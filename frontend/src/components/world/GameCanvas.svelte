<!-- src/components/GameCanvas.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { gameState, startGameLoop, type Building } from '../../stores/gameState';
  
  // Canvas properties
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  
  // Use simpler fixed dimensions for troubleshooting
  let width = 800;
  let height = 600;
  
  // Flag to track initialization
  let isInitialized = false;
  let debugMessage = "Component created";
  
  // Resize canvas when window changes
  function handleResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    if (canvas && ctx) {
      canvas.width = width;
      canvas.height = height;
    }
  }
  
  // Camera controls
  let cameraX = 0;
  let cameraY = 0;
  let zoom = 1;
  
  // Mouse state
  let mouseX = 0;
  let mouseY = 0;
  let isDragging = false;
  let selectedBuilding: Building | null = null;
  
  // Building placement
  let placementMode = false;
  let placementType = '';
  
  onMount(() => {
    console.log("GameCanvas: onMount triggered");
    
    // Initialize canvas
    if (!canvas) {
      console.error("GameCanvas: Canvas element not found on mount");
      return;
    }
    
    // Set initial canvas size
    canvas.width = width;
    canvas.height = height;
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("GameCanvas: Could not get canvas context");
      return;
    }
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Start render loop
    const renderLoopCleanup = startRenderLoop();
    
    // Start game loop
    const gameLoopCleanup = startGameLoop();
    
    console.log("GameCanvas: Render and game loops started");
    
    return () => {
      console.log("GameCanvas: Cleaning up");
      renderLoopCleanup();
      gameLoopCleanup();
      window.removeEventListener('resize', handleResize);
    };
  });
  
  function startRenderLoop() {
    let animationFrame: number;
    let renderCount = 0;
    
    const render = () => {
      if (!ctx || !canvas) {
        console.warn("GameCanvas: Canvas or context not available, skipping render");
        animationFrame = requestAnimationFrame(render);
        return;
      }
      
      try {
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        
        // Apply camera transform
        ctx.save();
        ctx.translate(width/2, height/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-cameraX, -cameraY);
        
        // Draw grid
        drawGrid();
        
        // Draw buildings if they exist
        if ($gameState.buildings && Array.isArray($gameState.buildings)) {
          $gameState.buildings.forEach(building => {
            drawBuilding(building);
          });
          
          // Draw connections between buildings
          drawConnections();
        }
        
        // Draw placement preview if in placement mode
        if (placementMode) {
          drawPlacementPreview();
        }
        
        // Reset transform
        ctx.restore();
        
        // Draw UI elements that don't move with camera
        drawUI();
        
        // Log only the first few frames for debugging
        renderCount++;
        if (renderCount <= 5) {
          console.log(`GameCanvas: Rendered frame #${renderCount}`);
        }
        if (renderCount === 60) {
          console.log("GameCanvas: Render loop running at 60fps");
        }
      } catch (err) {
        console.error("GameCanvas: Error in render loop:", err);
      }
      
      // Request next frame
      animationFrame = requestAnimationFrame(render);
    };
    
    console.log("GameCanvas: Starting render loop");
    animationFrame = requestAnimationFrame(render);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }
  
  function drawGrid() {
    const gridSize = 32;
    const gridExtent = 2000;
    
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    
    // Calculate visible grid range
    const startX = Math.floor((cameraX - width/(2*zoom)) / gridSize) * gridSize;
    const endX = Math.ceil((cameraX + width/(2*zoom)) / gridSize) * gridSize;
    const startY = Math.floor((cameraY - height/(2*zoom)) / gridSize) * gridSize;
    const endY = Math.ceil((cameraY + height/(2*zoom)) / gridSize) * gridSize;
    
    // Draw vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }
  
  function drawBuilding(building: Building) {
    const size = 32;
    const x = building.position.x;
    const y = building.position.y;
    
    // Draw different shapes based on building type
    ctx.fillStyle = getColorForBuildingType(building.type);
    
    switch (building.type) {
      case 'extractor':
        ctx.beginPath();
        ctx.arc(x, y, size/2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'reactor':
        ctx.fillRect(x - size/2, y - size/2, size, size);
        break;
      case 'powerPlant':
        drawTriangle(x, y, size);
        break;
      default:
        ctx.fillRect(x - size/2, y - size/2, size, size);
    }
    
    // Draw selection indicator if selected
    if (selectedBuilding && selectedBuilding.id === building.id) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - size/2 - 4, y - size/2 - 4, size + 8, size + 8);
    }
  }
  
  function drawTriangle(x: number, y: number, size: number) {
    ctx.beginPath();
    ctx.moveTo(x, y - size/2);
    ctx.lineTo(x + size/2, y + size/2);
    ctx.lineTo(x - size/2, y + size/2);
    ctx.closePath();
    ctx.fill();
  }
  
  function getColorForBuildingType(type: string): string {
    switch (type) {
      case 'extractor': return '#3498db';
      case 'reactor': return '#e74c3c';
      case 'separator': return '#9b59b6';
      case 'storage': return '#f1c40f';
      case 'powerPlant': return '#2ecc71';
      case 'pipe': return '#95a5a6';
      default: return '#bdc3c7';
    }
  }
  
  function drawConnections() {
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    
    $gameState.buildings.forEach(building => {
      building.connections.forEach(targetId => {
        const target = $gameState.buildings.find(b => b.id === targetId);
        if (target) {
          ctx.beginPath();
          ctx.moveTo(building.position.x, building.position.y);
          ctx.lineTo(target.position.x, target.position.y);
          ctx.stroke();
        }
      });
    });
  }
  
  function drawPlacementPreview() {
    // Get mouse world position
    const worldX = cameraX + (mouseX - width/2) / zoom;
    const worldY = cameraY + (mouseY - height/2) / zoom;
    
    // Snap to grid
    const gridSize = 32;
    const snappedX = Math.round(worldX / gridSize) * gridSize;
    const snappedY = Math.round(worldY / gridSize) * gridSize;
    
    // Draw preview
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = getColorForBuildingType(placementType);
    
    switch (placementType) {
      case 'extractor':
        ctx.beginPath();
        ctx.arc(snappedX, snappedY, gridSize/2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'reactor':
        ctx.fillRect(snappedX - gridSize/2, snappedY - gridSize/2, gridSize, gridSize);
        break;
      case 'powerPlant':
        drawTriangle(snappedX, snappedY, gridSize);
        break;
      default:
        ctx.fillRect(snappedX - gridSize/2, snappedY - gridSize/2, gridSize, gridSize);
    }
    
    ctx.globalAlpha = 1.0;
  }
  
  function drawUI() {
    // Draw resource info
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffffff';
    let y = 20;
    
    for (const [resource, amount] of Object.entries($gameState.resources)) {
      ctx.fillText(`${resource}: ${amount.toFixed(1)}`, 10, y);
      y += 20;
    }
    
    // Draw energy info
    ctx.fillText(`Energy: ${$gameState.energy} J`, 10, y + 20);
    
    // Draw tick count
    ctx.fillText(`Tick: ${$gameState.tick}`, 10, y + 40);
  }
  
  // Event handlers
  function handleMouseDown(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    
    if (event.button === 0) { // Left click
      if (placementMode) {
        placeBuilding();
      } else {
        selectBuilding();
      }
    } else if (event.button === 2) { // Right click
      isDragging = true;
    }
  }
  
  function handleMouseMove(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    
    if (isDragging) {
      cameraX -= event.movementX / zoom;
      cameraY -= event.movementY / zoom;
    }
  }
  
  function handleMouseUp() {
    isDragging = false;
  }
  
  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    zoom = Math.max(0.1, Math.min(zoom * zoomFactor, 5));
  }
  
  function placeBuilding() {
    const worldX = cameraX + (mouseX - width/2) / zoom;
    const worldY = cameraY + (mouseY - height/2) / zoom;
    
    // Snap to grid
    const gridSize = 32;
    const snappedX = Math.round(worldX / gridSize) * gridSize;
    const snappedY = Math.round(worldY / gridSize) * gridSize;
    
    // Create new building
    const newBuilding: Building = {
      id: crypto.randomUUID(),
      type: placementType,
      position: { x: snappedX, y: snappedY },
      connections: []
    };
    
    // Add to game state
    gameState.update(state => {
      state.buildings.push(newBuilding);
      return state;
    });
    
    // Exit placement mode
    placementMode = false;
  }
  
  function selectBuilding() {
    const worldX = cameraX + (mouseX - width/2) / zoom;
    const worldY = cameraY + (mouseY - height/2) / zoom;
    
    // Find clicked building
    selectedBuilding = null;
    
    for (const building of $gameState.buildings) {
      const dx = building.position.x - worldX;
      const dy = building.position.y - worldY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < 20) {
        selectedBuilding = building;
        break;
      }
    }
  }
  
  // Building placement controls
  export function startPlacement(type: string) {
    placementMode = true;
    placementType = type;
  }
  
  // Prevent context menu on right-click
  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
  }
</script>

<div class="game-container">
  <canvas
    bind:this={canvas}
    {width}
    {height}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:wheel={handleWheel}
    on:contextmenu={handleContextMenu}
    id="game-canvas-{canvasKey}"
  ></canvas>
  
  <div class="canvas-overlay">
    <div class="loading-indicator">
      {#if !ctx}
        Canvas initializing...
      {/if}
    </div>
  </div>
</div>

<style>
  .game-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #1a1a2e;
  }
  
  canvas {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .canvas-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .loading-indicator {
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    font-family: monospace;
  }
</style>