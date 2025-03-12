// frontend/src/lib/mapGenerator.ts
import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';
import * as Types from './types';

const {
  TerrainType,
  ResourceType,
  MapTile,
  PlanetMap,
  AtmosphereType,
  SpecialFeature,
  BiomeDistribution,
  MapGeneratorParams,
  PlanetType,
  planetTemplates
} = Types;

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
  alienness: number
): TerrainType {
  // Ocean
  if (height < oceanLevel) {
    if (height < oceanLevel - 0.2) {
      return TerrainType.DEEP_WATER;
    }
    
    // Check for methane lakes if the planet is very alien
    if (alienness > 0.7 && Math.random() < alienness - 0.7) {
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
  if (Math.random() < alienness * 0.3) {
    if (moisture > 0.6) {
      return TerrainType.ALIEN_FOREST;
    } else if (moisture > 0.3) {
      return TerrainType.ALIEN_GRASS;
    } else {
      return TerrainType.ALIEN_CRYSTAL;
    }
  }
  
  // Volcanic areas
  if (temperature > 0.8 && Math.random() < 0.3) {
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
  const resourceIndex = Math.floor(Math.random() * possibleResources.length);
  return { 
    type: possibleResources[resourceIndex], 
    density: Math.min(Math.max(density, 0), 1) 
  };
}

// Add special features to the map
function addSpecialFeatures(map: PlanetMap, count: number): void {
  const features: SpecialFeature[] = Object.values(SpecialFeature);
  const selectedFeatures: SpecialFeature[] = [];
  
  // Randomly select features
  for (let i = 0; i < count; i++) {
    const feature = features[Math.floor(Math.random() * features.length)];
    
    // Avoid duplicates unless we've used all features
    if (!selectedFeatures.includes(feature) || selectedFeatures.length >= features.length) {
      selectedFeatures.push(feature);
    }
  }
  
  map.specialFeatures = selectedFeatures;
  
  // For each feature, modify the map (this would be expanded in a full implementation)
  for (const feature of selectedFeatures) {
    const x = Math.floor(Math.random() * map.width);
    const y = Math.floor(Math.random() * map.height);
    
    // Ensure we're not placing in deep water
    if (map.tiles[y][x].terrain === TerrainType.DEEP_WATER) {
      continue;
    }
    
    // Create the feature based on type
    switch (feature) {
      case SpecialFeature.METEOR_CRATER:
        createMeteorCrater(map, x, y);
        break;
      case SpecialFeature.VOLCANO:
        createVolcano(map, x, y);
        break;
      case SpecialFeature.ALIEN_RUINS:
        createAlienRuins(map, x, y);
        break;
      // Add more feature creation methods as needed
    }
  }
}

// Create a meteor crater at the specified location
function createMeteorCrater(map: PlanetMap, centerX: number, centerY: number): void {
  const radius = 5 + Math.floor(Math.random() * 10);
  
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
  const radius = 7 + Math.floor(Math.random() * 8);
  
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
          tile.resourceDensity = 0.5 + Math.random() * 0.5;
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
  const radius = 4 + Math.floor(Math.random() * 6);
  
  // Modify terrain in a circle around the center
  for (let y = Math.max(0, centerY - radius); y < Math.min(map.height, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x < Math.min(map.width, centerX + radius); x++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (distance <= radius) {
        const tile = map.tiles[y][x];
        
        // Center has alien crystals and technology
        if (distance < radius * 0.5) {
          tile.terrain = TerrainType.ALIEN_CRYSTAL;
          tile.resource = Math.random() < 0.3 ? ResourceType.XENOCRYSTALS : ResourceType.RARE_METALS;
          tile.resourceDensity = 0.7 + Math.random() * 0.3;
          // Add decoration for ruins
          tile.decorations = [100 + Math.floor(Math.random() * 10)]; // Specific decoration IDs for ruins
        } 
        // Outer area has some scattered resources
        else {
          // Keep original terrain but add some resources
          if (Math.random() < 0.3) {
            tile.resource = ResourceType.SILICON;
            tile.resourceDensity = 0.3 + Math.random() * 0.4;
          }
          // Add sparse decorations
          if (Math.random() < 0.2) {
            tile.decorations = [110 + Math.floor(Math.random() * 5)]; // Scattered ruins decorations
          }
        }
      }
    }
  }
}

// Main map generation function
export function generatePlanetMap(params: MapGeneratorParams): PlanetMap {
  // Set defaults for optional parameters
  const seed = params.seed || Math.floor(Math.random() * 1000000);
  const oceanLevel = params.oceanLevel || 0.4;
  const mountainLevel = params.mountainLevel || 0.7;
  const resourceRichness = params.resourceRichness || 0.5;
  const alienness = params.alienness || 0.3;
  const smoothness = params.smoothness || 0.5;
  const moistureScale = params.moistureScale || 0.01;
  const heightScale = params.heightScale || 0.005;
  const temperatureScale = params.temperatureScale || 0.008;
  const biomeScale = params.biomeScale || 0.02;
  const specialFeatureCount = params.specialFeatureCount || 5;
  
  // Get planet template
  const planetType = params.planetType || PlanetType.EARTH_LIKE;
  const template = planetTemplates[planetType];
  
  // Initialize noise generators
  const noise = initNoiseGenerators(seed);
  
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
    specialFeatures: []
  };
  
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
      
      // Resources
      const resourceNoise = noise.resourceNoise(x * 0.02, y * 0.02);
      const resourceData = determineResourceType(
        determineTerrainType(height, moisture, temperature, oceanLevel, mountainLevel, alienness),
        (resourceNoise + 1) / 2,
        resourceRichness
      );
      
      // Create the tile
      map.tiles[y][x] = {
        terrain: determineTerrainType(height, moisture, temperature, oceanLevel, mountainLevel, alienness),
        resource: resourceData.type,
        resourceDensity: resourceData.density,
        temperature: template.baseTemperature + (temperature - 0.5) * 40, // Adjust based on planet template
        pressure: template.basePressure + (height - 0.5) * 10000, // Higher elevation = lower pressure
        radiation: template.atmosphere === AtmosphereType.THIN ? 0.2 + Math.random() * 0.1 : 0,
        height,
        moisture,
        traversable: true, // Will be updated later
        decorations: []
      };
      
      // Some terrain types are not traversable
      if (
        map.tiles[y][x].terrain === TerrainType.DEEP_WATER ||
        map.tiles[y][x].terrain === TerrainType.LAVA
      ) {
        map.tiles[y][x].traversable = false;
      }
    }
  }
  
  // Add special features
  addSpecialFeatures(map, specialFeatureCount);
  
  return map;
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