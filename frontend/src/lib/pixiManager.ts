// PixiJS Game Manager
import * as PIXI from 'pixi.js';
import { writable, get } from 'svelte/store';
import { gameState } from '../stores/gameState';
import { TerrainType, ResourceType, PlanetType } from './types';

// Store for the PIXI Application
export const pixiApp = writable<PIXI.Application | null>(null);

// Game layers
let worldContainer: PIXI.Container;
let terrainLayer: PIXI.Container;
let resourceLayer: PIXI.Container;
let buildingLayer: PIXI.Container;
let characterLayer: PIXI.Container;
let uiLayer: PIXI.Container;

// Player character sprite
let playerCharacter: PIXI.Sprite | null = null;

// Textures for different entities
const terrainTextures: Record<number, PIXI.Texture> = {};
const resourceTextures: Record<number, PIXI.Texture> = {};
const buildingTextures: Record<string, PIXI.Texture> = {};

// Game state tracking
let tileSize = 16;
let mapWidth = 0;
let mapHeight = 0;
let isDragging = false;
let lastPosition = { x: 0, y: 0 };
let selectedBuilding: any = null;
let hoverPosition = { x: 0, y: 0 };
let isPlacementMode = false;
let selectedBuildingType: string | null = null;

// Building ghost (for placement preview)
let buildingGhost: PIXI.Sprite | null = null;

// Initialize PixiJS Application
export function initPixiApp(parentElement: HTMLElement): PIXI.Application {
  console.log("initPixiApp called with parent element:", parentElement);
  
  // Check if parent already has a canvas child, clean it up
  const existingCanvas = parentElement.querySelector('canvas');
  if (existingCanvas) {
    console.log("Found existing canvas, removing it");
    parentElement.removeChild(existingCanvas);
  }
  
  // Create PIXI Application
  const app = new PIXI.Application({
    width: parentElement.clientWidth || 800,
    height: parentElement.clientHeight || 600,
    backgroundColor: 0x0f0f1e,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });

  // Add canvas to DOM
  console.log("Appending canvas to parent element");
  parentElement.appendChild(app.view as HTMLCanvasElement);

  // Store the app in our store
  console.log("Storing app in pixiApp store");
  pixiApp.set(app);

  // Create layers
  console.log("Setting up layers");
  setupLayers(app);

  // Generate textures
  console.log("Generating textures");
  generateTextures(app);

  // Set up event handlers
  console.log("Setting up event handlers");
  setupEvents(app);

  // Save the unsubscriber so we can clean it up later
  let unsubscribe: (() => void) | null = null;
  
  // Subscribe to game state changes
  console.log("Subscribing to game state changes");
  unsubscribe = gameState.subscribe(state => {
    console.log("Game state updated:", state);
    if (state.map) {
      console.log("Rendering map:", state.map.name);
      renderMap(state.map);
    }
    if (state.buildings) {
      console.log("Rendering buildings:", state.buildings.length);
      renderBuildings(state.buildings);
    }
  });
  
  // Add cleanup method to the app for more reliable cleanup
  (app as any).cleanupResources = () => {
    console.log("Cleaning up PIXI resources");
    // Unsubscribe from game state
    if (unsubscribe) {
      console.log("Unsubscribing from game state");
      unsubscribe();
      unsubscribe = null;
    }
    
    // Clear containers
    if (worldContainer) worldContainer.removeChildren();
    if (terrainLayer) terrainLayer.removeChildren();
    if (resourceLayer) resourceLayer.removeChildren();
    if (buildingLayer) buildingLayer.removeChildren();
    if (uiLayer) uiLayer.removeChildren();
    
    // Remove event listeners
    if (app.view) {
      console.log("Removing wheel event listener");
      app.view.removeEventListener('wheel', handleWheel);
    }
  };

  return app;
}

// Wheel event handler reference to be able to remove it
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const app = get(pixiApp);
  if (!app) return;
  
  // Calculate zoom factor
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  
  // Get current mouse position relative to world container
  const lastPosition = { x: event.clientX, y: event.clientY };
  const mouseX = lastPosition.x - worldContainer.x;
  const mouseY = lastPosition.y - worldContainer.y;
  
  // Apply zoom
  worldContainer.scale.x *= zoomFactor;
  worldContainer.scale.y *= zoomFactor;
  
  // Adjust world container position to zoom in/out from mouse position
  worldContainer.x = lastPosition.x - mouseX * zoomFactor;
  worldContainer.y = lastPosition.y - mouseY * zoomFactor;
}

