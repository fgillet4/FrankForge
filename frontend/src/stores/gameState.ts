import { writable } from 'svelte/store';

// Game state interface
export interface GameState {
  tick: number;
  isPaused: boolean;
  resources: Record<string, number>;
  buildings: Building[];
  energy: number;
  map?: any;
  planetType?: number;
  lastUpdated?: number;
  research: Research;
  statistics: Statistics;
  weather: Weather;
  timeOfDay: number; // 0-24 (hours)
  unlocked: UnlockedContent;
}

export interface Building {
  id: string;
  type: string;
  position: { x: number; y: number };
  connections: string[];
  efficiency?: number; // 0-1 (percentage)
  productionRate?: number;
  powerConsumption?: number;
  lastMaintenance?: number;
  wear?: number; // 0-1 (percentage)
  lightRadius?: number;
  isActive?: boolean;
  automation?: AutomationSettings;
}

export interface Research {
  points: number;
  currentResearch: string | null;
  progress: number;
  completed: string[];
  unlockQueue: string[];
}

export interface Statistics {
  resources: {
    produced: Record<string, number>;
    consumed: Record<string, number>;
  };
  production: {
    history: ProductionSnapshot[];
    efficiency: number;
  };
  power: {
    generated: number;
    consumed: number;
    history: PowerSnapshot[];
  };
  pollution: {
    level: number;
    history: PollutionSnapshot[];
  };
}

export interface ProductionSnapshot {
  tick: number;
  timestamp: number;
  resources: Record<string, number>;
}

export interface PowerSnapshot {
  tick: number;
  timestamp: number;
  generated: number;
  consumed: number;
}

export interface PollutionSnapshot {
  tick: number;
  timestamp: number;
  level: number;
  sources: { x: number; y: number; amount: number }[];
}

export interface Weather {
  current: string; // clear, rainy, stormy, foggy
  intensity: number; // 0-1
  duration: number;
  effects: WeatherEffect[];
}

export interface WeatherEffect {
  type: string;
  target: string;
  modifier: number;
}

export interface UnlockedContent {
  buildings: string[];
  technologies: string[];
  blueprints: boolean;
  automation: boolean;
  logistics: boolean;
  advanced: boolean;
}

export interface AutomationSettings {
  enabled: boolean;
  conditions: AutomationCondition[];
  priority: number;
}

export interface AutomationCondition {
  type: string;
  resource?: string;
  threshold?: number;
  target?: string;
  operator?: string;
}

// Define technology tree
export const technologies = {
  basicExtraction: {
    name: "Basic Resource Extraction",
    description: "Enables basic mining and drilling operations.",
    cost: 100,
    time: 60,
    prerequisites: [],
    unlocks: ["extractor", "storageSmall"],
    icon: "mining"
  },
  powerGeneration: {
    name: "Power Generation",
    description: "Enables power plant construction for energy production.",
    cost: 150,
    time: 90,
    prerequisites: ["basicExtraction"],
    unlocks: ["powerPlant", "solarPanel"],
    icon: "power"
  },
  basicLogistics: {
    name: "Basic Logistics",
    description: "Enables resource transportation between buildings.",
    cost: 200,
    time: 120,
    prerequisites: ["basicExtraction"],
    unlocks: ["pipe", "conveyor"],
    icon: "logistics"
  },
  advancedMaterials: {
    name: "Advanced Materials",
    description: "Enables processing of raw materials into more useful forms.",
    cost: 300,
    time: 180,
    prerequisites: ["basicExtraction", "powerGeneration"],
    unlocks: ["reactor", "smelter"],
    icon: "materials"
  },
  automation: {
    name: "Basic Automation",
    description: "Enables automated handling of resources and production.",
    cost: 500,
    time: 300,
    prerequisites: ["basicLogistics", "advancedMaterials"],
    unlocks: ["assembler", "autoLoader"],
    icon: "automation"
  },
  circuitNetworks: {
    name: "Circuit Networks",
    description: "Enables complex logical control of your factory systems.",
    cost: 800,
    time: 480,
    prerequisites: ["automation"],
    unlocks: ["circuitController", "sensor"],
    icon: "circuits"
  },
  advancedPower: {
    name: "Advanced Power Generation",
    description: "Enables high-output power generation facilities.",
    cost: 1000,
    time: 600,
    prerequisites: ["powerGeneration"],
    unlocks: ["nuclearReactor", "advancedSolarArray"],
    icon: "nuclear"
  },
  researchEfficiency: {
    name: "Research Efficiency",
    description: "Improves research speed and resource efficiency.",
    cost: 600,
    time: 360,
    prerequisites: ["automation"],
    unlocks: ["researchLab", "dataCore"],
    icon: "research"
  },
  advancedLogistics: {
    name: "Advanced Logistics",
    description: "Enables complex logistics networks with drones and stations.",
    cost: 1200,
    time: 720,
    prerequisites: ["basicLogistics", "automation"],
    unlocks: ["dronePort", "logisticsHub"],
    icon: "drones"
  },
  spaceTechnology: {
    name: "Space Technology",
    description: "Enables construction of space-based structures and vehicles.",
    cost: 2000,
    time: 1200,
    prerequisites: ["advancedPower", "advancedLogistics"],
    unlocks: ["rocketSilo", "spacePlatform"],
    icon: "space"
  }
};

