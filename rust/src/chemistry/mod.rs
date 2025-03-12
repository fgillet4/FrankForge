// src/chemistry/mod.rs
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

// Element data structure
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Element {
    pub symbol: String,
    pub name: String,
    pub atomic_number: u8,
    pub atomic_mass: f64,
}

// Molecule data structure
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Molecule {
    pub formula: String,
    pub name: String,
    pub elements: HashMap<String, u8>,  // Element symbol -> count
    pub energy_content: f64,            // kJ/mol
    pub state: MoleculeState,           // Physical state at standard conditions
    pub density: f64,                   // kg/m³
    pub specific_heat: f64,             // J/(kg·K)
}

// Physical state of a molecule
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum MoleculeState {
    Solid,
    Liquid,
    Gas,
    Plasma,
}

// Phase transition
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PhaseTransition {
    pub from_state: MoleculeState,
    pub to_state: MoleculeState,
    pub energy_required: f64,  // kJ/mol
    pub temperature: f64,      // Kelvin at standard pressure
}

// Chemical reaction
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Reaction {
    pub name: String,
    pub reactants: HashMap<String, f64>,   // Molecule formula -> mol
    pub products: HashMap<String, f64>,    // Molecule formula -> mol
    pub energy_delta: f64,                 // kJ (negative = exothermic)
    pub activation_energy: f64,            // kJ/mol
    pub rate_constant: f64,                // Base rate (mol/s)
    pub catalyst: Option<String>,          // Optional catalyst
    pub catalyst_effect: f64,              // Multiplier to rate when catalyst present
    pub min_temperature: f64,              // Minimum temperature (K) for reaction to occur
    pub max_temperature: f64,              // Maximum temperature (K) for reaction to occur
    pub min_pressure: f64,                 // Minimum pressure (Pa) for reaction to occur
    pub max_pressure: f64,                 // Maximum pressure (Pa) for reaction to occur
}

// Initialize a database of common elements
#[wasm_bindgen]
pub fn initialize_elements() -> JsValue {
    let mut elements = HashMap::new();
    
    elements.insert("H".to_string(), Element {
        symbol: "H".to_string(),
        name: "Hydrogen".to_string(),
        atomic_number: 1,
        atomic_mass: 1.008,
    });
    
    elements.insert("C".to_string(), Element {
        symbol: "C".to_string(),
        name: "Carbon".to_string(),
        atomic_number: 6,
        atomic_mass: 12.011,
    });
    
    elements.insert("O".to_string(), Element {
        symbol: "O".to_string(),
        name: "Oxygen".to_string(),
        atomic_number: 8,
        atomic_mass: 15.999,
    });
    
    elements.insert("N".to_string(), Element {
        symbol: "N".to_string(),
        name: "Nitrogen".to_string(),
        atomic_number: 7,
        atomic_mass: 14.007,
    });
    
    elements.insert("S".to_string(), Element {
        symbol: "S".to_string(),
        name: "Sulfur".to_string(),
        atomic_number: 16,
        atomic_mass: 32.06,
    });
    
    // Return as JS object
    JsValue::from_serde(&elements).unwrap()
}

