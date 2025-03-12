#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up FrankForge project...${NC}"

# Build Rust WASM component
echo -e "${YELLOW}Building Rust WASM components...${NC}"
cd rust
# Update Cargo.toml to include serde-serialize feature
sed -i.bak 's/wasm-bindgen = "0.2.87"/wasm-bindgen = { version = "0.2.87", features = ["serde-serialize"] }/g' Cargo.toml
wasm-pack build --target web
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build WASM components. See error above.${NC}"
    exit 1
fi
cd ..

# Set up frontend
echo -e "${YELLOW}Setting up frontend components...${NC}"
cd frontend

# Fix Game.svelte
echo -e "${YELLOW}Fixing Game.svelte...${NC}"
cat > src/routes/Game.svelte << 'EOL'
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import GameCanvas from '../components/world/GameCanvas.svelte';
  import BuildingControlPanel from '../components/ui/BuildingControlPanel.svelte';
  import { gameState, startGameLoop } from '../stores/gameState';
  import { initWasm } from '../wasm';
  
  let gameLoopStop: () => void;
  
  onMount(async () => {
    // Initialize WASM
    await initWasm();
    
    // Start game loop
    gameLoopStop = startGameLoop();
    
    return () => {
      if (gameLoopStop) gameLoopStop();
    };
  });
</script>

<div class="game-page">
  <header class="game-header">
    <h1>FrankForge</h1>
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
    </div>
  </header>
  
  <main class="game-content">
    <div class="sidebar">
      <BuildingControlPanel />
    </div>
    
    <div class="game-canvas-container">
      <GameCanvas />
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
    background-color: #1a1a2e;
  }
  
  h1 {
    margin: 0;
    font-size: 24px;
    color: #3498db;
  }
  
  .control-button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .game-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .sidebar {
    width: 320px;
    padding: 16px;
    background-color: rgba(26, 26, 46, 0.9);
  }
  
  .game-canvas-container {
    flex: 1;
    overflow: hidden;
  }
</style>
EOL

# Install dependencies and start dev server
npm install
echo -e "${GREEN}Setup complete! Starting development server...${NC}"
npm run dev