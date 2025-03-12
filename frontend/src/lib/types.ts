// src/lib/types.ts
  
  // Biome distribution - percentage of map covered by each biome
  export interface BiomeDistribution {
    water: number;
    plains: number;
    forest: number;
    mountains: number;
    desert: number;
    tundra: number;
    volcanic: number;
    alienFeatures: number;
  }
  
  // Map generator parameters
  export interface MapGeneratorParams {
    width: number;
    height: number;
    seed?: number;
    oceanLevel?: number; // 0-1, default 0.4
    mountainLevel?: number; // 0-1, default 0.7
    resourceRichness?: number; // 0-1, default 0.5
    alienness?: number; // 0-1, how "alien" the landscape is, default 0.3
    smoothness?: number; // 0-1, terrain smoothness, default 0.5
    moistureScale?: number; // Scale for moisture noise, default 0.01
    heightScale?: number; // Scale for height noise, default 0.005
    temperatureScale?: number; // Scale for temperature noise, default 0.008
    biomeScale?: number; // Scale for biome noise, default 0.02
    specialFeatureCount?: number; // Number of special features, default 5
    planetType?: PlanetType; // Planet template to use
  }
  

  export enum AssetType {
        SOUND_EFFECT = 'sound_effect',
        MUSIC = 'music',
        AMBIENCE = 'ambience',
        FOLEY = 'foley',
        SPRITE = 'sprite',
        TILESET = 'tileset',
        ANIMATION = 'animation',
        BUILDING = 'building',
        CHARACTER = 'character',
        TERRAIN = 'terrain',
        DECORATION = 'decoration',
        UI = 'ui'
    }
  
  // Basic Asset Metadata
  export interface AssetMetadata {
    id: string;
    type: AssetType;
    path: string;
    name: string;
    description?: string;
    tags?: string[];
    frameCount?: number;
    frameRate?: number;
    loop?: boolean;
    volume?: number;
    dimensions?: {
      width: number;
      height: number;
    };
    variants?: string[];
    author?: string;
    license?: string;
  }
  
  // Tileset Asset
  export interface TilesetAsset extends AssetMetadata {
    type: AssetType.TILESET | AssetType.TERRAIN;
    tileWidth: number;
    tileHeight: number;
    columns: number;
    rows: number;
    terrainTypes?: string[];
    tileProperties?: Record<number, any>;
  }
  
  // Terrain types
  export enum TerrainType {
    DEEP_WATER = 0,
    SHALLOW_WATER = 1,
    SAND = 2,
    GRASS = 3,
    FOREST = 4,
    HILLS = 5,
    MOUNTAINS = 6,
    SNOW = 7,
    VOLCANIC = 8,
    LAVA = 9,
    CAVE = 10,
    ALIEN_GRASS = 11,
    ALIEN_FOREST = 12,
    ALIEN_CRYSTAL = 13,
    METHANE_LAKE = 14,
    ICE = 15
  }
  
  // Resource deposits
  export enum ResourceType {
    NONE = 0,
    METHANE = 1,
    OXYGEN = 2,
    WATER = 3,
    IRON = 4,
    COPPER = 5,
    SILICON = 6,
    SULFUR = 7,
    URANIUM = 8,
    RARE_METALS = 9,
    XENOCRYSTALS = 10
  }
  
  // Map tile interface
  export interface MapTile {
    terrain: TerrainType;
    resource: ResourceType;
    resourceDensity: number; // 0-1
    temperature: number; // Kelvin
    pressure: number; // Pascal
    radiation: number; // 0-1
    height: number; // 0-1
    moisture: number; // 0-1
    traversable: boolean;
    decorations: number[]; // IDs of decorative elements
  }
  
  // Planet map
  export interface PlanetMap {
    name: string;
    width: number;
    height: number;
    seed: number;
    tiles: MapTile[][];
    biomes: BiomeDistribution;
    resourceRichness: number; // 0-1
    baseTemperature: number; // Kelvin
    basePressure: number; // Pascal
    gravity: number; // 1 = Earth
    atmosphere: AtmosphereType;
    specialFeatures: SpecialFeature[];
  }
  
  // Atmosphere types
  export enum AtmosphereType {
    NONE = 'none',
    THIN = 'thin',
    EARTH_LIKE = 'earth_like',
    THICK = 'thick',
    TOXIC = 'toxic',
    METHANE = 'methane',
    REDUCING = 'reducing',
    OXIDIZING = 'oxidizing'
  }
  
  // Special map features
  export enum SpecialFeature {
    METEOR_CRATER = 'meteor_crater',
    VOLCANO = 'volcano',
    CANYON = 'canyon',
    CAVE_SYSTEM = 'cave_system',
    ALIEN_RUINS = 'alien_ruins',
    GEOTHERMAL_AREA = 'geothermal_area',
    CRYSTAL_FORMATION = 'crystal_formation',
    ABANDONED_BASE = 'abandoned_base',
    STRANGE_SIGNAL = 'strange_signal',
    ANCIENT_TECHNOLOGY = 'ancient_technology'
  }
  
  // Biome distribution - percentage of map covered by each biome
  export interface BiomeDistribution {
    water: number;
    plains: number;
    forest: number;
    mountains: number;
    desert: number;
    tundra: number;
    volcanic: number;
    alienFeatures: number;
  }
  
  // Map generator parameters
  export interface MapGeneratorParams {
    width: number;
    height: number;
    seed?: number;
    oceanLevel?: number; // 0-1, default 0.4
    mountainLevel?: number; // 0-1, default 0.7
    resourceRichness?: number; // 0-1, default 0.5
    alienness?: number; // 0-1, how "alien" the landscape is, default 0.3
    smoothness?: number; // 0-1, terrain smoothness, default 0.5
    moistureScale?: number; // Scale for moisture noise, default 0.01
    heightScale?: number; // Scale for height noise, default 0.005
    temperatureScale?: number; // Scale for temperature noise, default 0.008
    biomeScale?: number; // Scale for biome noise, default 0.02
    specialFeatureCount?: number; // Number of special features, default 5
    planetType?: PlanetType; // Planet template to use
  }
  
  // Predefined planet types
  export enum PlanetType {
    EARTH_LIKE = 'earth_like',
    DESERT = 'desert',
    ICE = 'ice',
    VOLCANIC = 'volcanic',
    ALIEN = 'alien',
    OCEAN = 'ocean',
    MARS_LIKE = 'mars_like'
  }
  
  // Predefined planet templates
  export const planetTemplates = {
    [PlanetType.EARTH_LIKE]: {
      baseTemperature: 288, // 15°C in Kelvin
      basePressure: 101325, // 1 atm in Pascal
      atmosphere: AtmosphereType.EARTH_LIKE,
      gravity: 1.0,
      biomes: {
        water: 0.7,
        plains: 0.15,
        forest: 0.1,
        mountains: 0.03,
        desert: 0.01,
        tundra: 0.01,
        volcanic: 0,
        alienFeatures: 0
      }
    },
    [PlanetType.DESERT]: {
      baseTemperature: 313, // 40°C in Kelvin
      basePressure: 90000, // Slightly less than Earth
      atmosphere: AtmosphereType.THIN,
      gravity: 0.8,
      biomes: {
        water: 0.05,
        plains: 0.05,
        forest: 0.01,
        mountains: 0.04,
        desert: 0.85,
        tundra: 0,
        volcanic: 0,
        alienFeatures: 0
      }
    },
    [PlanetType.ICE]: {
      baseTemperature: 233, // -40°C in Kelvin
      basePressure: 60000, // Much less than Earth
      atmosphere: AtmosphereType.THIN,
      gravity: 0.7,
      biomes: {
        water: 0.3,
        plains: 0.05,
        forest: 0.01,
        mountains: 0.04,
        desert: 0,
        tundra: 0.6,
        volcanic: 0,
        alienFeatures: 0
      }
    },
    [PlanetType.VOLCANIC]: {
      baseTemperature: 373, // 100°C in Kelvin
      basePressure: 202650, // 2 atm in Pascal
      atmosphere: AtmosphereType.TOXIC,
      gravity: 1.2,
      biomes: {
        water: 0.1,
        plains: 0.1,
        forest: 0,
        mountains: 0.1,
        desert: 0.2,
        tundra: 0,
        volcanic: 0.5,
        alienFeatures: 0
      }
    },
    [PlanetType.ALIEN]: {
      baseTemperature: 293, // 20°C in Kelvin
      basePressure: 80000, // Less than Earth
      atmosphere: AtmosphereType.METHANE,
      gravity: 0.9,
      biomes: {
        water: 0.3,
        plains: 0.1,
        forest: 0.1,
        mountains: 0.1,
        desert: 0.1,
        tundra: 0.05,
        volcanic: 0.05,
        alienFeatures: 0.2
      }
    },
    [PlanetType.OCEAN]: {
      baseTemperature: 283, // 10°C in Kelvin
      basePressure: 101325, // 1 atm in Pascal
      atmosphere: AtmosphereType.EARTH_LIKE,
      gravity: 1.0,
      biomes: {
        water: 0.9,
        plains: 0.05,
        forest: 0.02,
        mountains: 0.01,
        desert: 0.01,
        tundra: 0.01,
        volcanic: 0,
        alienFeatures: 0
      }
    },
    [PlanetType.MARS_LIKE]: {
      baseTemperature: 210, // -63°C in Kelvin (Mars average)
      basePressure: 600, // Martian atmospheric pressure (~0.6% of Earth)
      atmosphere: AtmosphereType.THIN,
      gravity: 0.38, // Mars gravity relative to Earth
      biomes: {
        water: 0.01, // Very small amount of water ice
        plains: 0.40, // Martian plains
        forest: 0,    // No forests
        mountains: 0.20, // Olympus Mons and other Martian mountains
        desert: 0.39, // Mars is mostly desert-like
        tundra: 0,    // No tundra
        volcanic: 0,  // Dormant volcanic features
        alienFeatures: 0 // No alien features (yet!)
      }
    }
  };