// Set up basic layers for our game
function setupLayers(app: PIXI.Application) {
  // World container (can be moved, scaled, etc)
  worldContainer = new PIXI.Container();
  app.stage.addChild(worldContainer);

  // Terrain layer (bottom)
  terrainLayer = new PIXI.Container();
  worldContainer.addChild(terrainLayer);

  // Resource layer (above terrain)
  resourceLayer = new PIXI.Container();
  worldContainer.addChild(resourceLayer);

  // Building layer (above resources)
  buildingLayer = new PIXI.Container();
  worldContainer.addChild(buildingLayer);
  
  // Character layer (above buildings)
  characterLayer = new PIXI.Container();
  worldContainer.addChild(characterLayer);

  // UI layer (top, fixed position)
  uiLayer = new PIXI.Container();
  app.stage.addChild(uiLayer);
}

// Generate simple textures for game elements
function generateTextures(app: PIXI.Application) {
  // Create terrain textures
  for (let i = 0; i <= 15; i++) {
    const graphics = new PIXI.Graphics();
    
    // Fill with color based on terrain type
    switch (i) {
      case TerrainType.DEEP_WATER:
        graphics.beginFill(0x0a3b5c);
        break;
      case TerrainType.SHALLOW_WATER:
        graphics.beginFill(0x0e6ba8);
        break;
      case TerrainType.SAND:
        graphics.beginFill(0xe4d6a7);
        break;
      case TerrainType.GRASS:
        graphics.beginFill(0x7ab317);
        break;
      case TerrainType.FOREST:
        graphics.beginFill(0x3e7924);
        break;
      case TerrainType.HILLS:
        graphics.beginFill(0x6d8383);
        break;
      case TerrainType.MOUNTAINS:
        graphics.beginFill(0x8d8778);
        break;
      case TerrainType.SNOW:
        graphics.beginFill(0xffffff);
        break;
      case TerrainType.VOLCANIC:
        graphics.beginFill(0x7c3626);
        break;
      case TerrainType.LAVA:
        graphics.beginFill(0xe25822);
        break;
      case TerrainType.CAVE:
        graphics.beginFill(0x3c2c3e);
        break;
      case TerrainType.ALIEN_GRASS:
        graphics.beginFill(0xa2d6a2);
        break;
      case TerrainType.ALIEN_FOREST:
        graphics.beginFill(0x5eaa5e);
        break;
      case TerrainType.ALIEN_CRYSTAL:
        graphics.beginFill(0xbf62a6);
        break;
      case TerrainType.METHANE_LAKE:
        graphics.beginFill(0x39848b);
        break;
      case TerrainType.ICE:
        graphics.beginFill(0xc9e1ff);
        break;
      default:
        graphics.beginFill(0x555555);
    }
    
    graphics.drawRect(0, 0, tileSize, tileSize);
    graphics.endFill();
    
    // Add border
    graphics.lineStyle(1, 0x000000, 0.2);
    graphics.drawRect(0, 0, tileSize, tileSize);
    
    terrainTextures[i] = app.renderer.generateTexture(graphics);
  }

  // Create resource textures
  for (let i = 0; i <= 10; i++) {
    const graphics = new PIXI.Graphics();
    
    // Fill with color based on resource type
    switch (i) {
      case ResourceType.NONE:
        graphics.beginFill(0x000000, 0); // Transparent
        break;
      case ResourceType.METHANE:
        graphics.beginFill(0x39848b);
        break;
      case ResourceType.OXYGEN:
        graphics.beginFill(0xf5f5f5);
        break;
      case ResourceType.WATER:
        graphics.beginFill(0x43aada);
        break;
      case ResourceType.IRON:
        graphics.beginFill(0xb77333);
        break;
      case ResourceType.COPPER:
        graphics.beginFill(0xd4a276);
        break;
      case ResourceType.SILICON:
        graphics.beginFill(0xf0e68c);
        break;
      case ResourceType.SULFUR:
        graphics.beginFill(0xfff44f);
        break;
      case ResourceType.URANIUM:
        graphics.beginFill(0x9bc400);
        break;
      case ResourceType.RARE_METALS:
        graphics.beginFill(0xc0c0c0);
        break;
      case ResourceType.XENOCRYSTALS:
        graphics.beginFill(0xbf62a6);
        break;
      default:
        graphics.beginFill(0x888888);
    }
    
    // Draw circle for resources
    graphics.drawCircle(tileSize / 2, tileSize / 2, tileSize / 3);
    graphics.endFill();
    
    resourceTextures[i] = app.renderer.generateTexture(graphics);
  }

  // Create building textures
  const buildingTypes = ['extractor', 'storage', 'powerPlant', 'reactor', 'pipe'];
  
  buildingTypes.forEach(type => {
    const graphics = new PIXI.Graphics();
    
    // Fill with color based on building type
    switch (type) {
      case 'extractor':
        graphics.beginFill(0x3498db);
        graphics.drawCircle(tileSize, tileSize, tileSize);
        break;
      case 'storage':
        graphics.beginFill(0xf1c40f);
        graphics.drawRect(0, 0, tileSize * 2, tileSize * 2);
        break;
      case 'powerPlant':
        graphics.beginFill(0x2ecc71);
        graphics.moveTo(tileSize, 0);
        graphics.lineTo(tileSize * 2, tileSize * 2);
        graphics.lineTo(0, tileSize * 2);
        graphics.closePath();
        break;
      case 'reactor':
        graphics.beginFill(0xe74c3c);
        graphics.moveTo(tileSize, 0);
        graphics.lineTo(tileSize * 2, tileSize);
        graphics.lineTo(tileSize, tileSize * 2);
        graphics.lineTo(0, tileSize);
        graphics.closePath();
        break;
      case 'pipe':
        graphics.beginFill(0x95a5a6);
        graphics.drawRoundedRect(0, tileSize / 2, tileSize * 2, tileSize / 2, 5);
        break;
    }
    
    graphics.endFill();
    
    buildingTextures[type] = app.renderer.generateTexture(graphics);
  });

  // Create selection indicator
  const selectionGraphics = new PIXI.Graphics();
  selectionGraphics.lineStyle(2, 0xffffff, 1);
  selectionGraphics.drawCircle(tileSize, tileSize, tileSize + 5);
  buildingTextures['selection'] = app.renderer.generateTexture(selectionGraphics);

  // Create building ghost (transparent version for placement preview)
  const ghostGraphics = new PIXI.Graphics();
  ghostGraphics.lineStyle(2, 0xffffff, 0.8);
  ghostGraphics.beginFill(0xffffff, 0.3);
  ghostGraphics.drawCircle(tileSize, tileSize, tileSize);
  ghostGraphics.endFill();
  buildingTextures['ghost'] = app.renderer.generateTexture(ghostGraphics);
}

