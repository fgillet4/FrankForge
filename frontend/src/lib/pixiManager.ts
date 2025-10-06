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

// Chunking system
const CHUNK_SIZE = 32; // Size of each chunk in tiles
let visibleChunks: Record<string, { sprites: PIXI.Sprite[], resources: PIXI.Sprite[], decorations: PIXI.Sprite[] }> = {};
let renderedChunks = new Set<string>();
let currentPlayerChunk = { x: 0, y: 0 };
let loadDistance = 2; // How many chunks to load around the player

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

  // Create building ghost (transparent version for placement preview) for each building type
  buildingTypes.forEach(type => {
    const ghostGraphics = new PIXI.Graphics();
    
    // Copy the same shape as the building but make it transparent
    ghostGraphics.lineStyle(2, 0xffffff, 0.8);
    ghostGraphics.beginFill(0xffffff, 0.3);
    
    switch (type) {
      case 'extractor':
        ghostGraphics.drawCircle(tileSize, tileSize, tileSize);
        break;
      case 'storage':
        ghostGraphics.drawRect(0, 0, tileSize * 2, tileSize * 2);
        break;
      case 'powerPlant':
        ghostGraphics.moveTo(tileSize, 0);
        ghostGraphics.lineTo(tileSize * 2, tileSize * 2);
        ghostGraphics.lineTo(0, tileSize * 2);
        ghostGraphics.closePath();
        break;
      case 'reactor':
        ghostGraphics.moveTo(tileSize, 0);
        ghostGraphics.lineTo(tileSize * 2, tileSize);
        ghostGraphics.lineTo(tileSize, tileSize * 2);
        ghostGraphics.lineTo(0, tileSize);
        ghostGraphics.closePath();
        break;
      case 'pipe':
        ghostGraphics.drawRoundedRect(0, tileSize / 2, tileSize * 2, tileSize / 2, 5);
        break;
    }
    
    ghostGraphics.endFill();
    buildingTextures[`${type}_ghost`] = app.renderer.generateTexture(ghostGraphics);
  });
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
      // Get world position and convert to tile coordinates
      const worldPos = event.getLocalPosition(worldContainer);
      const tileX = Math.floor(worldPos.x / tileSize);
      const tileY = Math.floor(worldPos.y / tileSize);
      
      // Check if placement is valid before placing
      if (canPlaceBuilding(selectedBuildingType, tileX, tileY)) {
        placeBuilding(selectedBuildingType, worldPos.x, worldPos.y);
      } else {
        // Show error message (reason will be shown by ghost color)
        const x = tileX * tileSize;
        const y = tileY * tileSize;
        showBuildingMessage("Invalid placement", x, y, 0xff0000);
      }
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
      const ghostX = Math.floor(worldPos.x / tileSize) * tileSize;
      const ghostY = Math.floor(worldPos.y / tileSize) * tileSize;
      
      buildingGhost.position.set(ghostX, ghostY);
      
      // Check if placement is valid and update ghost appearance
      const isPlacementValid = canPlaceBuilding(
        selectedBuildingType,
        Math.floor(worldPos.x / tileSize),
        Math.floor(worldPos.y / tileSize)
      );
      
      // Tint the ghost based on validity
      buildingGhost.tint = isPlacementValid ? 0x00ff00 : 0xff0000;
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

// Render map from game state using chunking system
function renderMap(map: any) {
  console.log("Rendering map with dimensions:", map.width, "x", map.height);
  
  // Store map dimensions
  mapWidth = map.width;
  mapHeight = map.height;
  
  // Calculate appropriate tile size based on map dimensions
  const app = get(pixiApp);
  if (app) {
    console.log("Screen dimensions:", app.screen.width, "x", app.screen.height);
    
    // Set a visible background color for the app
    app.renderer.background.color = 0x0f0f1e; // Dark blue background
    
    // Use a fixed tile size to ensure consistent appearance
    tileSize = 32; // Larger tiles make it easier to see the map
    
    console.log("Using tile size:", tileSize);
  }
  
  // Clear all chunk data - we'll render chunks on demand
  visibleChunks = {};
  renderedChunks.clear();
  
  // Initialize FOW (Fog of War) layer if it doesn't exist
  if (!worldContainer.getChildByName("fow-layer")) {
    const fowLayer = new PIXI.Container();
    fowLayer.name = "fow-layer";
    fowLayer.zIndex = 100; // Above terrain but below UI
    worldContainer.addChild(fowLayer);
  }
  
  // Create a minimap if it doesn't exist
  createMinimap(map);
  
  // Initial render of chunks around center of map
  const centerX = Math.floor(map.width / 2);
  const centerY = Math.floor(map.height / 2);
  currentPlayerChunk = {
    x: Math.floor(centerX / CHUNK_SIZE),
    y: Math.floor(centerY / CHUNK_SIZE)
  };
  
  // Render chunks around player starting position
  updateVisibleChunks(map, currentPlayerChunk.x, currentPlayerChunk.y);
  
  // Center the map in the view
  if (app) {
    console.log("Centering map in view");
    worldContainer.position.set(
      (app.screen.width - mapWidth * tileSize) / 2,
      (app.screen.height - mapHeight * tileSize) / 2
    );
  }
}

