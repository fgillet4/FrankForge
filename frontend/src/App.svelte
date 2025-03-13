<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import BuildingControlPanel from './components/ui/BuildingControlPanel.svelte';
  import { gameState } from './stores/gameState';
  import { PlanetType } from './lib/types';
  
  // Game state
  let isPaused = false;
  let selectedBuilding = null;
  let debugMode = true;
  
  // Game world settings
  let mapWidth = 60;
  let mapHeight = 40;
  let tileSize = 24;
  let tiles = [];
  
  // Generate map
  function generateMap() {
    // Create an empty map
    tiles = [];
    
    // Generate tiles with interesting pattern
    for (let y = 0; y < mapHeight; y++) {
      let row = [];
      for (let x = 0; x < mapWidth; x++) {
        // Create varied terrain
        let tileType;
        
        // Create some large water bodies
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - mapWidth/2, 2) + 
          Math.pow(y - mapHeight/2, 2)
        );
        
        if (distanceFromCenter < 10) {
          // Deep water in center
          tileType = 1;
        } else if (distanceFromCenter < 15) {
          // Shallow water surrounding
          tileType = 2;
        } else if (x < 10 || x > mapWidth - 10 || y < 10 || y > mapHeight - 10) {
          // Mountains around edges
          tileType = 3;
        } else if (Math.random() < 0.1) {
          // Random forest patches
          tileType = 4;
        } else {
          // Grassland for most of the map
          tileType = 0;
        }
        
        // Add some resources
        let resource = Math.random() < 0.05 ? Math.floor(Math.random() * 3) + 1 : 0;
        
        row.push({
          type: tileType,
          resource: resource,
          building: null
        });
      }
      tiles.push(row);
    }
    
    // Update game state
    gameState.update(state => ({
      ...state,
      map: { 
        name: "Beautiful Planet", 
        width: mapWidth, 
        height: mapHeight,
        tiles: tiles
      },
      resources: {
        energy: 1000,
        water: 500,
        oxygen: 200,
        methane: 300
      }
    }));
    
    console.log("Beautiful map generated!");
  }
  
  // Toggle pause
  function togglePause() {
    isPaused = !isPaused;
    console.log("Game " + (isPaused ? "paused" : "resumed"));
  }
  
  // Place building
  function placeBuilding(type, x, y) {
    // Check if cell is empty
    if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
      if (tiles[y][x].building === null) {
        // Place building
        tiles[y][x].building = type;
        
        // Update resources
        gameState.update(state => {
          const resources = {...state.resources};
          resources.energy -= 50;
          return {...state, resources};
        });
        
        console.log(`Building ${type} placed at (${x},${y})`);
      }
    }
  }
  
  // Get tile color based on type
  function getTileColor(tile) {
    // Base terrain colors
    const colors = {
      0: '#27ae60', // Grass - green
      1: '#2980b9', // Deep water - blue
      2: '#3498db', // Shallow water - light blue
      3: '#7f8c8d', // Mountains - gray
      4: '#2ecc71'  // Forest - dark green
    };
    
    // Resource indicator
    if (tile.resource > 0) {
      const resourceColors = [
        '#f1c40f', // Gold - energy
        '#3498db', // Blue - water
        '#e74c3c'  // Red - oxygen
      ];
      
      // Return resource color
      return resourceColors[tile.resource - 1];
    }
    
    // Building colors
    if (tile.building !== null) {
      const buildingColors = {
        'extractor': '#e67e22',
        'storage': '#f39c12',
        'reactor': '#c0392b',
        'powerPlant': '#d35400',
        'pipe': '#7f8c8d'
      };
      
      return buildingColors[tile.building] || '#9b59b6';
    }
    
    // Otherwise return terrain color
    return colors[tile.type] || '#2c3e50';
  }
  
  // Initialize on mount
  onMount(() => {
    console.log("Game initialized");
    
    // Generate map
    generateMap();
    
    // Add keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        togglePause();
      }
    });
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', togglePause);
    };
  });
</script>

