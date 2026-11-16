// frontend/src/lib/mapGenerator.ts
import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';
import { TerrainType, ResourceType, AtmosphereType, PlanetType, planetTemplates } from './types';
import type { MapTile, PlanetMap, SpecialFeature, BiomeDistribution, MapGeneratorParams } from './types';

/** Seeded per map in generatePlanetMap, so a seed always makes the same world. */
let random: () => number = seedrandom('0');

// Export the mapGenerator object for use in other files
export const mapGenerator = {
  generateMap: generatePlanetMap,
  generateMars
};

// Helper function to initialize noise generators
function initNoiseGenerators(seed: number) {
  // Create different noise generators for various map aspects using seedrandom
  const heightNoise = createNoise2D(seedrandom(seed.toString()));
  const moistureNoise = createNoise2D(seedrandom((seed + 1).toString()));
  const temperatureNoise = createNoise2D(seedrandom((seed + 2).toString()));
  const resourceNoise = createNoise2D(seedrandom((seed + 3).toString()));
  const biomeNoise = createNoise2D(seedrandom((seed + 4).toString()));

  return {
    heightNoise,
    moistureNoise,
    temperatureNoise,
    resourceNoise,
    biomeNoise
  };
}

// Determine terrain type based on height, moisture, temperature
function determineTerrainType(
  height: number,
  moisture: number,
  temperature: number,
  oceanLevel: number,
  mountainLevel: number,
  alienness: number,
  rng: () => number
): TerrainType {
  // Ocean
  if (height < oceanLevel) {
    if (height < oceanLevel - 0.2) {
      return TerrainType.DEEP_WATER;
    }

    // Check for methane lakes if the planet is very alien
    if (alienness > 0.7 && rng() < alienness - 0.7) {
      return TerrainType.METHANE_LAKE;
    }

    return TerrainType.SHALLOW_WATER;
  }

  // Very cold areas become ice
  if (temperature < 0.2) {
    return TerrainType.ICE;
  }

  // Mountains
  if (height > mountainLevel) {
    if (height > mountainLevel + 0.2) {
      return temperature < 0.3 ? TerrainType.SNOW : TerrainType.MOUNTAINS;
    }
    return TerrainType.HILLS;
  }

  // Alien features
  if (rng() < alienness * 0.3) {
    if (moisture > 0.6) {
      return TerrainType.ALIEN_FOREST;
    } else if (moisture > 0.3) {
      return TerrainType.ALIEN_GRASS;
    } else {
      return TerrainType.ALIEN_CRYSTAL;
    }
  }

  // Volcanic areas
  if (temperature > 0.8 && rng() < 0.3) {
    return height > 0.6 ? TerrainType.VOLCANIC : TerrainType.LAVA;
  }

  // Normal biomes
  if (moisture > 0.65) {
    return TerrainType.FOREST;
  } else if (moisture > 0.3) {
    return TerrainType.GRASS;
  } else {
    return TerrainType.SAND;
  }
}

