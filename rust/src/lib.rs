// rust/src/lib.rs
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

// Define our chemical elements and compounds
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Molecule {
    pub formula: String,
    pub components: HashMap<String, u8>, // Element -> count
    pub energy_content: f64,             // in kJ/mol
}

// Chemical reaction definition
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Reaction {
    pub reactants: HashMap<String, f64>,  // Molecule -> mol
    pub products: HashMap<String, f64>,   // Molecule -> mol
    pub energy_delta: f64,                // in kJ (negative = exothermic)
    pub activation_energy: f64,           // in kJ/mol
    pub rate_constant: f64,               // reaction rate
}

// Building types
#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum BuildingType {
    Extractor,
    Reactor,
    Separator,
    Storage,
    PowerPlant,
    Pipe,
}

// Building definition
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Building {
    pub id: String,
    pub building_type: BuildingType,
    pub position: (f64, f64),
    pub connections: Vec<String>,
    pub input_rate: HashMap<String, f64>,    // substance -> mol/s
    pub output_rate: HashMap<String, f64>,   // substance -> mol/s
    pub temperature: f64,                    // in Kelvin
    pub pressure: f64,                       // in Pascal
    pub energy_consumption: f64,             // in Watts (J/s)
    pub energy_production: f64,              // in Watts (J/s)
}

// Game world state
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GameState {
    pub tick: u64,
    pub resources: HashMap<String, f64>,     // substance -> amount in mol
    pub buildings: Vec<Building>,
    pub energy_available: f64,               // in Joules
    pub ambient_temperature: f64,            // in Kelvin
}

// WASM exposed functions
#[wasm_bindgen]
pub fn initialize_molecules() -> JsValue {
    let mut molecules = HashMap::new();
    
    // Define some basic molecules
    let mut methane = Molecule {
        formula: "CH4".to_string(),
        components: HashMap::new(),
        energy_content: 890.0, // kJ/mol
    };
    methane.components.insert("C".to_string(), 1);
    methane.components.insert("H".to_string(), 4);
    
    let mut oxygen = Molecule {
        formula: "O2".to_string(),
        components: HashMap::new(),
        energy_content: 0.0,
    };
    oxygen.components.insert("O".to_string(), 2);
    
    // Add to our collection
    molecules.insert("methane".to_string(), methane);
    molecules.insert("oxygen".to_string(), oxygen);
    
    // Return as JS object
    JsValue::from_serde(&molecules).unwrap()
}

#[wasm_bindgen]
pub fn calculate_reaction(
    reactants_json: &str,
    reaction_json: &str,
    delta_time: f64
) -> String {
    // Parse input JSON
    let reactants: HashMap<String, f64> = serde_json::from_str(reactants_json).unwrap();
    let reaction: Reaction = serde_json::from_str(reaction_json).unwrap();
    
    // Find limiting reactant
    let mut limiting_factor = f64::MAX;
    for (reactant, required_amount) in &reaction.reactants {
        if let Some(available) = reactants.get(reactant) {
            let possible_reactions = available / required_amount;
            limiting_factor = limiting_factor.min(possible_reactions);
        } else {
            // Missing reactant
            limiting_factor = 0.0;
            break;
        }
    }
    
    // Calculate actual reaction amount based on rate and time
    let reaction_amount = limiting_factor.min(reaction.rate_constant * delta_time);
    
    // Calculate products
    let mut products = HashMap::new();
    let mut remaining_reactants = reactants.clone();
    
    // Consume reactants
    for (reactant, amount) in &reaction.reactants {
        let consumed = amount * reaction_amount;
        if let Some(remaining) = remaining_reactants.get_mut(reactant) {
            *remaining -= consumed;
        }
    }
    
    // Generate products
    for (product, amount) in &reaction.products {
        let produced = amount * reaction_amount;
        products.insert(product.clone(), produced);
    }
    
    // Calculate energy change
    let energy_change = reaction.energy_delta * reaction_amount;
    
    // Prepare result
    let result = serde_json::json!({
        "consumed": reaction.reactants.iter().map(|(k, v)| (k.clone(), v * reaction_amount)).collect::<HashMap<String, f64>>(),
        "produced": products,
        "energy_change": energy_change,
        "remaining_reactants": remaining_reactants,
        "reaction_amount": reaction_amount,
    });
    
    result.to_string()
}

#[wasm_bindgen]
pub fn update_game_state(state_json: &str, delta_time: f64) -> String {
    // Parse game state
    let mut state: GameState = serde_json::from_str(state_json).unwrap();
    
    // Process all buildings
    for building in &mut state.buildings {
        // Building-specific logic based on type
        match building.building_type {
            BuildingType::PowerPlant => {
                // Power plant consumes fuel and produces energy
                // Simplified example
                if let Some(fuel_amount) = state.resources.get_mut("methane") {
                    let fuel_consumed = building.input_rate.get("methane").unwrap_or(&0.0) * delta_time;
                    if *fuel_amount >= fuel_consumed {
                        *fuel_amount -= fuel_consumed;
                        state.energy_available += building.energy_production * delta_time;
                    }
                }
            },
            BuildingType::Reactor => {
                // Process chemical reactions
                // This is simplified - a real implementation would use the calculate_reaction function
            },
            // Handle other building types...
            _ => {}
        }
    }
    
    // Update tick
    state.tick += 1;
    
    // Return updated state
    serde_json::to_string(&state).unwrap()
}