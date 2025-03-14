<!-- src/routes/game/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import GameCanvas from '../../components/GameCanvas.svelte';
    import BuildingControlPanel from '../../components/BuildingControlPanel.svelte';
    import ResourceDisplay from '../../components/ResourceDisplay.svelte';
    import SaveLoadPanel from '../../components/SaveLoadPanel.svelte';
    import { gameState } from '../../lib/gameLoop';
    import { supabase } from '../../lib/supabase';
    // import { browser } from '$app/environment';
    // import { goto } from '$app/navigation';
    
    let gameCanvas: GameCanvas;
    let isLoading = true;
    let user: any = null;
    
    // Check if user is logged in
    onMount(async () => {
      if (browser) {
        const { data } = await supabase.auth.getUser();
        user = data.user;
        
        if (!user) {
          // Redirect to login page
          goto('/login');
          return;
        }
        
        // Initialize the game
        initializeGame();
      }
    });
    
    function initializeGame() {
      // Set up initial game state
      gameState.update(state => {
        // Initialize with default values if needed
        return {
          ...state,
          // Any additional initializations
        };
      });
      
      isLoading = false;
    }
    
    // Game controls
    function handlePause() {
      gameState.update(state => ({
        ...state,
        isPaused: !state.isPaused
      }));
    }
    
    // Handle keybindings
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Cancel current placement or selection
        // This would need to be implemented in the GameCanvas component
      } else if (event.key === ' ') {
        // Space bar to pause/unpause
        handlePause();
      }
    }
  </script>
  
  <svelte:window on:keydown={handleKeydown} />
  
  <div class="game-page">
    {#if isLoading}
      <div class="loading">
        <p>Loading FrankForge...</p>
      </div>
    {:else}
      <header class="game-header">
        <h1>FrankForge</h1>
        <div class="controls">
          <button class="control-button" on:click={handlePause}>
            {$gameState.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button class="control-button" on:click={() => null}>Settings</button>
        </div>
      </header>
      
      <main class="game-content">
        <div class="sidebar left-sidebar">
          <BuildingControlPanel {gameCanvas} />
          <ResourceDisplay />
        </div>
        
        <div class="game-canvas-container">
          <GameCanvas bind:this={gameCanvas} />
        </div>
        
        <div class="sidebar right-sidebar">
          <SaveLoadPanel />
          
          <div class="info-panel">
            <h3>Game Info</h3>
            <p>Tick: {$gameState.tick}</p>
            <p>Buildings: {$gameState.buildings.length}</p>
            <p>Planet conditions: Normal</p>
          </div>
        </div>
      </main>
    {/if}
  </div>
  
  <style>
    .game-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: #0f0f1e;
      color: white;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      font-size: 24px;
    }
    
    .game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background-color: #1a1a2e;
      border-bottom: 1px solid #2a2a3e;
    }
    
    h1 {
      margin: 0;
      font-size: 24px;
      color: #3498db;
    }
    
    .controls {
      display: flex;
      gap: 12px;
    }
    
    .control-button {
      background-color: #2c3e50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .control-button:hover {
      background-color: #3d566e;
    }
    
    .game-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .sidebar {
      width: 320px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
    }
    
    .left-sidebar {
      background-color: rgba(26, 26, 46, 0.9);
      border-right: 1px solid #2a2a3e;
    }
    
    .right-sidebar {
      background-color: rgba(26, 26, 46, 0.9);
      border-left: 1px solid #2a2a3e;
    }
    
    .game-canvas-container {
      flex: 1;
      overflow: hidden;
    }
    
    .info-panel {
      background-color: #2c3e50;
      border-radius: 4px;
      padding: 16px;
    }
    
    .info-panel h3 {
      margin-top: 0;
      border-bottom: 1px solid #34495e;
      padding-bottom: 8px;
    }
  </style>