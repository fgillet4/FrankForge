//! The JavaScript-facing API: one `ProcessWorld` per game, plus the static catalogues.

use crate::thermodynamics::species::SPECIES;
use crate::world::protos::PROTOS;
use crate::world::World;
use serde::Serialize;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ProcessWorld {
    world: World,
}

#[wasm_bindgen]
impl ProcessWorld {
    #[wasm_bindgen(constructor)]
    pub fn new(ambient_k: f64) -> ProcessWorld {
        ProcessWorld { world: World::new(ambient_k) }
    }

    /// Places a building; returns an empty string on success, or why it failed.
    pub fn place(&mut self, id: u32, proto: &str, x: i32, y: i32, rot: u8) -> String {
        match self.world.place(id, proto, x, y, rot) {
            Ok(()) => String::new(),
            Err(e) => e,
        }
    }

    pub fn remove(&mut self, id: u32) -> bool {
        self.world.remove(id)
    }

    /// Id of the building covering a tile, or -1.
    pub fn entity_at(&self, x: i32, y: i32) -> i64 {
        self.world.entity_at(x, y).map(|id| id as i64).unwrap_or(-1)
    }

    /// Runs the plant forward by `seconds` of game time.
    pub fn advance(&mut self, seconds: f64) {
        self.world.advance(seconds);
    }

    pub fn set_opening(&mut self, id: u32, opening: f64) {
        self.world.set_opening(id, opening);
    }

    pub fn set_enabled(&mut self, id: u32, on: bool) {
        self.world.set_enabled(id, on);
    }

    pub fn set_reaction(&mut self, id: u32, reaction: &str) {
        self.world.set_reaction(id, reaction);
    }

    pub fn set_pump(&mut self, id: u32, trim: f64, speed: f64) {
        self.world.set_pump(id, trim, speed);
    }

    pub fn set_demand(&mut self, id: u32, fraction: f64) {
        self.world.set_demand(id, fraction);
    }

    /// Takes up to `mol` of a species out of a building's first vessel; returns what it got.
    pub fn take(&mut self, id: u32, species: &str, mol: f64) -> f64 {
        self.world.take(id, species, mol)
    }

    pub fn fill(&mut self, id: u32, species: &str, mol: f64, t: f64) {
        self.world.fill(id, species, mol, t);
    }

    pub fn black_start(&mut self) {
        self.world.black_start();
    }

    /// The whole plant as JSON (see `world::Snapshot`).
    pub fn snapshot(&mut self) -> String {
        serde_json::to_string(&self.world.snapshot()).unwrap_or_default()
    }
}

#[derive(Serialize)]
struct SpeciesInfo {
    id: &'static str,
    name: &'static str,
    formula: &'static str,
    mw: f64,
}

/// Building catalogue as JSON.
#[wasm_bindgen]
pub fn prototypes() -> String {
    serde_json::to_string(PROTOS).unwrap_or_default()
}

/// Species catalogue as JSON.
#[wasm_bindgen]
pub fn species() -> String {
    let list: Vec<SpeciesInfo> = SPECIES.iter().map(|s| SpeciesInfo { id: s.id, name: s.name, formula: s.formula, mw: s.mw }).collect();
    serde_json::to_string(&list).unwrap_or_default()
}
