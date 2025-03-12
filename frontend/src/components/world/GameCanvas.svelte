<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gameState } from '$lib/gameLoop';
  
  // Canvas properties
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let width = 800;
  let height = 600;
  
  // Camera controls
  let cameraX = 0;
  let cameraY = 0;
  const cameraSpeed = 10;
  
  // Grid properties
  const TILE_SIZE = 32;
  
  // Mouse state
  let mouseX = 0;
  let mouseY = 0;
  let isMouseDown = false;
  
  // Building placement
  let placementMode = false;
  let placementType = '';
  
  // Tile types
  const tileTypes = {
    ground: { color: '#394764' },
    resource: { color: '#3498db' },
    methane: { color: '#27ae60' },
    water: { color: '#00bcd4' }
  };
  
  // World grid - for now a simple array
  let worldGrid = [];
  const GRID_SIZE = 50; // 50x50 grid
  
  // Initialize the world grid
  function initializeWorld() {
    worldGrid = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      let row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        // Add some random resource patches
        if (Math.random() < 0.03) {
          if (Math.random() < 0.5) {
            row.push('methane');
          } else {
            row.push('water');
          }
        } else {
          row.push('ground');
        }
      }
      worldGrid.push(row);
    }
  }
  
  // Handle keyboard input for camera movement
  function handleKeyDown(event: KeyboardEvent) {
    // Only move camera if not typing in an input
    if (event.target instanceof HTMLInputElement) return;
    
    if (event.key === 'w' || event.key === 'ArrowUp') cameraY -= cameraSpeed;
    if (event.key === 's' || event.key === 'ArrowDown') cameraY += cameraSpeed;
    if (event.key === 'a' || event.key === 'ArrowLeft') cameraX -= cameraSpeed;
    if (event.key === 'd' || event.key === 'ArrowRight') cameraX += cameraSpeed;
    
    // Prevent scrolling the page
    if (['w', 's', 'a', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
  }
  
  onMount(() => {
    // Initialize canvas
    ctx = canvas.getContext('2d');
    
    // Initialize world
    initializeWorld();
    
    // Add keyboard listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Start render loop
    const renderFrame = requestAnimationFrame(renderLoop);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(renderFrame);
    };
  });
  
  function renderLoop() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Render world grid
    renderTiles();
    
    // Render buildings
    renderBuildings();
    
    // Render placement preview
    if (placementMode) {
      renderPlacementPreview();
    }
    
    // Continue the loop
    requestAnimationFrame(renderLoop);
  }
  
  function renderTiles() {
    // Calculate visible grid range
    const startX = Math.floor(cameraX / TILE_SIZE);
    const endX = startX + Math.ceil(width / TILE_SIZE) + 1;
    const startY = Math.floor(cameraY / TILE_SIZE);
    const endY = startY + Math.ceil(height / TILE_SIZE) + 1;
    
    // Render visible tiles
    for (let y = Math.max(0, startY); y < Math.min(worldGrid.length, endY); y++) {
      for (let x = Math.max(0, startX); x < Math.min(worldGrid[0].length, endX); x++) {
        const tileType = worldGrid[y][x];
        const screenX = Math.floor(x * TILE_SIZE - cameraX);
        const screenY = Math.floor(y * TILE_SIZE - cameraY);
        
        // Draw tile
        ctx.fillStyle = tileTypes[tileType].color;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        
        // Draw grid lines
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  
  function renderBuildings() {
    $gameState.buildings.forEach(building => {
      const screenX = Math.floor(building.position.x * TILE_SIZE - cameraX);
      const screenY = Math.floor(building.position.y * TILE_SIZE - cameraY);
      
      // Only render if on screen
      if (screenX > -TILE_SIZE * 2 && screenX < width &&
          screenY > -TILE_SIZE * 2 && screenY < height) {
        
        // Draw building based on type
        switch (building.type) {
          case 'extractor':
            drawExtractor(screenX, screenY);
            break;
          case 'reactor':
            drawReactor(screenX, screenY);
            break;
          case 'powerPlant':
            drawPowerPlant(screenX, screenY);
            break;
          default:
            // Default building shape
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    });
  }
  
  function drawExtractor(x, y) {
    // Blue circular extractor
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner details
    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE/4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  function drawReactor(x, y) {
    // Red square reactor
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    
    // Inner details (warning stripes)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x + TILE_SIZE/4, y + TILE_SIZE/4, TILE_SIZE/2, TILE_SIZE/2);
  }
  
  function drawPowerPlant(x, y) {
    // Green power plant (triangle shape)
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE/2, y);
    ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
    ctx.lineTo(x, y + TILE_SIZE);
    ctx.closePath();
    ctx.fill();
  }
  
  function renderPlacementPreview() {
    // Get mouse grid position
    const gridX = Math.floor((mouseX + cameraX) / TILE_SIZE);
    const gridY = Math.floor((mouseY + cameraY) / TILE_SIZE);
    const screenX = gridX * TILE_SIZE - cameraX;
    const screenY = gridY * TILE_SIZE - cameraY;
    
    // Draw semi-transparent preview
    ctx.globalAlpha = 0.5;
    
    switch (placementType) {
      case 'extractor':
        drawExtractor(screenX, screenY);
        break;
      case 'reactor':
        drawReactor(screenX, screenY);
        break;
      case 'powerPlant':
        drawPowerPlant(screenX, screenY);
        break;
      default:
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
    
    ctx.globalAlpha = 1.0;
    
    // Draw grid highlight
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  }
  
  function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  }
  
  function handleMouseDown(event) {
    isMouseDown = true;
    
    if (placementMode) {
      const gridX = Math.floor((mouseX + cameraX) / TILE_SIZE);
      const gridY = Math.floor((mouseY + cameraY) / TILE_SIZE);
      
      // Check if within grid bounds
      if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
        // Check if we can place on this tile (not occupied)
        const canPlace = !$gameState.buildings.some(
          b => b.position.x === gridX && b.position.y === gridY
        );
        
        if (canPlace) {
          // Add new building to game state
          const newBuilding = {
            id: crypto.randomUUID(),
            type: placementType,
            position: { x: gridX, y: gridY },
            connections: []
          };
          
          gameState.update(state => {
            state.buildings = [...state.buildings, newBuilding];
            
            // Deduct resources (placeholder - will be implemented in next steps)
            // For now just decrease energy as a placeholder
            state.resources.energy -= 100;
            
            return state;
          });
        }
      }
      
      // Exit placement mode after placing
      placementMode = false;
    }
  }
  
  function handleMouseUp() {
    isMouseDown = false;
  }
  
  // Method to start building placement - will be called from BuildingControlPanel
  export function startPlacement(type) {
    placementMode = true;
    placementType = type;
  }
</script>

<div class="game-container">
  <canvas
    bind:this={canvas}
    {width}
    {height}
    on:mousemove={handleMouseMove}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
  ></canvas>
</div>

<style>
  .game-container {
    position: relative;
    overflow: hidden;
    background-color: #1a1a2e;
  }
  
  canvas {
    display: block;
  }
</style>