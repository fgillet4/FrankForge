// frontend/src/lib/mapRenderer.ts
import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';
import * as Types from './types';
const { 
  MapTile, 
  PlanetMap, 
  TerrainType, 
  ResourceType, 
  TilesetAsset 
} = Types;


export const TILE_SIZE = 32; // 32x32 pixel tiles

/// Tile rendering configuration
interface TerrainRenderConfig {
    tilesetIndex: number;  // Index in the tileset
    variants?: number[];   // Optional variant tiles
    animated?: boolean;    // Whether the tile is animated
    frames?: number;       // Number of animation frames
    animationSpeed?: number; // Animation speed in ms per frame
  }
  
  // Resource rendering configuration
  interface ResourceRenderConfig {
    tilesetIndex: number;
    density: {
      low: number;
      medium: number;
      high: number;
    };
    animated?: boolean;
    frames?: number;
    animationSpeed?: number;
  }
  
  // Mapping of terrain types to their tileset indices
  const terrainRenderConfig: Record<TerrainType, TerrainRenderConfig> = {
    [TerrainType.DEEP_WATER]: { 
      tilesetIndex: 0, 
      animated: true, 
      frames: 4, 
      animationSpeed: 800 
    },
    [TerrainType.SHALLOW_WATER]: { 
      tilesetIndex: 4, 
      animated: true, 
      frames: 4, 
      animationSpeed: 600 
    },
    [TerrainType.SAND]: { 
      tilesetIndex: 8, 
      variants: [8, 9, 10, 11]
    },
    [TerrainType.GRASS]: { 
      tilesetIndex: 12, 
      variants: [12, 13, 14, 15]
    },
    [TerrainType.FOREST]: { 
      tilesetIndex: 16 
    },
    [TerrainType.HILLS]: { 
      tilesetIndex: 20, 
      variants: [20, 21]
    },
    [TerrainType.MOUNTAINS]: { 
      tilesetIndex: 24, 
      variants: [24, 25, 26]
    },
    [TerrainType.SNOW]: { 
      tilesetIndex: 28, 
      variants: [28, 29, 30, 31]
    },
    [TerrainType.VOLCANIC]: { 
      tilesetIndex: 32 
    },
    [TerrainType.LAVA]: { 
      tilesetIndex: 36, 
      animated: true, 
      frames: 4, 
      animationSpeed: 500 
    },
    [TerrainType.CAVE]: { 
      tilesetIndex: 40 
    },
    [TerrainType.ALIEN_GRASS]: { 
      tilesetIndex: 44, 
      variants: [44, 45, 46, 47]
    },
    [TerrainType.ALIEN_FOREST]: { 
      tilesetIndex: 48, 
      variants: [48, 49]
    },
    [TerrainType.ALIEN_CRYSTAL]: { 
      tilesetIndex: 52, 
      animated: true, 
      frames: 4, 
      animationSpeed: 1000 
    },
    [TerrainType.METHANE_LAKE]: { 
      tilesetIndex: 56, 
      animated: true, 
      frames: 4, 
      animationSpeed: 700 
    },
    [TerrainType.ICE]: { 
      tilesetIndex: 60, 
      variants: [60, 61, 62, 63]
    }
  };

// Mapping of resource types to their tileset indices
const resourceRenderConfig: Record<ResourceType, ResourceRenderConfig> = {
  [ResourceType.NONE]: { 
    tilesetIndex: -1, 
    density: { low: -1, medium: -1, high: -1 } 
  },
  [ResourceType.METHANE]: { 
    tilesetIndex: 64, 
    density: { low: 64, medium: 65, high: 66 },
    animated: true,
    frames: 3,
    animationSpeed: 600
  },
  [ResourceType.OXYGEN]: { 
    tilesetIndex: 70, 
    density: { low: 70, medium: 71, high: 72 } 
  },
  [ResourceType.WATER]: { 
    tilesetIndex: 76, 
    density: { low: 76, medium: 77, high: 78 } 
  },
  [ResourceType.IRON]: { 
    tilesetIndex: 82, 
    density: { low: 82, medium: 83, high: 84 } 
  },
  [ResourceType.COPPER]: { 
    tilesetIndex: 88, 
    density: { low: 88, medium: 89, high: 90 } 
  },
  [ResourceType.SILICON]: { 
    tilesetIndex: 94, 
    density: { low: 94, medium: 95, high: 96 } 
  },
  [ResourceType.SULFUR]: { 
    tilesetIndex: 100, 
    density: { low: 100, medium: 101, high: 102 } 
  },
  [ResourceType.URANIUM]: { 
    tilesetIndex: 106, 
    density: { low: 106, medium: 107, high: 108 } 
  },
  [ResourceType.RARE_METALS]: { 
    tilesetIndex: 112, 
    density: { low: 112, medium: 113, high: 114 } 
  },
  [ResourceType.XENOCRYSTALS]: { 
    tilesetIndex: 118, 
    density: { low: 118, medium: 119, high: 120 },
    animated: true,
    frames: 3,
    animationSpeed: 800
  }
};

