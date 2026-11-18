//! Building prototypes: footprint, the vessels inside, where the pipe ports are, and what the
//! building does to the process network and the grid.

use serde::Serialize;

#[derive(Clone, Copy, Debug, Serialize)]
pub enum At {
    Bottom,
    Middle,
    Top,
}

/// A pipe port on the tile just outside the footprint (rotation 0 coordinates, origin at the
/// footprint's top-left tile). `vessel` indexes the building's vessels; link buildings use 0 for the
/// inlet side and 1 for the outlet side.
#[derive(Clone, Copy, Debug, Serialize)]
pub struct PortDef {
    pub dx: i32,
    pub dy: i32,
    pub vessel: usize,
    pub at: At,
    pub label: &'static str,
}

#[derive(Clone, Copy, Debug, Serialize)]
pub struct VesselDef {
    pub volume: f64,
    pub height: f64,
    pub design_bar: f64,
    pub reactions: &'static [&'static str],
    pub cat_volume: f64,
    pub pilot: bool,
    pub ua_ambient: f64,
    pub radiating_area: f64,
}

const fn vessel(volume: f64, height: f64, design_bar: f64) -> VesselDef {
    VesselDef { volume, height, design_bar, reactions: &[], cat_volume: 0.0, pilot: false, ua_ambient: 20.0, radiating_area: 0.0 }
}

const fn reactor(volume: f64, height: f64, design_bar: f64, reactions: &'static [&'static str], cat_volume: f64, ua_ambient: f64) -> VesselDef {
    VesselDef { volume, height, design_bar, reactions, cat_volume, pilot: false, ua_ambient, radiating_area: 0.0 }
}

const fn firebox(volume: f64, height: f64) -> VesselDef {
    VesselDef {
        volume, height, design_bar: 3.0, reactions: &["burn_ch4", "burn_h2", "burn_co"], cat_volume: volume, pilot: true,
        ua_ambient: 200.0, radiating_area: 6.0,
    }
}

/// Link buildings put a single pipe element between their two ports.
#[derive(Clone, Copy, Debug, Serialize)]
pub enum LinkDef {
    Valve,
    Check,
    /// Spring relief valve, its set pressure on the building.
    Relief,
    Pump { dp_bar: f64, q_max: f64 },
    Compressor { ratio_max: f64 },
    Turbine { flow_coeff: f64 },
    /// A plain pipe from a fixed reservoir (vents and stacks), with its bore [m].
    Open { diameter: f64 },
}

#[derive(Clone, Copy, Debug, Serialize)]
pub enum Source {
    /// Atmosphere at ambient temperature.
    Air,
    /// Groundwater at 15 °C, 3 bar.
    Groundwater,
    /// Natural gas at 37 °C, 60 bar.
    NaturalGas,
}

#[derive(Clone, Copy, Debug, Serialize)]
pub struct Proto {
    pub id: &'static str,
    pub name: &'static str,
    pub category: &'static str,
    pub description: &'static str,
    pub size: i32,
    pub vessels: &'static [VesselDef],
    pub ports: &'static [PortDef],
    /// Heat-transfer walls between vessels: (a, b, UA W/K).
    pub thermal: &'static [(usize, usize, f64)],
    pub link: Option<LinkDef>,
    pub source: Option<Source>,
    /// Electrical demand when running [W]. What it powers depends on the building.
    pub power_w: f64,
    /// Electrical generation rating [W].
    pub generator_w: f64,
    pub battery_j: f64,
    pub heater: bool,
    pub electrolyser: bool,
    pub fans: bool,
    /// Resource that must lie under the footprint.
    pub needs: Option<&'static str>,
    /// Power poles: how far a wire reaches to the next pole, and the half-width of the square
    /// around the pole's centre whose buildings it powers [tiles].
    pub wire: f64,
    pub supply: f64,
    /// Burns what it vents (flare stacks): emissions count as combustion products.
    pub burns: bool,
    /// Stirred: its heat-transfer walls work at full strength only while the agitator has power.
    pub agitated: bool,
    /// The player picks which reaction runs in the first vessel.
    pub selectable: bool,
    /// A generator driven from outside the process network (burning solid fuel): it delivers
    /// its rating times its demand fraction, which the frontend sets while it has fuel.
    pub fueled: bool,
    /// Pipes: the heights it carries a line at (0 ground, 1 low rack, 2 high rack). A riser
    /// carries one at every height and joins them.
    pub levels: &'static [u8],
}