// Set up event handlers for user interactions
function setupEvents(app: PIXI.Application) {
  console.log("Setting up event handlers");
  
  // Add interactive capabilities
  worldContainer.eventMode = 'static';
  worldContainer.cursor = 'pointer';

  // Mouse down
  worldContainer.on('pointerdown', (event) => {
    const position = event.global;
    lastPosition = { x: position.x, y: position.y };
    
    if (isPlacementMode && selectedBuildingType) {
      // Place building at mouse position
      const worldPos = event.getLocalPosition(worldContainer);
      placeBuilding(selectedBuildingType, worldPos.x, worldPos.y);
    } else {
      // Select building under cursor
      const worldPos = event.getLocalPosition(worldContainer);
      selectBuildingAt(worldPos.x, worldPos.y);
      
      // Start dragging if not in placement mode
      isDragging = true;
    }
  });

  // Mouse move
  worldContainer.on('pointermove', (event) => {
    const position = event.global;
    
    if (isDragging) {
      // Move the world container (panning)
      worldContainer.x += position.x - lastPosition.x;
      worldContainer.y += position.y - lastPosition.y;
    }
    
    lastPosition = { x: position.x, y: position.y };
    
    // Update hover position
    const worldPos = event.getLocalPosition(worldContainer);
    hoverPosition = { x: worldPos.x, y: worldPos.y };
    
    // Update ghost position in placement mode
    if (isPlacementMode && buildingGhost) {
      buildingGhost.position.set(
        Math.floor(worldPos.x / tileSize) * tileSize,
        Math.floor(worldPos.y / tileSize) * tileSize
      );
    }
  });

  // Mouse up
  worldContainer.on('pointerup', () => {
    isDragging = false;
  });

  // Mouse wheel for zoom - use our separate handleWheel function
  app.view.addEventListener('wheel', handleWheel);
  
  console.log("Event handlers setup complete");
}

