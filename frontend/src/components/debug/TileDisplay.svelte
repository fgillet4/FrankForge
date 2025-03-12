// frontend/src/components/debug/TileDisplay.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { TerrainType, ResourceType } from '$lib/mapGenerator';
  
  // Props
  export let showTerrainTiles = true;
  export let showResourceTiles = true;
  export let showBuildingTiles = true;
  export let tileSize = 32;
  
  // Tile image reference
  let terrainTileset: HTMLImageElement;
  let resourceTileset: HTMLImageElement;
  let buildingTileset: HTMLImageElement;
  
  // Canvas reference
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  
  // Displayed tiles
  const terrainTypes = Object.values(TerrainType).filter(v => typeof v === 'number');
  const resourceTypes = Object.values(ResourceType).filter(v => typeof v === 'number');
  
  // Building types (matching the ones in our game)
  const buildingTypes = [
    { id: 'extractor', name: 'Extractor' },
    { id: 'reactor', name: 'Chemical Reactor' },
    { id: 'powerPlant', name: 'Power Plant' }
  ];
  
  // Canvas dimensions based on what we're showing
  $: canvasWidth = 16 * tileSize; // 16 tiles per row
  $: canvasHeight = calculateCanvasHeight();
  
  function calculateCanvasHeight() {
    let rows = 0;
    if (showTerrainTiles) rows += Math.ceil(terrainTypes.length / 16);
    if (showResourceTiles) rows += Math.ceil(resourceTypes.length / 16);
    if (showBuildingTiles) rows += Math.ceil(buildingTypes.length / 16);
    
    return rows * tileSize + (rows > 0 ? (rows - 1) * 20 : 0);
  }
  
  // Load tilesets
  onMount(() => {
    ctx = canvas.getContext('2d');
    
    // Load terrain tileset
    terrainTileset = new Image();
    terrainTileset.src = 'assets/sprites/terrain/terrain_tileset.png';
    terrainTileset.onload = renderTiles;
    
    // Load resource tileset
    resourceTileset = new Image();
    resourceTileset.src = 'assets/sprites/resources/resource_tileset.png';
    resourceTileset.onload = renderTiles;
    
    // Load building tileset
    buildingTileset = new Image();
    buildingTileset.src = 'assets/sprites/buildings/building_tileset.png';
    buildingTileset.onload = renderTiles;
    
    return () => {
      // Cleanup if needed
    };
  });
  
  // Render all the tiles
  function renderTiles() {
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    let yOffset = 0;
    
    // Render terrain tiles
    if (showTerrainTiles && terrainTileset && terrainTileset.complete) {
      renderTerrainTiles(yOffset);
      yOffset += Math.ceil(terrainTypes.length / 16) * tileSize + 20;
    }
    
    // Render resource tiles
    if (showResourceTiles && resourceTileset && resourceTileset.complete) {
      renderResourceTiles(yOffset);
      yOffset += Math.ceil(resourceTypes.length / 16) * tileSize + 20;
    }
    
    // Render building tiles
    if (showBuildingTiles && buildingTileset && buildingTileset.complete) {
      renderBuildingTiles(yOffset);
    }
  }
  
  // Render terrain tiles section
  function renderTerrainTiles(yOffset: number) {
    // Draw section header
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText('Terrain Tiles', 10, yOffset - 5);
    
    // Draw tiles
    terrainTypes.forEach((terrainType, index) => {
      const row = Math.floor(index / 16);
      const col = index % 16;
      
      // Position on our canvas
      const x = col * tileSize;
      const y = yOffset + row * tileSize;
      
      // Position in the tileset (simplified mapping)
      const srcX = (terrainType % 16) * tileSize;
      const srcY = Math.floor(terrainType / 16) * tileSize;
      
      // Draw the tile
      ctx.drawImage(
        terrainTileset,
        srcX, srcY, tileSize, tileSize,
        x, y, tileSize, tileSize
      );
      
      // Draw tile index
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y, tileSize, 16);
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText(TerrainType[terrainType], x + 2, y + 12);
    });
  }
  
  // Render resource tiles section
  function renderResourceTiles(yOffset: number) {
    // Draw section header
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText('Resource Tiles', 10, yOffset - 5);
    
    // Draw tiles
    resourceTypes.forEach((resourceType, index) => {
      if (resourceType === ResourceType.NONE) return; // Skip NONE type
      
      const row = Math.floor(index / 16);
      const col = index % 16;
      
      // Position on our canvas
      const x = col * tileSize;
      const y = yOffset + row * tileSize;
      
      // Draw a background for clarity (resources are often transparent)
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y, tileSize, tileSize);
      
      // Position in the tileset (simplified mapping)
      // Resources typically start after terrain tiles
      const srcX = (resourceType % 16) * tileSize;
      const srcY = (Math.floor(resourceType / 16) + terrainTypes.length / 16) * tileSize;
      
      // Draw the tile
      ctx.drawImage(
        resourceTileset,
        srcX, srcY, tileSize, tileSize,
        x, y, tileSize, tileSize
      );
      
      // Draw resource name
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y, tileSize, 16);
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText(ResourceType[resourceType], x + 2, y + 12);
    });
  }
  
  // Render building tiles section
  function renderBuildingTiles(yOffset: number) {
    // Draw section header
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText('Building Tiles', 10, yOffset - 5);
    
    // Draw tiles
    buildingTypes.forEach((building, index) => {
      const row = Math.floor(index / 16);
      const col = index % 16;
      
      // Position on our canvas
      const x = col * tileSize;
      const y = yOffset + row * tileSize;
      
      // Draw a background for clarity
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y, tileSize, tileSize);
      
      // In a real implementation, we'd use actual building sprites
      // For now, draw placeholder colored squares
      ctx.fillStyle = getBuildingColor(building.id);
      ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
      
      // Draw building name
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y, tileSize, 16);
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText(building.id, x + 2, y + 12);
    });
  }
  
  // Get building color based on type
  function getBuildingColor(type: string): string {
    switch (type) {
      case 'extractor': return '#3498db';
      case 'reactor': return '#e74c3c';
      case 'powerPlant': return '#2ecc71';
      default: return '#bdc3c7';
    }
  }
</script>

<div class="tile-display">
  <div class="controls">
    <label>
      <input type="checkbox" bind:checked={showTerrainTiles}>
      Terrain Tiles
    </label>
    
    <label>
      <input type="checkbox" bind:checked={showResourceTiles}>
      Resource Tiles
    </label>
    
    <label>
      <input type="checkbox" bind:checked={showBuildingTiles}>
      Building Tiles
    </label>
    
    <label>
      Tile Size:
      <input type="range" min="16" max="64" step="16" bind:value={tileSize}>
      {tileSize}px
    </label>
  </div>
  
  <div class="canvas-container">
    <canvas 
      bind:this={canvas}
      width={canvasWidth}
      height={canvasHeight}
    ></canvas>
  </div>
</div>

<style>
  .tile-display {
    background-color: #1a1a2e;
    border-radius: 4px;
    padding: 16px;
    color: white;
  }
  
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .canvas-container {
    background-color: #0f0f1e;
    border-radius: 4px;
    padding: 16px;
    overflow: auto;
  }
  
  canvas {
    display: block;
  }
</style>