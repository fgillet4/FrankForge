// frontend/src/lib/wasm.ts 

// Enhanced types to include temperature and pressure
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
    // New fields for temperature-dependent properties
    boiling_point?: number;   // Kelvin
    melting_point?: number;   // Kelvin
    vapor_pressure?: number;  // Function of temperature
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
    catalyst_name?: string;
    temperature: number;
    pressure: number;
    error?: string;
  }
  
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

  // Enhanced version of the processReaction function
  export function processReactionEnhanced(
    reaction: Reaction,
    availableResources: Record<string, number>,
    temperature: number,
    pressure: number,
    deltaTime: number,
    catalystPresent: boolean
  ): EnhancedReactionResult {
    if (!isInitialized) {
      throw new Error('WASM module not initialized');
    }
    
    // For development, simulate the enhanced reaction with temperature and pressure effects
    const temperatureFactor = Math.exp(-reaction.activation_energy / (0.008314 * temperature));
    
    // Simplified pressure effect
    const pressureFactor = (pressure / 101325.0);
    
    // Simplified reaction calculation
    let reactionAmount = 1.0 * temperatureFactor * pressureFactor * deltaTime;
    
    // Calculate limitingFactor based on available resources
    const limitingFactors = Object.entries(reaction.reactants).map(([reactant, amount]) => {
      const available = availableResources[reactant] || 0;
      return available / amount;
    });
    
    const limitingFactor = Math.min(...limitingFactors);
    reactionAmount = Math.min(reactionAmount, limitingFactor);
    
    // Calculate consumed and produced
    const consumed: Record<string, number> = {};
    const produced: Record<string, number> = {};
    
    Object.entries(reaction.reactants).forEach(([reactant, amount]) => {
      consumed[reactant] = amount * reactionAmount;
    });
    
    Object.entries(reaction.products).forEach(([product, amount]) => {
      produced[product] = amount * reactionAmount;
    });
    
    // Energy change
    const energyChange = reaction.energy_delta * reactionAmount;
    
    // Calculate final temperature (simple model)
    const systemHeatCapacity = 10.0; // J/K
    const finalTemperature = temperature + energyChange / systemHeatCapacity;
    
    // Return the enhanced result
    return {
      reaction_name: reaction.name,
      reaction_amount: reactionAmount,
      consumed,
      produced,
      energy_change: energyChange,
      temperature_factor: temperatureFactor,
      pressure_factor: pressureFactor,
      final_temperature: finalTemperature,
      reaction_rate: reaction.rate_constant * temperatureFactor * pressureFactor,
      catalyst_used: catalystPresent && reaction.catalyst !== undefined,
      catalyst_name: reaction.catalyst,
      temperature,
      pressure
    };
    
    /* When the WASM implementation is ready, replace with:
    
    const reactionJson = JSON.stringify(reaction);
    const resourcesJson = JSON.stringify(availableResources);
    
    const resultJson = wasmModule.process_reaction_enhanced(
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