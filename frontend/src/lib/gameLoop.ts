// src/lib/gameLoop.ts
import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';



// Game state interface
export interface GameState {
  tick: number;
  lastUpdate: number;
  isPaused: boolean;
  resources: Record<string, number>;
  buildings: Building[];
  temperature: number;
  pressure: number;
  weather: WeatherCondition;
  timeOfDay: number;    // 0-24 hour
}

export interface Building {
  id: string;
  type: string;
  position: { x: number; y: number };
  connections: string[];
  // Building-specific properties
}
// Weather conditions that affect temperature and pressure
export enum WeatherCondition {
    Clear = "Clear",
    Cloudy = "Cloudy",
    Stormy = "Stormy",
    Cold = "Cold",
    Hot = "Hot"
  }

// Initialize default game state
const createGameState = (): Writable<GameState> => {
  return writable({
    tick: 0,
    lastUpdate: Date.now(),
    isPaused: false,
    resources: {
      methane: 100,
      oxygen: 100,
      water: 100,
      energy: 1000,
      carbon_dioxide: 0,
      hydrogen: 0,
      // ... other resources
    },
    buildings: [],
    temperature: 293.15, // 20°C in Kelvin
  pressure: 101325,    // 1 atm in Pascal
  weather: WeatherCondition.Clear,
  timeOfDay: 12,       // Noon
});
};

export const gameState = createGameState();

// Game loop
export function startGameLoop() {
  let animationFrame: number;
  let lastTimestamp = performance.now();
  
  const update = (timestamp: number) => {
    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    
    // Update game state
    gameState.update(state => {
      if (state.isPaused) return state;
      
      // Update tick counter
      state.tick += 1;
      state.lastUpdate = Date.now();
      
      // Process building operations
      processBuildingOperations(state, deltaTime);
      
      // Process resource consumption and production
      processResources(state, deltaTime);
      
      // Return updated state
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
      animationFrame = null;
    }
  };
}

// Process all building operations
function processBuildingOperations(state: GameState, deltaTime: number) {
  state.buildings.forEach(building => {
    // Process each building's operations based on type
    switch (building.type) {
      case 'extractor':
        // Extractors produce resources based on what they're placed on
        // This would normally check the tile type, but for now just produce methane
        state.resources.methane += 2 * deltaTime;
        // Consume energy
        state.resources.energy -= 1 * deltaTime;
        break;
        
      case 'reactor':
        // Reactors combine chemicals
        // Simple reaction: methane + oxygen -> carbon dioxide + water
        const methaneAvailable = state.resources.methane;
        const oxygenAvailable = state.resources.oxygen;
        
        if (methaneAvailable >= 1 * deltaTime && oxygenAvailable >= 2 * deltaTime) {
          // Consume reactants
          state.resources.methane -= 1 * deltaTime;
          state.resources.oxygen -= 2 * deltaTime;
          
          // Produce products
          state.resources.carbon_dioxide += 1 * deltaTime;
          state.resources.water += 2 * deltaTime;
          
          // Generate some energy from reaction
          state.resources.energy += 5 * deltaTime;
        }
        
        // Base energy consumption
        state.resources.energy -= 2 * deltaTime;
        break;
        
      case 'powerPlant':
        // Power plants generate energy
        state.resources.energy += 10 * deltaTime;
        
        // Consume some methane as fuel
        if (state.resources.methane >= 0.5 * deltaTime) {
          state.resources.methane -= 0.5 * deltaTime;
        } else {
          // Less efficient if no methane
          state.resources.energy -= 5 * deltaTime;
        }
        break;
        
      default:
        // Default building just consumes energy
        state.resources.energy -= 0.5 * deltaTime;
    }
  });
}

// Process resource production and consumption
function processResources(state: GameState, deltaTime: number) {
  // Ensure resources don't go negative (except energy, which can go into debt)
  for (const [resource, amount] of Object.entries(state.resources)) {
    if (resource !== 'energy' && amount < 0) {
      state.resources[resource] = 0;
    }
  }
  
  // Apply minimum energy - can't go below -1000
  if (state.resources.energy < -1000) {
    state.resources.energy = -1000;
    
    // When in energy debt, everything works at reduced capacity
    // This is handled in the building operations logic
  }
}

// Derived stores for UI
export const resourcesStore = derived(gameState, $state => $state.resources);
export const buildingsStore = derived(gameState, $state => $state.buildings);