// Animation state tracking
interface AnimationState {
  currentFrame: number;
  lastFrameTime: number;
}

// Map of current animations
const animations = new Map<string, AnimationState>();

// Get the tile index for a specific terrain type, considering variants and animation
export function getTerrainTileIndex(
  terrain: TerrainType, 
  x: number, 
  y: number, 
  time: number = Date.now()
): number {
  const config = terrainRenderConfig[terrain];
  
  // Handle animation
  if (config.animated && config.frames > 1) {
    const key = `terrain_${terrain}_${x}_${y}`;
    
    // Initialize animation state if needed
    if (!animations.has(key)) {
      animations.set(key, {
        currentFrame: Math.floor(Math.random() * config.frames),
        lastFrameTime: time
      });
    }
    
    // Update animation frame
    const anim = animations.get(key);
    if (time - anim.lastFrameTime > config.animationSpeed) {
      anim.currentFrame = (anim.currentFrame + 1) % config.frames;
      anim.lastFrameTime = time;
    }
    
    return config.tilesetIndex + anim.currentFrame;
  }
  
  // Handle variants
  if (config.variants && config.variants.length > 0) {
    // Use position to deterministically select variant
    const variantIndex = Math.abs(Math.sin(x * 0.3 + y * 0.7) * config.variants.length) | 0;
    return config.variants[variantIndex];
  }
  
  return config.tilesetIndex;
}

// Get the tile index for a resource, considering density
export function getResourceTileIndex(
  resource: ResourceType, 
  density: number, 
  x: number, 
  y: number, 
  time: number = Date.now()
): number {
  // If no resource, return -1 (no tile)
  if (resource === ResourceType.NONE) {
    return -1;
  }
  
  const config = resourceRenderConfig[resource];
  
  // Determine density level
  let densityTile: number;
  if (density < 0.3) {
    densityTile = config.density.low;
  } else if (density < 0.7) {
    densityTile = config.density.medium;
  } else {
    densityTile = config.density.high;
  }
  
  // Handle animation
  if (config.animated && config.frames > 1) {
    const key = `resource_${resource}_${x}_${y}`;
    
    // Initialize animation state if needed
    if (!animations.has(key)) {
      animations.set(key, {
        currentFrame: Math.floor(Math.random() * config.frames),
        lastFrameTime: time
      });
    }
    
    // Update animation frame
    const anim = animations.get(key);
    if (time - anim.lastFrameTime > config.animationSpeed) {
      anim.currentFrame = (anim.currentFrame + 1) % config.frames;
      anim.lastFrameTime = time;
    }
    
    return densityTile + anim.currentFrame;
  }
  
  return densityTile;
}

