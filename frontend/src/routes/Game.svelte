<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import PixiGame from '../components/world/PixiGame.svelte';
  import BuildingControlPanel from '../components/ui/BuildingControlPanel.svelte';
  import CharacterAttributesPanel from '../components/ui/CharacterAttributesPanel.svelte';
  import ObjectiveTracker from '../components/ui/ObjectiveTracker.svelte';
  import ChemistryPanel from '../components/ui/ChemistryPanel.svelte';
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
  let showCharacterPanel = false;
  let showObjectiveTracker = true;
  let showChemistryPanel = false;
  
  // Resources display
  let resources = {
    energy: $gameState.resources?.energy || 100,
    water: $gameState.resources?.water || 100,
    oxygen: $gameState.resources?.oxygen || 100,
    methane: $gameState.resources?.methane || 100
  };
  
  // Subscription to game state for resource updates
  const unsubscribe = gameState.subscribe(state => {
    resources = {
      energy: state.resources?.energy || 0,
      water: state.resources?.water || 0,
      oxygen: state.resources?.oxygen || 0,
      methane: state.resources?.methane || 0
    };
  });
  
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
      // Use larger map for exploration - at least 200x200
      const explorationMapWidth = Math.max(200, mapWidth);
      const explorationMapHeight = Math.max(200, mapHeight);
      
      console.log(`Generating ${planetType} map (${explorationMapWidth}x${explorationMapHeight})`);
      
      const generatedMap = mapGenerator.generateMap({
        planetType,
        width: explorationMapWidth,
        height: explorationMapHeight,
        resourceRichness,
        specialFeatureCount: 15,  // More features for exploration
        smoothness: 0.6,          // More gradual terrain transitions
        alienness: 0.4            // Slightly more alien features
      });
      
      // Set player position to center of map
      const centerX = Math.floor(explorationMapWidth / 2);
      const centerY = Math.floor(explorationMapHeight / 2);
      
      gameState.update(state => ({
        ...state,
        map: generatedMap,
        planetType,
        tick: 0,
        buildings: [],
        lastUpdated: Date.now(),
        player: {
          ...state.player,
          position: { x: centerX, y: centerY }
        }
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
    
    // Add an exploration starter quest if none exists
    addStarterQuest();
    
    // Log when game is ready
    console.log("Game component fully initialized");
  });
  
  onDestroy(() => {
    // Clean up subscriptions
    if (unsubscribe) unsubscribe();
  });
  
  // Toggle character panel
  function toggleCharacterPanel() {
    showCharacterPanel = !showCharacterPanel;
  }
  
  // Toggle objective tracker
  function toggleObjectiveTracker() {
    showObjectiveTracker = !showObjectiveTracker;
  }
  
  // Toggle chemistry panel
  function toggleChemistryPanel() {
    showChemistryPanel = !showChemistryPanel;
  }
  
  // Add a starter exploration quest if there are none
  function addStarterQuest() {
    gameState.update(state => {
      if (!state.exploration) {
        state.exploration = {
          discoveredTiles: 0,
          discoveredPOIs: [],
          activeQuests: [],
          completedQuests: [],
          fogOfWar: true,
          visibilityRadius: 15
        };
      }
      
      if (state.exploration.activeQuests.length === 0) {
        // Add an exploration starter quest
        state.exploration.activeQuests.push({
          id: 'q1',
          name: 'Getting Started',
          description: 'Explore the area around your landing site to establish a base.',
          status: 'active',
          objectives: [
            {
              id: 'obj1',
              description: 'Discover 50 tiles by exploring the map',
              type: 'discover',
              target: 'tiles',
              quantity: 50,
              progress: state.exploration.discoveredTiles || 0,
              completed: (state.exploration.discoveredTiles || 0) >= 50
            },
            {
              id: 'obj2',
              description: 'Find at least 1 point of interest',
              type: 'discover',
              target: 'poi',
              quantity: 1,
              progress: state.exploration.discoveredPOIs?.length || 0,
              completed: (state.exploration.discoveredPOIs?.length || 0) >= 1
            },
            {
              id: 'obj3',
              description: 'Harvest resources from the environment',
              type: 'collect',
              target: 'resources',
              quantity: 10,
              progress: 0,
              completed: false
            }
          ],
          reward: {
            resources: {
              energy: 200,
              iron: 50,
              copper: 50
            },
            skills: {
              exploration: 1
            }
          }
        });
      }
      
      return state;
    });
  }
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
      <button class="control-button" on:click={toggleCharacterPanel}>
        Character
      </button>
      <button class="control-button" on:click={toggleObjectiveTracker}>
        {showObjectiveTracker ? 'Hide Objectives' : 'Show Objectives'}
      </button>
      <button class="control-button" on:click={toggleChemistryPanel}>
        Chemistry
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
      
      <!-- Floating UI Elements -->
      {#if showCharacterPanel}
        <div class="floating-panel character-panel-container">
          <CharacterAttributesPanel on:close={() => (showCharacterPanel = false)} />
        </div>
      {/if}
      
      {#if showObjectiveTracker}
        <div class="floating-panel objective-tracker-container">
          <ObjectiveTracker />
        </div>
      {/if}
      
      {#if showChemistryPanel}
        <div class="floating-panel chemistry-panel-container">
          <ChemistryPanel on:close={() => (showChemistryPanel = false)} />
        </div>
      {/if}
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
  
  .floating-panel {
    position: absolute;
    z-index: 100;
  }
  
  .character-panel-container {
    top: 70px;
    right: 10px;
  }
  
  .objective-tracker-container {
    top: 70px;
    left: 270px;
  }
  
  .chemistry-panel-container {
    top: 70px;
    right: 340px;
  }
</style>
