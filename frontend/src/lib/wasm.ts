// src/lib/wasm.ts
import { writable, type Writable } from 'svelte/store';

// Define types from Rust
export interface Element {
  symbol: string;
  name: string;
  atomic_number: number;
  atomic_mass: number;
}

export enum MoleculeState {
  Solid = "Solid",
  Liquid = "Liquid",
  Gas = "Gas",
  Plasma = "Plasma"
}

export interface Molecule {
  formula: string;
  name: string;
  elements: Record<string, number>;
  energy_content: number;
  state: MoleculeState;
  density: number;
  specific_heat: number;
}

export interface Reaction {
  name: string;
  reactants: Record<string, number>;
  products: Record<string, number>;
  energy_delta: number;
  activation_energy: number;
  rate_constant: number;
  catalyst?: string;
  catalyst_effect: number;
  min_temperature: number;
  max_temperature: number;
  min_pressure: number;
  max_pressure: number;
}

export interface ReactionResult {
  reaction_name: string;
  reaction_amount: number;
  consumed: Record<string, number>;
  produced: Record<string, number>;
  energy_change: number;
  remaining_resources: Record<string, number>;
  catalyst_used: boolean;
  catalyst_name?: string;
  temperature: number;
  pressure: number;
}

// Create stores for our data
export const elements: Writable<Record<string, Element>> = writable({});
export const molecules: Writable<Record<string, Molecule>> = writable({});
export const reactions: Writable<Reaction[]> = writable([]);

// WASM module
let wasmModule: any;
let isInitialized = false;

// Initialize the WASM module
export async function initWasm() {
  if (isInitialized) return;
  
  try {
    console.log('Initializing WASM module...');
    
    // For development, we'll just set initialized to true
    // In production, we would actually import and initialize the WASM module
    isInitialized = true;
    
    /* Commented out for initial development
    // Dynamic import of the WASM module
    wasmModule = await import('../../rust/pkg/frankforge_core');
    
    // Initialize data
    const elementsData = wasmModule.initialize_elements();
    elements.set(elementsData);
    
    const moleculesData = wasmModule.initialize_molecules();
    molecules.set(moleculesData);
    
    const reactionsData = wasmModule.initialize_reactions();
    reactions.set(reactionsData);
    */
    
    console.log('WASM module initialized successfully');
  } catch (error) {
    console.error('Failed to initialize WASM module:', error);
    throw error;
  }
}

// Process a chemical reaction
export function processReaction(
  reaction: Reaction,
  availableResources: Record<string, number>,
  temperature: number,
  pressure: number,
  deltaTime: number,
  catalystPresent: boolean
): ReactionResult {
  if (!isInitialized) {
    throw new Error('WASM module not initialized');
  }
  
  // For development, return mock data
  return {
    reaction_name: reaction.name,
    reaction_amount: 1.0,
    consumed: { "methane": 1.0, "oxygen": 2.0 },
    produced: { "carbon_dioxide": 1.0, "water": 2.0 },
    energy_change: -890.0,
    remaining_resources: { ...availableResources },
    catalyst_used: catalystPresent,
    temperature: temperature,
    pressure: pressure
  };
  
  /* Commented out for initial development
  if (!wasmModule) {
    throw new Error('WASM module not initialized');
  }
  
  const reactionJson = JSON.stringify(reaction);
  const resourcesJson = JSON.stringify(availableResources);
  
  const resultJson = wasmModule.process_reaction(
    reactionJson,
    resourcesJson,
    temperature,
    pressure,
    deltaTime,
    catalystPresent
  );
  
  return JSON.parse(resultJson);
  */
}