// Render a map tile to a canvas context
export function renderTile(
  ctx: CanvasRenderingContext2D,
  tileset: HTMLImageElement,
  tilesetInfo: TilesetAsset,
  tile: MapTile,
  x: number,
  y: number,
  screenX: number,
  screenY: number,
  time: number = Date.now(),
  debug: boolean = false
): void {
  const { tileWidth, tileHeight, columns } = tilesetInfo;
  
  // Get terrain tile index
  const terrainIndex = getTerrainTileIndex(tile.terrain, x, y, time);
  
  // Calculate source position in tileset
  const srcX = (terrainIndex % columns) * tileWidth;
  const srcY = Math.floor(terrainIndex / columns) * tileHeight;
  
  // Draw terrain tile
  ctx.drawImage(
    tileset,
    srcX, srcY, tileWidth, tileHeight,
    screenX, screenY, TILE_SIZE, TILE_SIZE
  );
  
  // If there's a resource, draw it on top
  if (tile.resource !== ResourceType.NONE && tile.resourceDensity > 0) {
    const resourceIndex = getResourceTileIndex(tile.resource, tile.resourceDensity, x, y, time);
    
    if (resourceIndex >= 0) {
      const resourceSrcX = (resourceIndex % columns) * tileWidth;
      const resourceSrcY = Math.floor(resourceIndex / columns) * tileHeight;
      
      ctx.drawImage(
        tileset,
        resourceSrcX, resourceSrcY, tileWidth, tileHeight,
        screenX, screenY, TILE_SIZE, TILE_SIZE
      );
    }
  }
  
  // Draw any decorations
  if (tile.decorations && tile.decorations.length > 0) {
    for (const decorationIndex of tile.decorations) {
      const decorationSrcX = (decorationIndex % columns) * tileWidth;
      const decorationSrcY = Math.floor(decorationIndex / columns) * tileHeight;
      
      ctx.drawImage(
        tileset,
        decorationSrcX, decorationSrcY, tileWidth, tileHeight,
        screenX, screenY, TILE_SIZE, TILE_SIZE
      );
    }
  }
  
  // Debug overlay
  if (debug) {
    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    
    // Coordinates
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(screenX + 2, screenY + 2, 28, 12);
    ctx.fillStyle = 'white';
    ctx.font = '8px Arial';
    ctx.fillText(`${x},${y}`, screenX + 4, screenY + 10);
    
    // Resource info if present
    if (tile.resource !== ResourceType.NONE) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(screenX + 2, screenY + TILE_SIZE - 14, 28, 12);
      ctx.fillStyle = 'yellow';
      ctx.fillText(`R:${tile.resourceDensity.toFixed(1)}`, screenX + 4, screenY + TILE_SIZE - 4);
    }
  }
}

// Render map to canvas
export function renderMap(
  ctx: CanvasRenderingContext2D,
  map: PlanetMap,
  tileset: HTMLImageElement,
  tilesetInfo: TilesetAsset,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number,
  debug: boolean = false
): void {
  const time = Date.now();
  
  // Calculate visible range
  const startX = Math.max(0, Math.floor(cameraX / TILE_SIZE));
  const startY = Math.max(0, Math.floor(cameraY / TILE_SIZE));
  const endX = Math.min(map.width, startX + Math.ceil(viewportWidth / TILE_SIZE) + 1);
  const endY = Math.min(map.height, startY + Math.ceil(viewportHeight / TILE_SIZE) + 1);
  
  // Clear canvas (or draw background)
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  
  // Draw visible tiles
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = map.tiles[y][x];
      const screenX = Math.floor(x * TILE_SIZE - cameraX);
      const screenY = Math.floor(y * TILE_SIZE - cameraY);
      
      renderTile(
        ctx, 
        tileset, 
        tilesetInfo, 
        tile, 
        x, y, 
        screenX, screenY, 
        time, 
        debug
      );
    }
  }
  
  // Optional: Render map border
  if (debug) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      -cameraX, 
      -cameraY, 
      map.width * TILE_SIZE, 
      map.height * TILE_SIZE
    );
  }
}

// Calculate tile transitions for smooth terrain blending
export function calculateTileTransitions(map: PlanetMap): void {
  // This would implement auto-tiling logic to handle transitions
  // between different terrain types (e.g., grass to sand)
  
  // Placeholder implementation:
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      // Check neighboring tiles and calculate appropriate transition tiles
      // This would be expanded in a full implementation
    }
  }
}

// Optimize animations - stop animations for offscreen tiles
export function optimizeAnimations(
  map: PlanetMap,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  // Calculate visible range with buffer
  const buffer = 3; // Buffer of tiles
  const startX = Math.max(0, Math.floor(cameraX / TILE_SIZE) - buffer);
  const startY = Math.max(0, Math.floor(cameraY / TILE_SIZE) - buffer);
  const endX = Math.min(map.width, startX + Math.ceil(viewportWidth / TILE_SIZE) + buffer + 1);
  const endY = Math.min(map.height, startY + Math.ceil(viewportHeight / TILE_SIZE) + buffer + 1);
  
  // Check all animations
  for (const [key, _] of animations) {
    // Parse coordinates from key
    const parts = key.split('_');
    const type = parts[0]; // 'terrain' or 'resource'
    const x = parseInt(parts[2]);
    const y = parseInt(parts[3]);
    
    // If outside visible range, remove the animation
    if (x < startX || x >= endX || y < startY || y >= endY) {
      animations.delete(key);
    }
  }
}