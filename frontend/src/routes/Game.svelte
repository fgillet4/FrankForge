<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import PixiGame from '../components/world/PixiGame.svelte';
  import BuildingControlPanel from '../components/ui/BuildingControlPanel.svelte';
  import { gameState } from '../stores/gameState';
  import { mapGenerator } from '../lib/mapGenerator';
  import { PlanetType } from '../lib/types';
  import { initWasm } from '../wasm';
  
  // Game component references
  let pixiGameComponent: PixiGame;
  
  // Game settings from URL or default
  const params = new URLSearchParams(window.location.search);
  let planetType = (params.get('planet') as PlanetType) || PlanetType.EARTH_LIKE;
  let mapWidth = parseInt(params.get('width') || '100');
  let mapHeight = parseInt(params.get('height') || '100');
  let resourceRichness = parseFloat(params.get('resources') || '0.5');
  
  // UI state
  let selectedBuildingType: string | null = null;
  let isPlacementMode = false;
  
  // Resources display
  let resources = {
    energy: $gameState.resources?.energy || 100,
    water: $gameState.resources?.water || 100,
    oxygen: $gameState.resources?.oxygen || 100,
    methane: $gameState.resources?.methane || 100
  };
  
  // Navigate back to menu
  function handleBackToMenu() {
    window.location.href = '/';
  }
  
  // Handle building selection from control panel
  function handleBuildingSelect(event: CustomEvent) {
    selectedBuildingType = event.detail.type;
    isPlacementMode = true;
    
    if (pixiGameComponent) {
      pixiGameComponent.selectBuildingType(selectedBuildingType);
    }
  }
  
  // Generate a new map if needed
  function ensureMapExists() {
    const state = $gameState;
    if (!state.map) {
      console.log(`Generating ${planetType} map (${mapWidth}x${mapHeight})`);
      
      const generatedMap = mapGenerator.generateMap({
        planetType,
        width: mapWidth,
        height: mapHeight,
        resourceRichness,
        specialFeatureCount: 3
      });
      
      gameState.update(state => ({
        ...state,
        map: generatedMap,
        planetType,
        tick: 0,
        buildings: [],
        lastUpdated: Date.now()
      }));
      
      console.log('Map generated:', generatedMap.name);
    }
  }
  
  // Process game ready event from PixiGame component
  function handleGameReady(event: CustomEvent) {
    console.log('PixiJS game initialized and ready', event.detail);
  }
  
  onMount(async () => {
    console.log("Game component mounted!");
    console.debug("Props received:", { planetType, mapWidth, mapHeight, resourceRichness });
    
    // Initialize WASM
    await initWasm();
    
    // Ensure we have a map
    ensureMapExists();
    
    // Log when game is ready
    console.log("Game component fully initialized");
  });
</script>

<div class="game-page">
  <header class="game-header">
    <h1>FrankForge</h1>
    <div class="resources">
      <div class="resource">
        <div class="resource-icon energy"></div>
        <div class="resource-value">{resources.energy}</div>
      </div>
      <div class="resource">
        <div class="resource-icon water"></div>
        <div class="resource-value">{resources.water}</div>
      </div>
      <div class="resource">
        <div class="resource-icon oxygen"></div>
        <div class="resource-value">{resources.oxygen}</div>
      </div>
      <div class="resource">
        <div class="resource-icon methane"></div>
        <div class="resource-value">{resources.methane}</div>
      </div>
    </div>
    <div class="controls">
      <button
        class="control-button"
        on:click={() => {
          gameState.update(state => ({
            ...state,
            isPaused: !state.isPaused
          }));
        }}
      >
        {$gameState.isPaused ? 'Resume' : 'Pause'}
      </button>
      <button class="menu-button" on:click={handleBackToMenu}>
        Back to Menu
      </button>
    </div>
  </header>
  
  <main class="game-content">
    <div class="sidebar">
      <BuildingControlPanel on:select={handleBuildingSelect} />
    </div>
    
    <div class="game-canvas-container">
      <PixiGame
        bind:this={pixiGameComponent}
        on:ready={handleGameReady}
      />
    </div>
  </main>
</div>

<style>
  .game-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #0f0f1e;
    color: white;
  }
  
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background-color: rgba(26, 26, 46, 0.9);
    backdrop-filter: blur(5px);
    z-index: 100;
  }
  
  h1 {
    margin: 0;
    font-size: 24px;
    color: #3498db;
  }
  
  .resources {
    display: flex;
    gap: 20px;
  }
  
  .resource {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .resource-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  
  .energy {
    background-color: #f1c40f; /* Yellow for energy */
  }
  
  .water {
    background-color: #3498db; /* Blue for water */
  }
  
  .oxygen {
    background-color: #ecf0f1; /* Light gray/white for oxygen */
  }
  
  .methane {
    background-color: #9b59b6; /* Purple for methane */
  }
  
  .resource-value {
    font-size: 1rem;
    font-weight: bold;
    color: white;
  }
  
  .controls {
    display: flex;
    gap: 10px;
  }
  
  .control-button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .menu-button {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .menu-button:hover {
    background-color: #c0392b;
  }
  
  .game-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  
  .sidebar {
    width: 250px;
    padding: 16px;
    background-color: rgba(26, 26, 46, 0.8);
    backdrop-filter: blur(5px);
    z-index: 50;
    border-right: 1px solid rgba(52, 152, 219, 0.3);
  }
  
  .game-canvas-container {
    flex: 1;
    overflow: hidden;
    position: relative;
  }
</style>