// Render map from game state
function renderMap(map: any) {
  console.log("Rendering map with dimensions:", map.width, "x", map.height);
  
  // Clear existing terrain and resources
  terrainLayer.removeChildren();
  resourceLayer.removeChildren();
  
  // Store map dimensions
  mapWidth = map.width;
  mapHeight = map.height;
  
  // Calculate appropriate tile size based on map dimensions
  const app = get(pixiApp);
  if (app) {
    console.log("Screen dimensions:", app.screen.width, "x", app.screen.height);
    
    // Set a visible background color for the app
    app.renderer.background.color = 0x123456; // Dark blue background
    
    // Use a fixed tile size to ensure consistent appearance
    tileSize = 32; // Larger tiles make it easier to see the map
    
    console.log("Using tile size:", tileSize);
  }
  
  // Render each tile in the map
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      // Skip if the tile doesn't exist
      if (!map.tiles[y] || !map.tiles[y][x]) continue;
      
      const tile = map.tiles[y][x];
      
      // Create terrain sprite
      const terrainSprite = new PIXI.Sprite(terrainTextures[tile.terrain]);
      terrainSprite.position.set(x * tileSize, y * tileSize);
      terrainSprite.width = tileSize;
      terrainSprite.height = tileSize;
      terrainLayer.addChild(terrainSprite);
      
      // Add resource sprite if the tile has a resource
      if (tile.resource > 0) {
        const resourceSprite = new PIXI.Sprite(resourceTextures[tile.resource]);
        resourceSprite.position.set(x * tileSize + tileSize / 4, y * tileSize + tileSize / 4);
        resourceSprite.width = tileSize / 2;
        resourceSprite.height = tileSize / 2;
        resourceLayer.addChild(resourceSprite);
      }
    }
  }
  
  // Center the map in the view
  if (app) {
    console.log("Centering map in view");
    worldContainer.position.set(
      (app.screen.width - mapWidth * tileSize) / 2,
      (app.screen.height - mapHeight * tileSize) / 2
    );
  }
}

// Render buildings from game state
function renderBuildings(buildings: any[]) {
  // Clear existing buildings
  buildingLayer.removeChildren();
  
  // Create and add building sprites
  buildings.forEach(building => {
    if (buildingTextures[building.type]) {
      const sprite = new PIXI.Sprite(buildingTextures[building.type]);
      sprite.position.set(building.position.x, building.position.y);
      sprite.anchor.set(0.5, 0.5);
      sprite.interactive = true;
      
      // Store building data in sprite
      (sprite as any).buildingData = building;
      
      // Add to building layer
      buildingLayer.addChild(sprite);
      
      // Add selection indicator if this building is selected
      if (selectedBuilding && selectedBuilding.id === building.id) {
        const selection = new PIXI.Sprite(buildingTextures['selection']);
        selection.position.set(building.position.x, building.position.y);
        selection.anchor.set(0.5, 0.5);
        buildingLayer.addChild(selection);
      }
    }
  });
  
  // Add building ghost for placement preview
  if (isPlacementMode && selectedBuildingType) {
    if (buildingGhost) {
      buildingLayer.removeChild(buildingGhost);
    }
    
    buildingGhost = new PIXI.Sprite(buildingTextures[selectedBuildingType]);
    buildingGhost.position.set(
      Math.floor(hoverPosition.x / tileSize) * tileSize,
      Math.floor(hoverPosition.y / tileSize) * tileSize
    );
    buildingGhost.anchor.set(0.5, 0.5);
    buildingGhost.alpha = 0.6;
    buildingLayer.addChild(buildingGhost);
  }
}