// Update which chunks are visible based on player position
function updateVisibleChunks(map: any, chunkX: number, chunkY: number) {
  // First, determine which chunks should be visible
  const chunksToRender = new Set<string>();
  
  for (let y = chunkY - loadDistance; y <= chunkY + loadDistance; y++) {
    for (let x = chunkX - loadDistance; x <= chunkX + loadDistance; x++) {
      // Skip if the chunk is outside the map bounds
      if (x < 0 || y < 0 || x * CHUNK_SIZE >= mapWidth || y * CHUNK_SIZE >= mapHeight) {
        continue;
      }
      
      const chunkId = `${x},${y}`;
      chunksToRender.add(chunkId);
      
      // Render the chunk if it's not already rendered
      if (!renderedChunks.has(chunkId)) {
        renderChunk(map, x, y);
        renderedChunks.add(chunkId);
      }
    }
  }
  
  // Remove chunks that are no longer visible
  for (const chunkId of renderedChunks) {
    if (!chunksToRender.has(chunkId)) {
      const chunk = visibleChunks[chunkId];
      if (chunk) {
        // Remove sprites from layers
        chunk.sprites.forEach(sprite => terrainLayer.removeChild(sprite));
        chunk.resources.forEach(sprite => resourceLayer.removeChild(sprite));
        chunk.decorations.forEach(sprite => resourceLayer.removeChild(sprite));
        
        // Delete the chunk data
        delete visibleChunks[chunkId];
        renderedChunks.delete(chunkId);
      }
    }
  }
  
  // Update game state with currently loaded chunks
  gameState.update(state => {
    if (state.camera) {
      state.camera.chunks = Array.from(renderedChunks);
    }
    return state;
  });
}

// Render a single chunk of the map
function renderChunk(map: any, chunkX: number, chunkY: number) {
  const chunkId = `${chunkX},${chunkY}`;
  const startX = chunkX * CHUNK_SIZE;
  const startY = chunkY * CHUNK_SIZE;
  const endX = Math.min(startX + CHUNK_SIZE, mapWidth);
  const endY = Math.min(startY + CHUNK_SIZE, mapHeight);
  
  // Initialize arrays to store sprites for this chunk
  const chunkTerrainSprites: PIXI.Sprite[] = [];
  const chunkResourceSprites: PIXI.Sprite[] = [];
  const chunkDecorationSprites: PIXI.Sprite[] = [];
  
  // Get fog of war layer
  const fowLayer = worldContainer.getChildByName("fow-layer") as PIXI.Container;
  
  // Render each tile in the chunk
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      // Skip if the tile doesn't exist
      if (!map.tiles[y] || !map.tiles[y][x]) continue;
      
      const tile = map.tiles[y][x];
      
      // Create terrain sprite
      const terrainSprite = new PIXI.Sprite(terrainTextures[tile.terrain]);
      terrainSprite.position.set(x * tileSize, y * tileSize);
      terrainSprite.width = tileSize;
      terrainSprite.height = tileSize;
      terrainLayer.addChild(terrainSprite);
      chunkTerrainSprites.push(terrainSprite);
      
      // Add resource sprite if the tile has a resource
      if (tile.resource > 0) {
        const resourceSprite = new PIXI.Sprite(resourceTextures[tile.resource]);
        resourceSprite.position.set(x * tileSize + tileSize / 4, y * tileSize + tileSize / 4);
        resourceSprite.width = tileSize / 2;
        resourceSprite.height = tileSize / 2;
        resourceLayer.addChild(resourceSprite);
        chunkResourceSprites.push(resourceSprite);
      }
      
      // Add decoration sprites if the tile has decorations
      if (tile.decorations && tile.decorations.length > 0) {
        for (const decorationId of tile.decorations) {
          // Create a decoration sprite - for now using colored rectangles
          const graphics = new PIXI.Graphics();
          
          if (decorationId >= 0 && decorationId <= 3) {
            // Bush/plant
            graphics.beginFill(0x2c8c2c);
            graphics.drawCircle(0, 0, 4);
          } else if (decorationId >= 4 && decorationId <= 7) {
            // Crystal
            graphics.beginFill(0xa144e5);
            graphics.drawRect(-3, -6, 6, 12);
          } else if (decorationId >= 8 && decorationId <= 11) {
            // Rock
            graphics.beginFill(0x8c8c8c);
            graphics.drawRoundedRect(-5, -5, 10, 10, 2);
          } else if (decorationId >= 12) {
            // POI marker
            graphics.beginFill(0xf6e700);
            graphics.drawStar(0, 0, 5, 10, 5);
          }
          
          graphics.endFill();
          const texture = app?.renderer.generateTexture(graphics);
          
          if (texture) {
            const decorationSprite = new PIXI.Sprite(texture);
            decorationSprite.position.set(
              x * tileSize + tileSize / 2, 
              y * tileSize + tileSize / 2
            );
            decorationSprite.anchor.set(0.5, 0.5);
            
            resourceLayer.addChild(decorationSprite);
            chunkDecorationSprites.push(decorationSprite);
          }
        }
      }
      
      // Add fog of war if the tile hasn't been discovered
      if (fowLayer && map.tiles[y][x].discovered === false) {
        const fowTile = new PIXI.Graphics();
        fowTile.beginFill(0x000000, 0.8);
        fowTile.drawRect(0, 0, tileSize, tileSize);
        fowTile.endFill();
        
        const fowSprite = new PIXI.Sprite(app?.renderer.generateTexture(fowTile));
        fowSprite.position.set(x * tileSize, y * tileSize);
        fowSprite.name = `fow_${x}_${y}`;
        fowLayer.addChild(fowSprite);
      }
    }
  }
  
  // Store the chunk sprites for later removal
  visibleChunks[chunkId] = {
    sprites: chunkTerrainSprites,
    resources: chunkResourceSprites,
    decorations: chunkDecorationSprites
  };
}

