<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState, startGameLoop } from '$lib/gameLoop';
  import { initWasm } from '$lib/wasm';
  import GameCanvas from './components/world/GameCanvas.svelte';
  import BuildingControlPanel from './components/buildings/BuildingControlPanel.svelte';
  import ResourceDisplay from './components/ui/ResourceDisplay.svelte';
  
  let gameCanvas;
  let gameLoopStop;
  
  onMount(async () => {
    // Initialize WASM (commented out for now until we integrate it)
    try {
      // await initWasm();
      console.log('WASM integration will be added later');
    } catch (error) {
      console.error('Failed to initialize WASM:', error);
    }
    
    // Start game loop
    gameLoopStop = startGameLoop();
    
    // Clean up on component destroy
    return () => {
      if (gameLoopStop) gameLoopStop();
    };
  });
  
  // Handle pause toggle
  function togglePause() {
    gameState.update(state => ({
      ...state,
      isPaused: !state.isPaused
    }));
  }
</script>

<main>
  <div class="game-container">
    <header>
      <h1>FrankForge</h1>
      <div class="controls">
        <button on:click={togglePause}>
          {$gameState.isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </header>
    
    <div class="game-content">
      <div class="sidebar">
        <BuildingControlPanel {gameCanvas} />
        <ResourceDisplay />
      </div>
      
      <div class="canvas-container">
        <GameCanvas bind:this={gameCanvas} />
      </div>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #1a1a2e;
    color: white;
  }
  
  .game-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #0f0f1e;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #2a2a3e;
  }
  
  h1 {
    margin: 0;
    color: #3498db;
    font-size: 1.5rem;
  }
  
  .controls button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .controls button:hover {
    background-color: #3d566e;
  }
  
  .game-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .sidebar {
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background-color: #16213e;
    overflow-y: auto;
  }
  
  .canvas-container {
    flex: 1;
    overflow: hidden;
  }
</style>