// Place a new building
function placeBuilding(type: string, x: number, y: number) {
  // Create a new building object
  const building = {
    id: crypto.randomUUID(),
    type,
    position: { x, y },
    connections: [],
    efficiency: 1.0,
    isActive: true
  };
  
  // Update game state
  gameState.update(state => {
    return {
      ...state,
      buildings: [...(state.buildings || []), building]
    };
  });
  
  console.log(`Placed ${type} at (${x}, ${y})`);
}

// Select a building at a position
function selectBuildingAt(x: number, y: number) {
  const state = get(gameState);
  selectedBuilding = null;
  
  if (state.buildings) {
    for (const building of state.buildings) {
      // Simple distance check
      const distance = Math.sqrt(
        Math.pow(building.position.x - x, 2) + 
        Math.pow(building.position.y - y, 2)
      );
      
      // If within the radius of the building, select it
      if (distance < tileSize) {
        selectedBuilding = building;
        console.log(`Selected building: ${building.type} (ID: ${building.id})`);
        break;
      }
    }
  }
  
  if (!selectedBuilding) {
    console.log("No building selected");
  }
  
  // Re-render buildings to show selection
  renderBuildings(state.buildings || []);
}

// Set placement mode
export function setPlacementMode(enabled: boolean, buildingType?: string) {
  isPlacementMode = enabled;
  
  if (enabled && buildingType) {
    selectedBuildingType = buildingType;
    console.log(`Placement mode enabled for ${buildingType}`);
  } else {
    console.log("Placement mode disabled");
  }
  
  // Update ghost visibility
  if (!enabled && buildingGhost) {
    buildingLayer.removeChild(buildingGhost);
    buildingGhost = null;
  } else if (enabled && selectedBuildingType) {
    // Will be created on next render
    const state = get(gameState);
    renderBuildings(state.buildings || []);
  }
}

// Set selected building
export function setSelectedBuilding(building: any) {
  selectedBuilding = building;
  
  // Update rendering
  const state = get(gameState);
  renderBuildings(state.buildings || []);
}

// Reset view
export function resetView() {
  // Reset zoom and position
  worldContainer.scale.set(1, 1);
  
  const app = get(pixiApp);
  if (app) {
    worldContainer.position.set(
      (app.screen.width - mapWidth * tileSize) / 2,
      (app.screen.height - mapHeight * tileSize) / 2
    );
  }
}

// Move world container with WASD controls
export function moveWorld(dx: number, dy: number) {
  if (!worldContainer) return;
  
  // Update world container position
  worldContainer.x += dx;
  worldContainer.y += dy;
  
  // Log position for debugging
  if (dx !== 0 || dy !== 0) {
    console.log(`Moving world: dx=${dx}, dy=${dy}, position=(${worldContainer.x}, ${worldContainer.y})`);
  }
}

// Add a player character to the game
export function addPlayerCharacter() {
  const app = get(pixiApp);
  if (!app || !characterLayer) {
    console.error("Can't add player character - app or character layer not available");
    return;
  }
  
  console.log("Creating player character");
  
  // Create a simple character sprite
  const graphics = new PIXI.Graphics();
  
  // Draw character (a simple colored circle with an arrow for direction)
  graphics.lineStyle(2, 0xFFFFFF, 1);
  graphics.beginFill(0x3498db);
  graphics.drawCircle(0, 0, 16);
  graphics.endFill();
  
  // Draw direction indicator
  graphics.lineStyle(2, 0xFFFFFF, 1);
  graphics.moveTo(0, 0);
  graphics.lineTo(16, 0);
  
  // Create texture from graphics
  const texture = app.renderer.generateTexture(graphics);
  
  // Create sprite from texture
  playerCharacter = new PIXI.Sprite(texture);
  playerCharacter.anchor.set(0.5, 0.5);
  
  // Position at center of the screen
  const screenCenter = {
    x: app.screen.width / 2,
    y: app.screen.height / 2
  };
  
  // Convert screen center to world coordinates
  const worldPos = {
    x: (screenCenter.x - worldContainer.x) / worldContainer.scale.x,
    y: (screenCenter.y - worldContainer.y) / worldContainer.scale.y
  };
  
  playerCharacter.position.set(worldPos.x, worldPos.y);
  
  // Add to character layer
  characterLayer.addChild(playerCharacter);
  
  console.log("Player character added at position:", playerCharacter.position);
  
  return playerCharacter;
}