<main class="game-container">
  <!-- Header -->
  <header class="game-header">
    <h1>FrankForge</h1>
    <div class="resources">
      <div class="resource">Energy: {$gameState.resources?.energy || 0}</div>
      <div class="resource">Water: {$gameState.resources?.water || 0}</div>
      <div class="resource">Oxygen: {$gameState.resources?.oxygen || 0}</div>
      <div class="resource">Methane: {$gameState.resources?.methane || 0}</div>
    </div>
    <button class="pause-button" on:click={togglePause}>
      {isPaused ? 'Resume Game' : 'Pause Game'}
    </button>
  </header>
  
  <!-- Game Content -->
  <div class="game-content">
    <!-- Sidebar with building controls -->
    <aside class="sidebar">
      <BuildingControlPanel />
    </aside>
    
    <!-- Main game area with map -->
    <div class="game-area">
      <div class="game-map">
        {#each tiles as row, y}
          <div class="map-row">
            {#each row as tile, x}
              <div
                class="map-tile"
                style="background-color: {getTileColor(tile)}; width: {tileSize}px; height: {tileSize}px;"
                on:click={() => placeBuilding('extractor', x, y)}
              >
                {#if tile.resource > 0}
                  <div class="resource-indicator"></div>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
  
  <!-- Floating Action Button for pause -->
  <button class="floating-button" on:click={togglePause}>
    {isPaused ? '▶️' : '⏸️'}
  </button>
  
  <!-- Controls Info -->
  <div class="controls-info">
    Click on tiles to place extractors | ESC: Toggle Pause Menu
  </div>
  
  <!-- Pause Menu -->
  {#if isPaused}
    <div class="pause-overlay" transition:fade={{duration: 300}}>
      <div class="pause-menu">
        <h2>Game Paused</h2>
        
        <div class="menu-buttons">
          <button class="resume-button" on:click={togglePause}>Resume Game</button>
          <button class="new-game-button" on:click={generateMap}>New Game</button>
          <button class="settings-button">Game Settings</button>
          <button class="save-button">Save Game</button>
        </div>
        
        <div class="menu-footer">
          <p>Press ESC to resume game</p>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Debug Panel -->
  {#if debugMode}
    <div class="debug-panel">
      <h3>Debug Panel</h3>
      <button on:click={togglePause}>Toggle Pause</button>
      <button on:click={generateMap}>Regen Map</button>
      <div>
        <label>
          Tile Size: 
          <input type="range" min="10" max="40" bind:value={tileSize}>
          {tileSize}px
        </label>
      </div>
      <pre>
Game State:
Paused: {isPaused}
Map Size: {mapWidth}x{mapHeight}
Map Name: {$gameState.map?.name || 'None'}
Resources: {JSON.stringify($gameState.resources, null, 2)}
      </pre>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #0f1924;
    color: white;
    overflow: hidden;
  }
  
  .game-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  
  /* Header Styles */
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to right, #1a2a3a, #2c3e50);
    padding: 10px 20px;
    height: 60px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    z-index: 100;
  }
  
  .game-header h1 {
    margin: 0;
    font-size: 24px;
    background: linear-gradient(to right, #3498db, #2ecc71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .resources {
    display: flex;
    gap: 15px;
  }
  
  .resource {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 14px;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
  }
  
  .pause-button {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }
  
  .pause-button:hover {
    background-color: #c0392b;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  }
  
  /* Game Content */
  .game-content {
    display: flex;
    flex: 1;
    position: relative;
    overflow: hidden;
  }
  
  .sidebar {
    width: 250px;
    background-color: rgba(26, 37, 47, 0.9);
    padding: 15px;
    overflow-y: auto;
    z-index: 50;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
  }
  
  .game-area {
    flex: 1;
    position: relative;
    overflow: auto;
    background-color: #0a1016;
  }
  
  .game-map {
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
  
  .map-row {
    display: flex;
  }
  
  .map-tile {
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.3);
    box-sizing: border-box;
    transition: all 0.1s ease;
    cursor: pointer;
  }
  
  .map-tile:hover {
    transform: scale(1.1);
    z-index: 10;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }
  
  .resource-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    background-color: white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
    animation: pulse 2s infinite;
  }
  
  /* Controls Info */
  .controls-info {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 200;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
  }
  
  /* Floating Button */
  .floating-button {
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(145deg, #e74c3c, #c0392b);
    color: white;
    border: none;
    font-size: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 200;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
    transition: all 0.3s ease;
  }
  
  .floating-button:hover {
    transform: scale(1.1) rotate(10deg);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.6);
  }
  
  /* Pause Menu */
  .pause-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .pause-menu {
    background: linear-gradient(145deg, #1a2a3a, #2c3e50);
    border-radius: 20px;
    padding: 30px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .pause-menu h2 {
    margin-top: 0;
    margin-bottom: 30px;
    color: #3498db;
    font-size: 28px;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
  }
  
  .menu-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .menu-buttons button {
    padding: 15px;
    border: none;
    border-radius: 10px;
    background-color: #34495e;
    color: white;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }
  
  .menu-buttons button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  }
  
  .resume-button {
    background: linear-gradient(145deg, #2ecc71, #27ae60) !important;
  }
  
  .new-game-button {
    background: linear-gradient(145deg, #3498db, #2980b9) !important;
  }
  
  .menu-footer {
    margin-top: 30px;
    font-size: 14px;
    color: #bdc3c7;
  }
  
  /* Debug Panel */
  .debug-panel {
    position: fixed;
    bottom: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-top-left-radius: 10px;
    z-index: 2000;
    max-width: 300px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
  }
  
  .debug-panel h3 {
    margin-top: 0;
    color: #3498db;
  }
  
  .debug-panel button {
    margin: 5px;
    padding: 5px 10px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .debug-panel button:hover {
    background-color: #2980b9;
  }
  
  .debug-panel pre {
    font-size: 12px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 8px;
    border-radius: 5px;
    max-height: 200px;
    overflow: auto;
  }
  
  /* Animations */
  @keyframes pulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0.7;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
</style>