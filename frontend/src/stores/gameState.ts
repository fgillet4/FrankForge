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
}

export interface Building {
  id: string;
  type: string;
  position: { x: number; y: number };
  connections: string[];
}

// Initialize default game state
const createGameState = () => {
  return writable<GameState>({
    tick: 0,
    isPaused: false,
    resources: {
      methane: 100,
      oxygen: 100,
      water: 100,
    },
    buildings: [],
    energy: 1000,
  });
};

export const gameState = createGameState();

// Game loop function
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
      
      // Process building operations
      // This will be implemented later
      
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
