<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { fade } from 'svelte/transition';
  import MainMenu from './components/ui/MainMenu.svelte';
  import { mapGenerator } from './lib/mapGenerator';
  import { gameState } from './stores/gameState';
  import { PlanetType } from './lib/types';
  
  // For debugging purposes
  console.log("App.svelte is being evaluated");
  
  // Helper functions for map rendering
  function getTileColor(terrainType: number): string {
    // Colors for different terrain types
    switch(terrainType) {
      case 0: return '#0a3b5c'; // DEEP_WATER
      case 1: return '#0e6ba8'; // SHALLOW_WATER
      case 2: return '#e4d6a7'; // SAND
      case 3: return '#7ab317'; // GRASS
      case 4: return '#3e7924'; // FOREST
      case 5: return '#6d8383'; // HILLS
      case 6: return '#8d8778'; // MOUNTAINS
      case 7: return '#ffffff'; // SNOW
      case 8: return '#7c3626'; // VOLCANIC
      case 9: return '#e25822'; // LAVA
      case 10: return '#3c2c3e'; // CAVE
      case 11: return '#a2d6a2'; // ALIEN_GRASS
      case 12: return '#5eaa5e'; // ALIEN_FOREST
      case 13: return '#bf62a6'; // ALIEN_CRYSTAL
      case 14: return '#39848b'; // METHANE_LAKE
      case 15: return '#c9e1ff'; // ICE
      default: return '#555555'; // DEFAULT
    }
  }
  
  function getResourceColor(resourceType: number): string {
    // Colors for different resource types
    switch(resourceType) {
      case 0: return 'transparent'; // NONE
      case 1: return '#39848b'; // METHANE
      case 2: return '#f5f5f5'; // OXYGEN
      case 3: return '#43aada'; // WATER
      case 4: return '#b77333'; // IRON
      case 5: return '#d4a276'; // COPPER
      case 6: return '#f0e68c'; // SILICON
      case 7: return '#fff44f'; // SULFUR
      case 8: return '#9bc400'; // URANIUM
      case 9: return '#c0c0c0'; // RARE_METALS
      case 10: return '#bf62a6'; // XENOCRYSTALS
      default: return '#888888'; // DEFAULT
    }
  }
  
  // Application state
  let showMainMenu = true;
  let showGame = false;
  let gameSettings: {
    planetType: PlanetType;
    mapWidth: number;
    mapHeight: number;
    resourceRichness: number;
  } | null = null;
  
  // Debug flags
  let debugMode = true;
  
  // Handle game start from main menu
  function handleStartGame(event: CustomEvent) {
    console.log("handleStartGame triggered in App.svelte");
    
    // Get settings from the event
    gameSettings = event.detail;
    console.log("Game settings received:", gameSettings);
    
    // Generate the map based on settings
    if (gameSettings) {
      console.log("Generating map for", gameSettings.planetType);
      const generatedMap = mapGenerator.generateMap({
        planetType: gameSettings.planetType,
        width: gameSettings.mapWidth,
        height: gameSettings.mapHeight,
        resourceRichness: gameSettings.resourceRichness,
        specialFeatureCount: 3 // Reduce for safety
      });
      
      console.log("Map generated successfully, updating game state");
      
      // Update the game state with the new map
      gameState.update(state => ({
        ...state,
        map: generatedMap,
        planetType: gameSettings.planetType,
        tick: 0,
        buildings: [],
        lastUpdated: Date.now()
      }));
      
      console.log("Game state updated, transitioning to game view");
      
      // Switch scenes: hide menu, show game
      showMainMenu = false;
      showGame = true;
      console.log("Transitioning from menu to game scene");
      
      // Initialize canvas after DOM update
      setTimeout(initializeCanvas, 500);
    }
  }
  
  // Handle load game
  function handleLoadGame() {
    // Placeholder for load game functionality
    console.log("Load game requested");
    
    // Example of loading a saved game - would come from storage in reality
    const savedGame = {
      planetType: PlanetType.EARTH_LIKE,
      buildings: [],
      resources: {},
      tick: 0
    };
    
    // Update game state with saved game
    gameState.update(state => ({
      ...state,
      ...savedGame,
      lastUpdated: Date.now()
    }));
    
    // Switch scenes: hide menu, show game
    showMainMenu = false;
    showGame = true;
    
    // Initialize canvas after a delay
    setTimeout(initializeCanvas, 500);
  }
  
  let canvasElement: HTMLCanvasElement;
  let savedGameState: any = null;
  
  // Scene transition functions
  function handleBackToMenu() {
    showGame = false;
    showMainMenu = true;
    console.log("Returning to main menu");
  }
  
  // Handle toggling buttons in debug panel
  function handleToggleMenu() {
    showMainMenu = !showMainMenu;
    console.log("Toggled menu visibility:", showMainMenu);
    
    // Make sure we're in a valid state
    if (showMainMenu && showGame) {
      showGame = false;
    } else if (!showMainMenu && !showGame) {
      showGame = true;
    }
  }
  
  function handleToggleGame() {
    showGame = !showGame;
    console.log("Toggled game visibility:", showGame);
    
    // Make sure we're in a valid state
    if (showGame && showMainMenu) {
      showMainMenu = false;
    }
    
    // If showing game, make sure canvas is initialized
    if (showGame) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        initializeCanvas();
      }, 100);
    }
  }
  
  // For debugging - save current game state
  function forceSaveGame() {
    savedGameState = JSON.parse(JSON.stringify($gameState));
    console.log("Game state saved:", savedGameState);
    alert("Game state saved (see console)");
  }
  
  // For debugging - restore saved game state
  function forceLoadGame() {
    if (!savedGameState) {
      console.error("No saved game state to load");
      alert("No saved game state to load");
      return;
    }
    
    gameState.set(savedGameState);
    console.log("Game state restored from saved state");
    
    if (showGame) {
      setTimeout(() => {
        initializeCanvas();
      }, 100);
    }
    
    alert("Game state restored - map should appear when game is visible");
  }
  
  // Initialize and draw on the canvas
  function initializeCanvas() {
    try {
      const canvas = document.getElementById('basic-canvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error("Canvas element not found");
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("Could not get canvas context");
        return;
      }
      
      // Clear the canvas
      ctx.fillStyle = '#0a0a18';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw map if available
      if ($gameState.map && $gameState.map.tiles) {
        console.log("Rendering map tiles in canvas...");
        console.log("Map dimensions:", $gameState.map.width, "x", $gameState.map.height);
        
        // Calculate tile size to fit the map on screen
        const tileSize = Math.min(
          Math.floor(canvas.width / $gameState.map.width),
          Math.floor(canvas.height / $gameState.map.height)
        );
        
        // Maximum dimensions to render
        const maxTilesX = Math.min($gameState.map.width, Math.floor(canvas.width / tileSize));
        const maxTilesY = Math.min($gameState.map.height, Math.floor(canvas.height / tileSize));
        
        console.log(`Rendering ${maxTilesX}x${maxTilesY} tiles at ${tileSize}px size`);
        
        // Draw each map tile
        for (let y = 0; y < maxTilesY; y++) {
          for (let x = 0; x < maxTilesX; x++) {
            const tile = $gameState.map.tiles[y][x];
            
            // Get color based on terrain type
            const tileColor = getTileColor(tile.terrain);
            
            // Draw tile
            ctx.fillStyle = tileColor;
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            
            // Draw resource indicator if present
            if (tile.resource > 0) {
              ctx.fillStyle = getResourceColor(tile.resource);
              ctx.fillRect(
                x * tileSize + tileSize/4, 
                y * tileSize + tileSize/4, 
                tileSize/2, 
                tileSize/2
              );
            }
          }
        }
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= maxTilesX; x++) {
          ctx.beginPath();
          ctx.moveTo(x * tileSize, 0);
          ctx.lineTo(x * tileSize, maxTilesY * tileSize);
          ctx.stroke();
        }
        
        for (let y = 0; y <= maxTilesY; y++) {
          ctx.beginPath();
          ctx.moveTo(0, y * tileSize);
          ctx.lineTo(maxTilesX * tileSize, y * tileSize);
          ctx.stroke();
        }
        
        // Draw planet information
        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.fillText(`Planet: ${$gameState.map.name}`, 10, maxTilesY * tileSize + 25);
        ctx.fillText(`Type: ${$gameState.planetType}`, 10, maxTilesY * tileSize + 45);
        ctx.fillText(`Size: ${$gameState.map.width}x${$gameState.map.height}`, 10, maxTilesY * tileSize + 65);
      } else {
        // Draw a test pattern if no map is available
        console.log("No map data available, drawing test pattern");
        
        // Draw a grid
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        
        const gridSize = 32;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        // Draw text
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Debug Canvas View', 50, 50);
        ctx.fillText('No map data available', 50, 100);
        
        if (gameSettings) {
          ctx.fillText(`Attempted Planet Type: ${gameSettings.planetType}`, 50, 150);
        }
      }
      
      console.log("Canvas initialized and drawn");
    } catch (err) {
      console.error("Error initializing canvas:", err);
    }
  }
  
  onMount(() => {
    console.log("App component mounted");
  });
  
  afterUpdate(() => {
    console.log("App component updated, checking for canvas");
    canvasElement = document.getElementById('basic-canvas') as HTMLCanvasElement;
    if (canvasElement && showGame) {
      console.log("Canvas found after update:", canvasElement.id);
      initializeCanvas();
    }
  });
