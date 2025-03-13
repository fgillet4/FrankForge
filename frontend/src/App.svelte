<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import BuildingControlPanel from './components/ui/BuildingControlPanel.svelte';
  import ResourceDisplay from './components/ui/ResourceDisplay.svelte';
  import SaveLoadPanel from './components/ui/SaveLoadPanel.svelte';
  import ResearchPanel from './components/ui/ResearchPanel.svelte';
  import StatisticsPanel from './components/ui/StatisticsPanel.svelte';
  import { gameState } from './stores/gameState';
  import { PlanetType } from './lib/types';
  
  // Game state
  // We'll initialize isPaused from the gameState store, but maintain a local copy
  // for faster UI rendering
  let isPaused = $gameState.isPaused || false;
  
  // Reactive statement to keep local isPaused in sync with the store
  $: isPaused = $gameState.isPaused;
  let selectedBuilding = null;
  let debugMode = false; // Changed to false for production
  
  // Game world settings
  let mapWidth = 60;
  let mapHeight = 40;
  let tileSize = 24;
  let tiles = [];
  
  // UI state
  let showTooltip = false;
  let tooltipContent = '';
  let tooltipX = 0;
  let tooltipY = 0;
  let activePanel = 'buildings'; // buildings, resources, save, tutorial
  let showTutorial = false;
  let tutorialStep = 0;
  let showMinimap = true;
  let showGhostBuilding = true;
  let currentGhostBuilding = null;
  let ghostBuildingX = 0;
  let ghostBuildingY = 0;
  let isValidPlacement = true;
  let showContextMenu = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let contextMenuItems = [];
  let draggingCanvas = false;
  let canvasOffsetX = 0;
  let canvasOffsetY = 0;
  let zoomLevel = 1;
  let usedBlueprints = [];
  let currentBlueprint = null;
  let showConnectionLines = true;
  
  // Generate a noise value between 0 and 1
  function generateNoise(x, y, frequency = 0.1, seed = 42) {
    return Math.abs(Math.sin(x * frequency + seed) * Math.cos(y * frequency + seed)) % 1;
  }
  
  // Create multiple octaves of noise for more natural terrain
  function generateTerrainNoise(x, y, octaves = 4, persistence = 0.5, scale = 0.05) {
    let noise = 0;
    let amplitude = 1.0;
    let frequency = scale;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      noise += generateNoise(x * frequency, y * frequency, 1, i * 100) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    // Normalize to 0-1
    return noise / maxValue;
  }
  
  // Generate map with improved terrain using noise functions
  function generateMap() {
    // Create an empty map
    tiles = [];
    const seed = Math.floor(Math.random() * 10000);
    
    // Generate base noise maps for different terrain features
    const heightNoise = [];
    const moistureNoise = [];
    const resourceNoise = [];
    
    // Pre-calculate noise values for performance
    for (let y = 0; y < mapHeight; y++) {
      heightNoise[y] = [];
      moistureNoise[y] = [];
      resourceNoise[y] = [];
      
      for (let x = 0; x < mapWidth; x++) {
        // Height noise - determines base terrain type
        heightNoise[y][x] = generateTerrainNoise(x, y, 4, 0.5, 0.04);
        
        // Moisture noise - affects vegetation and water bodies
        moistureNoise[y][x] = generateTerrainNoise(x, y, 3, 0.4, 0.03);
        
        // Resource noise - determines resource distribution
        resourceNoise[y][x] = generateTerrainNoise(x + 500, y + 500, 3, 0.3, 0.08);
      }
    }
    
    // Generate tiles based on noise maps
    for (let y = 0; y < mapHeight; y++) {
      let row = [];
      for (let x = 0; x < mapWidth; x++) {
        // Create varied terrain based on noise values
        let tileType;
        let variant = 0;
        
        // Get noise values
        const height = heightNoise[y][x];
        const moisture = moistureNoise[y][x];
        
        // Determine base terrain type from height and moisture
        if (height < 0.3) {
          // Water bodies
          if (height < 0.15) {
            tileType = 1; // Deep water
          } else {
            tileType = 2; // Shallow water
          }
          
          // Add water variant based on moisture
          variant = Math.floor(moisture * 3);
        } else if (height > 0.7) {
          // Mountains and hills
          tileType = 3; // Mountains
          
          // Add mountain variant
          variant = Math.floor(moisture * 3);
        } else if (moisture > 0.65) {
          // Forest
          tileType = 4;
          // Forest variants
          variant = Math.floor(height * 3);
        } else {
          // Grassland/plains
          tileType = 0;
          // Grass variants
          variant = Math.floor((moisture + height) * 1.5) % 3;
        }
        
        // Special features for more variety (alien crystals, volcanic areas)
        const specialFeature = generateTerrainNoise(x + 1000, y + 1000, 2, 0.3, 0.1);
        if (specialFeature > 0.85) {
          tileType = 5; // Alien crystal
          variant = Math.floor(specialFeature * 3);
        } else if (specialFeature > 0.8 && height > 0.6) {
          tileType = 6; // Volcanic
          variant = Math.floor(specialFeature * 3);
        }
        
        // Determine resources based on terrain and resource noise
        let resource = 0;
        let resourceDensity = 0;
        
        if (resourceNoise[y][x] > 0.75) {
          // Higher chance of resources
          const resourceType = Math.floor(resourceNoise[y][x] * 8) % 8;
          
          // Different terrains favor different resources
          switch(tileType) {
            case 0: // Grass - iron, copper
              resource = resourceType % 2 + 1;
              break;
            case 1: // Deep water - water, methane
            case 2: // Shallow water
              resource = (resourceType % 2) + 3;
              break;
            case 3: // Mountains - rare metals, uranium
              resource = (resourceType % 2) + 5;
              break;
            case 4: // Forest - oxygen, organics
              resource = (resourceType % 2) + 7;
              break;
            case 5: // Alien crystal - xenocrystals
              resource = 9;
              break;
            case 6: // Volcanic - sulfur
              resource = 10;
              break;
          }
          
          resourceDensity = 0.3 + resourceNoise[y][x] * 0.7; // 0.3 to 1.0
        }
        
        // Create the tile with more detailed properties
        row.push({
          type: tileType,
          variant: variant,
          resource: resource,
          resourceDensity: resourceDensity,
          building: null,
          decoration: Math.random() < 0.1 ? Math.floor(Math.random() * 5) : -1,
          flowingResource: null,
          animationFrame: 0,
          lastUpdated: Date.now()
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
        methane: 300,
        iron: 200,
        copper: 150,
        rare_metals: 50,
        uranium: 25,
        xenocrystals: 10,
        sulfur: 100
      }
    }));
    
    console.log("Beautiful map generated!");
  }
  
  // Toggle pause
  function togglePause() {
    // Update local state
    isPaused = !isPaused;
    
    // Update global game state
    gameState.update(state => ({
      ...state,
      isPaused: isPaused
    }));
    
    console.log("Game " + (isPaused ? "paused" : "resumed"));
  }
  
  // Building selection
  let selectedBuildingType = null;
  let buildMode = false;
  let buildingCosts = {
    'extractor': { energy: 50, iron: 20 },
    'storage': { energy: 75, iron: 30 },
    'reactor': { energy: 150, iron: 40, copper: 30 },
    'powerPlant': { energy: 200, iron: 50, copper: 40 },
    'pipe': { energy: 10, iron: 5 },
    'conveyor': { energy: 15, iron: 10 }
  };
  
  // Select building type for placement
  function selectBuildingType(type) {
    selectedBuildingType = type;
    buildMode = true;
    console.log(`Selected building type: ${type}`);
    
    // Show ghost building preview
    currentGhostBuilding = type;
  }
  
  // Exit build mode
  function exitBuildMode() {
    selectedBuildingType = null;
    buildMode = false;
    currentGhostBuilding = null;
    console.log("Exited build mode");
  }

  // Check if player can afford a building
  function canAffordBuilding(type) {
    const cost = buildingCosts[type];
    if (!cost) return false;
    
    const resources = $gameState.resources;
    
    for (const [resource, amount] of Object.entries(cost)) {
      if (!resources[resource] || resources[resource] < amount) {
        return false;
      }
    }
    
    return true;
  }
  
  // Check if tile is valid for building placement
  function isValidBuildingPlacement(x, y, type) {
    // Check bounds
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) {
      return false;
    }
    
    const tile = tiles[y][x];
    
    // Can't build on water or mountains
    if (tile.type === 1 || tile.type === 2 || tile.type === 3) {
      return false;
    }
    
    // Check if tile already has a building
    if (tile.building !== null) {
      return false;
    }
    
    // Special rules for different building types
    switch (type) {
      case 'extractor':
        // Extractors need resources
        return tile.resource > 0;
      case 'powerPlant':
        // Power plants need flat ground
        return tile.type === 0;
      default:
        return true;
    }
  }
  
  // Place building
  function placeBuilding(type, x, y) {
    // Check if we're in build mode with a selected building
    if (!buildMode && type !== selectedBuildingType) {
      type = selectedBuildingType || type;
    }
    
    // Check if cell is valid for building placement
    if (!isValidBuildingPlacement(x, y, type)) {
      console.log(`Cannot build at (${x},${y})`);
      return;
    }
    
    // Check if player can afford the building
    if (!canAffordBuilding(type)) {
      showTooltip = true;
      tooltipContent = `Cannot afford ${type}`;
      tooltipX = event.clientX;
      tooltipY = event.clientY;
      setTimeout(() => { showTooltip = false; }, 2000);
      return;
    }
    
    // Place building
    const tile = tiles[y][x];
    tile.building = type;
    tile.buildTime = Date.now(); // For animation timing
    tile.buildFrame = 0; // Current animation frame
    
    // Add particle effect for building placement
    addBuildingPlacementEffect(x, y);
    
    // Deduct resources
    gameState.update(state => {
      const resources = {...state.resources};
      const cost = buildingCosts[type];
      
      // Deduct all costs
      for (const [resource, amount] of Object.entries(cost)) {
        resources[resource] -= amount;
      }
      
      return {...state, resources};
    });
    
    console.log(`Building ${type} placed at (${x},${y})`);
    
    // Auto-save after building placement
    saveGameToStorage();
    
    // If blueprint mode, continue placing buildings
    if (currentBlueprint) {
      // Continue with next building in blueprint
    } else {
      // Exit build mode if not using blueprint
      exitBuildMode();
    }
  }
  
  // Add visual effect for building placement
  function addBuildingPlacementEffect(x, y) {
    // This would add particle effects in a real implementation
    // For now just add a simple animation flag
    if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
      tiles[y][x].placementEffect = true;
      setTimeout(() => {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x].placementEffect = false;
        }
      }, 1000);
    }
  }
  
  // Connect buildings (pipe/conveyor)
  function connectBuildings(sourceX, sourceY, targetX, targetY) {
    if (sourceX === targetX && sourceY === targetY) return;
    
    // Check if both tiles have buildings
    if (tiles[sourceY][sourceX].building && tiles[targetY][targetX].building) {
      // Create a connection
      // In a real implementation, this would create pipe/conveyor entities
      // For now, just record the connection
      if (!tiles[sourceY][sourceX].connections) {
        tiles[sourceY][sourceX].connections = [];
      }
      
      tiles[sourceY][sourceX].connections.push({x: targetX, y: targetY});
      console.log(`Connected building at (${sourceX},${sourceY}) to (${targetX},${targetY})`);
    }
  }
  
  // Get tile color based on type and variant
  function getTileColor(tile) {
    // Base terrain colors with variants
    const terrainColors = {
      // Grass variants (lighter to darker greens)
      0: ['#2ecc71', '#27ae60', '#27ae60'],
      // Deep water variants (darker to lighter blues)
      1: ['#1a5276', '#21618c', '#2874a6'],
      // Shallow water variants (turquoise shades)
      2: ['#3498db', '#5dade2', '#85c1e9'],
      // Mountain variants (gray to brown)
      3: ['#7f8c8d', '#95a5a6', '#5d6d7e'],
      // Forest variants (dark greens)
      4: ['#196f3d', '#1e8449', '#239b56'],
      // Alien crystal variants (purples)
      5: ['#8e44ad', '#9b59b6', '#a569bd'],
      // Volcanic variants (reds/oranges)
      6: ['#922b21', '#c0392b', '#e74c3c']
    };
    
    // Resource colors by type
    const resourceColors = {
      1: '#e67e22', // Iron (orange)
      2: '#d35400', // Copper (dark orange)
      3: '#3498db', // Water (blue)
      4: '#1abc9c', // Methane (turquoise)
      5: '#bdc3c7', // Rare metals (silver)
      6: '#f1c40f', // Uranium (yellow)
      7: '#2ecc71', // Oxygen (green)
      8: '#27ae60', // Organics (dark green)
      9: '#9b59b6', // Xenocrystals (purple)
      10: '#f39c12' // Sulfur (amber)
    };
    
    // Building colors with animation frame consideration
    const buildingColors = {
      'extractor': ['#e67e22', '#d35400', '#e67e22', '#f39c12'],
      'storage': ['#3498db', '#2980b9', '#3498db', '#5dade2'],
      'reactor': ['#c0392b', '#922b21', '#c0392b', '#e74c3c'],
      'powerPlant': ['#f1c40f', '#d4ac0d', '#f1c40f', '#f4d03f'],
      'pipe': ['#7f8c8d', '#5d6d7e', '#7f8c8d', '#95a5a6'],
      'conveyor': ['#7f8c8d', '#5d6d7e', '#7f8c8d', '#95a5a6']
    };
    
    // Handle decoration overlay
    // We'll return actual colors for simplicity, but in a real implementation
    // this would return decoration sprite info
    const decorationColors = {
      0: 'rgba(102, 51, 0, 0.5)', // Rock
      1: 'rgba(0, 100, 0, 0.3)',  // Bush
      2: 'rgba(210, 180, 140, 0.3)', // Small rock
      3: 'rgba(139, 69, 19, 0.3)', // Log
      4: 'rgba(46, 204, 113, 0.3)' // Plant
    };
    
    // Building rendering takes priority
    if (tile.building !== null) {
      // Get the building color (with animation frame 0 for now)
      const buildingColor = buildingColors[tile.building];
      if (buildingColor) {
        // In a real implementation, we'd use the animation frame
        // For now, just use the first color
        return buildingColor[0];
      }
      return '#9b59b6'; // Default purple for unknown buildings
    }
    
    // Resource rendering is next priority
    if (tile.resource > 0) {
      // Get resource color
      const resourceColor = resourceColors[tile.resource];
      if (resourceColor) {
        // For resources with density, we could adjust opacity/brightness
        return resourceColor;
      }
    }
    
    // Base terrain rendering
    // Get the color based on type and variant
    if (tile.type in terrainColors) {
      const variantColors = terrainColors[tile.type];
      const variant = Math.min(tile.variant || 0, variantColors.length - 1);
      return variantColors[variant];
    }
    
    // Default fallback
    return '#2c3e50';
  }
  
  // Get decoration element for a tile
  function getTileDecoration(tile) {
    if (tile.decoration === undefined || tile.decoration < 0) {
      return null;
    }
    
    // Decoration types
    const decorations = [
      { name: 'rock', color: '#6b7280', size: 0.3 },
      { name: 'bush', color: '#047857', size: 0.25 },
      { name: 'small-rock', color: '#9ca3af', size: 0.2 },
      { name: 'log', color: '#92400e', size: 0.35 },
      { name: 'plant', color: '#10b981', size: 0.15 }
    ];
    
    const decorIndex = Math.min(tile.decoration, decorations.length - 1);
    return decorations[decorIndex];
  }
  
  // Get sprite URL for a building or resource
  function getSprite(type, variant = 0) {
    // In a real implementation, this would return sprite URLs from your assets folder
    const buildingSprites = {
      'extractor': '/assets/sprites/buildings/extractor_',
      'storage': '/assets/sprites/buildings/storage_',
      'reactor': '/assets/sprites/buildings/reactor_',
      'powerPlant': '/assets/sprites/buildings/power_plant_',
      'pipe': '/assets/sprites/buildings/pipe_',
    };
    
    const resourceSprites = {
      1: '/assets/sprites/resources/iron_',
      2: '/assets/sprites/resources/copper_',
      3: '/assets/sprites/resources/water_',
      4: '/assets/sprites/resources/methane_',
      5: '/assets/sprites/resources/rare_metals_',
      6: '/assets/sprites/resources/uranium_',
      7: '/assets/sprites/resources/oxygen_',
      8: '/assets/sprites/resources/sulfur_',
      9: '/assets/sprites/resources/xenocrystals_',
      10: '/assets/sprites/resources/sulfur_'
    };
    
    if (type in buildingSprites) {
      return `${buildingSprites[type]}${variant}.png`;
    } else if (type in resourceSprites) {
      return `${resourceSprites[type]}${variant}.png`;
    }
    
    // Default fallback
    return '';
  }
  
  // Create a new blueprint from selected buildings
  function createBlueprint() {
    // In a real implementation, this would save the layout of selected buildings
    const blueprint = {
      name: `Blueprint ${usedBlueprints.length + 1}`,
      buildings: [], // This would be a list of building types and relative positions
      created: Date.now()
    };
    
    usedBlueprints.push(blueprint);
    console.log("Blueprint created");
  }
  
  // Save game state to localStorage and JSON file
  async function saveGameToStorage() {
    const gameData = {
      tiles,
      resources: $gameState.resources,
      mapWidth,
      mapHeight,
      mapName: $gameState.map?.name || "Beautiful Planet"
    };
    
    try {
      // First save to localStorage
      localStorage.setItem('frankforge_game', JSON.stringify(gameData));
      console.log("Game saved to local storage");
      
      // Then save to JSON file
      await saveGameToFile(gameData);
    } catch (e) {
      console.error("Failed to save game:", e);
      showTooltip = true;
      tooltipContent = "Failed to save game";
      tooltipX = window.innerWidth / 2;
      tooltipY = window.innerHeight / 2;
      setTimeout(() => { showTooltip = false; }, 3000);
    }
  }
  
  // Save game data to JSON file using a Blob and download
  async function saveGameToFile(gameData) {
    try {
      // Create a blob with the game data
      const jsonData = JSON.stringify(gameData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create a download link and trigger it
      const filename = `frankforge_save_${Date.now()}.json`;
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      
      // Append to body temporarily
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`Game saved to file: ${filename}`);
      showTooltip = true;
      tooltipContent = "Game saved to file";
      tooltipX = window.innerWidth / 2;
      tooltipY = window.innerHeight / 2;
      setTimeout(() => { showTooltip = false; }, 2000);
      
      return true;
    } catch (e) {
      console.error("Failed to save game to file:", e);
      return false;
    }
  }
  
  // Load game data from JSON file
  async function loadGameFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const gameData = JSON.parse(e.target.result);
          
          // Restore map dimensions
          mapWidth = gameData.mapWidth || 60;
          mapHeight = gameData.mapHeight || 40;
          
          // Restore tiles
          if (gameData.tiles && gameData.tiles.length > 0) {
            tiles = gameData.tiles;
            
            // Update game state with loaded map
            gameState.update(state => ({
              ...state,
              map: {
                name: gameData.mapName || "Beautiful Planet",
                width: mapWidth,
                height: mapHeight,
                tiles: tiles
              },
              resources: gameData.resources || {
                energy: 1000,
                water: 500,
                oxygen: 200,
                methane: 300
              }
            }));
            
            console.log("Game loaded from file");
            showTooltip = true;
            tooltipContent = "Game loaded from file";
            tooltipX = window.innerWidth / 2;
            tooltipY = window.innerHeight / 2;
            setTimeout(() => { showTooltip = false; }, 2000);
          }
        } catch (parseError) {
          console.error("Failed to parse game file:", parseError);
          showTooltip = true;
          tooltipContent = "Invalid save file";
          tooltipX = window.innerWidth / 2;
          tooltipY = window.innerHeight / 2;
          setTimeout(() => { showTooltip = false; }, 3000);
        }
      };
      
      reader.readAsText(file);
    } catch (e) {
      console.error("Failed to load game from file:", e);
    }
  }
  
  // Load game state from localStorage
  function loadGameFromStorage() {
    try {
      const savedGame = localStorage.getItem('frankforge_game');
      if (savedGame) {
        const gameData = JSON.parse(savedGame);
        
        // Restore map dimensions
        mapWidth = gameData.mapWidth || 60;
        mapHeight = gameData.mapHeight || 40;
        
        // Restore tiles
        if (gameData.tiles && gameData.tiles.length > 0) {
          tiles = gameData.tiles;
          
          // Update game state with loaded map
          gameState.update(state => ({
            ...state,
            map: {
              name: gameData.mapName || "Beautiful Planet",
              width: mapWidth,
              height: mapHeight,
              tiles: tiles
            },
            resources: gameData.resources || {
              energy: 1000,
              water: 500,
              oxygen: 200,
              methane: 300
            }
          }));
          
          console.log("Game loaded from local storage");
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error("Failed to load game:", e);
      return false;
    }
  }
  
  // Show tutorial panel and start the tutorial
  function startTutorial() {
    showTutorial = true;
    tutorialStep = 0;
  }
  
  // Progress to next tutorial step
  function nextTutorialStep() {
    tutorialStep++;
    if (tutorialStep >= tutorialSteps.length) {
      showTutorial = false;
    }
  }
  
  // Tutorial steps content
  const tutorialSteps = [
    {
      title: "Welcome to FrankForge",
      content: "This tutorial will guide you through the basics of building your factory.",
      action: "Let's begin!"
    },
    {
      title: "Resource Gathering",
      content: "Start by placing an Extractor on a resource patch. Extractors collect resources from the planet's surface.",
      action: "Continue"
    },
    {
      title: "Power Generation",
      content: "Build a Power Plant to generate energy for your buildings. All buildings require power to operate.",
      action: "Continue"
    },
    {
      title: "Building Connections",
      content: "Connect your buildings with pipes and conveyors to transport resources between them.",
      action: "Continue"
    },
    {
      title: "Resource Processing",
      content: "Use reactors to process resources into more valuable materials.",
      action: "Continue"
    },
    {
      title: "Storage",
      content: "Build storage facilities to store excess resources for later use.",
      action: "Complete Tutorial"
    }
  ];
  
  // Initialize on mount
  onMount(() => {
    console.log("Game initialized");
    
    // Try to load from storage first, generate new map if no saved game
    if (!loadGameFromStorage()) {
      console.log("No saved game found, generating new map");
      generateMap();
    }
    
    // Auto-save every 30 seconds
    const saveInterval = setInterval(saveGameToStorage, 30000);
    
    // Add keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    
    // Add mouse movement for tooltips
    document.addEventListener('mousemove', handleMouseMove);
    
    // Check for first-time players to show tutorial
    const firstTime = localStorage.getItem('frankforge_first_time');
    if (!firstTime) {
      localStorage.setItem('frankforge_first_time', 'false');
      startTutorial();
    }
    
    // Return cleanup function
    return () => {
      clearInterval(saveInterval);
      saveGameToStorage(); // Save on unmount
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  });
  
  // Handle keyboard controls
  function handleKeyDown(e) {
    switch (e.key) {
      case 'Escape':
        if (showTutorial) {
          showTutorial = false;
        } else if (buildMode) {
          exitBuildMode();
        } else {
          togglePause();
        }
        break;
      case 'b':
        // Toggle build mode
        if (!buildMode) {
          activePanel = 'buildings';
        } else {
          exitBuildMode();
        }
        break;
      case 'm':
        // Toggle minimap
        showMinimap = !showMinimap;
        break;
      case 'r':
        // Rotate building in build mode
        if (buildMode) {
          // Would rotate the current building
        }
        break;
      // Number keys for quick select buildings
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        const buildingIndex = parseInt(e.key) - 1;
        const buildingTypes = ['extractor', 'storage', 'reactor', 'powerPlant', 'pipe'];
        if (buildingIndex >= 0 && buildingIndex < buildingTypes.length) {
          selectBuildingType(buildingTypes[buildingIndex]);
        }
        break;
    }
  }
  
  // Handle mouse movement for tooltips
  function handleMouseMove(e) {
    // If ghost building is active, update its position
    if (currentGhostBuilding) {
      const mapElement = document.querySelector('.game-map');
      if (mapElement) {
        const rect = mapElement.getBoundingClientRect();
        const mapX = e.clientX - rect.left;
        const mapY = e.clientY - rect.top;
        
        // Convert to grid coordinates
        ghostBuildingX = Math.floor(mapX / tileSize);
        ghostBuildingY = Math.floor(mapY / tileSize);
        
        // Check if placement is valid
        isValidPlacement = isValidBuildingPlacement(ghostBuildingX, ghostBuildingY, currentGhostBuilding);
      }
    }
  }
</script>

<main class="game-container">
  <!-- Header with resource display -->
  <header class="game-header" transition:slide={{duration: 300, axis: 'y'}}>
    <div class="header-left">
      <h1>FrankForge</h1>
    </div>
    
    <div class="header-center">
      <div class="resource-overview">
        {#each Object.entries($gameState.resources).slice(0, 5) as [resource, amount]}
          <div class="resource-chip" on:mouseenter={() => {
            showTooltip = true;
            tooltipContent = `${resource}: ${amount.toFixed(1)}`;
            tooltipX = event.clientX;
            tooltipY = event.clientY;
          }} on:mouseleave={() => showTooltip = false}>
            <div class="resource-icon" style="background: linear-gradient(135deg, var(--color-{resource}), var(--color-{resource}-dark))"></div>
            <span class="resource-amount">{amount >= 1000 ? `${(amount/1000).toFixed(1)}K` : amount.toFixed(0)}</span>
          </div>
        {/each}
        <button class="resource-more" on:click={() => activePanel = activePanel === 'resources' ? 'buildings' : 'resources'}>
          {activePanel === 'resources' ? 'Hide Resources' : 'More Resources'}
        </button>
      </div>
    </div>
    
    <div class="header-right">
      <div class="main-nav">
        <button 
          class="nav-button" 
          class:active={activePanel === 'buildings'}
          on:click={() => activePanel = 'buildings'}
          title="Buildings"
        >
          <span class="nav-icon">🏭</span>
        </button>
        
        <button 
          class="nav-button" 
          class:active={activePanel === 'research'}
          on:click={() => activePanel = 'research'}
          title="Research"
        >
          <span class="nav-icon">🔬</span>
        </button>
        
        <button 
          class="nav-button" 
          class:active={activePanel === 'statistics'}
          on:click={() => activePanel = 'statistics'}
          title="Statistics"
        >
          <span class="nav-icon">📊</span>
        </button>
        
        <button 
          class="nav-button" 
          class:active={activePanel === 'save'}
          on:click={() => activePanel = 'save'}
          title="Save/Load Game"
        >
          <span class="nav-icon">💾</span>
        </button>
      </div>
      
      <button class="control-button pause-button" on:click={togglePause}>
        <span class="button-icon">{isPaused ? '▶️' : '⏸️'}</span>
        <span class="button-text">{isPaused ? 'Resume' : 'Pause'}</span>
      </button>
    </div>
  </header>
  
  <!-- Game Content Area -->
  <div class="game-content">
    <!-- Left Sidebar with contextual panels -->
    <aside class="sidebar" transition:slide={{duration: 300, axis: 'x'}}>
      {#if activePanel === 'buildings'}
        <div class="panel" in:fly={{x: -20, duration: 200}}>
          <BuildingControlPanel on:select={(e) => selectBuildingType(e.detail.type)} />
        </div>
      {:else if activePanel === 'research'}
        <div class="panel" in:fly={{x: -20, duration: 200}}>
          <ResearchPanel />
        </div>
      {:else if activePanel === 'resources'}
        <div class="panel" in:fly={{x: -20, duration: 200}}>
          <ResourceDisplay />
        </div>
      {:else if activePanel === 'statistics'}
        <div class="panel" in:fly={{x: -20, duration: 200}}>
          <StatisticsPanel />
        </div>
      {:else if activePanel === 'save'}
        <div class="panel" in:fly={{x: -20, duration: 200}}>
          <SaveLoadPanel />
          
          <!-- Additional file-based save/load -->
          <div class="file-save-section">
            <h3>File Operations</h3>
            <button class="action-button save-file" on:click={saveGameToStorage}>
              Save to File
            </button>
            
            <div class="file-input-wrapper">
              <label for="load-file" class="action-button load-file">
                Load from File
              </label>
              <input
                type="file"
                id="load-file"
                accept=".json"
                on:change={loadGameFromFile}
                style="display: none;"
              />
            </div>
          </div>
        </div>
      {/if}
    </aside>
    
    <!-- Main game area with map -->
    <div class="game-area">
      <div 
        class="game-map"
        style="transform: scale({zoomLevel}); transform-origin: center;"
      >
        {#each tiles as row, y}
          <div class="map-row">
            {#each row as tile, x}
              <div
                class="map-tile"
                class:tile-water={tile.type === 1 || tile.type === 2}
                class:tile-mountain={tile.type === 3}
                class:tile-forest={tile.type === 4}
                class:tile-alien={tile.type === 5}
                class:tile-volcanic={tile.type === 6}
                class:tile-placement-effect={tile.placementEffect}
                style="background-color: {getTileColor(tile)}; width: {tileSize}px; height: {tileSize}px;"
                on:click={() => placeBuilding(selectedBuildingType, x, y)}
                on:mouseenter={() => {
                  if (tile.building) {
                    showTooltip = true;
                    tooltipContent = `${tile.building} - Click for details`;
                    tooltipX = event.clientX;
                    tooltipY = event.clientY;
                  } else if (tile.resource > 0) {
                    showTooltip = true;
                    tooltipContent = `${['', 'Iron', 'Copper', 'Water', 'Methane', 'Rare Metals', 'Uranium', 'Oxygen', 'Organics', 'Xenocrystals', 'Sulfur'][tile.resource]} - Density: ${Math.round(tile.resourceDensity * 100)}%`;
                    tooltipX = event.clientX;
                    tooltipY = event.clientY;
                  }
                }}
                on:mouseleave={() => {
                  showTooltip = false;
                }}
              >
                {#if tile.resource > 0}
                  <div 
                    class="resource-indicator" 
                    style="
                      opacity: {0.5 + tile.resourceDensity * 0.5}; 
                      transform: translate(-50%, -50%) scale({0.8 + tile.resourceDensity * 0.4});
                      background-image: url({getSprite(tile.resource, tile.variant)});
                    "
                  ></div>
                {/if}
                
                {#if tile.decoration !== undefined && tile.decoration >= 0}
                  {@const decoration = getTileDecoration(tile)}
                  {#if decoration}
                    <div 
                      class="decoration" 
                      style="
                        background-color: {decoration.color}; 
                        width: {tileSize * decoration.size}px; 
                        height: {tileSize * decoration.size}px;
                        top: {Math.random() * 70}%;
                        left: {Math.random() * 70}%;
                      "
                    ></div>
                  {/if}
                {/if}
                
                {#if tile.building}
                  <div 
                    class="building-indicator"
                    style="background-image: url({getSprite(tile.building, 0)});"
                  ></div>
                  
                  <!-- Animated working indicator -->
                  <div class="building-working-indicator"></div>
                {/if}
                
                <!-- Flow animations for resources between buildings -->
                {#if tile.flowingResource}
                  <div 
                    class="resource-flow" 
                    style="
                      background-color: {getTileColor({resource: tile.flowingResource})}; 
                      animation-duration: {1 + Math.random() * 0.5}s;
                    "
                  ></div>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
        
        <!-- Ghost building placement preview -->
        {#if currentGhostBuilding && ghostBuildingX >= 0 && ghostBuildingX < mapWidth && ghostBuildingY >= 0 && ghostBuildingY < mapHeight}
          <div 
            class="ghost-building" 
            class:invalid-placement={!isValidPlacement}
            style="
              left: {ghostBuildingX * tileSize}px; 
              top: {ghostBuildingY * tileSize}px; 
              width: {tileSize}px; 
              height: {tileSize}px;
              background-image: url({getSprite(currentGhostBuilding, 0)});
            "
          ></div>
        {/if}
      </div>
      
      <!-- Minimap -->
      {#if showMinimap}
        <div class="minimap" transition:fade={{duration: 200}}>
          <div class="minimap-content">
            {#each tiles as row, y}
              <div class="minimap-row">
                {#each row as tile, x}
                  <div 
                    class="minimap-tile" 
                    style="
                      background-color: {getTileColor(tile)}; 
                      width: {2}px; 
                      height: {2}px;
                    "
                    on:click={() => {
                      // Center the main view on this location
                      const mapElement = document.querySelector('.game-map');
                      if (mapElement) {
                        const centerX = x * tileSize - mapElement.clientWidth / 2 + tileSize / 2;
                        const centerY = y * tileSize - mapElement.clientHeight / 2 + tileSize / 2;
                        mapElement.scrollLeft = centerX;
                        mapElement.scrollTop = centerY;
                      }
                    }}
                  ></div>
                {/each}
              </div>
            {/each}
            
            <!-- Viewport indicator in minimap -->
            <div class="minimap-viewport"></div>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Tooltip -->
  {#if showTooltip}
    <div 
      class="tooltip" 
      style="
        left: {tooltipX}px; 
        top: {tooltipY + 20}px; 
        transform: translateX(-50%);
      "
      transition:fade={{duration: 150}}
    >
      {tooltipContent}
    </div>
  {/if}
  
  <!-- Keyboard shortcut display -->
  <div class="controls-info" transition:fade={{duration: 200}}>
    <div class="shortcut"><span class="key">ESC</span> Menu</div>
    <div class="shortcut"><span class="key">B</span> Build</div>
    <div class="shortcut"><span class="key">M</span> Map</div>
    <div class="shortcut"><span class="key">R</span> Rotate</div>
    <div class="shortcut"><span class="key">1-5</span> Quick Select</div>
  </div>
  
  <!-- Tutorial overlay -->
  {#if showTutorial}
    <div class="tutorial-overlay" transition:fade={{duration: 300}}>
      <div class="tutorial-card" transition:fly={{y: 20, duration: 300}}>
        <h2>{tutorialSteps[tutorialStep].title}</h2>
        <p>{tutorialSteps[tutorialStep].content}</p>
        <button class="tutorial-button" on:click={nextTutorialStep}>
          {tutorialSteps[tutorialStep].action}
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Blueprint panel (shown when creating blueprint) -->
  {#if currentBlueprint}
    <div class="blueprint-panel" transition:slide={{duration: 300, axis: 'y'}}>
      <h3>Blueprint Mode</h3>
      <p>Select the buildings to include in your blueprint.</p>
      <div class="blueprint-actions">
        <button class="action-button cancel" on:click={() => currentBlueprint = null}>Cancel</button>
        <button class="action-button save" on:click={createBlueprint}>Save Blueprint</button>
      </div>
    </div>
  {/if}
  
  <!-- Pause Menu -->
  {#if isPaused}
    <div class="pause-overlay" transition:fade={{duration: 300}}>
      <div class="pause-backdrop" in:fade={{duration: 150, delay: 150}}></div>
      <div class="pause-menu" transition:fly={{y: -20, duration: 400}}>
        <h2>Game Paused</h2>
        
        <div class="menu-buttons">
          <button class="menu-button resume-button" on:click={togglePause}>
            <span class="button-icon">▶️</span>
            <span>Resume Game</span>
          </button>
          <button class="menu-button save-button" on:click={() => {
            saveGameToStorage();
            // Show save confirmation
            showTooltip = true;
            tooltipContent = "Game saved successfully!";
            tooltipX = window.innerWidth / 2;
            tooltipY = window.innerHeight / 2;
            setTimeout(() => { showTooltip = false; }, 2000);
          }}>
            <span class="button-icon">💾</span>
            <span>Save Game</span>
          </button>
          <button class="menu-button load-button" on:click={loadGameFromStorage}>
            <span class="button-icon">📂</span>
            <span>Load Game</span>
          </button>
          <button class="menu-button new-game-button" on:click={() => {
            if (confirm("Start a new game? This will discard your current progress.")) {
              generateMap();
              togglePause(); // Resume game after generating
            }
          }}>
            <span class="button-icon">🌍</span>
            <span>New Game</span>
          </button>
          <button class="menu-button tutorial-button" on:click={() => {
            startTutorial();
            togglePause();
          }}>
            <span class="button-icon">❓</span>
            <span>Tutorial</span>
          </button>
        </div>
        
        <div class="menu-footer">
          <p>Press <span class="key-hint">ESC</span> to resume game</p>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Debug Panel - hidden by default now -->
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
    font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #0c1118;
    color: white;
    overflow: hidden;
    --color-energy: #f39c12;
    --color-energy-dark: #d35400;
    --color-water: #3498db;
    --color-water-dark: #2980b9;
    --color-oxygen: #2ecc71;
    --color-oxygen-dark: #27ae60;
    --color-methane: #1abc9c;
    --color-methane-dark: #16a085;
    --color-iron: #e67e22;
    --color-iron-dark: #d35400;
    --color-copper: #e74c3c;
    --color-copper-dark: #c0392b;
    --color-rare_metals: #bdc3c7;
    --color-rare_metals-dark: #95a5a6;
    --color-uranium: #f1c40f;
    --color-uranium-dark: #f39c12;
    --color-xenocrystals: #9b59b6;
    --color-xenocrystals-dark: #8e44ad;
    --color-sulfur: #f39c12;
    --color-sulfur-dark: #e67e22;
  }
  
  .game-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-color: #0c1118;
    position: relative;
  }
  
  /* Header Styles */
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to bottom, rgba(22, 30, 40, 0.95), rgba(16, 24, 34, 0.9));
    padding: 10px 20px;
    height: 50px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    z-index: 100;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .header-left, .header-right {
    display: flex;
    align-items: center;
  }
  
  .header-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .game-header h1 {
    margin: 0;
    font-size: 20px;
    background: linear-gradient(to right, #3498db, #2ecc71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    letter-spacing: 0.5px;
    font-weight: 800;
  }
  
  .resource-overview {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .resource-chip {
    display: flex;
    align-items: center;
    background-color: rgba(16, 22, 26, 0.8);
    border-radius: 16px;
    padding: 4px 8px 4px 4px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
    cursor: pointer;
    overflow: hidden;
  }
  
  .resource-chip:hover {
    transform: translateY(-2px);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2), 
                0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  .resource-icon {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    margin-right: 6px;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2),
                inset 0 2px 5px rgba(255, 255, 255, 0.1);
  }
  
  .resource-amount {
    font-size: 12px;
    font-weight: 600;
  }
  
  .resource-more {
    background-color: rgba(16, 22, 26, 0.5);
    border: none;
    color: #bdc3c7;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .resource-more:hover {
    background-color: rgba(26, 32, 36, 0.8);
    color: white;
  }
  
  /* Main Navigation */
  .main-nav {
    display: flex;
    gap: 6px;
    background-color: rgba(10, 15, 20, 0.7);
    padding: 4px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .nav-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: 6px;
    color: #bdc3c7;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }
  
  .nav-button.active {
    background-color: rgba(52, 152, 219, 0.3);
    color: white;
    box-shadow: inset 0 0 0 1px rgba(52, 152, 219, 0.5),
                0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  .nav-button:hover:not(.active) {
    background-color: rgba(26, 32, 44, 0.8);
    color: white;
    transform: translateY(-2px);
  }
  
  .nav-icon {
    font-size: 16px;
  }
  
  .nav-button.active::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid rgba(52, 152, 219, 0.3);
  }
  
  /* Control buttons */
  .control-button {
    background-color: rgba(16, 22, 26, 0.6);
    border: none;
    color: white;
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
  
  .control-button:hover {
    background-color: rgba(26, 32, 36, 0.8);
    transform: translateY(-2px);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2),
                0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  .button-icon {
    margin-right: 6px;
    font-size: 14px;
  }
  
  .button-text {
    font-size: 12px;
    font-weight: 500;
  }
  
  .pause-button {
    background-color: rgba(231, 76, 60, 0.2);
  }
  
  .pause-button:hover {
    background-color: rgba(231, 76, 60, 0.4);
  }
  
  /* Game Content */
  .game-content {
    display: flex;
    flex: 1;
    position: relative;
    overflow: hidden;
  }
  
  .sidebar {
    width: 280px;
    background: linear-gradient(to right, rgba(16, 24, 36, 0.95), rgba(20, 29, 38, 0.9));
    z-index: 50;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
    transition: width 0.3s ease;
  }
  
  .panel {
    padding: 16px;
    height: 100%;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }
  
  .panel::-webkit-scrollbar {
    width: 6px;
  }
  
  .panel::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .panel::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  
  .file-save-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .file-save-section h3 {
    margin-top: 0;
    font-size: 16px;
    color: #3498db;
    margin-bottom: 12px;
  }
  
  .action-button {
    width: 100%;
    background-color: #34495e;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    font-weight: 500;
    display: block;
    text-align: center;
  }
  
  .action-button.save-file {
    background-color: #2980b9;
  }
  
  .action-button.save-file:hover {
    background-color: #3498db;
  }
  
  .action-button.load-file {
    background-color: #27ae60;
  }
  
  .action-button.load-file:hover {
    background-color: #2ecc71;
  }
  
  .game-area {
    flex: 1;
    position: relative;
    overflow: auto;
    background-color: #0a0d12;
  }
  
  .game-map {
    padding: 20px;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: transform 0.2s ease;
  }
  
  .map-row {
    display: flex;
  }
  
  .map-tile {
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.3);
    box-sizing: border-box;
    transition: all 0.15s ease;
    cursor: pointer;
    background-size: cover;
    overflow: hidden;
  }
  
  .map-tile:hover {
    transform: translateZ(5px);
    z-index: 10;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  }
  
  .tile-water {
    animation: water-ripple 10s infinite alternate;
  }
  
  .tile-forest {
    animation: forest-sway 8s infinite alternate;
  }
  
  .tile-alien {
    animation: alien-pulse 5s infinite alternate;
  }
  
  .tile-volcanic {
    animation: volcanic-glow 3s infinite alternate;
  }
  
  .tile-placement-effect {
    animation: placement-effect 1s;
  }
  
  .resource-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 12px;
    height: 12px;
    background-color: white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    animation: pulse 3s infinite;
    background-size: cover;
    z-index: 2;
  }
  
  .decoration {
    position: absolute;
    border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    z-index: 1;
    transition: transform 0.3s ease;
  }
  
  .map-tile:hover .decoration {
    transform: scale(1.1);
  }
  
  .building-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
    animation: building-activate 0.5s ease;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 3;
  }
  
  .building-working-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #2ecc71;
    animation: working-indicator 1.5s infinite alternate;
    z-index: 4;
  }
  
  .resource-flow {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    opacity: 0.7;
    animation: flow-animation 2s infinite;
    z-index: 5;
  }
  
  .ghost-building {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.3);
    border: 2px dashed rgba(255, 255, 255, 0.5);
    box-sizing: border-box;
    border-radius: 4px;
    z-index: 20;
    pointer-events: none;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    animation: ghost-pulse 1.5s infinite alternate;
  }
  
  .ghost-building.invalid-placement {
    background-color: rgba(231, 76, 60, 0.3);
    border-color: rgba(231, 76, 60, 0.5);
  }
  
  /* Minimap */
  .minimap {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 180px;
    height: 180px;
    background-color: rgba(10, 15, 20, 0.8);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    z-index: 30;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
  }
  
  .minimap-content {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
  }
  
  .minimap-row {
    display: flex;
    height: 2px;
  }
  
  .minimap-tile {
    width: 2px;
    height: 2px;
  }
  
  .minimap-viewport {
    position: absolute;
    border: 1px solid rgba(52, 152, 219, 0.8);
    box-shadow: 0 0 0 1px rgba(52, 152, 219, 0.4);
    background-color: rgba(52, 152, 219, 0.2);
    pointer-events: none;
  }
  
  /* Tooltip */
  .tooltip {
    position: fixed;
    background-color: rgba(16, 22, 26, 0.95);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* Controls Info */
  .controls-info {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(10, 15, 20, 0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    z-index: 200;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
  }
  
  .shortcut {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .key {
    background-color: rgba(255, 255, 255, 0.1);
    padding: 2px 5px;
    border-radius: 3px;
    font-family: monospace;
    font-weight: bold;
    box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.2);
  }
  
  /* Tutorial Overlay */
  .tutorial-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
  }
  
  .tutorial-card {
    background: linear-gradient(145deg, #1e3a57, #2c3e50);
    border-radius: 8px;
    padding: 30px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .tutorial-card h2 {
    margin-top: 0;
    color: #3498db;
    font-size: 24px;
    margin-bottom: 16px;
  }
  
  .tutorial-card p {
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 24px;
  }
  
  .tutorial-button {
    background: linear-gradient(to right, #3498db, #2980b9);
    color: white;
    border: none;
    padding: 10px 30px;
    border-radius: 30px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  .tutorial-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
    background: linear-gradient(to right, #3aa1e3, #2e8bc3);
  }
  
  /* Blueprint Panel */
  .blueprint-panel {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(16, 22, 26, 0.9);
    padding: 16px;
    border-radius: 8px 8px 0 0;
    width: 400px;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5);
    z-index: 100;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }
  
  .blueprint-panel h3 {
    margin-top: 0;
    color: #3498db;
  }
  
  .blueprint-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }
  
  /* Pause Menu */
  .pause-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .pause-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(10, 15, 20, 0.8);
    backdrop-filter: blur(10px);
    z-index: -1;
  }
  
  .pause-menu {
    background: linear-gradient(145deg, #1e3a57, #2c3e50);
    border-radius: 12px;
    padding: 30px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  
  .pause-menu::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(to right, #3498db, #2ecc71);
    z-index: 1;
  }
  
  .pause-menu h2 {
    margin-top: 0;
    margin-bottom: 30px;
    color: #3498db;
    font-size: 28px;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
    letter-spacing: 1px;
  }
  
  .menu-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .menu-button {
    padding: 14px 20px;
    border: none;
    border-radius: 8px;
    background-color: rgba(52, 73, 94, 0.8);
    color: white;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
    text-align: left;
    position: relative;
    overflow: hidden;
  }
  
  .menu-button::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .menu-button:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.1);
    filter: brightness(1.1);
  }
  
  .menu-button:hover::after {
    opacity: 1;
  }
  
  .menu-button:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }
  
  .button-icon {
    font-size: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
  }
  
  .resume-button {
    background: linear-gradient(to right, #27ae60, #2ecc71);
  }
  
  .save-button {
    background: linear-gradient(to right, #3498db, #2980b9);
  }
  
  .load-button {
    background: linear-gradient(to right, #9b59b6, #8e44ad);
  }
  
  .new-game-button {
    background: linear-gradient(to right, #e67e22, #d35400);
  }
  
  .tutorial-button {
    background: linear-gradient(to right, #f1c40f, #f39c12);
  }
  
  .menu-footer {
    margin-top: 30px;
    font-size: 14px;
    color: #bdc3c7;
  }
  
  .key-hint {
    display: inline-block;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
    margin: 0 3px;
    font-family: monospace;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3),
                inset 0 -2px 0 rgba(0, 0, 0, 0.2);
    color: white;
  }
  
  /* Debug Panel */
  .debug-panel {
    position: fixed;
    bottom: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-top-left-radius: 8px;
    z-index: 2000;
    max-width: 300px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    font-size: 12px;
    font-family: monospace;
  }
  
  .debug-panel h3 {
    margin-top: 0;
    color: #3498db;
    font-size: 14px;
  }
  
  .debug-panel button {
    margin: 5px;
    padding: 5px 10px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .debug-panel pre {
    font-size: 11px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 8px;
    border-radius: 4px;
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
      transform: translate(-50%, -50%) scale(1.3);
      opacity: 0.7;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes water-ripple {
    0% {
      filter: brightness(1) saturate(1);
    }
    50% {
      filter: brightness(1.2) saturate(1.1);
    }
    100% {
      filter: brightness(1) saturate(1);
    }
  }
  
  @keyframes forest-sway {
    0% {
      background-position: 0 0;
    }
    50% {
      background-position: 1px 0;
    }
    100% {
      background-position: 0 0;
    }
  }
  
  @keyframes alien-pulse {
    0% {
      filter: hue-rotate(0deg) brightness(1);
    }
    100% {
      filter: hue-rotate(30deg) brightness(1.2);
    }
  }
  
  @keyframes volcanic-glow {
    0% {
      filter: brightness(1);
      box-shadow: inset 0 0 5px rgba(231, 76, 60, 0.5);
    }
    100% {
      filter: brightness(1.3);
      box-shadow: inset 0 0 15px rgba(231, 76, 60, 0.8);
    }
  }
  
  @keyframes building-activate {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    70% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  @keyframes working-indicator {
    0% {
      opacity: 0.7;
      box-shadow: 0 0 3px #2ecc71;
    }
    100% {
      opacity: 1;
      box-shadow: 0 0 8px #2ecc71;
    }
  }
  
  @keyframes flow-animation {
    0% {
      left: 10%;
      top: 10%;
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      left: 90%;
      top: 90%;
      opacity: 0;
    }
  }
  
  @keyframes ghost-pulse {
    0% {
      opacity: 0.5;
    }
    100% {
      opacity: 0.8;
    }
  }
  
  @keyframes placement-effect {
    0% {
      filter: brightness(2) saturate(1.5);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
    }
    100% {
      filter: brightness(1) saturate(1);
      box-shadow: none;
    }
  }
</style>