// Determine resource type based on terrain and random factor
function determineResourceType(
  terrain: TerrainType,
  resourceNoise: number,
  resourceRichness: number
): { type: ResourceType, density: number } {
  let possibleResources: ResourceType[] = [];
  let density = 0;

  // Base chance of resource based on richness
  const hasResource = resourceNoise < resourceRichness * 0.5;

  if (!hasResource) {
    return { type: ResourceType.NONE, density: 0 };
  }

  // Different terrains have different resource probabilities
  switch (terrain) {
    case TerrainType.DEEP_WATER:
    case TerrainType.SHALLOW_WATER:
      possibleResources = [ResourceType.WATER, ResourceType.OXYGEN];
      density = resourceNoise * 0.5 + resourceRichness * 0.5;
      break;

    case TerrainType.METHANE_LAKE:
      return { type: ResourceType.METHANE, density: 0.7 + resourceNoise * 0.3 };

    case TerrainType.SAND:
      possibleResources = [ResourceType.SILICON, ResourceType.IRON];
      density = resourceNoise * 0.4 + resourceRichness * 0.3;
      break;

    case TerrainType.MOUNTAINS:
    case TerrainType.HILLS:
      possibleResources = [ResourceType.IRON, ResourceType.COPPER, ResourceType.RARE_METALS];
      density = resourceNoise * 0.6 + resourceRichness * 0.4;
      break;

    case TerrainType.VOLCANIC:
    case TerrainType.LAVA:
      possibleResources = [ResourceType.SULFUR, ResourceType.RARE_METALS];
      density = resourceNoise * 0.7 + resourceRichness * 0.3;
      break;

    case TerrainType.ALIEN_CRYSTAL:
      return { type: ResourceType.XENOCRYSTALS, density: 0.5 + resourceNoise * 0.5 };

    case TerrainType.GRASS:
    case TerrainType.FOREST:
    case TerrainType.ALIEN_GRASS:
    case TerrainType.ALIEN_FOREST:
      possibleResources = [ResourceType.OXYGEN, ResourceType.WATER];
      density = resourceNoise * 0.5 + resourceRichness * 0.2;
      break;

    case TerrainType.SNOW:
    case TerrainType.ICE:
      possibleResources = [ResourceType.WATER];
      density = resourceNoise * 0.6 + resourceRichness * 0.2;
      break;

    default:
      possibleResources = [ResourceType.NONE];
      density = 0;
  }

  // Rarely add uranium or other special resources
  if (resourceNoise > 0.95 && resourceRichness > 0.7) {
    possibleResources.push(ResourceType.URANIUM);
    density = Math.max(density, 0.8);
  }

  // Select a random resource from the possible ones
  const resourceIndex = Math.floor(random() * possibleResources.length);
  return {
    type: possibleResources[resourceIndex],
    density: Math.min(Math.max(density, 0), 1)
  };
}

// Add special features to the map
function addSpecialFeatures(map: PlanetMap, count: number): void {
  if (!map || !map.tiles || map.tiles.length === 0) {
    console.warn("Cannot add special features: Map is not properly initialized");
    return;
  }

  // Use string enum values directly
  const features = [
    'meteor_crater',
    'volcano',
    'canyon',
    'cave_system',
    'alien_ruins',
    'geothermal_area',
    'crystal_formation',
    'abandoned_base',
    'strange_signal',
    'ancient_technology'
  ];

  const selectedFeatures: SpecialFeature[] = [];

  // Randomly select features
  for (let i = 0; i < count; i++) {
    const feature = features[Math.floor(random() * features.length)] as SpecialFeature;

    // Avoid duplicates unless we've used all features
    if (!selectedFeatures.includes(feature) || selectedFeatures.length >= features.length) {
      selectedFeatures.push(feature);
    }
  }

  map.specialFeatures = selectedFeatures;

  // For each feature, modify the map (this would be expanded in a full implementation)
  for (const feature of selectedFeatures) {
    // Make sure map dimensions are valid
    if (!map.width || !map.height || map.width <= 0 || map.height <= 0) {
      console.warn("Invalid map dimensions for feature placement");
      continue;
    }

    const x = Math.floor(random() * map.width);
    const y = Math.floor(random() * map.height);

    // Make sure indices are valid
    if (!map.tiles[y] || !map.tiles[y][x]) {
      console.warn(`Invalid map coordinates (${x},${y}) for feature placement`);
      continue;
    }

    // Ensure we're not placing in deep water
    if (map.tiles[y][x].terrain === TerrainType.DEEP_WATER) {
      continue;
    }

    // Create the feature based on type
    switch (feature) {
      case 'meteor_crater':
        createMeteorCrater(map, x, y);
        break;
      case 'volcano':
        createVolcano(map, x, y);
        break;
      case 'alien_ruins':
        createAlienRuins(map, x, y);
        break;
      // For other features, we'll add them in the future
      default:
        // Just add a basic decoration for now
        if (map.tiles[y][x]) {
          map.tiles[y][x].decorations = [Math.floor(random() * 10)];
        }
    }
  }
}

// Create a meteor crater at the specified location
function createMeteorCrater(map: PlanetMap, centerX: number, centerY: number): void {
  const radius = 5 + Math.floor(random() * 10);

  // Modify terrain in a circle around the center
  for (let y = Math.max(0, centerY - radius); y < Math.min(map.height, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x < Math.min(map.width, centerX + radius); x++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      if (distance <= radius) {
        const tile = map.tiles[y][x];

        // Center of crater has rare resources
        if (distance < radius * 0.3) {
          tile.terrain = TerrainType.ALIEN_CRYSTAL;
          tile.resource = ResourceType.RARE_METALS;
          tile.resourceDensity = 0.8;
          tile.radiation = 0.5; // Some radiation
        }
        // Crater rim
        else if (distance > radius * 0.8) {
          tile.terrain = TerrainType.HILLS;
          tile.height = 0.6;
        }
        // Crater floor
        else {
          tile.terrain = TerrainType.SAND;
          tile.height = 0.45;
        }
      }
    }
  }
}

