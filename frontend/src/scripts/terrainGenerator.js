// frontend/src/scripts/terrainGenerator.js

/**
 * Terrain Asset Generator
 * 
 * This script generates placeholder terrain tiles and other game assets
 * for use in development until final assets are created.
 * 
 * Run this script with Node.js to generate a set of basic assets:
 * node src/scripts/terrainGenerator.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

// Get current directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TILE_SIZE = 32;
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'public', 'assets', 'sprites');

// Ensure output directories exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Create terrain directory structure
ensureDirectoryExists(path.join(OUTPUT_DIR, 'terrain'));
ensureDirectoryExists(path.join(OUTPUT_DIR, 'buildings'));
ensureDirectoryExists(path.join(OUTPUT_DIR, 'resources'));
ensureDirectoryExists(path.join(OUTPUT_DIR, 'decorations'));

// Terrain types and their colors
const terrainTypes = {
  DEEP_WATER: { color: '#0077BE', variants: 4 },
  SHALLOW_WATER: { color: '#39A0ED', variants: 4 },
  SAND: { color: '#E8D68A', variants: 4 },
  GRASS: { color: '#7EC850', variants: 4 },
  FOREST: { color: '#228B22', variants: 2 },
  HILLS: { color: '#8B7355', variants: 3 },
  MOUNTAINS: { color: '#6D6552', variants: 3 },
  SNOW: { color: '#EEEEFF', variants: 4 },
  VOLCANIC: { color: '#333333', variants: 2 },
  LAVA: { color: '#FF4500', variants: 4 },
  CAVE: { color: '#353535', variants: 1 },
  ALIEN_GRASS: { color: '#8A5FAF', variants: 4 },
  ALIEN_FOREST: { color: '#6A0DAD', variants: 2 },
  ALIEN_CRYSTAL: { color: '#00FFFF', variants: 4 },
  METHANE_LAKE: { color: '#30D5C8', variants: 4 },
  ICE: { color: '#BBDDFF', variants: 4 }
};

// Resource types and their colors
const resourceTypes = {
  METHANE: { color: '#26734D', density: 3 },
  OXYGEN: { color: '#90EE90', density: 3 },
  WATER: { color: '#4169E1', density: 3 },
  IRON: { color: '#A19D94', density: 3 },
  COPPER: { color: '#B87333', density: 3 },
  SILICON: { color: '#DAA520', density: 3 },
  SULFUR: { color: '#FFFF00', density: 3 },
  URANIUM: { color: '#00FF33', density: 3 },
  RARE_METALS: { color: '#D4AF37', density: 3 },
  XENOCRYSTALS: { color: '#E6E6FA', density: 3 }
};

// Building types and their colors
const buildingTypes = {
  EXTRACTOR: { color: '#3498db', variants: 1 },
  REACTOR: { color: '#e74c3c', variants: 1 },
  POWER_PLANT: { color: '#2ecc71', variants: 1 },
  STORAGE: { color: '#f1c40f', variants: 1 },
  PIPE: { color: '#95a5a6', variants: 1 }
};

// Decoration elements
const decorationTypes = {
  ROCK: { color: '#777777', variants: 3 },
  BUSH: { color: '#446644', variants: 3 },
  CRYSTAL: { color: '#AA66FF', variants: 3 },
  CRATER: { color: '#555555', variants: 2 },
  RUINS: { color: '#AAAAAA', variants: 5 }
};

// Generate noise texture (for randomness in tiles)
function generateNoiseTexture(canvas, context, intensity = 0.1) {
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() * 2 - 1) * intensity * 255;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // r
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // g
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // b
  }
  
  context.putImageData(imageData, 0, 0);
}

// Generate a single terrain tile
function generateTerrainTile(type, variant, animated = false) {
  const terrainInfo = terrainTypes[type];
  if (!terrainInfo) {
    console.error(`Unknown terrain type: ${type}`);
    return;
  }
  
  const canvas = createCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');
  
  // Set base color for terrain
  ctx.fillStyle = terrainInfo.color;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Add some variation based on variant number
  const hueShift = variant * 5;
  const darken = (variant % 2) * 0.05;
  
  const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Adjust color slightly based on variant
    data[i] = Math.max(0, Math.min(255, data[i] - darken * 255));     // r
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + hueShift)); // g
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] - hueShift)); // b
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Add noise for texture
  generateNoiseTexture(canvas, ctx, 0.1);
  
  // Add features specific to terrain type
  switch (type) {
    case 'DEEP_WATER':
    case 'SHALLOW_WATER':
    case 'METHANE_LAKE':
      // Add wave pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 3; i++) {
        const y = 10 + i * 8 + (animated ? variant * 2 : 0);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(TILE_SIZE / 4, y + 3, TILE_SIZE * 3 / 4, y - 3, TILE_SIZE, y);
        ctx.stroke();
      }
      break;
      
    case 'GRASS':
    case 'ALIEN_GRASS':
      // Add grass tufts
      ctx.fillStyle = type === 'GRASS' ? '#5C9B3A' : '#5A3D8F';
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * TILE_SIZE;
        const y = Math.random() * TILE_SIZE;
        const size = 2 + Math.random() * 2;
        ctx.fillRect(x, y, size, size);
      }
      break;
      
    case 'FOREST':
    case 'ALIEN_FOREST':
      // Add tree trunks
      ctx.fillStyle = type === 'FOREST' ? '#664D36' : '#432569';
      ctx.fillRect(TILE_SIZE / 2 - 2, TILE_SIZE / 2 + 2, 4, 8);
      
      // Add tree canopy
      ctx.fillStyle = type === 'FOREST' ? '#1E7D1E' : '#5A3D8F';
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2 - 4, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'MOUNTAINS':
      // Add mountain peaks
      ctx.fillStyle = '#5A5A5A';
      ctx.beginPath();
      ctx.moveTo(TILE_SIZE / 4, TILE_SIZE);
      ctx.lineTo(TILE_SIZE / 2, TILE_SIZE / 4);
      ctx.lineTo(TILE_SIZE * 3 / 4, TILE_SIZE);
      ctx.fill();
      
      // Add snow caps
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(TILE_SIZE / 2 - 4, TILE_SIZE / 4 + 4);
      ctx.lineTo(TILE_SIZE / 2, TILE_SIZE / 4);
      ctx.lineTo(TILE_SIZE / 2 + 4, TILE_SIZE / 4 + 4);
      ctx.fill();
      break;
      
    case 'LAVA':
      // Add lava bubbles
      ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
      for (let i = 0; i < 3; i++) {
        const x = 5 + Math.random() * (TILE_SIZE - 10);
        const y = 5 + Math.random() * (TILE_SIZE - 10);
        const size = 2 + Math.random() * 3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 'ALIEN_CRYSTAL':
      // Add crystal formations
      ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(TILE_SIZE / 2, 5);
      ctx.lineTo(TILE_SIZE - 5, TILE_SIZE / 2);
      ctx.lineTo(TILE_SIZE / 2, TILE_SIZE - 5);
      ctx.lineTo(5, TILE_SIZE / 2);
      ctx.closePath();
      ctx.fill();
      
      // Add glow effect if animated
      if (animated) {
        ctx.globalAlpha = 0.2 + (variant * 0.1);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      break;
  }
  
  // Add edge noise/detail
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  return canvas;
}

// Generate resource overlay
function generateResourceTile(type, density) {
  const resourceInfo = resourceTypes[type];
  if (!resourceInfo) {
    console.error(`Unknown resource type: ${type}`);
    return;
  }
  
  const canvas = createCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');
  
  // Make the background transparent
  ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Draw resource indicators based on density
  const count = 3 + density * 2; // Number of resource indicators
  const size = 3 + density * 2;  // Size of each indicator
  
  for (let i = 0; i < count; i++) {
    // Position resource indicators more centrally for higher density
    let margin = 10 - density * 2;
    let x = margin + Math.random() * (TILE_SIZE - margin * 2);
    let y = margin + Math.random() * (TILE_SIZE - margin * 2);
    
    ctx.fillStyle = resourceInfo.color;
    
    // Different shapes for different resources
    switch (type) {
      case 'METHANE':
      case 'OXYGEN':
        // Bubble-like
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x - size / 3, y - size / 3, size / 3, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'IRON':
      case 'COPPER':
      case 'RARE_METALS':
        // Solid chunks
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        break;
        
      case 'XENOCRYSTALS':
        // Crystal shape
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
        break;
        
      default:
        // Default circular shape
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
  }
  
  return canvas;
}

// Generate building tile
function generateBuildingTile(type, variant) {
  const buildingInfo = buildingTypes[type];
  if (!buildingInfo) {
    console.error(`Unknown building type: ${type}`);
    return;
  }
  
  const canvas = createCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');
  
  // Clear background
  ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Draw building based on type
  switch (type) {
    case 'EXTRACTOR':
      // Base
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner mechanism
      ctx.fillStyle = '#2980b9';
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 4, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'REACTOR':
      // Base
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      
      // Inner details (warning stripes)
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(TILE_SIZE / 4, TILE_SIZE / 4, TILE_SIZE / 2, TILE_SIZE / 2);
      break;
      
    case 'POWER_PLANT':
      // Triangle shape
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.moveTo(TILE_SIZE / 2, 2);
      ctx.lineTo(TILE_SIZE - 2, TILE_SIZE - 2);
      ctx.lineTo(2, TILE_SIZE - 2);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'STORAGE':
      // Cylindrical tank
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(4, 8, TILE_SIZE - 8, TILE_SIZE - 12);
      
      // Tank top
      ctx.beginPath();
      ctx.ellipse(TILE_SIZE / 2, 8, TILE_SIZE / 2 - 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Tank bottom
      ctx.beginPath();
      ctx.ellipse(TILE_SIZE / 2, TILE_SIZE - 4, TILE_SIZE / 2 - 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'PIPE':
      // Pipe body
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(TILE_SIZE / 3, 0, TILE_SIZE / 3, TILE_SIZE);
      
      // Joint
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 4, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  // Add detail based on variant
  if (variant > 0) {
    // For animated buildings or different states
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    if (variant === 1) {
      // Working state
      ctx.beginPath();
      ctx.arc(TILE_SIZE * 3 / 4, TILE_SIZE / 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (variant === 2) {
      // Alert/Warning state
      ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(TILE_SIZE * 3 / 4, TILE_SIZE / 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  return canvas;
}

// Generate a decoration element
function generateDecorationTile(type, variant) {
  const decorationInfo = decorationTypes[type];
  if (!decorationInfo) {
    console.error(`Unknown decoration type: ${type}`);
    return;
  }
  
  const canvas = createCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');
  
  // Make the background transparent
  ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Draw decoration based on type
  switch (type) {
    case 'ROCK':
      // Draw random rock shape
      ctx.fillStyle = decorationInfo.color;
      ctx.beginPath();
      
      // Create random rock polygon
      const centerX = TILE_SIZE / 2;
      const centerY = TILE_SIZE / 2 + 4;
      const radius = 6 + variant * 2;
      const points = 5 + variant;
      
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius * (0.8 + Math.random() * 0.4);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.fill();
      
      // Add shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 8, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'BUSH':
      // Draw bush
      ctx.fillStyle = decorationInfo.color;
      
      // Bush foliage (multiple circles)
      for (let i = 0; i < 3 + variant; i++) {
        const x = TILE_SIZE / 2 + (Math.random() - 0.5) * 8;
        const y = TILE_SIZE / 2 + (Math.random() - 0.5) * 6;
        const size = 4 + Math.random() * 3;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 'CRYSTAL':
      // Draw crystal formation
      ctx.fillStyle = decorationInfo.color;
      
      // Multiple crystal shards
      for (let i = 0; i < 2 + variant; i++) {
        const x = TILE_SIZE / 2 + (Math.random() - 0.5) * 12;
        const y = TILE_SIZE / 2 + (Math.random() - 0.5) * 8;
        const height = 6 + Math.random() * 8;
        const width = 2 + Math.random() * 3;
        
        ctx.beginPath();
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x + width / 2, y - height / 2);
        ctx.lineTo(x - width / 2, y - height / 2);
        ctx.closePath();
        ctx.fill();
      }
      
      // Add glow effect
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      break;
      
    case 'CRATER':
      // Draw crater
      ctx.fillStyle = decorationInfo.color;
      
      // Crater pit
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 8 + variant * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Crater rim
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 10 + variant * 2, 0, Math.PI * 2);
      ctx.stroke();
      break;
      
    case 'RUINS':
      // Draw alien ruins
      ctx.fillStyle = decorationInfo.color;
      
      // Different ruin types based on variant
      if (variant === 0) {
        // Broken column
        ctx.fillRect(TILE_SIZE / 2 - 3, TILE_SIZE / 2 - 8, 6, 16);
        
        // Broken top
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE / 2 - 5, TILE_SIZE / 2 - 8);
        ctx.lineTo(TILE_SIZE / 2 + 5, TILE_SIZE / 2 - 8);
        ctx.lineTo(TILE_SIZE / 2 + 3, TILE_SIZE / 2 - 12);
        ctx.lineTo(TILE_SIZE / 2 - 3, TILE_SIZE / 2 - 12);
        ctx.closePath();
        ctx.fill();
      } else if (variant === 1) {
        // Wall segment
        ctx.fillRect(TILE_SIZE / 3, TILE_SIZE / 2, TILE_SIZE / 3, TILE_SIZE / 3);
        
        // Broken edges
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE / 3, TILE_SIZE / 2);
        ctx.lineTo(TILE_SIZE * 2 / 3, TILE_SIZE / 2);
        ctx.lineTo(TILE_SIZE * 2 / 3 - 2, TILE_SIZE / 2 - 4);
        ctx.lineTo(TILE_SIZE / 3 + 2, TILE_SIZE / 2 - 4);
        ctx.closePath();
        ctx.fill();
      } else {
        // Strange alien artifact
        ctx.beginPath();
        ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Alien glyphs
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2;
          const x1 = TILE_SIZE / 2 + Math.cos(angle) * 10;
          const y1 = TILE_SIZE / 2 + Math.sin(angle) * 10;
          const x2 = TILE_SIZE / 2 + Math.cos(angle + Math.PI) * 10;
          const y2 = TILE_SIZE / 2 + Math.sin(angle + Math.PI) * 10;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
      break;
  }
  
  return canvas;
}

// Generate all tiles and save them
async function generateAllTiles() {
  console.log('Generating terrain tiles...');
  
  // Create tileset canvas
  const TILESET_COLUMNS = 16;
  const TOTAL_TILES = Object.keys(terrainTypes).length * 4 + // terrain (4 variants each)
                      Object.keys(resourceTypes).length * 3 + // resources (3 densities each)
                      Object.keys(buildingTypes).length * 2 + // buildings (2 states each)
                      Object.keys(decorationTypes).length * 3; // decorations (3 variants each)
                      
  const TILESET_ROWS = Math.ceil(TOTAL_TILES / TILESET_COLUMNS);
  
  const tilesetCanvas = createCanvas(TILESET_COLUMNS * TILE_SIZE, TILESET_ROWS * TILE_SIZE);
  const tilesetCtx = tilesetCanvas.getContext('2d');
  
  // Fill with transparent background
  tilesetCtx.clearRect(0, 0, tilesetCanvas.width, tilesetCanvas.height);
  
  let tileIndex = 0;
  
  // Generate terrain tiles
  for (const [type, info] of Object.entries(terrainTypes)) {
    for (let variant = 0; variant < info.variants; variant++) {
      // Determine position in tileset
      const row = Math.floor(tileIndex / TILESET_COLUMNS);
      const col = tileIndex % TILESET_COLUMNS;
      
      // Generate tile
      const isAnimated = ['DEEP_WATER', 'SHALLOW_WATER', 'LAVA', 'METHANE_LAKE', 'ALIEN_CRYSTAL'].includes(type);
      const tileCanvas = generateTerrainTile(type, variant, isAnimated);
      
      // Draw to tileset
      tilesetCtx.drawImage(tileCanvas, col * TILE_SIZE, row * TILE_SIZE);
      
      // Save individual tile for reference
      const buffer = tileCanvas.toBuffer('image/png');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'terrain', `${type.toLowerCase()}_${variant}.png`), buffer);
      
      tileIndex++;
    }
  }
  
  // Generate resource tiles
  for (const [type, info] of Object.entries(resourceTypes)) {
    for (let density = 0; density < info.density; density++) {
      // Determine position in tileset
      const row = Math.floor(tileIndex / TILESET_COLUMNS);
      const col = tileIndex % TILESET_COLUMNS;
      
      // Generate tile
      const tileCanvas = generateResourceTile(type, density);
      
      // Draw to tileset
      tilesetCtx.drawImage(tileCanvas, col * TILE_SIZE, row * TILE_SIZE);
      
      // Save individual tile for reference
      const buffer = tileCanvas.toBuffer('image/png');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'resources', `${type.toLowerCase()}_${density}.png`), buffer);
      
      tileIndex++;
    }
  }
  
  // Generate building tiles
  for (const [type, info] of Object.entries(buildingTypes)) {
    for (let variant = 0; variant < info.variants + 1; variant++) {
      // Determine position in tileset
      const row = Math.floor(tileIndex / TILESET_COLUMNS);
      const col = tileIndex % TILESET_COLUMNS;
      
      // Generate tile
      const tileCanvas = generateBuildingTile(type, variant);
      
      // Draw to tileset
      tilesetCtx.drawImage(tileCanvas, col * TILE_SIZE, row * TILE_SIZE);
      
      // Save individual tile for reference
      const buffer = tileCanvas.toBuffer('image/png');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'buildings', `${type.toLowerCase()}_${variant}.png`), buffer);
      
      tileIndex++;
    }
  }
  
  // Generate decoration tiles
  for (const [type, info] of Object.entries(decorationTypes)) {
    for (let variant = 0; variant < info.variants; variant++) {
      // Determine position in tileset
      const row = Math.floor(tileIndex / TILESET_COLUMNS);
      const col = tileIndex % TILESET_COLUMNS;
      
      // Generate tile
      const tileCanvas = generateDecorationTile(type, variant);
      
      // Draw to tileset
      tilesetCtx.drawImage(tileCanvas, col * TILE_SIZE, row * TILE_SIZE);
      
      // Save individual tile for reference
      // Save individual tile for reference
      const buffer = tileCanvas.toBuffer('image/png');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'decorations', `${type.toLowerCase()}_${variant}.png`), buffer);
      
      tileIndex++;
    }
  }
  
  // Save complete tileset
  const tilesetBuffer = tilesetCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'terrain', 'terrain_tileset.png'), tilesetBuffer);
  
  console.log(`Generated ${tileIndex} tiles successfully!`);
  console.log(`Tileset saved to: ${path.join(OUTPUT_DIR, 'terrain', 'terrain_tileset.png')}`);
}

// Generate a terrain tileset for specific planet types
function generatePlanetTerrainSet(planetType) {
  console.log(`Generating tileset for planet type: ${planetType}...`);
  
  // Adjust colors based on planet type
  const colorAdjustments = {
    'earth': {},  // Default colors
    'mars': {
      // Reddish tint for Mars
      GRASS: { color: '#AA6C39' },
      SAND: { color: '#D9A066' },
      DEEP_WATER: { color: '#79553D' },  // Dark dried river beds
      SHALLOW_WATER: { color: '#9C7F65' }, // Light dried river beds
      MOUNTAINS: { color: '#8D6E63' },
      HILLS: { color: '#A1887F' },
    },
    'alien': {
      // Exotic colors for alien world
      GRASS: { color: '#7D3C98' },  // Purple grass
      SAND: { color: '#D0F5A9' },   // Light green sand
      DEEP_WATER: { color: '#D35400' }, // Orange liquid
      SHALLOW_WATER: { color: '#E67E22' }, // Light orange liquid
      MOUNTAINS: { color: '#34495E' }, // Dark blue-gray mountains
      HILLS: { color: '#5D6D7E' },
      FOREST: { color: '#6C3483' }, // Purple forest
    },
    'ice': {
      // Blue-white palette for ice world
      GRASS: { color: '#D6EAF8' },
      SAND: { color: '#EBF5FB' },
      DEEP_WATER: { color: '#2874A6' },
      SHALLOW_WATER: { color: '#3498DB' },
      MOUNTAINS: { color: '#D6DBDF' },
      HILLS: { color: '#F0F3F4' },
      FOREST: { color: '#A9CCE3' },
    }
  };
  
  // Apply color adjustments
  const originalColors = {};
  const adjustments = colorAdjustments[planetType.toLowerCase()] || {};
  
  for (const [type, info] of Object.entries(terrainTypes)) {
    // Save original color
    originalColors[type] = { ...info };
    
    // Apply adjustment if available
    if (adjustments[type]) {
      terrainTypes[type] = { ...info, ...adjustments[type] };
    }
  }
  
  // Generate the tileset
  const tilesetPath = path.join(OUTPUT_DIR, 'terrain', `${planetType.toLowerCase()}_tileset.png`);
  
  // Create a reduced tileset with just the main terrain types
  const TILESET_COLUMNS = 8;
  const mainTerrainTypes = ['DEEP_WATER', 'SHALLOW_WATER', 'SAND', 'GRASS', 'FOREST', 'HILLS', 'MOUNTAINS', 'SNOW'];
  const TOTAL_TILES = mainTerrainTypes.length * 4; // 4 variants per type
  
  const TILESET_ROWS = Math.ceil(TOTAL_TILES / TILESET_COLUMNS);
  
  const tilesetCanvas = createCanvas(TILESET_COLUMNS * TILE_SIZE, TILESET_ROWS * TILE_SIZE);
  const tilesetCtx = tilesetCanvas.getContext('2d');
  
  // Fill with transparent background
  tilesetCtx.clearRect(0, 0, tilesetCanvas.width, tilesetCanvas.height);
  
  let tileIndex = 0;
  
  // Generate only the main terrain tiles
  for (const type of mainTerrainTypes) {
    const info = terrainTypes[type];
    for (let variant = 0; variant < 4; variant++) { // Always generate 4 variants for consistency
      // Determine position in tileset
      const row = Math.floor(tileIndex / TILESET_COLUMNS);
      const col = tileIndex % TILESET_COLUMNS;
      
      // Generate tile
      const isAnimated = ['DEEP_WATER', 'SHALLOW_WATER'].includes(type);
      const tileCanvas = generateTerrainTile(type, variant, isAnimated);
      
      // Draw to tileset
      tilesetCtx.drawImage(tileCanvas, col * TILE_SIZE, row * TILE_SIZE);
      
      tileIndex++;
    }
  }
  
  // Save planet-specific tileset
  const tilesetBuffer = tilesetCanvas.toBuffer('image/png');
  fs.writeFileSync(tilesetPath, tilesetBuffer);
  
  console.log(`Generated planet tileset with ${tileIndex} tiles.`);
  console.log(`Planet tileset saved to: ${tilesetPath}`);
  
  // Restore original colors
  for (const [type, info] of Object.entries(originalColors)) {
    terrainTypes[type] = info;
  }
}

// Main execution
async function main() {
  try {
    // Generate main tileset
    await generateAllTiles();
    
    // Generate planet-specific tilesets
    await generatePlanetTerrainSet('earth');
    await generatePlanetTerrainSet('mars');
    await generatePlanetTerrainSet('alien');
    await generatePlanetTerrainSet('ice');
    
    console.log("All assets generated successfully!");
  } catch (error) {
    console.error("Error generating assets:", error);
  }
}

// Run the script
main();