// Initialize a database of common molecules
#[wasm_bindgen]
pub fn initialize_molecules() -> JsValue {
    let mut molecules = HashMap::new();
    
    // Methane
    let mut methane_elements = HashMap::new();
    methane_elements.insert("C".to_string(), 1);
    methane_elements.insert("H".to_string(), 4);
    
    molecules.insert("CH4".to_string(), Molecule {
        formula: "CH4".to_string(),
        name: "Methane".to_string(),
        elements: methane_elements,
        energy_content: 890.0,  // kJ/mol
        state: MoleculeState::Gas,
        density: 0.657,         // kg/m³ at STP
        specific_heat: 2.22,    // J/(g·K)
    });
    
    // Oxygen
    let mut oxygen_elements = HashMap::new();
    oxygen_elements.insert("O".to_string(), 2);
    
    molecules.insert("O2".to_string(), Molecule {
        formula: "O2".to_string(),
        name: "Oxygen".to_string(),
        elements: oxygen_elements,
        energy_content: 0.0,
        state: MoleculeState::Gas,
        density: 1.429,         // kg/m³ at STP
        specific_heat: 0.918,   // J/(g·K)
    });
    
    // Carbon Dioxide
    let mut co2_elements = HashMap::new();
    co2_elements.insert("C".to_string(), 1);
    co2_elements.insert("O".to_string(), 2);
    
    molecules.insert("CO2".to_string(), Molecule {
        formula: "CO2".to_string(),
        name: "Carbon Dioxide".to_string(),
        elements: co2_elements,
        energy_content: -393.5, // kJ/mol (formation energy)
        state: MoleculeState::Gas,
        density: 1.98,          // kg/m³ at STP
        specific_heat: 0.844,   // J/(g·K)
    });
    
    // Water
    let mut water_elements = HashMap::new();
    water_elements.insert("H".to_string(), 2);
    water_elements.insert("O".to_string(), 1);
    
    molecules.insert("H2O".to_string(), Molecule {
        formula: "H2O".to_string(),
        name: "Water".to_string(),
        elements: water_elements,
        energy_content: -285.8, // kJ/mol (formation energy)
        state: MoleculeState::Liquid,
        density: 997.0,         // kg/m³ at 25°C
        specific_heat: 4.184,   // J/(g·K)
    });
    
    // Return as JS object
    JsValue::from_serde(&molecules).unwrap()
}

// Initialize common reactions
#[wasm_bindgen]
pub fn initialize_reactions() -> JsValue {
    let mut reactions = Vec::new();
    
    // Methane combustion: CH4 + 2O2 -> CO2 + 2H2O
    let mut methane_combustion_reactants = HashMap::new();
    methane_combustion_reactants.insert("CH4".to_string(), 1.0);
    methane_combustion_reactants.insert("O2".to_string(), 2.0);
    
    let mut methane_combustion_products = HashMap::new();
    methane_combustion_products.insert("CO2".to_string(), 1.0);
    methane_combustion_products.insert("H2O".to_string(), 2.0);
    
    reactions.push(Reaction {
        name: "Methane Combustion".to_string(),
        reactants: methane_combustion_reactants,
        products: methane_combustion_products,
        energy_delta: -890.0,           // Exothermic
        activation_energy: 50.0,        // kJ/mol
        rate_constant: 10.0,            // Base rate in mol/s
        catalyst: None,
        catalyst_effect: 1.0,
        min_temperature: 400.0,         // K
        max_temperature: 2000.0,        // K
        min_pressure: 101325.0,         // Pa (1 atm)
        max_pressure: 10132500.0,       // Pa (100 atm)
    });
    
    // Water electrolysis: 2H2O -> 2H2 + O2
    let mut electrolysis_reactants = HashMap::new();
    electrolysis_reactants.insert("H2O".to_string(), 2.0);
    
    let mut electrolysis_products = HashMap::new();
    electrolysis_products.insert("H2".to_string(), 2.0);
    electrolysis_products.insert("O2".to_string(), 1.0);
    
    reactions.push(Reaction {
        name: "Water Electrolysis".to_string(),
        reactants: electrolysis_reactants,
        products: electrolysis_products,
        energy_delta: 571.6,            // Endothermic
        activation_energy: 80.0,        // kJ/mol
        rate_constant: 2.0,             // Base rate in mol/s
        catalyst: Some("Platinum".to_string()),
        catalyst_effect: 5.0,           // 5x faster with platinum catalyst
        min_temperature: 273.15,        // K (0°C)
        max_temperature: 373.15,        // K (100°C at 1 atm)
        min_pressure: 101325.0,         // Pa (1 atm)
        max_pressure: 10132500.0,       // Pa (100 atm)
    });
    
    // Return as JS object
    JsValue::from_serde(&reactions).unwrap()
}