// Create a volcano at the specified location
function createVolcano(map: PlanetMap, centerX: number, centerY: number): void {
  const radius = 7 + Math.floor(random() * 8);

  // Modify terrain in a circle around the center
  for (let y = Math.max(0, centerY - radius); y < Math.min(map.height, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x < Math.min(map.width, centerX + radius); x++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      if (distance <= radius) {
        const tile = map.tiles[y][x];

        // Center is lava
        if (distance < radius * 0.2) {
          tile.terrain = TerrainType.LAVA;
          tile.temperature = 873; // 600°C in Kelvin
          tile.traversable = false;
        }
        // Inner slopes are volcanic
        else if (distance < radius * 0.6) {
          tile.terrain = TerrainType.VOLCANIC;
          tile.temperature = 373 + (radius * 0.6 - distance) * 100; // Gets hotter closer to center
          tile.resource = ResourceType.SULFUR;
          tile.resourceDensity = 0.5 + random() * 0.5;
        }
        // Outer slopes are mountains/hills
        else {
          tile.terrain = distance < radius * 0.8 ? TerrainType.MOUNTAINS : TerrainType.HILLS;
          tile.height = 0.7 + (radius - distance) / radius * 0.3;
          tile.temperature = 323 + (radius * 0.8 - distance) * 30; // Gets hotter closer to center
        }
      }
    }
  }
}

// Create alien ruins at the specified location
function createAlienRuins(map: PlanetMap, centerX: number, centerY: number): void {
  const radius = 4 + Math.floor(random() * 6);

  // Modify terrain in a circle around the center
  for (let y = Math.max(0, centerY - radius); y < Math.min(map.height, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x < Math.min(map.width, centerX + radius); x++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      if (distance <= radius) {
        const tile = map.tiles[y][x];

        // Center has alien crystals and technology
        if (distance < radius * 0.5) {
          tile.terrain = TerrainType.ALIEN_CRYSTAL;
          tile.resource = random() < 0.3 ? ResourceType.XENOCRYSTALS : ResourceType.RARE_METALS;
          tile.resourceDensity = 0.7 + random() * 0.3;
          // Add decoration for ruins
          tile.decorations = [100 + Math.floor(random() * 10)]; // Specific decoration IDs for ruins
        }
        // Outer area has some scattered resources
        else {
          // Keep original terrain but add some resources
          if (random() < 0.3) {
            tile.resource = ResourceType.SILICON;
            tile.resourceDensity = 0.3 + random() * 0.4;
          }
          // Add sparse decorations
          if (random() < 0.2) {
            tile.decorations = [110 + Math.floor(random() * 5)]; // Scattered ruins decorations
          }
        }
      }
    }
  }
}

// Place ore patches using seeded RNG
/**
 * Factorio-style resource patches: compact, single-resource fields with ragged edges, richest at
 * the centre. A starter set of iron, copper, gas and water sits near the landing site; the rest,
 * bigger the further out they are, are spread over the map. Counts scale with map area and the
 * richness setting.
 */
