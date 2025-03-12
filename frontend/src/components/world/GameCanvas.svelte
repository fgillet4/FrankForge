<script lang="ts">
  import { onMount } from 'svelte';
  import { canvasActions, registerCanvasActions } from '$lib/canvasActions';
  import { gameState } from '$lib/gameLoop';
  import { TILE_SIZE, renderMap } from '$lib/mapRenderer';
  import { generatePlanetMap } from '$lib/mapGenerator';
  import { PlanetType } from '$lib/types';
  // Canvas properties
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let width = 800;
  let height = 600;
  
  // Camera controls
  let cameraX = 0;
  let cameraY = 0;
  const cameraSpeed = 10;
  
  // Mouse state
  let mouseX = 0;
  let mouseY = 0;
  let isMouseDown = false;
  
  // Building placement
  let placementMode = false;
  let placementType = '';
  
  // Environmental visualization
  let showHeatMap = false;
  let showPressureMap = false;
  
  // Map and tileset
  let planetMap;
  let tileset: HTMLImageElement;
  let tilesetInfo = {
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
    columns: 16,
    rows: 16
  };
  
  // Method to start building placement - will be called via store
  function startPlacementInternal(type) {
    console.log("GameCanvas.startPlacement called with:", type);
    placementMode = true;
    placementType = type;
  }

  // Initialize the world map
  function initializeWorld() {
    // Generate a map for testing (would eventually load from save or generate based on seed)
    planetMap = generatePlanetMap({
      width: 50,
      height: 50,
      planetType: PlanetType.EARTH_LIKE,
      oceanLevel: 0.35,
      mountainLevel: 0.7,
      resourceRichness: 0.6,
      alienness: 0.2
    });
    
    // Load tileset image
    tileset = new Image();
    tileset.src = 'assets/sprites/terrain/terrain_tileset.png'; // Placeholder path
    tileset.onload = () => {
      // Force a redraw when tileset is loaded
      renderLoop();
    };
  }
  
  // Handle keyboard input for camera movement
  function handleKeyDown(event: KeyboardEvent) {
    // Only move camera if not typing in an input
    if (event.target instanceof HTMLInputElement) return;
    
    if (event.key === 'w' || event.key === 'ArrowUp') cameraY -= cameraSpeed;
    if (event.key === 's' || event.key === 'ArrowDown') cameraY += cameraSpeed;
    if (event.key === 'a' || event.key === 'ArrowLeft') cameraX -= cameraSpeed;
    if (event.key === 'd' || event.key === 'ArrowRight') cameraX += cameraSpeed;
    
    // Toggle heat map with 'h'
    if (event.key === 'h') showHeatMap = !showHeatMap;
    
    // Toggle pressure map with 'p'
    if (event.key === 'p') showPressureMap = !showPressureMap;
    
    // Cancel placement with Escape
    if (event.key === 'Escape' && placementMode) {
      placementMode = false;
    }
    
    // Prevent scrolling the page
    if (['w', 's', 'a', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'h', 'p'].includes(event.key)) {
      event.preventDefault();
    }
  }

  function renderLoop() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Render map if available
    if (planetMap && tileset && tileset.complete) {
      renderMap(
        ctx, 
        planetMap, 
        tileset, 
        tilesetInfo, 
        cameraX, 
        cameraY, 
        width, 
        height, 
        false // debug mode
      );
    } else {
      // Render loading message
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading map...', width / 2, height / 2);
      
      // Render a simple grid as placeholder
      renderTiles();
    }
    
    // Render environmental effects if enabled
    if (showHeatMap) {
      renderHeatMap();
    } else if (showPressureMap) {
      renderPressureMap();
    }
    
    // Render buildings
    renderBuildings();
    
    // Render placement preview
    if (placementMode) {
      renderPlacementPreview();
    }
    
    // Render UI overlays
    renderUIOverlays();
    
    // Continue the loop
    requestAnimationFrame(renderLoop);
  }
  
  function renderTiles() {
    // Calculate visible grid range
    const startX = Math.floor(cameraX / TILE_SIZE);
    const endX = startX + Math.ceil(width / TILE_SIZE) + 1;
    const startY = Math.floor(cameraY / TILE_SIZE);
    const endY = startY + Math.ceil(height / TILE_SIZE) + 1;
    
    // Render visible tiles (simplified placeholder grid)
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const screenX = Math.floor(x * TILE_SIZE - cameraX);
        const screenY = Math.floor(y * TILE_SIZE - cameraY);
        
        // Draw grid cell
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        
        // Draw checkerboard pattern for visibility
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = '#1a1a2e';
        } else {
          ctx.fillStyle = '#232342';
        }
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  
  function renderHeatMap() {
    // Overlay heat visualization on the world
    ctx.globalAlpha = 0.4; // Semi-transparent

    // Buildings and their heat influence
    if ($gameState && $gameState.buildings) {
      $gameState.buildings.forEach(building => {
        const screenX = Math.floor(building.position.x * TILE_SIZE - cameraX);
        const screenY = Math.floor(building.position.y * TILE_SIZE - cameraY);
        
        // Only render if on screen
        if (screenX > -TILE_SIZE * 5 && screenX < width + TILE_SIZE * 5 &&
            screenY > -TILE_SIZE * 5 && screenY < height + TILE_SIZE * 5) {
          
          // Heat radius depends on temperature difference from ambient
          const tempDiff = building.temperature - $gameState.temperature;
          const radius = Math.abs(tempDiff) / 10 * TILE_SIZE * 3;
          
          // Create radial gradient for heat effect
          const gradient = ctx.createRadialGradient(
            screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, 0,
            screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, radius
          );
          
          if (tempDiff > 0) {
            // Hot buildings (red)
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          } else {
            // Cold buildings (blue)
            gradient.addColorStop(0, 'rgba(0, 0, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
          }
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    
    ctx.globalAlpha = 1.0; // Reset transparency
  }
  
  function renderPressureMap() {
    // Overlay pressure visualization
    ctx.globalAlpha = 0.3; // Semi-transparent
    
    // Buildings and their pressure influence
    $gameState.buildings.forEach(building => {
      const screenX = Math.floor(building.position.x * TILE_SIZE - cameraX);
      const screenY = Math.floor(building.position.y * TILE_SIZE - cameraY);
      
      // Only render if on screen
      if (screenX > -TILE_SIZE * 5 && screenX < width + TILE_SIZE * 5 &&
          screenY > -TILE_SIZE * 5 && screenY < height + TILE_SIZE * 5) {
        
        // Pressure radius depends on pressure difference from ambient
        const pressureDiff = building.pressure - $gameState.pressure;
        const radius = Math.abs(pressureDiff) / 10000 * TILE_SIZE * 3;
        
        // Create radial gradient for pressure effect
        const gradient = ctx.createRadialGradient(
          screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, 0,
          screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, radius
        );
        
        if (pressureDiff > 0) {
          // High pressure (purple)
          gradient.addColorStop(0, 'rgba(128, 0, 128, 0.7)');
          gradient.addColorStop(1, 'rgba(128, 0, 128, 0)');
        } else {
          // Low pressure (green)
          gradient.addColorStop(0, 'rgba(0, 128, 0, 0.7)');
          gradient.addColorStop(1, 'rgba(0, 128, 0, 0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    ctx.globalAlpha = 1.0; // Reset transparency
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
            drawExtractor(screenX, screenY, building);
            break;
          case 'reactor':
            drawReactor(screenX, screenY, building);
            break;
          case 'powerPlant':
            drawPowerPlant(screenX, screenY, building);
            break;
          default:
            // Default building shape
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    });
  }
  
  function drawExtractor(x, y, building) {
    // Blue circular extractor
    ctx.fillStyle = '#3498db';
    
    // Apply efficiency visual effect
    if (building && building.efficiency) {
      const opacity = Math.max(0.3, building.efficiency);
      ctx.fillStyle = `rgba(52, 152, 219, ${opacity})`;
    }
    
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner details
    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE/4, 0, Math.PI * 2);
    ctx.fill();
    
    // Show building is selected
    if (building && building.selected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 2, y - 2, TILE_SIZE + 4, TILE_SIZE + 4);
    }
    
    // Display efficiency indicator if very low
    if (building && building.efficiency < 0.5) {
      drawWarningIndicator(x, y);
    }
  }
  
  function drawReactor(x, y, building) {
    // Red square reactor
    ctx.fillStyle = '#e74c3c';
    
    // Apply efficiency visual effect
    if (building && building.efficiency) {
      const opacity = Math.max(0.3, building.efficiency);
      ctx.fillStyle = `rgba(231, 76, 60, ${opacity})`;
    }
    
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    
    // Inner details (warning stripes)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x + TILE_SIZE/4, y + TILE_SIZE/4, TILE_SIZE/2, TILE_SIZE/2);
    
    // Show building is selected
    if (building && building.selected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 2, y - 2, TILE_SIZE + 4, TILE_SIZE + 4);
    }
    
    // Display efficiency indicator if very low
    if (building && building.efficiency < 0.5) {
      drawWarningIndicator(x, y);
    }
    
    // Show heat effect for reactors (they tend to be hot)
    if (building && building.temperature > 400) {
      drawHeatIndicator(x, y);
    }
  }
  
  function drawPowerPlant(x, y, building) {
    // Green power plant (triangle shape)
    ctx.fillStyle = '#2ecc71';
    
    // Apply efficiency visual effect
    if (building && building.efficiency) {
      const opacity = Math.max(0.3, building.efficiency);
      ctx.fillStyle = `rgba(46, 204, 113, ${opacity})`;
    }
    
    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE/2, y);
    ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
    ctx.lineTo(x, y + TILE_SIZE);
    ctx.closePath();
    ctx.fill();
    
    // Show building is selected
    if (building && building.selected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 2, y - 2, TILE_SIZE + 4, TILE_SIZE + 4);
    }
    
    // Display efficiency indicator if very low
    if (building && building.efficiency < 0.5) {
      drawWarningIndicator(x, y);
    }
    
    // Show heat effect for power plants (they tend to be hot)
    if (building && building.temperature > 450) {
      drawHeatIndicator(x, y);
    }
  }
  
  function drawWarningIndicator(x, y) {
    // Draw a warning triangle
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE - 4, y + 4);
    ctx.lineTo(x + TILE_SIZE - 4, y + 14);
    ctx.lineTo(x + TILE_SIZE - 14, y + 4);
    ctx.closePath();
    ctx.fill();
    
    // Exclamation mark
    ctx.fillStyle = '#000';
    ctx.fillRect(x + TILE_SIZE - 9, y + 6, 2, 4);
    ctx.fillRect(x + TILE_SIZE - 9, y + 11, 2, 2);
  }
  
  function drawHeatIndicator(x, y) {
    // Small flame indicator
    ctx.fillStyle = '#f39c12';
    
    // Flame base
    ctx.beginPath();
    ctx.moveTo(x + 4, y + TILE_SIZE - 4);
    ctx.lineTo(x + 12, y + TILE_SIZE - 14);
    ctx.lineTo(x + 20, y + TILE_SIZE - 4);
    ctx.closePath();
    ctx.fill();
  }
  
  function renderUIOverlays() {
    // Draw mode indicators
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    
    if (showHeatMap) {
      ctx.fillText('Heat Map Active (H to toggle)', 10, 20);
    } else if (showPressureMap) {
      ctx.fillText('Pressure Map Active (P to toggle)', 10, 20);
    }
    
    // Display current coordinates under mouse
    if (mouseX > 0 && mouseY > 0) {
      const gridX = Math.floor((mouseX + cameraX) / TILE_SIZE);
      const gridY = Math.floor((mouseY + cameraY) / TILE_SIZE);
      
      if (gridX >= 0 && gridY >= 0) {
        ctx.fillText(`Coordinates: (${gridX}, ${gridY})`, 10, height - 10);
      }
    }
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
        drawExtractor(screenX, screenY, null);
        break;
      case 'reactor':
        drawReactor(screenX, screenY, null);
        break;
      case 'powerPlant':
        drawPowerPlant(screenX, screenY, null);
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
    
    // Display info about placement
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Placing: ${placementType}`, 10, 40);
    
    // Show resource at placement location
    if (gridX >= 0 && gridY >= 0 && planetMap && gridY < planetMap.height && gridX < planetMap.width) {
      const tile = planetMap.tiles[gridY][gridX];
      ctx.fillText(`Terrain: ${TerrainType[tile.terrain]}`, 10, 60);
      
      if (tile.resource !== ResourceType.NONE) {
        ctx.fillText(`Resource: ${ResourceType[tile.resource]} (${Math.round(tile.resourceDensity * 100)}%)`, 10, 80);
      }
      
      // Show efficiency prediction based on environment
      const predictedEfficiency = predictBuildingEfficiency(placementType, $gameState.temperature, $gameState.pressure);
      ctx.fillText(`Predicted Efficiency: ${Math.round(predictedEfficiency * 100)}%`, 10, 100);
    }
  }
  
  function handleMouseMove(event) {
    if (!canvas) return;
    
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
      if (gridX >= 0 && gridY >= 0 && planetMap && gridY < planetMap.height && gridX < planetMap.width) {
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
            connections: [],
            temperature: $gameState.temperature, // Initialize with ambient temperature
            pressure: $gameState.pressure,       // Initialize with ambient pressure
            efficiency: predictBuildingEfficiency(placementType, $gameState.temperature, $gameState.pressure)
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
    } else {
      // Select building under cursor
      selectBuildingUnderCursor();
    }
  }
  
  function handleMouseUp() {
    isMouseDown = false;
  }
  
  function selectBuildingUnderCursor() {
    const gridX = Math.floor((mouseX + cameraX) / TILE_SIZE);
    const gridY = Math.floor((mouseY + cameraY) / TILE_SIZE);
    
    // Deselect all buildings first
    gameState.update(state => {
      state.buildings.forEach(b => b.selected = false);
      
      // Find and select the building under cursor
      const building = state.buildings.find(
        b => b.position.x === gridX && b.position.y === gridY
      );
      
      if (building) {
        building.selected = true;
      }
      
      return state;
    });
  }
  
  // Predict building efficiency based on placement environment
  function predictBuildingEfficiency(type, temperature, pressure) {
    // Different building types have different optimal conditions
    let optimalTemp = 293.15; // Default 20°C
    let optimalPressure = 101325; // Default 1 atm
    
    // Set optimal conditions based on building type
    switch (type) {
      case 'extractor':
        optimalTemp = 283.15; // 10°C
        optimalPressure = 101325; // 1 atm
        break;
      case 'reactor':
        optimalTemp = 450; // Higher temperature for reactions
        optimalPressure = 200000; // ~2 atm for better reaction rates
        break;
      case 'powerPlant':
        optimalTemp = 500; // High temperature for power generation
        optimalPressure = 101325; // Standard pressure
        break;
    }
    
    // Calculate temperature efficiency component (drop off as we move from optimal)
    const tempDeviation = Math.abs(temperature - optimalTemp) / optimalTemp;
    const tempEfficiency = Math.max(0.3, 1 - tempDeviation);
    
    // Calculate pressure efficiency component
    const pressureDeviation = Math.abs(pressure - optimalPressure) / optimalPressure;
    const pressureEfficiency = Math.max(0.5, 1 - pressureDeviation);
    
    // Combined efficiency with more weight on temperature
    return tempEfficiency * 0.7 + pressureEfficiency * 0.3;
  }

  onMount(() => {
    // Initialize canvas
    ctx = canvas.getContext('2d');
    
    // Register canvas actions with the store
    registerCanvasActions({
      startPlacement: startPlacementInternal,
      selectBuilding: (id) => {
        // Implementation for selecting a building by ID
        gameState.update(state => {
          state.buildings.forEach(b => b.selected = b.id === id);
          return state;
        });
      },
      deleteSelectedBuilding: () => {
        // Implementation for deleting the selected building
        gameState.update(state => {
          state.buildings = state.buildings.filter(b => !b.selected);
          return state;
        });
      },
      rotateSelectedBuilding: () => {
        // Rotation implementation (if needed)
        console.log("Rotate building - to be implemented");
      },
      cancelPlacement: () => {
        // Cancel building placement
        placementMode = false;
      }
    });
    
    // Initialize world
    initializeWorld();
    
    // Add keyboard listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Start render loop
    const renderFrame = requestAnimationFrame(renderLoop);
    
    // Handle canvas resizing
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === canvas.parentElement) {
          width = entry.contentRect.width;
          height = entry.contentRect.height;
          canvas.width = width;
          canvas.height = height;
        }
      }
    });
    
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    
    return () => {
      // Clean up when component is destroyed
      registerCanvasActions({
        startPlacement: null,
        selectBuilding: null,
        deleteSelectedBuilding: null,
        rotateSelectedBuilding: null,
        cancelPlacement: null
      });
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(renderFrame);
      resizeObserver.disconnect();
    };
  });
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
  
  <div class="view-controls">
    <button 
      class:active={showHeatMap} 
      on:click={() => {
        showHeatMap = !showHeatMap;
        if (showHeatMap) showPressureMap = false;
      }}
      title="Toggle Heat Map (H)"
    >
      Heat Map
    </button>
    <button 
      class:active={showPressureMap} 
      on:click={() => {
        showPressureMap = !showPressureMap;
        if (showPressureMap) showHeatMap = false;
      }}
      title="Toggle Pressure Map (P)"
    >
      Pressure Map
    </button>
  </div>
</div>

<style>
  .game-container {
    position: relative;
    overflow: hidden;
    background-color: #1a1a2e;
    width: 100%;
    height: 100%;
  }
  
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  
  .view-controls {
    position: absolute;
    bottom: 16px;
    right: 16px;
    display: flex;
    gap: 8px;
  }
  
  .view-controls button {
    background-color: rgba(44, 62, 80, 0.8);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .view-controls button:hover {
    background-color: rgba(52, 73, 94, 0.8);
  }
  
  .view-controls button.active {
    background-color: rgba(41, 128, 185, 0.8);
  }
</style>