// Process a chemical reaction with given conditions
#[wasm_bindgen]
pub fn process_reaction(
    reaction_json: &str,
    available_resources_json: &str,
    temperature: f64,
    pressure: f64,
    delta_time: f64,
    catalyst_present: bool
) -> String {
    // Parse inputs
    let reaction: Reaction = match serde_json::from_str(reaction_json) {
        Ok(r) => r,
        Err(_) => return json!({ "error": "Invalid reaction JSON" }).to_string(),
    };
    
    let available_resources: HashMap<String, f64> = match serde_json::from_str(available_resources_json) {
        Ok(r) => r,
        Err(_) => return json!({ "error": "Invalid resources JSON" }).to_string(),
    };
    
    // Check if reaction can occur at current temperature and pressure
    if temperature < reaction.min_temperature || temperature > reaction.max_temperature {
        return json!({ 
            "error": "Temperature out of range",
            "current": temperature,
            "range": { "min": reaction.min_temperature, "max": reaction.max_temperature }
        }).to_string();
    }
    
    if pressure < reaction.min_pressure || pressure > reaction.max_pressure {
        return json!({ 
            "error": "Pressure out of range",
            "current": pressure,
            "range": { "min": reaction.min_pressure, "max": reaction.max_pressure }
        }).to_string();
    }
    
    // Calculate limiting reactant
    let mut limiting_factor = f64::MAX;
    for (reactant, required_amount) in &reaction.reactants {
        let available = match available_resources.get(reactant) {
            Some(amount) => *amount,
            None => 0.0,
        };
        
        if available <= 0.0 {
            return json!({ 
                "error": "Missing reactant",
                "reactant": reactant 
            }).to_string();
        }
        
        let possible_reactions = available / required_amount;
        limiting_factor = limiting_factor.min(possible_reactions);
    }
    
    // Calculate actual reaction rate
    // Higher temperature increases rate (simplified Arrhenius equation)
    let temperature_factor = ((temperature - 273.15) / 100.0).exp();
    
    // Catalyst effect
    let catalyst_factor = if catalyst_present && reaction.catalyst.is_some() {
        reaction.catalyst_effect
    } else {
        1.0
    };
    
    // Calculate actual reaction amount
    let max_possible = limiting_factor;
    let rate = reaction.rate_constant * temperature_factor * catalyst_factor;
    let reaction_amount = max_possible.min(rate * delta_time);
    
    // Calculate consumed reactants
    let mut consumed = HashMap::new();
    for (reactant, amount) in &reaction.reactants {
        consumed.insert(reactant.clone(), amount * reaction_amount);
    }
    
    // Calculate produced products
    let mut produced = HashMap::new();
    for (product, amount) in &reaction.products {
        produced.insert(product.clone(), amount * reaction_amount);
    }
    
    // Calculate energy change
    let energy_change = reaction.energy_delta * reaction_amount;
    
    // Calculate remaining resources
    let mut remaining = available_resources.clone();
    for (reactant, amount) in &consumed {
        if let Some(remaining_amount) = remaining.get_mut(reactant) {
            *remaining_amount -= amount;
            // Prevent negative values due to floating point errors
            if *remaining_amount < 1e-10 {
                *remaining_amount = 0.0;
            }
        }
    }
    
    // Add produced resources to remaining
    for (product, amount) in &produced {
        *remaining.entry(product.clone()).or_insert(0.0) += amount;
    }
    
    // Prepare result
    json!({
        "reaction_name": reaction.name,
        "reaction_amount": reaction_amount,
        "consumed": consumed,
        "produced": produced,
        "energy_change": energy_change,
        "remaining_resources": remaining,
        "catalyst_used": catalyst_present && reaction.catalyst.is_some(),
        "catalyst_name": reaction.catalyst,
        "temperature": temperature,
        "pressure": pressure
    }).to_string()
}

// Helper function to create JSON
#[macro_export]
macro_rules! json {
    ($($json:tt)+) => {
        serde_json::json!($($json)+)
    };
}