function placeOrePatches(map: PlanetMap, seed: number): void {
  for (const row of map.tiles) for (const t of row) { t.resource = ResourceType.NONE; t.resourceDensity = 0; }
  const rng = seedrandom(`${seed}:ores`);
  const edge = createNoise2D(seedrandom(`${seed}:ore-edges`));
  const cx = map.width / 2, cy = map.height / 2;
  const span = Math.min(map.width, map.height) / 2;
  const scale = (map.width * map.height) / 14400 * (0.5 + (map.resourceRichness ?? 0.7));

  const patch = (resource: ResourceType, px: number, py: number, radius: number) => {
    const r = Math.ceil(radius * 1.4);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const tx = Math.round(px + dx), ty = Math.round(py + dy);
        const tile = map.tiles[ty]?.[tx];
        if (!tile || !tile.traversable || tile.resource !== ResourceType.NONE) continue;
        const d = Math.hypot(dx, dy) / radius + edge(tx * 0.25, ty * 0.25) * 0.3;
        if (d > 1) continue;
        tile.resource = resource;
        tile.resourceDensity = Math.min(1, 0.35 + (1 - d) * 0.75);
      }
    }
  };
  /** A spot at a given distance from the landing site, on land. */
  const spot = (minD: number, maxD: number): [number, number] | null => {
    for (let k = 0; k < 40; k++) {
      const a = rng() * Math.PI * 2;
      const d = minD + rng() * (maxD - minD);
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      const t = map.tiles[Math.round(y)]?.[Math.round(x)];
      if (t?.traversable && t.resource === ResourceType.NONE) return [x, y];
    }
    return null;
  };

  // Starter patches near the landing site.
  const starters: [ResourceType, number, number, number][] = [
    [ResourceType.IRON, 7, 13, 4.5], [ResourceType.COPPER, 8, 15, 4], [ResourceType.WATER, 6, 13, 3.5],
    [ResourceType.METHANE, 10, 18, 3.5], [ResourceType.SILICON, 16, 26, 3.5], [ResourceType.SULFUR, 20, 32, 3],
  ];
  for (const [res, a, b, r] of starters) {
    const s = spot(a, Math.min(b, span * 0.8));
    if (s) patch(res, s[0], s[1], r);
  }
  // Further out: more and bigger.
  const more: [ResourceType, number][] = [
    [ResourceType.IRON, 6], [ResourceType.COPPER, 5], [ResourceType.WATER, 4], [ResourceType.METHANE, 4],
    [ResourceType.SILICON, 3], [ResourceType.SULFUR, 3],
  ];
  for (const [res, n] of more) {
    for (let k = 0; k < Math.round(n * scale); k++) {
      const s = spot(span * 0.3, span * 0.95);
      if (!s) continue;
      const far = Math.hypot(s[0] - cx, s[1] - cy) / span;
      patch(res, s[0], s[1], 3 + far * 4 + rng() * 2);
    }
  }
}

