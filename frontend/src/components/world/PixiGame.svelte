<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { initPixiApp, pixiApp, setPlacementMode, moveWorld } from '../../lib/pixiManager';
  import { gameState } from '../../stores/gameState';
  import { get } from 'svelte/store';
  
  // Props
  export let width = '100%';
  export let height = '100%';
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Local state
  let gameContainer: HTMLDivElement;
  let selectedBuildingType: string | null = null;
  let isPlacementMode = false;
  
  // Keyboard controls
  let keysPressed: Record<string, boolean> = {};
  let keyboardControlsActive = false;
  let keyboardInterval: number | null = null;
  let cameraControlMode = false; // Whether to move camera or player
  
  // Handle keyboard controls
  function handleKeyDown(event: KeyboardEvent) {
    // Don't block other handlers - we want the Escape key to still work
    const key = event.key.toLowerCase();
    keysPressed[key] = true;
    
    // Handle Tab key to toggle between camera and player movement
    if (key === 'tab') {
      cameraControlMode = !cameraControlMode;
      event.preventDefault();
      console.log(`Switched to ${cameraControlMode ? 'camera' : 'player'} control mode`);
      return;
    }
    
    // Handle shift key for running
    if (key === 'shift') {
      import('../../lib/pixiManager').then(module => {
        if (module.setPlayerRunning) {
          module.setPlayerRunning(true);
        }
      });
    }
    
    // Handle E key for interactions
    if (key === 'e') {
      import('../../lib/pixiManager').then(module => {
        if (module.interactWithWorld) {
          module.interactWithWorld();
        }
      });
      event.preventDefault();
      return;
    }
    
    // Only handle movement keys in this component
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      // Start the movement loop if not already running
      if (!keyboardControlsActive) {
        startKeyboardControls();
      }
      
      // Prevent default to avoid scrolling the page with arrow keys
      event.preventDefault();
    }
  }
  
  function handleKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    keysPressed[key] = false;
    
    // Handle shift key for running
    if (key === 'shift') {
      import('../../lib/pixiManager').then(module => {
        if (module.setPlayerRunning) {
          module.setPlayerRunning(false);
        }
      });
    }
    
    // Check if any movement keys are still pressed
    const anyKeysPressed = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].some(k => keysPressed[k]);
    
    if (!anyKeysPressed && keyboardControlsActive) {
      stopKeyboardControls();
      
      // Stop player movement if in player mode
      if (!cameraControlMode) {
        import('../../lib/pixiManager').then(module => {
          if (module.setPlayerMoving) {
            module.setPlayerMoving(false);
          }
        });
      }
    }
  }
  
  function startKeyboardControls() {
    keyboardControlsActive = true;
    
    // If in player mode, notify the player is moving
    if (!cameraControlMode) {
      import('../../lib/pixiManager').then(module => {
        if (module.setPlayerMoving) {
          module.setPlayerMoving(true);
        }
      });
    }
    
    // Process keyboard input at a fixed rate
    keyboardInterval = window.setInterval(() => {
      if (cameraControlMode) {
        // Camera movement mode
        updateCameraMovement();
      } else {
        // Player movement mode
        updatePlayerMovement();
      }
    }, 16); // ~60fps
  }
  
  function stopKeyboardControls() {
    keyboardControlsActive = false;
    if (keyboardInterval !== null) {
      clearInterval(keyboardInterval);
      keyboardInterval = null;
    }
  }
  
  // Update camera position based on keyboard input
  function updateCameraMovement() {
    if (!keyboardControlsActive) return;
    
    // Calculate direction vector
    let dx = 0;
    let dy = 0;
    
    if (keysPressed['w'] || keysPressed['arrowup']) dy += 10; // Up
    if (keysPressed['s'] || keysPressed['arrowdown']) dy -= 10; // Down
    if (keysPressed['a'] || keysPressed['arrowleft']) dx += 10; // Left
    if (keysPressed['d'] || keysPressed['arrowright']) dx -= 10; // Right
    
    // Move the world if there's any direction
    if (dx !== 0 || dy !== 0) {
      import('../../lib/pixiManager').then(module => {
        module.moveWorld(dx, dy);
      });
    }
  }
  
  // Update player position based on keyboard input
  function updatePlayerMovement() {
    if (!keyboardControlsActive) return;
    
    // Calculate direction vector
    let dx = 0;
    let dy = 0;
    
    if (keysPressed['w'] || keysPressed['arrowup']) dy -= 1; // Up 
    if (keysPressed['s'] || keysPressed['arrowdown']) dy += 1; // Down
    if (keysPressed['a'] || keysPressed['arrowleft']) dx -= 1; // Left
    if (keysPressed['d'] || keysPressed['arrowright']) dx += 1; // Right
    
    // Determine player direction
    let direction = 'down';
    
    if (dx < 0) direction = 'left';
    else if (dx > 0) direction = 'right';
    else if (dy < 0) direction = 'up';
    else if (dy > 0) direction = 'down';
    
    // Update player direction
    import('../../lib/pixiManager').then(module => {
      if (module.setPlayerDirection) {
        module.setPlayerDirection(direction);
      }
    });
    
    // Get player data from game state
    const state = get(gameState);
    if (!state.player) return;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx = dx / length;
      dy = dy / length;
    }
    
    // Get player speed from state
    const baseSpeed = state.player.stats.speed || 2.5;
    const isRunning = keysPressed['shift'];
    const runMultiplier = isRunning ? 1.5 : 1.0;
    
    // Check if player has enough energy to run
    let canRun = true;
    if (isRunning && state.player.stats.energy <= 0) {
      canRun = false;
      import('../../lib/pixiManager').then(module => {
        if (module.setPlayerRunning) {
          module.setPlayerRunning(false);
        }
      });
    }
    
    // Calculate movement
    const speed = baseSpeed * runMultiplier * (1/60); // Adjust for 60 FPS
    dx *= speed;
    dy *= speed;
    
    // Get current position
    const currentX = state.player.position.x;
    const currentY = state.player.position.y;
    
    // Calculate new position
    const newX = currentX + dx;
    const newY = currentY + dy;
    
    // Check for collisions at new position
    import('../../lib/pixiManager').then(module => {
      if (module.checkCollision) {
        // Use collision system in pixiManager
        const canMoveX = !module.checkCollision(state.map, Math.floor(newX), Math.floor(currentY));
        const canMoveY = !module.checkCollision(state.map, Math.floor(currentX), Math.floor(newY));
        
        // Apply movement with collision resolution
        const finalX = canMoveX ? newX : currentX;
        const finalY = canMoveY ? newY : currentY;
        
        // Update player position in game state
        gameState.update(state => {
          // Update position
          state.player.position.x = finalX;
          state.player.position.y = finalY;
          
          // Update energy if running
          if (isRunning && canRun) {
            state.player.stats.energy = Math.max(0, state.player.stats.energy - 0.2);
          } else if (state.player.stats.energy < state.player.stats.maxEnergy) {
            // Recover energy when not running
            state.player.stats.energy = Math.min(
              state.player.stats.maxEnergy,
              state.player.stats.energy + 0.05
            );
          }
          
          return state;
        });
      } else {
        // Fallback if collision system isn't available
        gameState.update(state => {
          state.player.position.x = newX;
          state.player.position.y = newY;
          return state;
        });
      }
    });
  }
  
  // Initialize PixiJS when component mounts
  onMount(() => {
    if (gameContainer) {
      try {
        console.log("Initializing PixiJS in game container");
        
        // Check if there's an existing app and destroy it if needed
        const existingApp = get(pixiApp);
        if (existingApp) {
          console.log("Destroying existing PixiJS app before creating a new one");
          existingApp.destroy(true, { children: true, texture: true, baseTexture: true });
          pixiApp.set(null);
        }
        
        // Initialize new app with game world
        const app = initPixiApp(gameContainer);
        
        // Add player character
        console.log("Adding player character");
        import('../../lib/pixiManager').then(module => {
          if (module.addPlayerCharacter) {
            module.addPlayerCharacter();
          }
        });
        
        // Set initial container dimensions to be fullscreen
        gameContainer.style.width = typeof width === 'number' ? `${width}px` : width;
        gameContainer.style.height = typeof height === 'number' ? `${height}px` : height;
        
        // Add keyboard event listeners for WASD controls
        console.log("Setting up keyboard controls");
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // Notify parent that the game is ready
        console.log("PixiGame component initialized successfully, dispatching ready event");
        dispatch('ready', { app });
      } catch (error) {
        console.error("Error initializing PixiJS:", error);
      }
    } else {
      console.error("Game container reference not available");
    }
    
    return () => {
      console.log("PixiGame component cleanup from onMount return");
      stopKeyboardControls();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      const app = get(pixiApp);
      if (app) {
        console.log("Destroying PixiJS app in onMount cleanup");
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        pixiApp.set(null);
      }
    };
  });
  
  // Clean up when component is destroyed
  onDestroy(() => {
    console.log("PixiGame component onDestroy triggered");
    
    // Clean up keyboard controls
    stopKeyboardControls();
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    
    const app = get(pixiApp);
    if (app) {
      try {
        // Clean up resources using our custom method first
        if ((app as any).cleanupResources) {
          console.log("Calling cleanupResources before destroying app");
          (app as any).cleanupResources();
        }
        
        console.log("Destroying PixiJS app in onDestroy");
        app.destroy(true, { 
          children: true, 
          texture: true, 
          baseTexture: true,
          removeView: true
        });
        
        // Check if we need to remove the canvas manually
        if (gameContainer) {
          const canvas = gameContainer.querySelector('canvas');
          if (canvas) {
            console.log("Manually removing canvas from container");
            gameContainer.removeChild(canvas);
          }
        }
        
        // Reset the store
        pixiApp.set(null);
        
      } catch (error) {
        console.error("Error during PixiJS app cleanup:", error);
      }
    }
  });
  
  // Handle building type selection
  export function selectBuildingType(type: string) {
    selectedBuildingType = type;
    isPlacementMode = true;
    setPlacementMode(true, type);
    
    console.log(`Selected building type: ${type}`);
  }
  
  // Toggle placement mode
  export function togglePlacementMode(enabled: boolean) {
    isPlacementMode = enabled;
    
    if (!enabled) {
      selectedBuildingType = null;
    }
    
    setPlacementMode(isPlacementMode, selectedBuildingType || undefined);
  }
  
  // Reset the view (center and reset zoom)
  export function resetView() {
    console.log("Resetting game view");
    import('../../lib/pixiManager').then(module => {
      module.resetView();
    });
  }
</script>

<div 
  class="pixi-game-container"
  bind:this={gameContainer}
  style:width={typeof width === 'number' ? `${width}px` : width}
  style:height={typeof height === 'number' ? `${height}px` : height}
/>

<style>
  .pixi-game-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    background-color: #0f0f1e;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  }
</style>