// Initialize default game state
const createGameState = () => {
  return writable<GameState>({
    tick: 0,
    isPaused: false,
    resources: {
      energy: 1000,
      methane: 100,
      oxygen: 100,
      water: 100,
      iron: 50,
      copper: 50,
      science: 0
    },
    buildings: [],
    energy: 1000,
    research: {
      points: 0,
      currentResearch: null,
      progress: 0,
      completed: [],
      unlockQueue: []
    },
    statistics: {
      resources: {
        produced: {},
        consumed: {}
      },
      production: {
        history: [],
        efficiency: 1.0
      },
      power: {
        generated: 0,
        consumed: 0,
        history: []
      },
      pollution: {
        level: 0,
        history: []
      }
    },
    weather: {
      current: "clear",
      intensity: 0,
      duration: 0,
      effects: []
    },
    timeOfDay: 12, // Noon
    unlocked: {
      buildings: ["extractor", "storageSmall"],
      technologies: [],
      blueprints: false,
      automation: false,
      logistics: false,
      advanced: false
    }
  });
};

export const gameState = createGameState();

// Game loop function
export function startGameLoop() {
  let animationFrame: number;
  let lastTimestamp = performance.now();
  let statisticsTimer = 0;
  let weatherTimer = 0;
  const STATISTICS_INTERVAL = 600; // Collect stats every 10 minutes of game time
  const WEATHER_CHANGE_INTERVAL = 1800; // Weather changes every 30 minutes of game time
  
  const update = (timestamp: number) => {
    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    
    // Update game state
    gameState.update(state => {
      if (state.isPaused) return state;
      
      // Update tick counter
      state.tick += 1;
      
      // Update time of day (full cycle every 24000 ticks - 24 mins real time = 24 hours game time)
      state.timeOfDay = (state.timeOfDay + 0.001) % 24;
      
      // Process research
      if (state.research.currentResearch) {
        const tech = technologies[state.research.currentResearch];
        if (tech && state.resources.science >= 0.1) {
          // Consume science resources
          state.resources.science -= 0.1;
          // Progress research
          state.research.progress += 0.1;
          
          // Complete research if finished
          if (state.research.progress >= tech.cost) {
            state.research.completed.push(state.research.currentResearch);
            
            // Unlock related content
            tech.unlocks.forEach(item => {
              if (!state.unlocked.buildings.includes(item)) {
                state.unlocked.buildings.push(item);
              }
            });
            
            // Move to next research in queue
            state.research.currentResearch = state.research.unlockQueue.shift() || null;
            state.research.progress = 0;
          }
        }
      }
      
      // Process building operations
      let totalPowerGenerated = 0;
      let totalPowerConsumed = 0;
      let totalPollution = 0;
      
      // First pass - calculate available power
      state.buildings.forEach(building => {
        if (building.type === 'powerPlant' || building.type === 'solarPanel' || building.type === 'nuclearReactor') {
          // Calculate power generation based on building type, efficiency, and time of day
          let powerOutput = 0;
          
          if (building.type === 'powerPlant') {
            powerOutput = 50;
          } else if (building.type === 'solarPanel') {
            // Solar panels produce less power at night/dawn/dusk
            const dayFactor = getDaylight(state.timeOfDay);
            powerOutput = 30 * dayFactor;
          } else if (building.type === 'nuclearReactor') {
            powerOutput = 200;
          }
          
          // Apply efficiency
          building.efficiency = building.efficiency || 1.0;
          powerOutput *= building.efficiency;
          
          // Apply weather effects
          if (state.weather.current === 'stormy' && building.type === 'solarPanel') {
            powerOutput *= (1 - state.weather.intensity * 0.8);
          }
          
          totalPowerGenerated += powerOutput;
          building.productionRate = powerOutput;
        }
      });
      
      // Second pass - consume power and produce resources
      state.buildings.forEach(building => {
        // Set activity state
        building.isActive = true;
        
        // Calculate power consumption
        let powerNeeded = 0;
        
        switch (building.type) {
          case 'extractor':
            powerNeeded = 10;
            break;
          case 'reactor':
            powerNeeded = 25;
            break;
          case 'assembler':
            powerNeeded = 30;
            break;
          case 'researchLab':
            powerNeeded = 40;
            break;
          default:
            powerNeeded = 5;
        }
        
        // Apply weather effects
        if (state.weather.current === 'stormy' && building.type !== 'powerPlant') {
          powerNeeded *= (1 + state.weather.intensity * 0.2);
        }
        
        building.powerConsumption = powerNeeded;
        totalPowerConsumed += powerNeeded;
        
        // If not enough power, reduce efficiency
        const powerRatio = totalPowerGenerated / totalPowerConsumed;
        const powerEfficiency = Math.min(1, powerRatio);
        building.efficiency = powerEfficiency;
        
        // Calculate resource production based on efficiency
        if (building.type === 'extractor' && building.isActive && building.efficiency > 0.1) {
          // Determine resource type from position (simplified)
          const resourceType = determineResourceFromPosition(building.position.x, building.position.y);
          
          if (resourceType) {
            const baseProductionRate = 0.2;
            const productionAmount = baseProductionRate * building.efficiency;
            
            state.resources[resourceType] = (state.resources[resourceType] || 0) + productionAmount;
            
            // Update statistics
            state.statistics.resources.produced[resourceType] = 
              (state.statistics.resources.produced[resourceType] || 0) + productionAmount;
              
            building.productionRate = productionAmount;
            
            // Generate pollution
            totalPollution += 0.1 * building.efficiency;
          }
        } else if (building.type === 'researchLab' && building.isActive && building.efficiency > 0.1) {
          // Research labs generate science points
          const baseProductionRate = 0.1;
          const productionAmount = baseProductionRate * building.efficiency;
          
          state.resources.science = (state.resources.science || 0) + productionAmount;
          building.productionRate = productionAmount;
        } else if (building.type === 'assembler' && building.isActive && building.efficiency > 0.1) {
          // Assemblers convert basic resources into advanced materials
          // Logic would depend on what the assembler is configured to produce
        }
        
        // Increase wear over time
        building.wear = building.wear || 0;
        building.wear += 0.00001 * building.efficiency;
        
        // If a building has high wear, reduce its efficiency
        if (building.wear > 0.7) {
          building.efficiency *= (1 - (building.wear - 0.7) / 0.3);
        }
      });
      
      // Update power statistics
      state.statistics.power.generated = totalPowerGenerated;
      state.statistics.power.consumed = totalPowerConsumed;
      
      // Update pollution level
      state.statistics.pollution.level += totalPollution;
      
      // Natural pollution decay
      state.statistics.pollution.level *= 0.9999;
      
      // Weather effects on pollution
      if (state.weather.current === 'rainy') {
        state.statistics.pollution.level *= (1 - state.weather.intensity * 0.001);
      }
      
      // Collect statistics periodically
      statisticsTimer += 1;
      if (statisticsTimer >= STATISTICS_INTERVAL) {
        // Save production snapshot
        state.statistics.production.history.push({
          tick: state.tick,
          timestamp: Date.now(),
          resources: { ...state.resources }
        });
        
        // Keep only the last 100 snapshots
        if (state.statistics.production.history.length > 100) {
          state.statistics.production.history.shift();
        }
        
        // Save power snapshot
        state.statistics.power.history.push({
          tick: state.tick,
          timestamp: Date.now(),
          generated: totalPowerGenerated,
          consumed: totalPowerConsumed
        });
        
        // Keep only the last 100 snapshots
        if (state.statistics.power.history.length > 100) {
          state.statistics.power.history.shift();
        }
        
        // Save pollution snapshot
        state.statistics.pollution.history.push({
          tick: state.tick,
          timestamp: Date.now(),
          level: state.statistics.pollution.level,
          sources: state.buildings
            .filter(b => b.type === 'extractor' || b.type === 'powerPlant')
            .map(b => ({
              x: b.position.x,
              y: b.position.y,
              amount: b.type === 'powerPlant' ? 0.2 : 0.1
            }))
        });
        
        // Keep only the last 100 snapshots
        if (state.statistics.pollution.history.length > 100) {
          state.statistics.pollution.history.shift();
        }
        
        statisticsTimer = 0;
      }
      
      // Weather changes
      weatherTimer += 1;
      if (weatherTimer >= WEATHER_CHANGE_INTERVAL) {
        // Chance of weather changing
        if (Math.random() < 0.3) {
          const weatherTypes = ['clear', 'rainy', 'foggy', 'stormy'];
          const weights = [0.5, 0.25, 0.15, 0.1];
          
          // Higher pollution increases chance of bad weather
          if (state.statistics.pollution.level > 50) {
            weights[0] -= 0.2;
            weights[2] += 0.1;
            weights[3] += 0.1;
          }
          
          const newWeather = weightedRandomChoice(weatherTypes, weights);
          state.weather.current = newWeather;
          state.weather.intensity = Math.random();
          state.weather.duration = Math.floor(Math.random() * 1200) + 600; // 10-30 minutes
          
          // Set weather effects
          state.weather.effects = [];
          
          if (newWeather === 'stormy') {
            state.weather.effects.push({
              type: 'production',
              target: 'solarPanel',
              modifier: -0.5
            });
            state.weather.effects.push({
              type: 'consumption',
              target: 'all',
              modifier: 0.2
            });
          } else if (newWeather === 'foggy') {
            state.weather.effects.push({
              type: 'visibility',
              target: 'all',
              modifier: -0.3
            });
          } else if (newWeather === 'rainy') {
            state.weather.effects.push({
              type: 'pollution',
              target: 'all',
              modifier: -0.2
            });
          }
        }
        
        weatherTimer = 0;
      }
      
      // Decrease weather duration
      if (state.weather.duration > 0) {
        state.weather.duration -= 1;
        
        if (state.weather.duration <= 0) {
          state.weather.current = 'clear';
          state.weather.intensity = 0;
          state.weather.effects = [];
        }
      }
      
      return state;
    });
    
    // Request next frame
    animationFrame = requestAnimationFrame(update);
  };
  
  // Start the loop
  animationFrame = requestAnimationFrame(update);
  
  // Return a function to stop the loop
  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };
}

// Helper function to determine resource type based on position
function determineResourceFromPosition(x: number, y: number): string | null {
  // In a real implementation, this would use the tile data
  // For now, just return a random resource type
  const resourceTypes = ['iron', 'copper', 'methane', 'oxygen', 'water'];
  const index = Math.floor((x * y) % resourceTypes.length);
  return resourceTypes[index];
}

// Helper function to calculate daylight factor based on time of day
function getDaylight(timeOfDay: number): number {
  // Night: 0-6 and 18-24 hours
  if (timeOfDay < 6 || timeOfDay > 18) {
    return 0.1;
  }
  
  // Dawn/Dusk: 6-8 and 16-18 hours
  if (timeOfDay < 8 || timeOfDay > 16) {
    // Linear interpolation
    if (timeOfDay < 8) {
      return 0.1 + (timeOfDay - 6) / 2 * 0.9;
    } else {
      return 0.1 + (18 - timeOfDay) / 2 * 0.9;
    }
  }
  
  // Full day: 8-16 hours
  return 1.0;
}

// Weighted random choice helper
function weightedRandomChoice<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    if (random < weights[i]) {
      return items[i];
    }
    random -= weights[i];
  }
  
  return items[0]; // Fallback
}