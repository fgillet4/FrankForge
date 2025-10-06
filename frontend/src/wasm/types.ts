// Type definitions for WASM module integration

// Chemical element
export interface Element {
  symbol: string;
  name: string;
  atomic_number: number;
  atomic_mass: number;
}

// Physical state of a molecule
export type MoleculeState = 'Solid' | 'Liquid' | 'Gas' | 'Plasma';

// Molecule
export interface Molecule {
  formula: string;
  name: string;
  elements: Record<string, number>;  // Element symbol -> count
  energy_content: number;            // kJ/mol
  state: MoleculeState;              // Physical state at standard conditions
  density: number;                   // kg/m³
  specific_heat: number;             // J/(kg·K)
}

// Chemical reaction
export interface Reaction {
  name: string;
  reactants: Record<string, number>;   // Molecule formula -> mol
  products: Record<string, number>;    // Molecule formula -> mol
  energy_delta: number;                // kJ (negative = exothermic)
  activation_energy: number;           // kJ/mol
  rate_constant: number;               // Base rate (mol/s)
  catalyst: string | null;             // Optional catalyst
  catalyst_effect: number;             // Multiplier to rate when catalyst present
  min_temperature: number;             // Minimum temperature (K) for reaction to occur
  max_temperature: number;             // Maximum temperature (K) for reaction to occur
  min_pressure: number;                // Minimum pressure (Pa) for reaction to occur
  max_pressure: number;                // Maximum pressure (Pa) for reaction to occur
}

// Enhanced reaction result with temperature and pressure effects
export interface EnhancedReactionResult {
  reaction_name: string;
  reaction_amount: number;
  consumed: Record<string, number>;
  produced: Record<string, number>;
  energy_change: number;
  temperature_factor: number;
  pressure_factor: number;
  final_temperature: number;
  reaction_rate: number;
  catalyst_used: boolean;
  catalyst_name: string | null;
}

// Building types
export enum BuildingType {
  Extractor = 'Extractor',
  Reactor = 'Reactor',
  Separator = 'Separator',
  Storage = 'Storage',
  PowerPlant = 'PowerPlant',
  Pipe = 'Pipe'
}

// Building
export interface Building {
  id: string;
  building_type: BuildingType;
  position: [number, number];
  connections: string[];
  input_rate: Record<string, number>;    // substance -> mol/s
  output_rate: Record<string, number>;   // substance -> mol/s
  temperature: number;                   // in Kelvin
  pressure: number;                      // in Pascal
  energy_consumption: number;            // in Watts (J/s)
  energy_production: number;             // in Watts (J/s)
}

// Game world state for WASM simulation
export interface GameState {
  tick: number;
  resources: Record<string, number>;     // substance -> amount in mol
  buildings: Building[];
  energy_available: number;              // in Joules
  ambient_temperature: number;           // in Kelvin
}

// Reaction input for simulation
export interface ReactionInput {
  reactants: Record<string, number>;    // Available reactants (formula -> amount)
  reaction: string;                     // Reaction name
  temperature: number;                  // in Kelvin
  pressure: number;                     // in Pascal
  delta_time: number;                   // Time step in seconds
  catalyst_present: boolean;            // Whether a catalyst is present
}

// Reaction output from simulation
export interface ReactionOutput {
  consumed: Record<string, number>;     // Consumed reactants
  produced: Record<string, number>;     // Produced products
  energy_change: number;                // Energy change in kJ
  remaining: Record<string, number>;    // Remaining reactants
}