// Create a minimap UI element
function createMinimap(map: any) {
  if (!uiLayer) return;
  
  // Clear existing minimap
  const existingMinimap = uiLayer.getChildByName("minimap");
  if (existingMinimap) {
    uiLayer.removeChild(existingMinimap);
  }
  
  const app = get(pixiApp);
  if (!app) return;
  
  // Create minimap container
  const minimap = new PIXI.Container();
  minimap.name = "minimap";
  
  // Position in top-right corner with padding
  minimap.position.set(app.screen.width - 220, 20);
  
  // Create background
  const background = new PIXI.Graphics();
  background.beginFill(0x000000, 0.7);
  background.drawRoundedRect(0, 0, 200, 200, 8);
  background.endFill();
  minimap.addChild(background);
  
  // Create the minimap content at a small scale
  const minimapContent = new PIXI.Container();
  minimapContent.name = "minimap-content"; // Add name so we can find it later
  minimapContent.position.set(10, 10);
  
  // Calculate scale to fit map in minimap
  const minimapSize = 180;
  const scaleX = minimapSize / (mapWidth * tileSize);
  const scaleY = minimapSize / (mapHeight * tileSize);
  const scale = Math.min(scaleX, scaleY);
  
  minimapContent.scale.set(scale, scale);
  minimap.addChild(minimapContent);
  
  // Create a simplified minimap - just basic terrain colors
  // We'll use a 1:8 ratio to avoid too many sprites
  const simplificationFactor = 8; 
  
  for (let y = 0; y < mapHeight; y += simplificationFactor) {
    for (let x = 0; x < mapWidth; x += simplificationFactor) {
      if (!map.tiles[y] || !map.tiles[y][x]) continue;
      
      const tile = map.tiles[y][x];
      
      // Create a colored rectangle for each tile type
      const pixelGraphics = new PIXI.Graphics();
      
      // Color based on terrain type
      let color = 0x333333; // Default gray
      
      switch (tile.terrain) {
        case 0: color = 0x0a3b5c; break; // DEEP_WATER
        case 1: color = 0x0e6ba8; break; // SHALLOW_WATER
        case 2: color = 0xe4d6a7; break; // SAND
        case 3: color = 0x7ab317; break; // GRASS
        case 4: color = 0x3e7924; break; // FOREST
        case 5: color = 0x6d8383; break; // HILLS
        case 6: color = 0x8d8778; break; // MOUNTAINS
        case 7: color = 0xffffff; break; // SNOW
        case 8: color = 0x7c3626; break; // VOLCANIC
        case 9: color = 0xe25822; break; // LAVA
        case 10: color = 0x3c2c3e; break; // CAVE
        case 11: color = 0xa2d6a2; break; // ALIEN_GRASS
        case 12: color = 0x5eaa5e; break; // ALIEN_FOREST
        case 13: color = 0xbf62a6; break; // ALIEN_CRYSTAL
        case 14: color = 0x39848b; break; // METHANE_LAKE
        case 15: color = 0xc9e1ff; break; // ICE
      }
      
      // Draw the pixel - larger size to account for simplification
      pixelGraphics.beginFill(color);
      pixelGraphics.drawRect(
        x * tileSize, 
        y * tileSize, 
        tileSize * simplificationFactor, 
        tileSize * simplificationFactor
      );
      pixelGraphics.endFill();
      
      // If not discovered, overlay with dark color
      if (tile.discovered === false) {
        pixelGraphics.beginFill(0x000000, 0.7);
        pixelGraphics.drawRect(
          x * tileSize, 
          y * tileSize, 
          tileSize * simplificationFactor, 
          tileSize * simplificationFactor
        );
        pixelGraphics.endFill();
      }
      
      minimapContent.addChild(pixelGraphics);
    }
  }
  
  // Add points of interest to minimap
  if (map.pointsOfInterest) {
    for (const poi of map.pointsOfInterest) {
      // Only show discovered POIs or make them appear as unexplored areas
      if (poi.discovered) {
        const poiMarker = new PIXI.Graphics();
        poiMarker.beginFill(0xf6e700); // Yellow
        poiMarker.drawStar(0, 0, 5, 10, 5);
        poiMarker.endFill();
        poiMarker.position.set(poi.x * tileSize, poi.y * tileSize);
        minimapContent.addChild(poiMarker);
      }
    }
  }
  
  // Add player position marker (will be updated in real-time)
  const playerMarker = new PIXI.Graphics();
  playerMarker.beginFill(0xff0000);
  playerMarker.drawCircle(0, 0, 5 / scale); // Adjust size for visibility
  playerMarker.endFill();
  playerMarker.name = "player-marker";
  minimapContent.addChild(playerMarker);
  
  // Add to UI layer
  uiLayer.addChild(minimap);
  
  // Make minimap interactive for clicking to move
  background.eventMode = 'static';
  background.cursor = 'pointer';
  background.on('pointerdown', (event) => {
    const localPos = event.getLocalPosition(minimapContent);
    
    // Convert minimap coordinates to world coordinates
    const worldX = localPos.x / scale;
    const worldY = localPos.y / scale;
    
    // Center the view on the clicked point
    centerViewOnPosition(worldX, worldY);
  });
}