</script>

<main class="app">
  <!-- Unity-style scene management approach -->
  {#if showMainMenu}
    <!-- MENU SCENE -->
    <div class="scene menu-scene" transition:fade={{ duration: 400 }}>
      <MainMenu 
        on:startGame={handleStartGame}
        on:loadGame={handleLoadGame}
      />
    </div>
  {:else if showGame}
    <!-- GAME SCENE -->
    <div class="scene game-scene" transition:fade={{ duration: 400 }}>
      <div class="game-content">
        <canvas 
          id="basic-canvas" 
          width="1000" 
          height="800"
        ></canvas>
        
        <!-- Game UI Overlay -->
        <div class="game-ui">
          <div class="top-bar">
            <h2 class="planet-name">
              {$gameState.map?.name || 'Unknown Planet'} 
              ({gameSettings?.planetType || 'unknown'})
            </h2>
            <button class="menu-button" on:click={handleBackToMenu}>Back to Menu</button>
          </div>
        </div>
      </div>
    </div>
  {/if}
  
  {#if debugMode}
    <div class="debug-panel">
      <h3>Debug Panel</h3>
      <button on:click={handleToggleMenu}>
        Toggle Menu
      </button>
      <button on:click={handleToggleGame}>
        Toggle Game
      </button>
      <pre>
        State: 
        showMainMenu: {showMainMenu}
        showGame: {showGame}
        settings: {JSON.stringify(gameSettings, null, 2)}
        
        Game State:
        Map Name: {$gameState.map?.name || 'Not generated yet'}
        Planet Type: {$gameState.planetType || 'None'}
        Buildings: {$gameState.buildings?.length || 0}
        Map Available: {$gameState.map ? 'Yes' : 'No'}
        Map Tiles: {$gameState.map?.tiles ? 'Yes (' + $gameState.map.tiles.length + ' rows)' : 'No'}
        Resources: {JSON.stringify($gameState.resources, null, 2)}
      </pre>
      
      <div class="debug-actions">
        <button on:click={() => forceSaveGame()}>Force Save Game State</button>
        <button on:click={() => forceLoadGame()}>Force Restore Game State</button>
      </div>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #0f0f1e;
    color: white;
    overflow: hidden;
  }
  
  .app {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }
  
  /* Scene Management */
  .scene {
    width: 100%;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10;
  }
  
  .menu-scene {
    background-color: #0f0f1e;
  }
  
  .game-scene {
    background-color: #1a1a2e;
    display: flex;
    flex-direction: column;
  }
  
  .game-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }
  
  /* Game UI */
  .game-ui {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    pointer-events: none;
  }
  
  .game-ui .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
  }
  
  .planet-name {
    margin: 0;
    font-size: 1.2rem;
    color: #3498db;
  }
  
  .menu-button {
    pointer-events: auto;
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  canvas {
    border: 2px solid #3498db;
    background-color: #0f0f1e;
    max-width: 90vw;
    max-height: 70vh;
    box-shadow: 0 0 20px rgba(52, 152, 219, 0.5);
  }
  
  .canvas-text, .planet-info {
    color: white;
    font-size: 16px;
    margin-top: 10px;
    text-align: center;
  }
  
  .planet-info {
    color: #3498db;
    font-weight: bold;
  }
  
  .debug-panel {
    position: fixed;
    bottom: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-top-left-radius: 5px;
    z-index: 1000;
    max-width: 400px;
    font-size: 12px;
  }
  
  .debug-panel button {
    margin: 5px;
    padding: 4px 8px;
    font-size: 12px;
    background-color: #2c3e50;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  
  .debug-panel button:hover {
    background-color: #3498db;
  }
  
  .debug-panel pre {
    max-height: 250px;
    overflow: auto;
    font-size: 10px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 8px;
    border-radius: 3px;
  }
  
  .debug-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 10px;
  }
  
  .debug-actions button {
    background-color: #27ae60;
    flex: 1;
  }
</style>