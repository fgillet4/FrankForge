// WASM integration for the Rust-generated chemistry and physics modules
import type { 
  GameState,
  Molecule, 
  Reaction,
  Element,
  MoleculeState,
  EnhancedReactionResult 
} from './types';

// Module and cache storage
let wasmModule: any;
let isInitialized = false;

// Cache for elements, molecules, and reactions
let elementsCache: Record<string, Element> = {};
let moleculesCache: Record<string, Molecule> = {};
let reactionsCache: Reaction[] = [];

/**
 * Initialize the WASM module
 */
export async function initWasm() {
  if (isInitialized) return;
  
  try {
    console.log('Initializing WASM module...');
    
    // Import the WASM module from the Rust pkg directory
    const wasmImport = await import('../../rust/pkg/frankforge_core');
    wasmModule = wasmImport;
    
    // Initialize chemistry data
    initializeChemistryData();
    
    console.log('WASM module initialized successfully');
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize WASM module:', error);
    // Fallback to stub implementations
    setupStubImplementations();
    throw error;
  }
}

/**
 * Initialize chemistry data (elements, molecules, reactions)
 */
function initializeChemistryData() {
  if (!wasmModule) return;
  
  try {
    // Get elements, molecules, and reactions from Rust
    elementsCache = wasmModule.initialize_elements();
    moleculesCache = wasmModule.initialize_molecules();
    reactionsCache = wasmModule.initialize_reactions();
    
    console.log(`Loaded ${Object.keys(elementsCache).length} elements`);
    console.log(`Loaded ${Object.keys(moleculesCache).length} molecules`);
    console.log(`Loaded ${reactionsCache.length} reactions`);
  } catch (error) {
    console.error('Failed to initialize chemistry data:', error);
  }
}

/**
 * Set up stub implementations in case WASM loading fails
 */
function setupStubImplementations() {
  console.warn('Setting up stub implementations for WASM functions');
  
  // Create some basic chemistry data for the stub
  elementsCache = {
    'H': { symbol: 'H', name: 'Hydrogen', atomic_number: 1, atomic_mass: 1.008 },
    'O': { symbol: 'O', name: 'Oxygen', atomic_number: 8, atomic_mass: 15.999 },
    'C': { symbol: 'C', name: 'Carbon', atomic_number: 6, atomic_mass: 12.011 }
  };
  
  moleculesCache = {
    'H2O': { 
      formula: 'H2O', 
      name: 'Water', 
      elements: { 'H': 2, 'O': 1 },
      energy_content: -285.8,
      state: 'Liquid',
      density: 997.0,
      specific_heat: 4.184
    },
    'CH4': {
      formula: 'CH4',
      name: 'Methane',
      elements: { 'C': 1, 'H': 4 },
      energy_content: 890.0,
      state: 'Gas',
      density: 0.657,
      specific_heat: 2.22
    }
  };
  
  reactionsCache = [{
    name: 'Methane Combustion',
    reactants: { 'CH4': 1.0, 'O2': 2.0 },
    products: { 'CO2': 1.0, 'H2O': 2.0 },
    energy_delta: -890.0,
    activation_energy: 50.0,
    rate_constant: 10.0,
    catalyst: null,
    catalyst_effect: 1.0,
    min_temperature: 400.0,
    max_temperature: 2000.0,
    min_pressure: 101325.0,
    max_pressure: 10132500.0
  }];
}

/**
 * Get all available elements
 */
export function getElements(): Record<string, Element> {
  return elementsCache;
}

/**
 * Get all available molecules
 */
export function getMolecules(): Record<string, Molecule> {
  return moleculesCache;
}

/**
 * Get all available reactions
 */
export function getReactions(): Reaction[] {
  return reactionsCache;
}

/**
 * Get a specific reaction by name
 */
export function getReactionByName(name: string): Reaction | null {
  return reactionsCache.find(r => r.name === name) || null;
}

/**
 * Simulate a chemical reaction
 */
export function simulateChemicalReaction(
  reactants: Record<string, number>,
  reactionName: string,
  temperature: number = 298.15, // 25°C in Kelvin
  pressure: number = 101325,    // 1 atm in Pascals
  deltaTime: number = 1.0,      // 1 second
  catalystPresent: boolean = false
): {
  consumed: Record<string, number>,
  produced: Record<string, number>,
  energyChange: number
} {
  console.log(`Simulating reaction: ${reactionName}`, reactants);
  
  // Check if WASM is initialized
  if (!isInitialized || !wasmModule) {
    console.warn('WASM not initialized, using stub implementation');
    // Return dummy results
    return {
      consumed: { 'CH4': 1.0, 'O2': 2.0 },
      produced: { 'CO2': 1.0, 'H2O': 2.0 },
      energyChange: -890.0
    };
  }
  
  try {
    // Find the reaction
    const reaction = getReactionByName(reactionName);
    if (!reaction) {
      throw new Error(`Reaction not found: ${reactionName}`);
    }
    
    // Call the Rust function
    const result = wasmModule.process_reaction_enhanced(
      JSON.stringify(reaction),
      JSON.stringify(reactants),
      temperature,
      pressure,
      deltaTime,
      catalystPresent
    );
    
    // Parse the result
    const parsedResult = JSON.parse(result);
    
    // Check for errors
    if (parsedResult.error) {
      throw new Error(`Reaction error: ${parsedResult.error}`);
    }
    
    // Return the results
    return {
      consumed: parsedResult.consumed,
      produced: parsedResult.produced,
      energyChange: parsedResult.energy_change
    };
  } catch (error) {
    console.error('Error simulating chemical reaction:', error);
    
    // Return fallback data
    return {
      consumed: { 'CH4': 1.0, 'O2': 2.0 },
      produced: { 'CO2': 1.0, 'H2O': 2.0 },
      energyChange: -890.0
    };
  }
}

/**
 * Update game state using the WASM physics simulation
 */
export function updateGameState(
  state: GameState,
  deltaTime: number
): GameState {
  if (!isInitialized || !wasmModule) {
    console.warn('WASM not initialized, using stub implementation for game state update');
    return state;
  }
  
  try {
    const result = wasmModule.update_game_state(
      JSON.stringify(state),
      deltaTime
    );
    
    return JSON.parse(result);
  } catch (error) {
    console.error('Error updating game state with WASM:', error);
    return state;
  }
}

/**
 * Get detailed information about a specific molecule
 */
export function getMoleculeDetails(formula: string): Molecule | null {
  return moleculesCache[formula] || null;
}

/**
 * Calculate energy available from combusting a specific amount of fuel
 */
export function calculateEnergyFromFuel(
  fuelType: string,
  amount: number
): number {
  const molecule = getMoleculeDetails(fuelType);
  if (!molecule) return 0;
  
  // Energy in kJ = amount (in mol) * energy content (kJ/mol)
  return amount * Math.abs(molecule.energy_content);
}
