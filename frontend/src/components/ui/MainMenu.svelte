<!-- frontend/src/components/ui/MainMenu.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { PlanetType } from '$lib/types';
    
    const dispatch = createEventDispatcher();
    
    // Available planet types for selection
    const planetTypes = [
      { id: PlanetType.EARTH_LIKE, name: 'Earth-like', description: 'A planet with conditions similar to Earth' },
      { id: PlanetType.MARS_LIKE, name: 'Mars-like', description: 'A dry, cold planet with thin atmosphere' },
      { id: PlanetType.DESERT, name: 'Desert', description: 'A hot, arid world with vast wastelands' },
      { id: PlanetType.ICE, name: 'Ice', description: 'A frozen world with freezing temperatures' },
      { id: PlanetType.VOLCANIC, name: 'Volcanic', description: 'A world of lava and extreme heat' },
      { id: PlanetType.ALIEN, name: 'Alien', description: 'A bizarre world with strange properties' },
      { id: PlanetType.OCEAN, name: 'Ocean', description: 'A world covered mostly in water' }
    ];
    
    // Game settings
    let selectedPlanet = PlanetType.EARTH_LIKE;
    let mapSize = "medium";
    let resourceRichness = 0.5;
    let mapWidth = 100;
    let mapHeight = 100;
    
    // Update map size based on selection
    function updateMapSize(size: string) {
      mapSize = size;
      switch (size) {
        case "small":
          mapWidth = 50;
          mapHeight = 50;
          break;
        case "medium":
          mapWidth = 100;
          mapHeight = 100;
          break;
        case "large":
          mapWidth = 200;
          mapHeight = 200;
          break;
      }
    }
    
    // Start game with current settings
    function startGame() {
    console.log("startGame function called in MainMenu");
    const settings = {
      planetType: selectedPlanet,
      mapWidth,
      mapHeight,
      resourceRichness
    };
    console.log("Dispatching startGame event with settings:", settings);
    
    // Force event to dispatch synchronously to parent
    setTimeout(() => {
      dispatch('startGame', settings);
      console.log("Event dispatched from MainMenu");
    }, 0);
    
    // Log dispatch to help debug
    console.log("IMPORTANT: If you don't see handleStartGame logs in App.svelte within a second, the event handling is broken");
  }
    
    // Load a saved game
    function loadGame() {
      console.log("loadGame function called in MainMenu");
      
      // Force event to dispatch synchronously to parent
      setTimeout(() => {
        dispatch('loadGame');
        console.log("loadGame event dispatched from MainMenu");
      }, 0);
    }
  </script>
  
  <div class="main-menu">
  <div class="menu-container">
    <div class="game-title">
      <h1>FrankForge</h1>
      <div class="tagline">Build, React, Evolve</div>
    </div>
    
    <div class="menu-content">

      <div class="planet-selection">
        <h2>Select Planet</h2>
        <div class="planet-grid">
          {#each planetTypes as planet}
            <button 
              class="planet-card" 
              class:selected={selectedPlanet === planet.id}
              on:click={() => selectedPlanet = planet.id}
              type="button"
            >
              <div class="planet-icon" style={`background-color: ${getPlanetColor(planet.id)};`}></div>
              <div class="planet-details">
                <div class="planet-name">{planet.name}</div>
                <div class="planet-description">{planet.description}</div>
              </div>
            </button>
          {/each}
        </div>
      </div>
      
      <div class="game-settings">
        <h2>Game Settings</h2>
        
        <!-- Map Size Selection -->
        <div class="setting">
          <label>Map Size:</label>
          <div class="setting-options">
            <button 
              class:active={mapSize === "small"} 
              on:click={() => updateMapSize("small")}
            >
              Small (50×50)
            </button>
            <button 
              class:active={mapSize === "medium"} 
              on:click={() => updateMapSize("medium")}
            >
              Medium (100×100)
            </button>
            <button 
              class:active={mapSize === "large"} 
              on:click={() => updateMapSize("large")}
            >
              Large (200×200)
            </button>
          </div>
        </div>
        
        <!-- Resource Richness -->
        <div class="setting">
          <label for="resource-slider">Resource Richness: {Math.round(resourceRichness * 100)}%</label>
          <input 
            id="resource-slider"
            type="range" 
            min="0.1" 
            max="1" 
            step="0.1" 
            bind:value={resourceRichness} 
          />
        </div>
      </div>
      
      <!-- Action Buttons - Moved to the top for visibility -->
      <div class="menu-actions">
        <button class="primary-button" on:click={startGame}>
          Start New Game
        </button>
        <button class="secondary-button" on:click={loadGame}>
          Load Saved Game
        </button>
      </div>
    </div>
  </div>
</div>
  
  <style>
    .main-menu {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100vh;
      background-color: #0f0f1e;
      background-image: radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0f0f1e 100%);
      color: white;
      overflow: auto;
    }
    
    .menu-container {
      width: 90%;
      max-width: 1080px;
      height: 90vh;
      overflow-y: auto;
      background-color: rgba(26, 26, 46, 0.8);
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      padding: 1.5rem;
    }
    
    .game-title {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    h1 {
      font-size: 2.5rem;
      margin: 0;
      background: linear-gradient(90deg, #3498db, #2ecc71, #e74c3c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    .tagline {
      font-size: 1rem;
      margin-top: 0.5rem;
      color: #bdc3c7;
    }
    
    .menu-content {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }
    
    .planet-selection {
      margin-bottom: 0.5rem;
    }
    
    .planet-selection label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .planet-selection select {
      width: 100%;
      padding: 0.6rem;
      background-color: #2c3e50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .planet-selection select option {
      background-color: #2c3e50;
      color: white;
    }
    
    .setting {
      margin-bottom: 0.8rem;
    }
    
    .setting label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .setting-options {
      display: flex;
      gap: 0.5rem;
    }
    
    .setting-options button {
      flex: 1;
      background-color: #34495e;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .setting-options button:hover {
      background-color: #3d566e;
    }
    
    .setting-options button.active {
      background-color: #3498db;
    }
    
    input[type="range"] {
      width: 100%;
      background-color: #34495e;
      height: 8px;
      border-radius: 4px;
      -webkit-appearance: none;
    }
    
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: #3498db;
      cursor: pointer;
    }
    
    .menu-actions {
      display: flex;
      gap: 0.8rem;
      margin-top: 1.5rem;
    }
    
    .primary-button, .secondary-button {
      flex: 1;
      padding: 0.8rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .primary-button {
      background-color: #2ecc71;
      color: white;
    }
    
    .primary-button:hover {
      background-color: #27ae60;
      transform: translateY(-2px);
    }
    
    .secondary-button {
      background-color: #7f8c8d;
      color: white;
    }
    
    .secondary-button:hover {
      background-color: #95a5a6;
      transform: translateY(-2px);
    }
  </style>
  
  <script context="module">
    // Helper function to get a color for each planet type
    function getPlanetColor(planetType: PlanetType): string {
      switch (planetType) {
        case PlanetType.EARTH_LIKE:
          return '#27ae60'; // Green for Earth
        case PlanetType.MARS_LIKE:
          return '#d35400'; // Red-orange for Mars
        case PlanetType.DESERT:
          return '#f39c12'; // Yellow-orange for Desert
        case PlanetType.ICE:
          return '#3498db'; // Blue for Ice
        case PlanetType.VOLCANIC:
          return '#c0392b'; // Red for Volcanic
        case PlanetType.ALIEN:
          return '#8e44ad'; // Purple for Alien
        case PlanetType.OCEAN:
          return '#2980b9'; // Darker blue for Ocean
        default:
          return '#bdc3c7'; // Gray for unknown
      }
    }
  </script>