// Function to center view on a specific position
function centerViewOnPosition(x: number, y: number) {
  const app = get(pixiApp);
  if (!app || !worldContainer) return;
  
  worldContainer.position.set(
    app.screen.width / 2 - x,
    app.screen.height / 2 - y
  );
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

// Place a new building with player proximity check
function placeBuilding(type: string, x: number, y: number) {
  // Get game state to check player position
  const state = get(gameState);
  
  // Convert coordinates to tile coordinates
  const tileX = Math.floor(x / tileSize);
  const tileY = Math.floor(y / tileSize);
  
  // Check player proximity (player can only build within a certain range)
  const buildingRange = 5; // Maximum distance player can build from their position
  if (state.player && state.player.position) {
    const playerX = Math.floor(state.player.position.x);
    const playerY = Math.floor(state.player.position.y);
    
    // Calculate distance from player to building location
    const distance = Math.sqrt(Math.pow(playerX - tileX, 2) + Math.pow(playerY - tileY, 2));
    
    if (distance > buildingRange) {
      console.log(`Cannot place building: Too far from player (${distance.toFixed(1)} tiles away, max is ${buildingRange})`);
      showBuildingMessage(`Too far away (${distance.toFixed(1)} tiles)`, x, y, 0xff0000);
      return;
    }
  }
  
  // Check for collision with terrain or other buildings
  if (state.map && state.map.tiles && state.map.tiles[tileY] && state.map.tiles[tileY][tileX]) {
    const tile = state.map.tiles[tileY][tileX];
    
    // Check if the tile is traversable (not water, mountains, etc.)
    if (!tile.traversable) {
      console.log(`Cannot place building: Terrain not suitable`);
      showBuildingMessage("Cannot build here", x, y, 0xff0000);
      return;
    }
    
    // Check for any existing buildings at this location
    const buildingExists = state.buildings.some(b => {
      const bx = Math.floor(b.position.x / tileSize);
      const by = Math.floor(b.position.y / tileSize);
      return bx === tileX && by === tileY;
    });
    
    if (buildingExists) {
      console.log(`Cannot place building: Location already occupied`);
      showBuildingMessage("Location occupied", x, y, 0xff0000);
      return;
    }
  }
  
  // Check resources for building
  let canAfford = true;
  const buildingCosts: Record<string, Record<string, number>> = {
    'extractor': { 'iron': 10, 'copper': 5 },
    'storage': { 'iron': 15, 'copper': 5 },
    'powerPlant': { 'iron': 20, 'copper': 10, 'silicon': 5 },
    'reactor': { 'iron': 25, 'copper': 15, 'silicon': 10 },
    'pipe': { 'iron': 5 }
  };
  
  // Check if player has enough resources
  const cost = buildingCosts[type] || {}; 
  const missingResources: string[] = [];
  
  for (const [resource, amount] of Object.entries(cost)) {
    if ((state.resources[resource] || 0) < amount) {
      canAfford = false;
      missingResources.push(`${resource} (need ${amount})`);
    }
  }
  
  if (!canAfford) {
    console.log(`Cannot place building: Insufficient resources - missing ${missingResources.join(', ')}`);
    showBuildingMessage(`Need: ${missingResources.join(', ')}`, x, y, 0xff0000);
    return;
  }
  
  // Create the new building object
  const building = {
    id: crypto.randomUUID(),
    type,
    position: { x, y },
    connections: [],
    efficiency: 1.0,
    isActive: true
  };
  
  // Deduct resources
  gameState.update(state => {
    // Update resources
    const newResources = { ...state.resources };
    for (const [resource, amount] of Object.entries(cost)) {
      newResources[resource] = (newResources[resource] || 0) - amount;
    }
    
    return {
      ...state,
      resources: newResources,
      buildings: [...(state.buildings || []), building]
    };
  });
  
  // Show success message
  showBuildingMessage(`${type} built`, x, y, 0x00ff00);
  
  console.log(`Placed ${type} at (${x}, ${y})`);
}

// Check if a building can be placed at the given position
function canPlaceBuilding(type: string | null, tileX: number, tileY: number): boolean {
  if (!type) return false;
  
  // Get game state
  const state = get(gameState);
  if (!state.map || !state.player) return false;
  
  // Check player proximity
  const buildingRange = 5; // Maximum distance player can build
  const playerX = Math.floor(state.player.position.x);
  const playerY = Math.floor(state.player.position.y);
  
  // Calculate distance
  const distance = Math.sqrt(Math.pow(playerX - tileX, 2) + Math.pow(playerY - tileY, 2));
  if (distance > buildingRange) return false;
  
  // Check terrain
  if (!state.map.tiles[tileY] || !state.map.tiles[tileY][tileX]) return false;
  const tile = state.map.tiles[tileY][tileX];
  if (!tile.traversable) return false;
  
  // Check for existing buildings
  const buildingExists = state.buildings.some(b => {
    const bx = Math.floor(b.position.x / tileSize);
    const by = Math.floor(b.position.y / tileSize);
    return bx === tileX && by === tileY;
  });
  if (buildingExists) return false;
  
  // Check if player has resources
  const buildingCosts: Record<string, Record<string, number>> = {
    'extractor': { 'iron': 10, 'copper': 5 },
    'storage': { 'iron': 15, 'copper': 5 },
    'powerPlant': { 'iron': 20, 'copper': 10, 'silicon': 5 },
    'reactor': { 'iron': 25, 'copper': 15, 'silicon': 10 },
    'pipe': { 'iron': 5 }
  };
  
  const cost = buildingCosts[type] || {};
  for (const [resource, amount] of Object.entries(cost)) {
    if ((state.resources[resource] || 0) < amount) {
      return false;
    }
  }
  
  return true;
}

// Show a temporary floating message near a building site
function showBuildingMessage(message: string, x: number, y: number, color: number = 0xffffff) {
  const app = get(pixiApp);
  if (!app || !uiLayer) return;
  
  // Create text
  const text = new PIXI.Text(message, {
    fontFamily: 'Arial',
    fontSize: 14,
    fill: color,
    stroke: 0x000000,
    strokeThickness: 2,
    align: 'center'
  });
  
  text.x = x;
  text.y = y - 30; // Position above the building site
  text.anchor.set(0.5, 0.5);
  
  // Add to UI layer
  uiLayer.addChild(text);
  
  // Animate and remove
  let alpha = 1;
  let yOffset = 0;
  const animateAndRemove = () => {
    alpha -= 0.02;
    yOffset -= 0.5;
    text.alpha = alpha;
    text.y = y - 30 + yOffset;
    
    if (alpha <= 0) {
      uiLayer.removeChild(text);
      app.ticker.remove(animateAndRemove);
    }
  };
  
  app.ticker.add(animateAndRemove);
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

// Player character control functions
export function setPlayerDirection(direction: string) {
  if (!playerCharacter) return;
  
  const animState = (playerCharacter as any).animState;
  if (animState) {
    animState.direction = direction;
  }
}

export function setPlayerMoving(isMoving: boolean) {
  if (!playerCharacter) return;
  
  const animState = (playerCharacter as any).animState;
  if (animState) {
    animState.isMoving = isMoving;
    animState.animation = isMoving ? (animState.isRunning ? 'run' : 'walk') : 'idle';
  }
}

export function setPlayerRunning(isRunning: boolean) {
  if (!playerCharacter) return;
  
  const animState = (playerCharacter as any).animState;
  if (animState) {
    animState.isRunning = isRunning;
    
    // Only update animation if moving
    if (animState.isMoving) {
      animState.animation = isRunning ? 'run' : 'walk';
      
      // Update frame delay for faster animation when running
      animState.frameDelay = isRunning ? 100 : 150;
    }
  }
}

// Check if a tile position has a collision
export function checkCollision(map: any, tileX: number, tileY: number): boolean {
  if (!map) return true;
  
  // Check map boundaries
  if (tileX < 0 || tileY < 0 || tileX >= map.width || tileY >= map.height) {
    return true; // Collision with map edge
  }
  
  // Check tile properties
  if (map.tiles[tileY] && map.tiles[tileY][tileX]) {
    const tile = map.tiles[tileY][tileX];
    
    // Check if tile is traversable
    if (!tile.traversable) {
      return true;
    }
    
    // Check for buildings
    for (const building of get(gameState).buildings || []) {
      const buildingTileX = Math.floor(building.position.x / tileSize);
      const buildingTileY = Math.floor(building.position.y / tileSize);
      
      if (buildingTileX === tileX && buildingTileY === tileY) {
        return true;
      }
    }
  }
  
  return false; // No collision
}

// Interact with world objects
export function interactWithWorld() {
  if (!playerCharacter) return;
  
  // Get game state
  const state = get(gameState);
  if (!state.player || !state.map) return;
  
  // Get player position and direction
  const playerX = Math.floor(state.player.position.x);
  const playerY = Math.floor(state.player.position.y);
  const direction = (playerCharacter as any).animState?.direction || 'down';
  
  // Calculate interaction position based on direction
  let interactX = playerX;
  let interactY = playerY;
  
  if (direction === 'up') interactY--;
  else if (direction === 'down') interactY++;
  else if (direction === 'left') interactX--;
  else if (direction === 'right') interactX++;
  
  // Check map boundaries
  if (interactX < 0 || interactY < 0 || interactX >= state.map.width || interactY >= state.map.height) {
    return; // Out of bounds
  }
  
  // Get tile at interaction position
  const tile = state.map.tiles[interactY][interactX];
  if (!tile) return;
  
  // Update player animation
  if ((playerCharacter as any).animState) {
    (playerCharacter as any).animState.animation = 'interact';
    (playerCharacter as any).animState.isInteracting = true;
    
    // Reset after animation
    setTimeout(() => {
      if (playerCharacter && (playerCharacter as any).animState) {
        (playerCharacter as any).animState.isInteracting = false;
        (playerCharacter as any).animState.animation = 'idle';
      }
    }, 600);
  }
  
  // Handle interaction based on what's in the tile
  console.log(`Interacting with tile at (${interactX}, ${interactY}) - type: ${tile.terrain}, resource: ${tile.resource}`);
  
  // Check for buildings
  let foundBuilding = false;
  for (const building of state.buildings || []) {
    const buildingTileX = Math.floor(building.position.x / tileSize);
    const buildingTileY = Math.floor(building.position.y / tileSize);
    
    if (buildingTileX === interactX && buildingTileY === interactY) {
      console.log(`Interacting with building: ${building.type}`);
      setSelectedBuilding(building);
      foundBuilding = true;
      break;
    }
  }
  
  // If no building, check for resources
  if (!foundBuilding && tile.resource > 0) {
    console.log(`Harvesting resource ${tile.resource} at (${interactX}, ${interactY})`);
    
    // Update animation
    if ((playerCharacter as any).animState) {
      (playerCharacter as any).animState.animation = 'harvest';
    }
    
    // Add resource to inventory
    gameState.update(state => {
      // Get resource type name
      const resourceNames = [
        'none', 'methane', 'oxygen', 'water', 'iron', 'copper', 
        'silicon', 'sulfur', 'uranium', 'rare_metals', 'xenocrystals'
      ];
      
      const resourceType = resourceNames[tile.resource] || 'unknown';
      const amount = Math.ceil(tile.resourceDensity * 5); // Scale based on density
      
      // Add to resources
      state.resources[resourceType] = (state.resources[resourceType] || 0) + amount;
      
      return state;
    });
  }
  
  // Check for points of interest
  if (state.map.pointsOfInterest) {
    for (const poi of state.map.pointsOfInterest) {
      if (poi.x === interactX && poi.y === interactY) {
        console.log(`Interacting with POI: ${poi.name}`);
        
        // If already discovered, show details
        if (poi.discovered) {
          // TODO: Show details in UI
          console.log(`POI details: ${poi.description}`);
        }
      }
    }
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
  
  // Check if we already have a player character
  if (playerCharacter) {
    characterLayer.removeChild(playerCharacter);
  }
  
  // Get player position from game state
  const state = get(gameState);
  let playerPos = { x: Math.floor(mapWidth / 2), y: Math.floor(mapHeight / 2) };
  
  // Use position from game state if available
  if (state.player && state.player.position) {
    playerPos = state.player.position;
  } else {
    // Update game state with default position
    gameState.update(state => {
      if (state.player) {
        state.player.position = playerPos;
      }
      return state;
    });
  }
  
  // Create character sprites for different directions and animations
  const characterTextures: Record<string, PIXI.Texture> = {};
  
  // Create placeholder sprites for different directions and animations
  const directions = ['down', 'up', 'left', 'right'];
  const animations = ['idle', 'walk', 'run', 'interact', 'harvest'];
  
  for (const direction of directions) {
    for (const animation of animations) {
      for (let frame = 0; frame < 4; frame++) {
        const graphics = new PIXI.Graphics();
        
        // Base character shape
        graphics.lineStyle(1, 0x000000, 1);
        graphics.beginFill(0x3498db); // Character color
        
        // Different shapes based on direction
        if (direction === 'down') {
          graphics.drawRoundedRect(-8, -16, 16, 24, 4);
        } else if (direction === 'up') {
          graphics.drawRoundedRect(-8, -16, 16, 24, 4);
        } else if (direction === 'left' || direction === 'right') {
          graphics.drawRoundedRect(-8, -16, 16, 24, 4);
        }
        
        graphics.endFill();
        
        // Add face/direction indicator
        graphics.lineStyle(1, 0x000000, 1);
        graphics.beginFill(0xFFFFFF);
        
        if (direction === 'down') {
          // Face looking down
          graphics.drawEllipse(-3, -8, 2, 2); // Left eye
          graphics.drawEllipse(3, -8, 2, 2); // Right eye
          // Mouth - changes with animation
          if (animation === 'idle') {
            graphics.drawRect(-4, -4, 8, 1);
          } else if (animation === 'run') {
            // Open mouth for running
            graphics.drawEllipse(0, -4, 3, 2);
          }
        } else if (direction === 'up') {
          // Face looking up - can't see eyes
          graphics.drawRect(-4, -4, 8, 1); // Back of head line
        } else if (direction === 'left') {
          // Profile face looking left
          graphics.drawEllipse(-4, -8, 2, 2); // Eye
          graphics.drawRect(-6, -4, 4, 1); // Mouth
        } else if (direction === 'right') {
          // Profile face looking right
          graphics.drawEllipse(4, -8, 2, 2); // Eye
          graphics.drawRect(2, -4, 4, 1); // Mouth
        }
        
        graphics.endFill();
        
        // Animation modifications
        if (animation === 'walk' || animation === 'run') {
          // Modify body shape slightly based on frame to simulate walking/running
          const offsetY = animation === 'run' ? 2 : 1;
          if (frame % 2 === 0) {
            // Lean slightly based on direction
            if (direction === 'left') {
              graphics.position.set(-1, frame === 0 ? offsetY : 0);
            } else if (direction === 'right') {
              graphics.position.set(1, frame === 0 ? offsetY : 0);
            } else {
              graphics.position.set(0, frame === 0 ? offsetY : 0);
            }
          }
        } else if (animation === 'interact' || animation === 'harvest') {
          // Hands out animation
          const outerGraphics = new PIXI.Graphics();
          outerGraphics.lineStyle(1, 0x000000, 1);
          outerGraphics.beginFill(0x3498db);
          
          // Draw hands in different positions based on frame
          if (direction === 'down') {
            const handOffsets = [5, 7, 8, 7];
            outerGraphics.drawCircle(-8, handOffsets[frame], 3); // Left hand
            outerGraphics.drawCircle(8, handOffsets[frame], 3); // Right hand
          } else if (direction === 'up') {
            const handOffsets = [-5, -7, -8, -7];
            outerGraphics.drawCircle(-8, handOffsets[frame], 3); // Left hand
            outerGraphics.drawCircle(8, handOffsets[frame], 3); // Right hand
          } else if (direction === 'left') {
            const handOffsets = [5, 7, 8, 7];
            outerGraphics.drawCircle(-8, handOffsets[frame], 3); // Forward hand
          } else if (direction === 'right') {
            const handOffsets = [5, 7, 8, 7];
            outerGraphics.drawCircle(8, handOffsets[frame], 3); // Forward hand
          }
          
          outerGraphics.endFill();
          graphics.addChild(outerGraphics);
        }
        
        // Generate a texture for this frame
        const textureName = `${direction}_${animation}_${frame}`;
        characterTextures[textureName] = app.renderer.generateTexture(graphics);
      }
    }
  }
  
  // Create the player character sprite with the default texture
  playerCharacter = new PIXI.Sprite(characterTextures['down_idle_0']);
  playerCharacter.name = 'player-character';
  playerCharacter.anchor.set(0.5, 0.5);
  
  // Set initial position
  const pixelPos = {
    x: playerPos.x * tileSize,
    y: playerPos.y * tileSize
  };
  playerCharacter.position.set(pixelPos.x, pixelPos.y);
  
  // Add to character layer
  characterLayer.addChild(playerCharacter);
  
  // Set up animation properties
  (playerCharacter as any).animState = {
    direction: 'down',
    animation: 'idle',
    frame: 0,
    lastFrameUpdate: Date.now(),
    frameDelay: 150, // ms between frames
    isMoving: false,
    isRunning: false,
    isInteracting: false
  };
  
  // Set up character shadow
  const shadowGraphics = new PIXI.Graphics();
  shadowGraphics.beginFill(0x000000, 0.3);
  shadowGraphics.drawEllipse(0, 0, 8, 4);
  shadowGraphics.endFill();
  
  const shadowTexture = app.renderer.generateTexture(shadowGraphics);
  const characterShadow = new PIXI.Sprite(shadowTexture);
  characterShadow.name = 'character-shadow';
  characterShadow.position.set(pixelPos.x, pixelPos.y + 12);
  characterShadow.anchor.set(0.5, 0.5);
  characterLayer.addChild(characterShadow);
  
  // Store reference to textures and shadow
  (playerCharacter as any).textures = characterTextures;
  (playerCharacter as any).shadow = characterShadow;
  
  // Set up player animation loop
  const animatePlayer = (delta: number) => {
    if (!playerCharacter) return;
    
    const animState = (playerCharacter as any).animState;
    if (!animState) return;
    
    // Update animation frame
    const now = Date.now();
    if (now - animState.lastFrameUpdate > animState.frameDelay) {
      animState.frame = (animState.frame + 1) % 4;
      animState.lastFrameUpdate = now;
      
      // Update texture based on current animation state
      const textureName = `${animState.direction}_${animState.animation}_${animState.frame}`;
      if (characterTextures[textureName]) {
        playerCharacter.texture = characterTextures[textureName];
      }
    }
    
    // Update shadow position
    if ((playerCharacter as any).shadow) {
      (playerCharacter as any).shadow.position.set(
        playerCharacter.position.x,
        playerCharacter.position.y + 12
      );
      
      // Scale shadow based on animation
      if (animState.animation === 'run') {
        (playerCharacter as any).shadow.scale.set(
          1 + 0.2 * Math.sin(now / 100),
          1 + 0.2 * Math.sin(now / 100)
        );
      } else {
        (playerCharacter as any).shadow.scale.set(1, 1);
      }
    }
    
    // Update player position based on game state
    const state = get(gameState);
    if (state.player && state.player.position) {
      const targetX = state.player.position.x * tileSize;
      const targetY = state.player.position.y * tileSize;
      
      // Smoothly move towards target position
      playerCharacter.position.x += (targetX - playerCharacter.position.x) * 0.2;
      playerCharacter.position.y += (targetY - playerCharacter.position.y) * 0.2;
      
      // Update minimap marker
      updateMinimapMarker();
      
      // Update camera if in follow mode
      if (state.camera && state.camera.followPlayer) {
        updateCameraPosition();
      }
      
      // Update current chunk
      const playerChunkX = Math.floor(state.player.position.x / CHUNK_SIZE);
      const playerChunkY = Math.floor(state.player.position.y / CHUNK_SIZE);
      
      if (playerChunkX !== currentPlayerChunk.x || playerChunkY !== currentPlayerChunk.y) {
        // Player has moved to a new chunk
        currentPlayerChunk = { x: playerChunkX, y: playerChunkY };
        
        // Update visible chunks
        updateVisibleChunks(state.map, playerChunkX, playerChunkY);
        
        // Update fog of war and discovered areas
        updateFogOfWar(state.map, state.player.position, state.exploration.visibilityRadius);
      }
    }
  };
  
  // Add to app ticker
  app.ticker.add(animatePlayer);
  (playerCharacter as any).animationTicker = animatePlayer;
  
  console.log("Player character added at position:", playerCharacter.position);
  return playerCharacter;
}

// Update the fog of war when player moves
function updateFogOfWar(map: any, playerPosition: { x: number, y: number }, radius: number) {
  if (!map) return;
  
  const fowLayer = worldContainer.getChildByName("fow-layer") as PIXI.Container;
  if (!fowLayer) return;
  
  const centerX = Math.round(playerPosition.x);
  const centerY = Math.round(playerPosition.y);
  let tilesDiscovered = 0;
  
  // Process tiles in visibility radius
  for (let y = Math.max(0, centerY - radius); y <= Math.min(map.height - 1, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x <= Math.min(map.width - 1, centerX + radius); x++) {
      // Calculate distance to player
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      // If within visibility radius
      if (distance <= radius) {
        // Skip if tile doesn't exist
        if (!map.tiles[y] || !map.tiles[y][x]) continue;
        
        // If this tile was previously undiscovered
        if (map.tiles[y][x].discovered === false) {
          // Mark as discovered
          map.tiles[y][x].discovered = true;
          tilesDiscovered++;
          
          // Remove fog of war sprite
          const fowSprite = fowLayer.getChildByName(`fow_${x}_${y}`);
          if (fowSprite) {
            fowLayer.removeChild(fowSprite);
          }
          
          // Check for points of interest at this position
          if (map.pointsOfInterest) {
            for (const poi of map.pointsOfInterest) {
              if (poi.x === x && poi.y === y && !poi.discovered) {
                discoverPointOfInterest(poi);
              }
            }
          }
        }
      }
    }
  }
  
  // Track discovered chunk
  if (tilesDiscovered > 0) {
    const chunkX = Math.floor(centerX / CHUNK_SIZE);
    const chunkY = Math.floor(centerY / CHUNK_SIZE);
    const chunkId = `${chunkX},${chunkY}`;
    
    // Add to discovered chunks in map
    if (map.discoveredChunks && !map.discoveredChunks.has(chunkId)) {
      map.discoveredChunks.add(chunkId);
    }
    
    // Update exploration stats
    gameState.update(state => {
      state.exploration.discoveredTiles += tilesDiscovered;
      return state;
    });
    
    // Update minimap if new tiles were discovered
    updateMinimap();
  }
}

// Function to call when a point of interest is discovered
function discoverPointOfInterest(poi: any) {
  console.log(`Discovered point of interest: ${poi.name}`);
  
  // Mark as discovered
  poi.discovered = true;
  
  // Add to player's discovered POIs list
  gameState.update(state => {
    // Add to discovered POIs
    state.exploration.discoveredPOIs.push(poi);
    
    // Show notification
    // In a full implementation, you would have a UI notification system
    
    // Grant discovery bonus (resources, skills, etc)
    if (poi.discoveryBonus === 'resources') {
      // Add some random resources to inventory
      const resourceTypes = ['iron', 'copper', 'methane', 'oxygen', 'water', 'silicon'];
      const randomResource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const amount = 10 + Math.floor(Math.random() * 20);
      
      state.resources[randomResource] = (state.resources[randomResource] || 0) + amount;
    } else if (poi.discoveryBonus === 'research') {
      // Add research points
      state.research.points += 50;
    } else if (poi.discoveryBonus === 'skills') {
      // Improve a random skill
      const skillKeys = Object.keys(state.player.skills);
      const randomSkill = skillKeys[Math.floor(Math.random() * skillKeys.length)];
      state.player.skills[randomSkill] += 1;
    }
    
    return state;
  });
}

// Update player position on minimap
function updateMinimapMarker() {
  if (!uiLayer) return;
  
  const minimap = uiLayer.getChildByName("minimap");
  if (!minimap) return;
  
  const minimapContent = minimap.getChildByName("minimap-content") as PIXI.Container;
  if (!minimapContent) return;
  
  const playerMarker = minimapContent.getChildByName("player-marker");
  if (!playerMarker || !playerCharacter) return;
  
  // Calculate minimap scale
  const app = get(pixiApp);
  if (!app) return;
  
  const minimapSize = 180;
  const scaleX = minimapSize / (mapWidth * tileSize);
  const scaleY = minimapSize / (mapHeight * tileSize);
  const scale = Math.min(scaleX, scaleY);
  
  // Update marker position
  playerMarker.position.set(
    playerCharacter.position.x,
    playerCharacter.position.y
  );
}

// Update minimap when new areas are discovered
function updateMinimap() {
  // Re-create minimap
  const state = get(gameState);
  if (state.map) {
    createMinimap(state.map);
  }
}

// Update camera to follow player
function updateCameraPosition() {
  const app = get(pixiApp);
  if (!app || !worldContainer || !playerCharacter) return;
  
  // Smoothly center the view on the player
  worldContainer.position.x = app.screen.width / 2 - playerCharacter.position.x;
  worldContainer.position.y = app.screen.height / 2 - playerCharacter.position.y;
  
  // Update camera position in game state
  gameState.update(state => {
    if (state.camera) {
      state.camera.x = playerCharacter.position.x;
      state.camera.y = playerCharacter.position.y;
    }
    return state;
  });
}