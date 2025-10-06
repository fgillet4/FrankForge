<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { gameState } from '../../stores/gameState';
  
  // Export properties
  export let position = { x: 0, y: 0 }; // Position in game coordinates
  export let tileSize = 24; // Size of each tile in pixels
  export let mapData; // Reference to the map data
  
  // Character state
  let direction = 'down'; // down, up, left, right
  let isMoving = false;
  let isInteracting = false;
  let currentAnimation = 'idle';
  let animationFrame = 0;
  let lastAnimationUpdate = 0;
  let isRunning = false;
  let velocity = { x: 0, y: 0 };
  let collisions = [];
  
  // Character stats
  let stats = {
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    speed: 2, // Tiles per second
    carryingCapacity: 10, // Number of resource units
    harvestingSpeed: 1, // Multiplier for harvest speed
  };
  
  // Character inventory
  let inventory = [];
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Key state tracking
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    e: false,
    Shift: false
  };
  
  // Animation config
  const ANIMATION_SPEED = 150; // ms per frame
  const ANIMATION_FRAMES = 4; // frames per animation
  
  // Character dimensions
  const characterWidth = tileSize;
  const characterHeight = tileSize * 1.5; // Character is 1.5x taller than a tile
  
  // Movement speed (pixels per frame)
  let moveSpeed = stats.speed;
  const runningMultiplier = 1.5;
  
  // Handle keydown events
  function handleKeyDown(event) {
    if (keys.hasOwnProperty(event.key)) {
      keys[event.key] = true;
      
      // Update running state
      isRunning = keys.Shift;
      
      // Update moving state
      isMoving = keys.w || keys.a || keys.s || keys.d || 
                keys.ArrowUp || keys.ArrowLeft || keys.ArrowDown || keys.ArrowRight;
                
      // Determine direction
      if (keys.w || keys.ArrowUp) direction = 'up';
      else if (keys.s || keys.ArrowDown) direction = 'down';
      else if (keys.a || keys.ArrowLeft) direction = 'left';
      else if (keys.d || keys.ArrowRight) direction = 'right';
      
      // Handle interaction (E key)
      if (keys.e) {
        interact();
      }
      
      event.preventDefault();
    }
  }
  
  // Handle keyup events
  function handleKeyUp(event) {
    if (keys.hasOwnProperty(event.key)) {
      keys[event.key] = false;
      
      // Update running state
      isRunning = keys.Shift;
      
      // Update moving state
      isMoving = keys.w || keys.a || keys.s || keys.d || 
                keys.ArrowUp || keys.ArrowLeft || keys.ArrowDown || keys.ArrowRight;
      
      event.preventDefault();
    }
  }
  
  // Character interaction with world
  function interact() {
    // Get the tile in front of the character based on direction
    let interactX = position.x;
    let interactY = position.y;
    
    switch (direction) {
      case 'up':
        interactY -= 1;
        break;
      case 'down':
        interactY += 1;
        break;
      case 'left':
        interactX -= 1;
        break;
      case 'right':
        interactX += 1;
        break;
    }
    
    // Check if coordinates are valid
    if (
      interactX >= 0 && 
      interactX < mapData.width && 
      interactY >= 0 && 
      interactY < mapData.height
    ) {
      const tile = mapData.tiles[interactY][interactX];
      
      // Interact with the tile
      isInteracting = true;
      currentAnimation = 'interact';
      animationFrame = 0;
      
      // Check for buildings
      if (tile.building) {
        // Dispatch interaction event for building
        dispatch('interact', { 
          type: 'building', 
          building: tile.building,
          x: interactX,
          y: interactY
        });
      } 
      // Check for resources
      else if (tile.resource && tile.resource > 0) {
        // Dispatch interaction event for resource
        dispatch('interact', { 
          type: 'resource', 
          resource: tile.resource,
          x: interactX,
          y: interactY
        });
        
        // Start harvesting animation
        currentAnimation = 'harvest';
      }
      // Check for decorations
      else if (tile.decoration !== undefined && tile.decoration >= 0) {
        // Dispatch interaction event for decoration
        dispatch('interact', { 
          type: 'decoration', 
          decoration: tile.decoration,
          x: interactX,
          y: interactY
        });
      }
      // Nothing to interact with
      else {
        isInteracting = false;
      }
    } else {
      isInteracting = false;
    }
  }
  
  // Check for collisions
  function checkCollision(x, y) {
    // Convert to tile coordinates
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    
    // Boundary check
    if (
      tileX < 0 || 
      tileX >= mapData.width || 
      tileY < 0 || 
      tileY >= mapData.height
    ) {
      return true; // Collision with map boundary
    }
    
    // Get the tile
    const tile = mapData.tiles[tileY][tileX];
    
    // Check for collision with buildings
    if (tile.building) {
      return true;
    }
    
    // Check for collision with water or mountains
    if (tile.type === 1 || tile.type === 2 || tile.type === 3) {
      return true;
    }
    
    return false; // No collision
  }
  
  // Update character position based on keys pressed
  function updatePosition(deltaTime) {
    if (isInteracting) return; // Don't move while interacting
    
    let newVelocity = { x: 0, y: 0 };
    
    // Calculate movement direction
    if (keys.w || keys.ArrowUp) newVelocity.y -= 1;
    if (keys.s || keys.ArrowDown) newVelocity.y += 1;
    if (keys.a || keys.ArrowLeft) newVelocity.x -= 1;
    if (keys.d || keys.ArrowRight) newVelocity.x += 1;
    
    // Normalize velocity if moving diagonally
    if (newVelocity.x !== 0 && newVelocity.y !== 0) {
      const length = Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.y * newVelocity.y);
      newVelocity.x /= length;
      newVelocity.y /= length;
    }
    
    // Apply speed
    moveSpeed = stats.speed;
    if (isRunning) {
      moveSpeed *= runningMultiplier;
      // Reduce energy when running
      stats.energy = Math.max(0, stats.energy - 0.1 * deltaTime);
    }
    
    // Recover energy when not running
    if (!isRunning && stats.energy < stats.maxEnergy) {
      stats.energy = Math.min(stats.maxEnergy, stats.energy + 0.05 * deltaTime);
    }
    
    // If out of energy, can't run
    if (stats.energy <= 0) {
      isRunning = false;
    }
    
    newVelocity.x *= moveSpeed * deltaTime;
    newVelocity.y *= moveSpeed * deltaTime;
    
    // Apply velocity to position with collision detection
    let newX = position.x + newVelocity.x;
    let newY = position.y + newVelocity.y;
    
    // Check if new position would cause collision
    const collideX = checkCollision(newX, position.y);
    const collideY = checkCollision(position.x, newY);
    
    // Only move in non-colliding directions
    if (!collideX) position.x = newX;
    if (!collideY) position.y = newY;
    
    // Update velocity
    velocity = newVelocity;
    
    // If moving, update animation
    if (isMoving) {
      currentAnimation = isRunning ? 'run' : 'walk';
      
      // Update animation frame
      const now = Date.now();
      if (now - lastAnimationUpdate > ANIMATION_SPEED) {
        animationFrame = (animationFrame + 1) % ANIMATION_FRAMES;
        lastAnimationUpdate = now;
      }
    } else {
      currentAnimation = 'idle';
      animationFrame = 0;
    }
    
    // Dispatch position update
    dispatch('move', { position, direction });
  }
  
  // Animation loop
  let animationFrameId;
  let lastUpdateTime = 0;
  
  function animate(timestamp) {
    const deltaTime = (timestamp - lastUpdateTime) / 1000;
    lastUpdateTime = timestamp;
    
    // Skip update if game is paused
    if (!$gameState.isPaused) {
      updatePosition(deltaTime);
    }
    
    animationFrameId = requestAnimationFrame(animate);
  }
  
  // Get sprite URL based on animation and direction
  function getSprite() {
    // In a real implementation, this would select the appropriate sprite
    // from a sprite sheet based on direction, animation, and frame
    return `/assets/sprites/characters/player_${direction}_${currentAnimation}_${animationFrame}.png`;
  }
  
  // Initialize component
  onMount(() => {
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start animation loop
    lastUpdateTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
    
    // Register player in game state if needed
    gameState.update(state => {
      return { 
        ...state, 
        player: {
          position,
          stats,
          inventory
        }
      };
    });
    
    return () => {
      // Clean up on unmount
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  });
  
  // Update stats in the game state when they change
  $: {
    gameState.update(state => {
      if (state.player) {
        return { 
          ...state, 
          player: {
            ...state.player,
            position,
            stats,
            inventory
          }
        };
      }
      return state;
    });
  }
  
  // Player visibility in current viewport
  export function isVisible(viewportX, viewportY, viewportWidth, viewportHeight) {
    const screenX = position.x * tileSize;
    const screenY = position.y * tileSize;
    
    return (
      screenX + characterWidth > viewportX &&
      screenX < viewportX + viewportWidth &&
      screenY + characterHeight > viewportY &&
      screenY < viewportY + viewportHeight
    );
  }
</script>

<div
  class="player-character"
  class:running={isRunning}
  class:interacting={isInteracting}
  style="
    left: {position.x * tileSize}px;
    top: {position.y * tileSize - tileSize * 0.5}px;
    width: {characterWidth}px;
    height: {characterHeight}px;
    background-image: url({getSprite()});
    z-index: {Math.floor(position.y * 10)};
  "
>
  <!-- Character shadow -->
  <div class="character-shadow"></div>
  
  <!-- Interaction indicator (shows when near interactable objects) -->
  {#if isInteracting}
    <div class="interaction-indicator"></div>
  {/if}
</div>

<style>
  .player-character {
    position: absolute;
    background-size: contain;
    background-position: center bottom;
    background-repeat: no-repeat;
    pointer-events: none;
    transition: transform 0.1s ease;
    image-rendering: pixelated;
  }
  
  .player-character::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 10%;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    filter: blur(2px);
  }
  
  .character-shadow {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 5px;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    z-index: -1;
  }
  
  .interaction-indicator {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
    animation: pulse 1s infinite alternate;
  }
  
  .running .character-shadow {
    animation: shadow-pulse 0.3s infinite alternate;
  }
  
  .interacting .player-character {
    transform: scale(1.1);
  }
  
  @keyframes pulse {
    from {
      transform: translateX(-50%) scale(0.8);
      opacity: 0.7;
    }
    to {
      transform: translateX(-50%) scale(1.2);
      opacity: 1;
    }
  }
  
  @keyframes shadow-pulse {
    from {
      opacity: 0.2;
      width: 40%;
    }
    to {
      opacity: 0.4;
      width: 60%;
    }
  }
</style>