// Main map generation function
export function generatePlanetMap(params: MapGeneratorParams): PlanetMap {
  // Set defaults for optional parameters
  const seed = params.seed || Math.floor(Math.random() * 1000000);
  random = seedrandom(`${seed}:features`);
  const oceanLevel = params.oceanLevel || 0.4;
  const mountainLevel = params.mountainLevel || 0.7;
  const resourceRichness = params.resourceRichness || 0.5;
  const alienness = params.alienness || 0.3;
  const smoothness = params.smoothness || 0.5;
  const moistureScale = params.moistureScale || 0.01;
  const heightScale = params.heightScale || 0.005;
  const temperatureScale = params.temperatureScale || 0.008;
  const biomeScale = params.biomeScale || 0.02;
  const specialFeatureCount = params.specialFeatureCount || 15; // Increased count for larger maps

  // Get planet template
  const planetType = params.planetType || PlanetType.EARTH_LIKE;
  const template = planetTemplates[planetType as keyof typeof planetTemplates];

  // Initialize noise generators
  const noise = initNoiseGenerators(seed);

  // Seeded RNG for terrain-type and decoration randomness
  const terrainRng = seedrandom((seed + 50).toString());

  // Create empty map
  const map: PlanetMap = {
    name: generatePlanetName(seed),
    width: params.width,
    height: params.height,
    seed,
    tiles: [],
    biomes: { ...template.biomes },
    resourceRichness,
    baseTemperature: template.baseTemperature,
    basePressure: template.basePressure,
    gravity: template.gravity,
    atmosphere: template.atmosphere,
    specialFeatures: [],
    discoveredChunks: new Set(), // Track which chunks have been discovered
    pointsOfInterest: [] // Store points of interest for exploration
  };

  // Generate biome noise for the entire map first to create coherent biome regions
  const biomeNoise: number[][] = [];
  for (let y = 0; y < params.height; y++) {
    biomeNoise[y] = [];
    for (let x = 0; x < params.width; x++) {
      const nx = x * biomeScale;
      const ny = y * biomeScale;
      biomeNoise[y][x] = (noise.biomeNoise(nx, ny) + 1) / 2;
    }
  }

  // Initialize tiles array
  for (let y = 0; y < params.height; y++) {
    map.tiles[y] = [];
    for (let x = 0; x < params.width; x++) {
      // Generate base noise values
      const nx = x * heightScale;
      const ny = y * heightScale;

      // Height is a combination of different octaves for more natural-looking terrain
      let height = 0;
      const octaves = 4;
      let amplitude = 1;
      let frequency = 1;
      let maxValue = 0;

      for (let o = 0; o < octaves; o++) {
        height += noise.heightNoise(nx * frequency, ny * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }

      // Normalize to 0-1
      height = (height / maxValue + 1) / 2;

      // Apply smoothness factor (higher smoothness = more plateaus and less extreme variations)
      height = Math.pow(height, 1 - smoothness * 0.5);

      // Generate moisture
      const moistureNoise = noise.moistureNoise(x * moistureScale, y * moistureScale);
      const moisture = (moistureNoise + 1) / 2;

      // Generate temperature with latitude effect (poles are colder)
      const latitudeFactor = 1 - Math.abs((y / params.height) - 0.5) * 2;
      const temperatureNoise = noise.temperatureNoise(x * temperatureScale, y * temperatureScale);
      const temperature = (temperatureNoise + 1) / 4 + latitudeFactor * 0.5;

      // Use biome noise to create larger contiguous biome regions
      const biomeFactor = biomeNoise[y][x];

      // Blend moisture and height based on biome factor for natural transitions
      const blendedMoisture = moisture * (1 - biomeFactor * 0.5) + biomeFactor * 0.5;
      const blendedHeight = height * (1 - biomeFactor * 0.3) + biomeFactor * 0.3;

      const terrainType = determineTerrainType(
        blendedHeight, blendedMoisture, temperature,
        oceanLevel, mountainLevel, alienness, terrainRng
      );

      // Create the tile — resources will be set by placeOrePatches below
      map.tiles[y][x] = {
        terrain: terrainType,
        resource: ResourceType.NONE,
        resourceDensity: 0,
        temperature: template.baseTemperature + (temperature - 0.5) * 40, // Adjust based on planet template
        pressure: template.basePressure + (blendedHeight - 0.5) * 10000, // Higher elevation = lower pressure
        radiation: template.atmosphere === AtmosphereType.THIN ? 0.2 + terrainRng() * 0.1 : 0,
        height: blendedHeight,
        moisture: blendedMoisture,
        traversable: true, // Will be updated later
        decorations: [],
        discovered: false // Tile starts undiscovered
      };

      // Add decorative elements based on terrain type (trees, rocks, etc.)
      addDecorativeElements(map.tiles[y][x], terrainType, biomeFactor, terrainRng);

      // Some terrain types are not traversable
      if (
        map.tiles[y][x].terrain === TerrainType.DEEP_WATER ||
        map.tiles[y][x].terrain === TerrainType.LAVA ||
        map.tiles[y][x].terrain === TerrainType.MOUNTAINS
      ) {
        map.tiles[y][x].traversable = false;
      }
    }
  }

  // Place ore patches (after tile generation, before special features)
  placeOrePatches(map, seed);

  // Add special features and points of interest
  addSpecialFeatures(map, specialFeatureCount);
  generatePointsOfInterest(map, seed, Math.floor(params.width * params.height / 2000)); // One POI per 2000 tiles on average

  // Mark spawn area as discovered (center of map)
  const centerX = Math.floor(params.width / 2);
  const centerY = Math.floor(params.height / 2);
  const viewRadius = 15; // Initial visibility radius

  for (let y = Math.max(0, centerY - viewRadius); y < Math.min(params.height, centerY + viewRadius); y++) {
    for (let x = Math.max(0, centerX - viewRadius); x < Math.min(params.width, centerX + viewRadius); x++) {
      map.tiles[y][x].discovered = true;
    }
  }

  // Add the center chunk to discovered chunks
  map.discoveredChunks?.add(`${Math.floor(centerX/32)},${Math.floor(centerY/32)}`);

  return map;
}

// Add decorative elements based on terrain type
function addDecorativeElements(tile: MapTile, terrainType: TerrainType, biomeFactor: number, rng: () => number) {
  // Only add decorations to certain terrain types
  switch (terrainType) {
    case TerrainType.GRASS:
      // Add trees, bushes, rocks
      if (rng() < 0.2) {
        tile.decorations.push(rng() < 0.7 ? 0 : 1); // Bush variants
      }
      if (rng() < 0.05) {
        tile.decorations.push(rng() < 0.5 ? 8 : 9); // Rock variants
      }
      break;

    case TerrainType.FOREST:
      // Add more trees, dense vegetation
      if (rng() < 0.8) {
        tile.decorations.push(rng() < 0.5 ? 0 : 2); // Bush/plant variants
      }
      break;

    case TerrainType.SAND:
      // Add rocks, dead trees
      if (rng() < 0.1) {
        tile.decorations.push(8 + Math.floor(rng() * 3)); // Rock variants
      }
      break;

    case TerrainType.ALIEN_GRASS:
    case TerrainType.ALIEN_FOREST:
      // Add alien crystal formations
      if (rng() < 0.2) {
        tile.decorations.push(4 + Math.floor(rng() * 2)); // Crystal variants
      }
      break;

    case TerrainType.HILLS:
    case TerrainType.MOUNTAINS:
      // Add rocks, small caves
      if (rng() < 0.3) {
        tile.decorations.push(8 + Math.floor(rng() * 3)); // Rock variants
      }
      break;

    case TerrainType.ALIEN_CRYSTAL:
      // Add more crystals
      if (rng() < 0.6) {
        tile.decorations.push(4 + Math.floor(rng() * 3)); // Crystal variants
      }
      break;
  }
}

// Generate points of interest for exploration
function generatePointsOfInterest(map: PlanetMap, seed: number, count: number) {
  const rng = seedrandom(seed.toString());

  const poiTypes = [
    { type: 'ancient_ruins', name: 'Ancient Ruins', discoveryBonus: 'tech' },
    { type: 'crashed_ship', name: 'Crashed Ship', discoveryBonus: 'resources' },
    { type: 'alien_artifact', name: 'Alien Artifact', discoveryBonus: 'research' },
    { type: 'resource_cache', name: 'Resource Cache', discoveryBonus: 'materials' },
    { type: 'abandoned_outpost', name: 'Abandoned Outpost', discoveryBonus: 'blueprints' },
    { type: 'strange_formation', name: 'Strange Formation', discoveryBonus: 'map' },
    { type: 'underground_entrance', name: 'Underground Entrance', discoveryBonus: 'exploration' },
    { type: 'signal_source', name: 'Mysterious Signal', discoveryBonus: 'story' }
  ];

  // Place POIs in suitable locations
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let placed = false;

    while (!placed && attempts < 50) {
      attempts++;

      const x = Math.floor(rng() * map.width);
      const y = Math.floor(rng() * map.height);

      // Check if location is suitable (not water, not too close to other POIs)
      if (map.tiles[y][x].traversable) {
        // Check for minimum distance from other POIs
        let tooClose = false;
        for (const poi of map.pointsOfInterest ?? []) {
          const distance = Math.sqrt(Math.pow(poi.x - x, 2) + Math.pow(poi.y - y, 2));
          if (distance < 30) { // Minimum distance of 30 tiles
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          // Select a random POI type
          const poiType = poiTypes[Math.floor(rng() * poiTypes.length)];

          // Add POI
          map.pointsOfInterest?.push({
            id: `poi_${i}`,
            x,
            y,
            type: poiType.type,
            name: poiType.name,
            discovered: false,
            discoveryBonus: poiType.discoveryBonus,
            description: generatePOIDescription(poiType.type, rng)
          });

          // Add visual marker or decoration
          map.tiles[y][x].decorations.push(12 + Math.floor(rng() * 5)); // Special decoration IDs for POIs

          placed = true;
        }
      }
    }
  }
}

// Generate a description for a point of interest
function generatePOIDescription(type: string, rng: () => number): string {
  const descriptions: Record<string, string[]> = {
    'ancient_ruins': [
      'Crumbling structures of an unknown civilization.',
      'Ancient stone buildings covered in strange symbols.',
      'The remnants of what appears to be a research facility.',
      'A series of interconnected chambers buried partially underground.'
    ],
    'crashed_ship': [
      'The wreckage of a spacecraft of unknown origin.',
      'A damaged vessel that seems to have crashed recently.',
      'A transport ship split in two, surrounded by scattered cargo.',
      'The remains of what appears to be an escape pod.'
    ],
    'alien_artifact': [
      'A pulsating crystal formation emitting strange energy.',
      'A metallic object that seems to defy conventional physics.',
      'A geometric structure that slowly rotates without any power source.',
      'A containment unit housing something that shifts and changes as you watch.'
    ],
    'resource_cache': [
      'A collection of containers, some partially buried in the soil.',
      'What appears to be a mining outpost, abandoned but full of resources.',
      'A cargo drop with the parachute still attached.',
      'A sealed vault that could contain valuable materials.'
    ],
    'abandoned_outpost': [
      'A small research station with equipment still powered on.',
      'Living quarters and lab facilities, evacuated in a hurry.',
      'A communications relay station with logs still intact.',
      'A fortified position with defensive systems still active.'
    ],
    'strange_formation': [
      'A perfect circle of altered terrain, unlike anything natural.',
      'Crystalline growths that seem to form complex patterns.',
      'A series of perfectly aligned rock formations.',
      'A crater with unusual material properties.'
    ],
    'underground_entrance': [
      'A cave opening with warm air flowing from within.',
      'A metal hatch built into the side of a hill.',
      'A sinkhole revealing a network of tunnels below.',
      'A fissure in the ground emitting strange light.'
    ],
    'signal_source': [
      'A beacon transmitting an encrypted message on repeat.',
      'Equipment generating unusual electromagnetic patterns.',
      'A terminal displaying coordinates to another location.',
      'A distress signal coming from what appears to be empty space.'
    ]
  };

  const options = descriptions[type] || ['A mysterious discovery worth investigating.'];
  return options[Math.floor(rng() * options.length)];
}

// Generate a unique name for the planet
function generatePlanetName(seed: number): string {
    // Simple name generator
    const prefixes = [
      'Nova', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota',
      'Kappa', 'Lambda', 'Mu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon',
      'Phi', 'Chi', 'Psi', 'Omega'
    ];

    const middles = [
      'Proxi', 'Cen', 'Siri', 'Veg', 'Alt', 'Ant', 'Arc', 'Alde', 'Caph', 'Dene',
      'Elec', 'Fomal', 'Gem', 'Hyad', 'Iol', 'Jup', 'Keid', 'Lyr', 'Mira', 'Nix'
    ];

    const suffixes = [
      'a', 'b', 'c', 'd', 'e', 'i', 'ia', 'on', 'us', 'um', 'is', 'ar', 'oid',
      'or', 'ium', 'ix', 'an', 'ius', 'ese', 'ov', 'ax', 'es', 'ine'
    ];

    // Use seed to deterministically generate name
    const random = seedrandom(seed.toString());

    let name = '';

    // 20% chance of using a prefix
    if (random() < 0.2) {
      name += prefixes[Math.floor(random() * prefixes.length)] + ' ';
    }

    // Main name - either a middle + suffix or a completely random generated name
    if (random() < 0.7) {
      name += middles[Math.floor(random() * middles.length)];
      name += suffixes[Math.floor(random() * suffixes.length)];
    } else {
      // Generate a unique name with alternating consonants and vowels
      const consonants = 'bcdfghjklmnpqrstvwxyz';
      const vowels = 'aeiou';
      const nameLength = 4 + Math.floor(random() * 5);

      for (let i = 0; i < nameLength; i++) {
        if (i % 2 === 0) {
          name += consonants[Math.floor(random() * consonants.length)];
        } else {
          name += vowels[Math.floor(random() * vowels.length)];
        }
      }

      // 50% chance to add a suffix
      if (random() < 0.5) {
        name += suffixes[Math.floor(random() * suffixes.length)];
      }
    }

    // 30% chance to add a designation
    if (random() < 0.3) {
      name += ' ' + (Math.floor(random() * 999) + 1);
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Export a function to generate Mars
  export function generateMars(width: number, height: number): PlanetMap {
    return generatePlanetMap({
      width,
      height,
      planetType: PlanetType.MARS_LIKE,
      oceanLevel: 0.1,   // Very little water
      mountainLevel: 0.6,
      resourceRichness: 0.4,
      alienness: 0.1,    // Not very alien, just barren
    });
  }