const fn port(dx: i32, dy: i32, vessel: usize, at: At, label: &'static str) -> PortDef {
    PortDef { dx, dy, vessel, at, label }
}

const BASE: Proto = Proto {
    id: "", name: "", category: "", description: "", size: 1, vessels: &[], ports: &[], thermal: &[], link: None,
    source: None, power_w: 0.0, generator_w: 0.0, battery_j: 0.0, heater: false, electrolyser: false, fans: false, needs: None,
    wire: 0.0, supply: 0.0, burns: false, agitated: false, selectable: false, fueled: false, levels: &[],
};

use At::*;

pub const PROTOS: &[Proto] = &[
    Proto {
        id: "pipe", name: "Pipe", category: "Logistics",
        description: "150 mm steel pipe. Connected pipes form one segment; every connection to it is a real length of pipe with friction.",
        levels: &[0],
        ..BASE
    },
    Proto {
        id: "pipe_rack", name: "Pipe on a low rack", category: "Logistics",
        description: "Pipe carried on a steel trestle over everything else. It joins only other low-rack pipe and risers, so belts, roads and ground pipe pass underneath.",
        levels: &[1],
        ..BASE
    },
    Proto {
        id: "pipe_rack_high", name: "Pipe on a high rack", category: "Logistics",
        description: "Pipe on the upper tier of a rack, over the low rack: lines can cross lines.",
        levels: &[2],
        ..BASE
    },
    Proto {
        id: "pipe_riser", name: "Pipe riser", category: "Logistics",
        description: "A vertical pipe that joins the ground and both rack heights on its tile.",
        levels: &[0, 1, 2],
        ..BASE
    },
    Proto {
        id: "valve", name: "Gate valve", category: "Logistics",
        description: "Throttles or shuts a line. The loss coefficient climbs steeply as it closes.",
        ports: &[port(-1, 0, 0, Middle, "A"), port(1, 0, 1, Middle, "B")], link: Some(LinkDef::Valve), ..BASE
    },
    Proto {
        id: "relief_valve", name: "Relief valve", category: "Logistics",
        description: "A spring holds it shut until the inlet reaches its set pressure; then it lifts and vents to the outlet, wide open by 10% over, and reseats once the inlet falls 7% below set. One way only (in → out). Pipe its outlet to a vent or flare.",
        ports: &[port(-1, 0, 0, Middle, "in"), port(1, 0, 1, Middle, "out")], link: Some(LinkDef::Relief), ..BASE
    },
    Proto {
        id: "check_valve", name: "Check valve", category: "Logistics",
        description: "Lets flow pass one way only (A → B).",
        ports: &[port(-1, 0, 0, Middle, "in"), port(1, 0, 1, Middle, "out")], link: Some(LinkDef::Check), ..BASE
    },
    Proto {
        id: "pump", name: "Centrifugal pump", category: "Logistics",
        description: "Adds up to 6 bar of head, falling off along its curve toward 0.05 m³/s (180 m³/h). Trim the impeller or slow it with a VFD to move the operating point. 22 kW motor.",
        ports: &[port(-1, 0, 0, Middle, "suction"), port(1, 0, 1, Middle, "discharge")],
        link: Some(LinkDef::Pump { dp_bar: 6.0, q_max: 0.05 }), power_w: 22e3, ..BASE
    },
    Proto {
        id: "compressor", name: "Gas compressor", category: "Logistics",
        description: "Raises gas pressure up to 4× per stage. Shaft work heats the gas — cool it between stages. 1.5 MW.",
        size: 2, ports: &[port(-1, 0, 0, Middle, "suction"), port(2, 1, 1, Middle, "discharge")],
        link: Some(LinkDef::Compressor { ratio_max: 4.0 }), power_w: 1.5e6, ..BASE
    },
    Proto {
        id: "storage_tank", name: "Storage tank", category: "Storage",
        description: "150 m³ atmospheric tank, 8 m tall, rated 3 bar. Bottom nozzles draw liquid; the top nozzle draws gas.",
        size: 3, vessels: &[vessel(150.0, 8.0, 3.0)],
        ports: &[port(1, -1, 0, Bottom, "bottom"), port(3, 1, 0, Bottom, "bottom"), port(1, 3, 0, Bottom, "bottom"), port(-1, 1, 0, Top, "top")],
        ..BASE
    },
    Proto {
        id: "gas_sphere", name: "Pressure sphere", category: "Storage",
        description: "40 m³ sphere rated 30 bar for compressed gases and pressurised liquids.",
        size: 3, vessels: &[vessel(40.0, 4.2, 30.0)],
        ports: &[port(1, -1, 0, Top, "top"), port(1, 3, 0, Bottom, "bottom")], ..BASE
    },
    Proto {
        id: "water_well", name: "Water well", category: "Extraction",
        description: "Pumps groundwater (15 °C, 3 bar aquifer) with a 5 bar well pump. Place on water. 75 kW.",
        size: 2, ports: &[port(2, 0, 1, Middle, "out")], link: Some(LinkDef::Pump { dp_bar: 5.0, q_max: 0.03 }),
        source: Some(Source::Groundwater), power_w: 75e3, needs: Some("water"), ..BASE
    },
    Proto {
        id: "gas_well", name: "Gas well", category: "Extraction",
        description: "Natural gas (90 % CH₄, ethane, CO₂, N₂) flowing from a 60 bar reservoir through the wellhead choke. Place on methane.",
        size: 2, ports: &[port(2, 0, 1, Middle, "out")], link: Some(LinkDef::Valve), source: Some(Source::NaturalGas),
        needs: Some("methane"), ..BASE
    },
    Proto {
        id: "air_intake", name: "Air blower", category: "Extraction",
        description: "Filtered atmospheric air at up to 0.5 bar above ambient, for burners and nitrogen. 100 kW.",
        size: 2, ports: &[port(2, 0, 1, Middle, "out")], link: Some(LinkDef::Pump { dp_bar: 0.5, q_max: 4.0 }),
        source: Some(Source::Air), power_w: 100e3, ..BASE
    },
    Proto {
        id: "vent", name: "Atmospheric vent", category: "Utilities",
        description: "Open to the atmosphere. Whatever reaches it escapes.",
        ports: &[port(0, 1, 1, Middle, "in")], link: Some(LinkDef::Open { diameter: 0.3 }), source: Some(Source::Air), ..BASE
    },
    Proto {
        id: "flare_stack", name: "Flare stack", category: "Utilities",
        description: "Burns off waste gas on a pilot flame, so it leaves as CO₂ and water instead of raw gas.",
        ports: &[port(0, 1, 1, Middle, "in")], link: Some(LinkDef::Open { diameter: 0.4 }), source: Some(Source::Air), burns: true, ..BASE
    },
    Proto {
        id: "fired_boiler", name: "Fired boiler", category: "Power",
        description: "A gas burner heats a 60 bar steam drum through its tube walls (UA 300 kW/K). Feed fuel and air; take flue gas from the stack.",
        size: 3, vessels: &[firebox(5.0, 2.5), vessel(6.0, 2.0, 60.0)], thermal: &[(0, 1, 3e5)],
        ports: &[
            port(-1, 0, 0, Bottom, "fuel"), port(-1, 2, 0, Bottom, "air"), port(1, -1, 0, Top, "flue"),
            port(3, 2, 1, Bottom, "feedwater"), port(3, 0, 1, Top, "steam"),
        ],
        ..BASE
    },
    Proto {
        id: "steam_turbine", name: "Steam turbine", category: "Power",
        description: "Expands steam isentropically (80 % efficient) to the exhaust pressure; the governor opens its valve to follow grid frequency. 10 MW.",
        size: 3, ports: &[port(-1, 1, 0, Top, "steam in"), port(3, 1, 1, Bottom, "exhaust")],
        link: Some(LinkDef::Turbine { flow_coeff: 0.07 }), generator_w: 10e6, ..BASE
    },
    Proto {
        id: "condenser", name: "Air-cooled condenser", category: "Power",
        description: "Fin-fan condenser rejecting heat to the air (UA 150 kW/K with fans on, a fifth of that without). Low pressure keeps turbines efficient. 150 kW fans.",
        size: 3, vessels: &[VesselDef { ua_ambient: 1.5e5, ..vessel(15.0, 3.0, 5.0) }],
        ports: &[port(1, -1, 0, Top, "steam"), port(1, 3, 0, Bottom, "condensate")], power_w: 150e3, fans: true, ..BASE
    },
    Proto {
        id: "water_wheel", name: "Water wheel", category: "Power",
        description: "A paddle wheel turned by a river, driving a dynamo through a gearbox. Up to 100 kW where the current runs fast, less where the river is wide and slow. Stand it mostly in a river.",
        size: 2, generator_w: 100e3, fueled: true, needs: Some("river"), ..BASE
    },
    Proto {
        id: "solar_array", name: "Solar array", category: "Power",
        description: "150 kW peak, following the day.",
        size: 2, generator_w: 150e3, ..BASE
    },
    Proto {
        id: "battery_bank", name: "Battery bank", category: "Power",
        description: "10 MWh, ±2 MW. Answers frequency dips within a fraction of a second.",
        size: 2, battery_j: 3.6e10, generator_w: 2e6, ..BASE
    },
    Proto {
        id: "heat_exchanger", name: "Heat exchanger", category: "Processing",
        description: "Shell-and-tube, UA 80 kW/K between shell side (A) and tube side (B).",
        size: 2, vessels: &[vessel(1.5, 1.0, 40.0), vessel(0.5, 1.0, 40.0)], thermal: &[(0, 1, 8e4)],
        ports: &[
            port(-1, 0, 0, Top, "shell in"), port(2, 0, 0, Bottom, "shell out"),
            port(-1, 1, 1, Middle, "tube in"), port(2, 1, 1, Middle, "tube out"),
        ],
        ..BASE
    },
    Proto {
        id: "electric_heater", name: "Electric heater", category: "Processing",
        description: "Puts 1 MW of electrical heat straight into the stream.",
        size: 2, vessels: &[vessel(1.0, 1.0, 40.0)], ports: &[port(-1, 0, 0, Bottom, "in"), port(2, 1, 0, Top, "out")],
        power_w: 1e6, heater: true, ..BASE
    },
    Proto {
        id: "flash_drum", name: "Flash drum", category: "Processing",
        description: "Vapour–liquid separator: feed enters mid-height, vapour leaves the top, liquid the bottom. Rated 40 bar.",
        size: 2, vessels: &[vessel(6.0, 5.0, 40.0)],
        ports: &[port(-1, 0, 0, Middle, "feed"), port(0, -1, 0, Top, "vapour"), port(1, 2, 0, Bottom, "liquid")], ..BASE
    },
    Proto {
        id: "smr_reformer", name: "Steam methane reformer", category: "Reactors",
        description: "Nickel-catalyst tubes (CH₄ + H₂O ⇌ CO + 3H₂, plus shift) fired from outside. Needs ~800 °C — and steam, or it cokes in real life.",
        size: 4,
        vessels: &[reactor(3.0, 4.0, 40.0, &["smr", "wgs"], 2.5, 50.0), firebox(8.0, 4.0)], thermal: &[(1, 0, 2.5e5)],
        ports: &[
            port(-1, 0, 0, Top, "feed"), port(4, 0, 0, Bottom, "syngas"),
            port(-1, 2, 1, Bottom, "fuel"), port(-1, 3, 1, Bottom, "air"), port(1, -1, 1, Top, "flue"),
        ],
        ..BASE
    },
    Proto {
        id: "shift_reactor", name: "Shift reactor", category: "Reactors",
        description: "Iron–chrome catalyst: CO + H₂O ⇌ CO₂ + H₂. Exothermic, so it favours conversion when cooler (but it is slow below 200 °C).",
        size: 2, vessels: &[reactor(4.0, 4.0, 40.0, &["wgs"], 3.0, 300.0)],
        ports: &[port(0, -1, 0, Top, "in"), port(1, 2, 0, Bottom, "out")], ..BASE
    },
    Proto {
        id: "ammonia_converter", name: "Ammonia converter", category: "Reactors",
        description: "Promoted-iron catalyst at high pressure: N₂ + 3H₂ ⇌ 2NH₃. Rated 300 bar; the loop cooler removes 10 kW/K.",
        size: 3, vessels: &[reactor(5.0, 5.0, 300.0, &["haber"], 4.0, 1e4)],
        ports: &[port(-1, 1, 0, Top, "in"), port(3, 1, 0, Bottom, "out")], ..BASE
    },
    Proto {
        id: "methanol_reactor", name: "Methanol reactor", category: "Reactors",
        description: "Cu/ZnO catalyst: CO + 2H₂ ⇌ CH₃OH at 50–100 bar, cooled at 20 kW/K. Rated 120 bar.",
        size: 2, vessels: &[reactor(4.0, 4.0, 120.0, &["methanol"], 3.0, 2e4)],
        ports: &[port(-1, 0, 0, Top, "in"), port(2, 1, 0, Bottom, "out")], ..BASE
    },
    Proto {
        id: "cracker_furnace", name: "Cracking furnace", category: "Reactors",
        description: "Thermal cracking of ethane to ethylene in fired coils above ~650 °C.",
        size: 3, vessels: &[reactor(1.5, 3.0, 10.0, &["cracking"], 1.5, 50.0), firebox(5.0, 3.0)], thermal: &[(1, 0, 1.5e5)],
        ports: &[
            port(-1, 0, 0, Top, "feed"), port(3, 0, 0, Bottom, "product"),
            port(-1, 2, 1, Bottom, "fuel"), port(1, 3, 1, Bottom, "air"), port(1, -1, 1, Top, "flue"),
        ],
        ..BASE
    },
    Proto {
        id: "electrolyser", name: "Electrolyser", category: "Reactors",
        description: "Splits water with 5 MW at 1.9 V per cell (≈65 % efficient): hydrogen at the cathode, oxygen at the anode.",
        size: 3, vessels: &[vessel(2.0, 2.0, 30.0), vessel(1.0, 2.0, 30.0)],
        ports: &[port(-1, 1, 0, Bottom, "water"), port(1, -1, 0, Top, "H₂"), port(3, 1, 1, Top, "O₂")],
        power_w: 5e6, electrolyser: true, ..BASE
    },
    Proto {
        id: "cstr", name: "Jacketed CSTR", category: "Reactors",
        description: "A stirred-tank reactor (6 m³, 40 bar, catalysed) inside a 2 m³ jacket (UA 100 kW/K while the 30 kW agitator runs, a third of that without). Pick its reaction; run steam or cooling water through the jacket.",
        size: 3, vessels: &[reactor(6.0, 3.0, 40.0, &["methanol"], 3.0, 30.0), vessel(2.0, 3.0, 50.0)], thermal: &[(0, 1, 1e5)],
        ports: &[
            port(-1, 1, 0, Middle, "feed"), port(1, -1, 0, Top, "vapour"), port(1, 3, 0, Bottom, "product"),
            port(3, 2, 1, Bottom, "jacket in"), port(3, 0, 1, Top, "jacket out"),
        ],
        power_w: 30e3, agitated: true, selectable: true, ..BASE
    },
    Proto {
        id: "power_pole", name: "Power pole", category: "Power",
        description: "Wires reach 7.5 tiles to the next pole; powers buildings in the 5×5 area around it.",
        wire: 7.5, supply: 2.5, ..BASE
    },
    Proto {
        id: "burner_generator", name: "Burner generator", category: "Power",
        description: "A small steam engine and dynamo burning wood or solid fuel at 35 % efficiency. 250 kW.",
        size: 2, generator_w: 250e3, fueled: true, ..BASE
    },
    Proto {
        id: "substation", name: "Substation", category: "Power",
        description: "Wires reach 18 tiles; powers buildings in the 18×18 area around it.",
        size: 2, wire: 18.0, supply: 9.0, ..BASE
    },
    // Solid logistics and production. The item side of these lives in the frontend; here they take
    // up tiles and, if electric, draw from the grid.
    Proto { id: "transport_belt", name: "Transport belt", category: "Belts", description: "Carries items along. 7.5 items/s.", ..BASE },
    Proto { id: "underground_belt", name: "Underground belt", category: "Belts", description: "An entrance or exit; items pass under up to 4 tiles between a pair.", ..BASE },
    Proto { id: "splitter", name: "Splitter", category: "Belts", description: "Splits a belt between the two belts beside it, and merges them back.", ..BASE },
    Proto { id: "burner_inserter", name: "Burner inserter", category: "Belts", description: "Moves items from behind it to in front, slowly, burning a little of any fuel it handles.", ..BASE },
    Proto { id: "inserter", name: "Inserter", category: "Belts", description: "Moves items from the tile behind it to the tile in front. 13 kW.", power_w: 13e3, ..BASE },
    Proto { id: "wooden_chest", name: "Wooden chest", category: "Belts", description: "16 slots of storage.", ..BASE },
    Proto { id: "iron_chest", name: "Iron chest", category: "Belts", description: "32 slots of storage.", ..BASE },
    Proto { id: "burner_drill", name: "Burner mining drill", category: "Production", description: "Mines ore under it, burning wood, coal, charcoal or solid fuel. 0.25 ore/s.", size: 2, ..BASE },
    Proto { id: "electric_drill", name: "Electric mining drill", category: "Production", description: "Mines ore under it. 0.5 ore/s, 90 kW.", size: 3, power_w: 90e3, ..BASE },
    Proto { id: "stone_furnace", name: "Stone furnace", category: "Production", description: "Smelts ore into plates, burning wood, coal, charcoal or solid fuel.", size: 2, ..BASE },
    Proto {
        id: "charcoal_kiln", name: "Charcoal kiln", category: "Production",
        description: "A kolmila: a turf-covered stack of logs that smoulders without air, charring 4 wood into 1 charcoal. Needs no fuel; part of each charge burns to char the rest.",
        size: 3, ..BASE
    },
    Proto { id: "electric_furnace", name: "Electric furnace", category: "Production", description: "Smelts ore into plates twice as fast as stone. 180 kW.", size: 3, power_w: 180e3, ..BASE },
    Proto { id: "assembler", name: "Assembling machine", category: "Production", description: "Crafts a chosen recipe from the items inserted into it. 150 kW.", size: 3, power_w: 150e3, ..BASE },
    Proto {
        id: "chemical_plant", name: "Chemical plant", category: "Production",
        description: "Turns piped-in chemicals into solid products, such as plastic from ethylene and solid fuel from methane. 210 kW.",
        size: 3, vessels: &[vessel(2.0, 2.0, 20.0)], ports: &[port(-1, 1, 0, Middle, "feed"), port(3, 1, 0, Middle, "feed")],
        power_w: 210e3, ..BASE
    },
    Proto { id: "lab", name: "Lab", category: "Science", description: "Researches technologies from science packs. 60 kW.", size: 3, power_w: 60e3, ..BASE },
    Proto { id: "gun_turret", name: "Gun turret", category: "Defense", description: "Shoots aliens in range with the magazines loaded into it.", size: 2, ..BASE },
    Proto { id: "laser_turret", name: "Laser turret", category: "Defense", description: "Burns aliens in range with grid power: 10 kW idle, 600 kW firing.", size: 2, power_w: 600e3, ..BASE },
];

impl Proto {
    /// Buildings with no part in the process network or the grid: the frontend runs them alone.
    pub fn plain(&self) -> bool {
        self.vessels.is_empty() && self.ports.is_empty() && self.link.is_none() && self.source.is_none()
            && self.power_w == 0.0 && self.generator_w == 0.0 && self.battery_j == 0.0 && self.wire == 0.0
    }
}

pub fn proto(id: &str) -> Option<usize> {
    PROTOS.iter().position(|p| p.id == id)
}

/// Rotates a footprint-relative point by `rot` quarter turns clockwise.
pub fn rotate(size: i32, rot: u8, x: i32, y: i32) -> (i32, i32) {
    match rot % 4 {
        0 => (x, y),
        1 => (size - 1 - y, x),
        2 => (size - 1 - x, size - 1 - y),
        _ => (y, size - 1 - x),
    }
}
