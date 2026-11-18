//! The tile world: buildings on a grid, pipe segments, and the process network and grid built
//! from them.
//!
//! Like Factorio 2.0, connected pipe tiles merge into one segment that shares its contents, which
//! keeps big pipe networks cheap. Unlike Factorio, every port that joins a segment does so through
//! a real length of pipe (its walking distance to the segment's hub), so long runs cost pressure.
//! The network is rebuilt whenever something is placed or removed. Contents survive the rebuild:
//! buildings keep their vessels, and pipe contents are shared out tile by tile.

pub mod protos;

use crate::physics::electric::{Battery, Generator, Grid, Load, F_NOMINAL};
use crate::physics::fluid::{Network, Pipe, PipeKind, Reservoir, Vessel, P_ATM};
use crate::thermodynamics::eos::Comp;
use crate::thermodynamics::flash::{uv_flash, Flash};
use crate::thermodynamics::reaction::{reaction, REACTIONS};
use crate::thermodynamics::species::{index_of, NS, SPECIES};
use protos::{rotate, At, LinkDef, Proto, Source, PROTOS};
use serde::Serialize;
use std::collections::{BTreeMap, HashMap, VecDeque};

/// Pipe bore and wall roughness for pipe tiles [m].
pub const PIPE_DIAMETER: f64 = 0.15;
/// Smallest volume a pipe segment is given [m³].
pub const SEGMENT_MIN_VOLUME: f64 = 0.25;
/// Process time step [s].
pub const DT: f64 = 0.05;
/// One in-game day [s].
pub const DAY: f64 = 600.0;

type Tile = (i32, i32);

#[derive(Clone, Debug)]
pub struct Entity {
    pub id: u32,
    pub proto: usize,
    pub x: i32,
    pub y: i32,
    pub rot: u8,
    pub vessels: Vec<Vessel>,
    /// Valve or turbine-admission opening 0..1, and whether a consumer is switched on.
    pub opening: f64,
    pub enabled: bool,
    pub battery_charge: f64,
    /// Fraction of its rated power an electric building asks for (machines idle at a trickle).
    pub demand: f64,
    /// Pumps: impeller diameter as a fraction of full size, and VFD speed as a fraction of rated.
    pub trim: f64,
    pub speed: f64,
    /// Pumps: how far cavitation has eaten the impeller, 0..1 (1: worn through).
    pub wear: f64,
    /// Pipes: inner diameter [m].
    pub diameter: f64,
    /// Relief valves: set pressure [bar].
    pub relief_bar: f64,
    /// What it has let into the sky so far [kg], for where pollution comes from.
    pub emitted_kg: f64,
    /// Pipes: which sides join the pipe beside them, as bits for +x, -x, +y, -y. All four unless
    /// laid apart from its neighbours.
    pub joins: u8,
    /// The power network it is wired into, if any.
    pub network: Option<usize>,
    // Where this entity's parts live in the current network and grid.
    net_vessels: Vec<usize>,
    net_pipes: Vec<usize>,
    net_links: Vec<usize>,
    load: Option<usize>,
    generator: Option<usize>,
    battery: Option<usize>,
}

impl Entity {
    fn proto(&self) -> &'static Proto {
        &PROTOS[self.proto]
    }
    fn tiles(&self) -> impl Iterator<Item = Tile> + '_ {
        let s = self.proto().size;
        (0..s).flat_map(move |dy| (0..s).map(move |dx| (self.x + dx, self.y + dy)))
    }
    /// World tile of port `k`, and the tile inside the footprint it faces from.
    fn port_tile(&self, k: usize) -> (Tile, Tile) {
        let p = self.proto();
        let def = &p.ports[k];
        let (rx, ry) = rotate(p.size, self.rot, def.dx, def.dy);
        let inside = (def.dx.clamp(0, p.size - 1), def.dy.clamp(0, p.size - 1));
        let (ix, iy) = rotate(p.size, self.rot, inside.0, inside.1);
        ((self.x + rx, self.y + ry), (self.x + ix, self.y + iy))
    }
}

#[derive(Clone, Copy, Debug, Default)]
struct TileShare {
    n: Comp,
    u: f64,
    t: f64,
    p: f64,
}

#[derive(Clone, Debug, Serialize)]
pub struct Segment {
    pub tiles: Vec<Tile>,
    pub vessel: usize,
    /// Bore of the run [m]: its narrowest tile's.
    pub diameter: f64,
    /// Where it runs above the ground, on racks: (height, tile).
    pub racks: Vec<Node>,
}

/// A place a pipe can be: height (0 ground, 1 low rack, 2 high rack) and tile.
pub type Node = (u8, Tile);

pub struct World {
    pub entities: BTreeMap<u32, Entity>,
    occupied: HashMap<Tile, u32>,
    /// Pipe on racks, by height and tile (risers stand in these too).
    racks: HashMap<Node, u32>,
    pub net: Network,
    /// One grid per power network: poles wired together and the buildings they reach.
    pub grids: Vec<Grid>,
    /// Wires between poles, as pairs of pole ids.
    pub wires: Vec<(u32, u32)>,
    pub segments: Vec<Segment>,
    segment_of: HashMap<Tile, usize>,
    /// Every pipe node's segment, at any height.
    node_seg: HashMap<Node, usize>,
    pub time: f64,
    accumulator: f64,
    dirty: bool,
    pub events: Vec<String>,
    /// Totals vented to the atmosphere [mol], by species.
    pub emitted: Comp,
    /// Pipe contents per tile, saved when the network is about to be rebuilt.
    pending_shares: Option<HashMap<Node, TileShare>>,
}

/// The four sides of a tile, in the order of a pipe's join bits.
const PIPE_SIDES: [(i32, i32); 4] = [(1, 0), (-1, 0), (0, 1), (0, -1)];

/// Whether two pipe nodes side by side (b on side k of a) are joined: both must allow it.
fn joined(joins: &HashMap<Node, u8>, a: Node, k: usize, b: Node) -> bool {
    let back = k ^ 1;
    joins.get(&a).is_some_and(|m| m & (1 << k) != 0) && joins.get(&b).is_some_and(|m| m & (1 << back) != 0)
}

fn air() -> Comp {
    let mut z = [0.0; NS];
    z[index_of("n2").unwrap()] = 0.7808;
    z[index_of("o2").unwrap()] = 0.2095;
    z[index_of("co2").unwrap()] = 0.0004;
    z[index_of("h2o").unwrap()] = 0.0093;
    z
}

fn source_reservoir(s: Source, ambient: f64) -> Reservoir {
    match s {
        Source::Air => Reservoir { z: air(), t: ambient, p: P_ATM },
        Source::Groundwater => {
            let mut z = [0.0; NS];
            z[index_of("h2o").unwrap()] = 1.0;
            Reservoir { z, t: 288.15, p: 3e5 }
        }
        Source::NaturalGas => {
            let mut z = [0.0; NS];
            z[index_of("ch4").unwrap()] = 0.90;
            z[index_of("c2h6").unwrap()] = 0.05;
            z[index_of("co2").unwrap()] = 0.02;
            z[index_of("n2").unwrap()] = 0.03;
            Reservoir { z, t: 310.15, p: 60e5 }
        }
        Source::CrudeOil => {
            // By mass about 2 % gas, 25 % naphtha, 15 % kerosene, 25 % diesel and 33 % heavy oil.
            let mut z = [0.0; NS];
            for (id, x) in [("ch4", 0.167), ("c6h14", 0.388), ("c10h22", 0.142), ("c16h34", 0.147), ("c20h42", 0.156)] {
                z[index_of(id).unwrap()] = x;
            }
            Reservoir { z, t: 323.15, p: 15e5 }
        }
    }
}

fn port_height(at: At, v: &Vessel) -> f64 {
    match at {
        At::Bottom => 0.0,
        At::Middle => 0.5 * v.height,
        At::Top => v.height,
    }
}

impl World {
    pub fn new(ambient_t: f64) -> Self {
        World {
            entities: BTreeMap::new(), occupied: HashMap::new(), racks: HashMap::new(), net: Network::new(ambient_t), grids: vec![], wires: vec![],
            segments: vec![], segment_of: HashMap::new(), node_seg: HashMap::new(), time: DAY * 0.3, accumulator: 0.0, dirty: true, events: vec![],
            emitted: [0.0; NS], pending_shares: None,
        }
    }

    pub fn ambient(&self) -> f64 {
        self.net.ambient_t
    }

    /// Places a building with its top-left tile at (x, y). Fails if any tile is taken.
    pub fn place(&mut self, id: u32, proto_id: &str, x: i32, y: i32, rot: u8) -> Result<(), String> {
        let proto = protos::proto(proto_id).ok_or_else(|| format!("unknown building {proto_id}"))?;
        let p = &PROTOS[proto];
        let ambient = self.ambient();
        let vessels = p
            .vessels
            .iter()
            .map(|d| {
                let mut v = Vessel::new(d.volume, d.height, ambient);
                v.design_p = d.design_bar * 1e5;
                v.reactions = d.reactions.iter().filter_map(|r| reaction(r)).collect();
                v.cat_volume = d.cat_volume;
                v.pilot = d.pilot;
                v.ua_ambient = d.ua_ambient;
                v.radiating_area = d.radiating_area;
                v
            })
            .collect();
        let e = Entity {
            id, proto, x, y, rot: rot % 4, vessels, opening: 1.0, enabled: true, battery_charge: p.battery_j * 0.5, demand: 1.0, trim: 1.0, speed: 1.0, wear: 0.0, diameter: PIPE_DIAMETER, relief_bar: 5.0, emitted_kg: 0.0, joins: 0b1111, network: None,
            net_vessels: vec![], net_pipes: vec![], net_links: vec![], load: None, generator: None, battery: None,
        };
        let tiles: Vec<Tile> = e.tiles().collect();
        // Everything but rack pipe stands on the ground; rack pipe and risers take their heights.
        let levels = p.levels;
        let on_ground = levels.is_empty() || levels.contains(&0);
        if on_ground {
            if let Some(t) = tiles.iter().find(|t| self.occupied.contains_key(t)) {
                return Err(format!("tile {t:?} is taken"));
            }
        }
        for &l in levels.iter().filter(|&&l| l > 0) {
            if tiles.iter().any(|&t| self.racks.contains_key(&(l, t))) {
                return Err(if l == 1 { "the low rack is taken here".into() } else { "the high rack is taken here".into() });
            }
        }
        self.sync_back();
        // A pipe laid on to a run takes the run's bore.
        let mut e = e;
        if !levels.is_empty() {
            let next = levels.iter().find_map(|&l| {
                [(1, 0), (-1, 0), (0, 1), (0, -1)].iter().find_map(|d| self.pipe_at(l, (e.x + d.0, e.y + d.1)).map(|n| self.entities[&n].diameter))
            });
            if let Some(d) = next {
                e.diameter = d;
            }
        }
        for t in tiles {
            if on_ground {
                self.occupied.insert(t, id);
            }
            for &l in levels.iter().filter(|&&l| l > 0) {
                self.racks.insert((l, t), id);
            }
        }
        self.entities.insert(id, e);
        self.dirty = true;
        Ok(())
    }

    pub fn remove(&mut self, id: u32) -> bool {
        self.sync_back();
        let Some(e) = self.entities.remove(&id) else { return false };
        for t in e.tiles() {
            if self.occupied.get(&t) == Some(&id) {
                self.occupied.remove(&t);
            }
            for l in 1..=2 {
                if self.racks.get(&(l, t)) == Some(&id) {
                    self.racks.remove(&(l, t));
                }
            }
        }
        self.dirty = true;
        true
    }

    pub fn entity_at(&self, x: i32, y: i32) -> Option<u32> {
        self.occupied.get(&(x, y)).copied()
    }

    /// Turns a placed building a quarter turn clockwise, contents and all.
    pub fn rotate(&mut self, id: u32) -> bool {
        self.sync_back();
        let Some(e) = self.entities.get_mut(&id) else { return false };
        e.rot = (e.rot + 1) % 4;
        self.dirty = true;
        true
    }

    /// What's on a rack at a height (1 low, 2 high) over a tile.
    pub fn rack_at(&self, x: i32, y: i32, level: u8) -> Option<u32> {
        self.racks.get(&(level, (x, y))).copied()
    }

    /// The pipe carrying a line at a height over a tile, if there is one.
    fn pipe_at(&self, level: u8, t: Tile) -> Option<u32> {
        let id = if level == 0 { *self.occupied.get(&t)? } else { *self.racks.get(&(level, t))? };
        self.entities[&id].proto().levels.contains(&level).then_some(id)
    }

    /// Fills a building's first vessel with `mol` of a species at temperature `t` (a starting
    /// inventory or a cheat).
    pub fn fill(&mut self, id: u32, species: &str, mol: f64, t: f64) {
        self.rebuild_if_dirty();
        let Some(i) = index_of(species) else { return };
        let Some(e) = self.entities.get(&id) else { return };
        let Some(&vi) = e.net_vessels.first() else { return };
        let mut n = self.net.vessels[vi].n;
        n[i] += mol;
        self.net.fill(vi, n, t);
    }

    pub fn set_opening(&mut self, id: u32, opening: f64) {
        if let Some(e) = self.entities.get_mut(&id) {
            e.opening = opening.clamp(0.0, 1.0);
        }
    }

    /// A relief valve's set pressure [bar].
    pub fn set_relief(&mut self, id: u32, bar: f64) {
        if let Some(e) = self.entities.get_mut(&id) {
            e.relief_bar = bar.clamp(1.1, 200.0);
        }
    }

    /// Re-bores the whole pipe run a pipe belongs to [m].
    pub fn set_pipe_diameter(&mut self, id: u32, diameter: f64) {
        self.rebuild_if_dirty();
        let Some(e) = self.entities.get(&id) else { return };
        let Some(&si) = e.proto().levels.iter().find_map(|&l| self.node_seg.get(&(l, (e.x, e.y)))) else { return };
        let d = diameter.clamp(0.025, 0.6);
        let node_seg = &self.node_seg;
        for e in self.entities.values_mut() {
            if e.proto().levels.iter().any(|&l| node_seg.get(&(l, (e.x, e.y))) == Some(&si)) {
                e.diameter = d;
            }
        }
        self.dirty = true;
    }

    /// Sets which sides of a pipe join the pipe beside them (bits for +x, -x, +y, -y).
    pub fn set_pipe_joins(&mut self, id: u32, joins: u8) {
        let Some(e) = self.entities.get_mut(&id) else { return };
        if e.proto().levels.is_empty() || e.joins == joins & 0b1111 {
            return;
        }
        e.joins = joins & 0b1111;
        self.sync_back();
        self.dirty = true;
    }

    /// Sets how worn a pump's impeller is (0..1), as when loading a save.
    pub fn set_pump_wear(&mut self, id: u32, wear: f64) {
        let Some(e) = self.entities.get_mut(&id) else { return };
        e.wear = wear.clamp(0.0, 1.0);
        for &pi in &e.net_pipes {
            if let PipeKind::Pump { wear, .. } = &mut self.net.pipes[pi].kind {
                *wear = e.wear;
            }
        }
    }

    /// Trims a pump's impeller (0.7–1 of full diameter) and sets its VFD speed (0–1 of rated).
    /// The motor then asks the grid for rated power × (speed·trim)³.
    pub fn set_pump(&mut self, id: u32, trim: f64, speed: f64) {
        let Some(e) = self.entities.get_mut(&id) else { return };
        e.trim = trim.clamp(0.7, 1.0);
        e.speed = speed.clamp(0.0, 1.0);
        e.demand = (e.trim * e.speed).powi(3);
        for &pi in &e.net_pipes {
            if let Some(p) = self.net.pipes.get_mut(pi) {
                if let PipeKind::Pump { trim, speed, .. } = &mut p.kind {
                    (*trim, *speed) = (e.trim, e.speed);
                }
            }
        }
    }

    pub fn set_enabled(&mut self, id: u32, on: bool) {
        if let Some(e) = self.entities.get_mut(&id) {
            e.enabled = on;
        }
    }

    /// Chooses the reaction in a building whose reaction is selectable; an unknown id clears it.
    pub fn set_reaction(&mut self, id: u32, reaction_id: &str) {
        let r: Vec<usize> = reaction(reaction_id).into_iter().collect();
        let Some(e) = self.entities.get_mut(&id) else { return };
        if !e.proto().selectable {
            return;
        }
        if let Some(v) = e.vessels.first_mut() {
            v.reactions = r.clone();
            v.reaction_rate.clear();
        }
        if let Some(&vi) = e.net_vessels.first() {
            self.net.vessels[vi].reactions = r;
            self.net.vessels[vi].reaction_rate.clear();
        }
    }

    pub fn set_demand(&mut self, id: u32, fraction: f64) {
        if let Some(e) = self.entities.get_mut(&id) {
            e.demand = fraction.clamp(0.0, 1.0);
        }
    }

    /// Takes up to `mol` of a species out of a building's first vessel, with its share of the
    /// internal energy so the rest stays at the same temperature. Returns what it got.
    pub fn take(&mut self, id: u32, species: &str, mol: f64) -> f64 {
        self.rebuild_if_dirty();
        let Some(i) = index_of(species) else { return 0.0 };
        let Some(&vi) = self.entities.get(&id).and_then(|e| e.net_vessels.first()) else { return 0.0 };
        let v = &mut self.net.vessels[vi];
        let got = mol.min(v.n[i]).max(0.0);
        let total = v.moles();
        if got <= 0.0 || total <= 0.0 {
            return 0.0;
        }
        v.u -= v.u * got / total;
        v.n[i] -= got;
        got
    }

    /// Copies the live network state back into the buildings and records pipe contents per tile,
    /// before the network is torn down.
    fn sync_back(&mut self) {
        // Already saved since the last rebuild.
        if self.dirty {
            return;
        }
        let mut shares = HashMap::new();
        for e in self.entities.values_mut() {
            for (k, &vi) in e.net_vessels.iter().enumerate() {
                if let (Some(dst), Some(src)) = (e.vessels.get_mut(k), self.net.vessels.get(vi)) {
                    *dst = src.clone();
                }
            }
            if let (Some(n), Some(b)) = (e.network, e.battery) {
                e.battery_charge = self.grids[n].batteries[b].charge_j;
            }
        }
        for s in &self.segments {
            let v = &self.net.vessels[s.vessel];
            let nodes: Vec<Node> = s.tiles.iter().map(|&t| (0, t)).chain(s.racks.iter().copied()).collect();
            let k = nodes.len() as f64;
            for nd in nodes {
                shares.insert(nd, TileShare { n: v.n.map(|x| x / k), u: v.u / k, t: v.t(), p: v.p() });
            }
        }
        self.pending_shares = Some(shares);
    }

    fn rebuild_if_dirty(&mut self) {
        if self.dirty {
            self.rebuild();
        }
    }

    fn rebuild(&mut self) {
        let shares = self.pending_shares.take().unwrap_or_default();
        let ambient = self.ambient();
        // Each grid's state follows its poles through the rebuild.
        let old_grids: HashMap<u32, (f64, bool, f64)> = self
            .entities
            .values()
            .filter(|e| e.proto().wire > 0.0)
            .filter_map(|e| e.network.and_then(|n| self.grids.get(n)).map(|g| (e.id, (g.frequency, g.blackout, g.setpoint))))
            .collect();
        let old_flows: HashMap<(u32, usize), f64> = self
            .entities
            .values()
            .flat_map(|e| e.net_pipes.iter().enumerate().filter_map(move |(k, &pi)| Some(((e.id, k), pi))))
            .filter_map(|(key, pi)| self.net.pipes.get(pi).map(|p| (key, p.mdot)))
            .collect();
        let ruptures = std::mem::take(&mut self.net.ruptures);
        self.net = Network::new(ambient);
        self.net.ruptures = ruptures;
        self.build_power_networks(&old_grids);
        self.segments.clear();
        self.segment_of.clear();

        // Pipe segments: connected components of pipe nodes. Pipe joins pipe beside it at the
        // same height; a riser joins every height on its tile.
        self.node_seg.clear();
        let mut bore: HashMap<Node, f64> = HashMap::new();
        let mut joins: HashMap<Node, u8> = HashMap::new();
        let mut risers: std::collections::HashSet<Tile> = std::collections::HashSet::new();
        for e in self.entities.values() {
            let levels = e.proto().levels;
            for &l in levels {
                bore.insert((l, (e.x, e.y)), e.diameter);
                joins.insert((l, (e.x, e.y)), e.joins);
            }
            if levels.len() > 1 {
                risers.insert((e.x, e.y));
            }
        }
        let mut starts: Vec<Node> = bore.keys().copied().collect();
        starts.sort();
        for &start in &starts {
            if self.node_seg.contains_key(&start) {
                continue;
            }
            let si = self.segments.len();
            let mut nodes = vec![];
            let mut queue = VecDeque::from([start]);
            self.node_seg.insert(start, si);
            while let Some((l, t)) = queue.pop_front() {
                nodes.push((l, t));
                let mut next: Vec<Node> = PIPE_SIDES
                    .iter()
                    .enumerate()
                    .filter(|&(k, d)| joined(&joins, (l, t), k, (l, (t.0 + d.0, t.1 + d.1))))
                    .map(|(_, d)| (l, (t.0 + d.0, t.1 + d.1)))
                    .collect();
                if risers.contains(&t) {
                    next.extend((0..=2).filter(|&m| m != l).map(|m| (m, t)));
                }
                for nb in next {
                    if bore.contains_key(&nb) && !self.node_seg.contains_key(&nb) {
                        self.node_seg.insert(nb, si);
                        queue.push_back(nb);
                    }
                }
            }
            let tiles: Vec<Tile> = nodes.iter().filter(|n| n.0 == 0).map(|n| n.1).collect();
            let racks: Vec<Node> = nodes.iter().filter(|n| n.0 > 0).copied().collect();
            for &t in &tiles {
                self.segment_of.insert(t, si);
            }
            let k = nodes.len() as f64;
            let diameter = nodes.iter().map(|n| bore[n]).fold(f64::INFINITY, f64::min);
            let area = std::f64::consts::PI * diameter * diameter / 4.0;
            // Fittings, headers and the run into each machine add hold-up beyond the straight pipe;
            // it also keeps a segment's contents larger than one step's throughput.
            let mut v = Vessel::new((area * k).max(SEGMENT_MIN_VOLUME), diameter, ambient);
            v.design_p = 150e5;
            v.ua_ambient = 0.5 * k;
            // Contents: the old tiles' shares, and fresh tiles purged with nitrogen at 1 atm.
            let fresh = Vessel::new(v.volume / k, diameter, ambient);
            let (mut n, mut u, mut t_guess, mut p_guess, mut known) = ([0.0; NS], 0.0, 0.0, 0.0, 0.0);
            for nd in &nodes {
                if let Some(s) = shares.get(nd) {
                    for i in 0..NS {
                        n[i] += s.n[i];
                    }
                    u += s.u;
                    t_guess += s.t;
                    p_guess += s.p;
                    known += 1.0;
                } else {
                    for i in 0..NS {
                        n[i] += fresh.n[i];
                    }
                    u += fresh.u;
                }
            }
            if known > 0.0 && n.iter().sum::<f64>() > 0.0 {
                v.n = n;
                v.u = u;
                v.state = uv_flash(&n, v.volume, u, t_guess / known, p_guess / known);
            } else {
                v.n = n;
                v.u = u;
                v.state = Flash { ..fresh.state };
            }
            let vi = self.net.add_vessel(v);
            self.segments.push(Segment { tiles, vessel: vi, diameter, racks });
        }

        // Buildings: their vessels, reservoirs, power hookups.
        let ids: Vec<u32> = self.entities.keys().copied().collect();
        for id in &ids {
            let e = self.entities.get_mut(id).unwrap();
            let p = &PROTOS[e.proto];
            e.net_vessels.clear();
            e.net_pipes.clear();
            e.net_links.clear();
            e.load = None;
            e.generator = None;
            e.battery = None;
            let net = e.network;
            for v in &e.vessels {
                e.net_vessels.push(self.net.add_vessel(v.clone()));
            }
            if let Some(src) = p.source {
                e.net_vessels.push(self.net.add_vessel(Vessel::reservoir(source_reservoir(src, ambient))));
            }
            if let Some(grid) = net.map(|n| &mut self.grids[n]) {
                if p.power_w > 0.0 {
                    grid.loads.push(Load { demand_w: 0.0, served: 1.0 });
                    e.load = Some(grid.loads.len() - 1);
                }
                if p.battery_j > 0.0 {
                    grid.batteries.push(Battery { capacity_j: p.battery_j, charge_j: e.battery_charge, rated_w: p.generator_w, p_out: 0.0 });
                    e.battery = Some(grid.batteries.len() - 1);
                } else if p.generator_w > 0.0 {
                    let turbine = matches!(p.link, Some(LinkDef::Turbine { .. }));
                    let online = !grid.blackout;
                    // Steam engines, big or small, run under the governors; inverters don't.
                    let governed = turbine || p.fueled;
                    grid.generators.push(Generator {
                        rated_w: p.generator_w, inertia_h: if turbine { 5.0 } else if p.fueled { 2.0 } else { 0.5 }, p_mech: 0.0, governed,
                        target_w: 0.0, online,
                    });
                    e.generator = Some(grid.generators.len() - 1);
                }
            }
            for &(a, b, ua) in p.thermal {
                let (va, vb) = (e.net_vessels[a], e.net_vessels[b]);
                e.net_links.push(self.net.links.len());
                self.net.links.push(crate::physics::fluid::ThermalLink { a: va, b: vb, ua, q: 0.0 });
            }
        }

        // Ports: find what each one touches. A pipe tile joins that segment; a facing port on
        // another building joins it directly.
        struct Attach {
            id: u32,
            port: usize,
            seg: usize,
        }
        let mut attaches: Vec<Attach> = vec![];
        let mut direct: Vec<(u32, usize, u32, usize)> = vec![];
        for id in &ids {
            let e = &self.entities[id];
            if !e.proto().levels.is_empty() {
                continue;
            }
            for k in 0..e.proto().ports.len() {
                let (outside, inside) = e.port_tile(k);
                if let Some(&si) = self.segment_of.get(&outside) {
                    attaches.push(Attach { id: *id, port: k, seg: si });
                } else if let Some(&other) = self.occupied.get(&outside) {
                    let o = &self.entities[&other];
                    if let Some(ok) = (0..o.proto().ports.len()).find(|&ok| o.port_tile(ok).0 == inside) {
                        if (other, ok) > (*id, k) {
                            direct.push((*id, k, other, ok));
                        }
                    }
                }
            }
        }
        // Each segment's hub is the attached port tile nearest the middle of them; a port's pipe
        // length is its walking distance to the hub (plus one tile).
        let mut lengths: HashMap<(u32, usize), f64> = HashMap::new();
        for (si, seg) in self.segments.iter().enumerate() {
            let ports: Vec<&Attach> = attaches.iter().filter(|a| a.seg == si).collect();
            if ports.is_empty() {
                continue;
            }
            let tile_of = |a: &Attach| self.entities[&a.id].port_tile(a.port).0;
            let (mx, my) = ports.iter().fold((0.0, 0.0), |acc, a| {
                let t = tile_of(a);
                (acc.0 + t.0 as f64, acc.1 + t.1 as f64)
            });
            let c = (mx / ports.len() as f64, my / ports.len() as f64);
            let hub = *seg
                .tiles
                .iter()
                .min_by(|a, b| {
                    let da = (a.0 as f64 - c.0).powi(2) + (a.1 as f64 - c.1).powi(2);
                    let db = (b.0 as f64 - c.0).powi(2) + (b.1 as f64 - c.1).powi(2);
                    da.partial_cmp(&db).unwrap()
                })
                .unwrap();
            // Walking the run, up and over racks included.
            let mut dist: HashMap<Node, i32> = HashMap::from([((0, hub), 0)]);
            let mut queue = VecDeque::from([(0u8, hub)]);
            while let Some((l, t)) = queue.pop_front() {
                let mut next: Vec<Node> = PIPE_SIDES
                    .iter()
                    .enumerate()
                    .filter(|&(k, d)| joined(&joins, (l, t), k, (l, (t.0 + d.0, t.1 + d.1))))
                    .map(|(_, d)| (l, (t.0 + d.0, t.1 + d.1)))
                    .collect();
                if risers.contains(&t) {
                    next.extend((0..=2).filter(|&m| m != l).map(|m| (m, t)));
                }
                for nb in next {
                    if self.node_seg.get(&nb) == Some(&si) && !dist.contains_key(&nb) {
                        // Climbing a riser is a few metres of pipe.
                        dist.insert(nb, dist[&(l, t)] + if nb.0 != l { 4 } else { 1 });
                        queue.push_back(nb);
                    }
                }
            }
            for a in ports {
                lengths.insert((a.id, a.port), 1.0 + *dist.get(&(0, tile_of(a))).unwrap_or(&0) as f64);
            }
        }

        let seg_for = |id: u32, port: usize| attaches.iter().find(|a| a.id == id && a.port == port).map(|a| a.seg);
        for id in &ids {
            let (proto, ports_len) = {
                let e = &self.entities[id];
                (e.proto, e.proto().ports.len())
            };
            let p = &PROTOS[proto];
            if !PROTOS[proto].levels.is_empty() {
                continue;
            }
            let mut pipes: Vec<usize> = vec![];
            match p.link {
                Some(link) => {
                    // Link buildings: one element between side 0 and side 1. With a source, side 0
                    // is the building's own reservoir.
                    let e = &self.entities[id];
                    let side = |s: usize| -> Option<(usize, f64, f64)> {
                        if p.source.is_some() && s == 0 {
                            return Some((*e.net_vessels.last().unwrap(), 2.0, f64::INFINITY));
                        }
                        let k = (0..ports_len).find(|&k| p.ports[k].vessel == s)?;
                        seg_for(*id, k).map(|si| (self.segments[si].vessel, lengths[&(*id, k)], self.segments[si].diameter))
                    };
                    if let (Some((a, la, da)), Some((b, lb, db))) = (side(0), side(1)) {
                        let kind = match link {
                            LinkDef::Valve => PipeKind::Valve { opening: e.opening },
                            LinkDef::Check => PipeKind::Check,
                            LinkDef::Relief => PipeKind::Relief { set_p: e.relief_bar * 1e5, lift: 0.0 },
                            LinkDef::Pump { dp_bar, q_max } => PipeKind::Pump {
                                dp_max: dp_bar * 1e5, q_max, eff: 0.75, rated_w: p.power_w, power_avail: 0.0, power_used: 0.0,
                                trim: e.trim, speed: e.speed, q: 0.0, dp: 0.0, eff_now: 0.0, n: 0.0, rho: 1000.0,
                                npsha: 0.0, npshr: 0.0, cavitation: 0.0, wear: e.wear,
                            },
                            LinkDef::Compressor { ratio_max } => PipeKind::Compressor {
                                ratio_max, eff: 0.75, rated_w: p.power_w, power_avail: 0.0, power_used: 0.0,
                            },
                            LinkDef::Turbine { flow_coeff } => PipeKind::Turbine {
                                flow_coeff, eff: 0.8, opening: e.opening.min(0.3), rated_w: p.generator_w, power_out: 0.0,
                            },
                            LinkDef::Open { .. } => PipeKind::Plain,
                        };
                        let diameter = match link {
                            LinkDef::Open { diameter } => diameter,
                            _ if p.source.is_some() => 0.08f64.min(db),
                            // Through the machine at the bore of the narrower line.
                            _ => da.min(db),
                        };
                        let mut pipe = Pipe::new(a, b, la + lb, diameter, kind);
                        let port_of = |s: usize| if p.source.is_some() && s == 0 { None } else { (0..ports_len).find(|&k| p.ports[k].vessel == s) };
                        pipe.ports = [port_of(0), port_of(1)];
                        pipe.mdot = old_flows.get(&(*id, 0)).copied().unwrap_or(0.0);
                        pipes.push(self.net.add_pipe(pipe));
                    }
                }
                None => {
                    for k in 0..ports_len {
                        let Some(si) = seg_for(*id, k) else { continue };
                        let e = &self.entities[id];
                        let def = &p.ports[k];
                        let vi = e.net_vessels[def.vessel];
                        let mut pipe = Pipe::new(vi, self.segments[si].vessel, lengths[&(*id, k)], self.segments[si].diameter, PipeKind::Plain);
                        pipe.ha = port_height(def.at, &self.net.vessels[vi]);
                        pipe.ports = [None, Some(k)];
                        pipe.mdot = old_flows.get(&(*id, k)).copied().unwrap_or(0.0);
                        pipes.push(self.net.add_pipe(pipe));
                    }
                }
            }
            self.entities.get_mut(id).unwrap().net_pipes = pipes;
        }
        for (a, ka, b, kb) in direct {
            let (ea, eb) = (&self.entities[&a], &self.entities[&b]);
            if ea.proto().link.is_some() || eb.proto().link.is_some() {
                continue;
            }
            let (da, db) = (&ea.proto().ports[ka], &eb.proto().ports[kb]);
            let (va, vb) = (ea.net_vessels[da.vessel], eb.net_vessels[db.vessel]);
            let mut pipe = Pipe::new(va, vb, 1.0, PIPE_DIAMETER, PipeKind::Plain);
            pipe.ha = port_height(da.at, &self.net.vessels[va]);
            pipe.hb = port_height(db.at, &self.net.vessels[vb]);
            let pi = self.net.add_pipe(pipe);
            self.entities.get_mut(&a).unwrap().net_pipes.push(pi);
        }
        self.dirty = false;
    }

    /// Advances the world by `seconds` of game time in fixed process steps.
    pub fn advance(&mut self, seconds: f64) {
        self.rebuild_if_dirty();
        self.accumulator += seconds.min(1.0);
        while self.accumulator >= DT {
            self.accumulator -= DT;
            self.step();
        }
    }

    fn step(&mut self) {
        self.time += DT;
        let daylight = (std::f64::consts::TAU * self.time / DAY).sin().max(0.0);
        // Power demand and what each consumer got last step.
        for e in self.entities.values() {
            let p = e.proto();
            if p.power_w > 0.0 {
                // Unwired buildings get nothing.
                let demand = if e.enabled { p.power_w * e.demand } else { 0.0 };
                let got = match (e.network, e.load) {
                    (Some(n), Some(l)) => {
                        let load = &mut self.grids[n].loads[l];
                        load.demand_w = demand;
                        demand * load.served
                    }
                    _ => 0.0,
                };
                for &pi in &e.net_pipes {
                    match &mut self.net.pipes[pi].kind {
                        PipeKind::Pump { power_avail, .. } | PipeKind::Compressor { power_avail, .. } => *power_avail = got,
                        _ => {}
                    }
                }
                if p.heater {
                    self.net.vessels[e.net_vessels[0]].heat_in = got;
                }
                if p.electrolyser {
                    self.net.vessels[e.net_vessels[0]].electrolysis_w = got;
                }
                if p.agitated {
                    for (&li, &(_, _, ua)) in e.net_links.iter().zip(p.thermal) {
                        self.net.links[li].ua = ua * (1.0 / 3.0 + 2.0 / 3.0 * got / p.power_w);
                    }
                }
                if p.fans {
                    let base = p.vessels[0].ua_ambient;
                    self.net.vessels[e.net_vessels[0]].ua_ambient = base * (0.2 + 0.8 * got / p.power_w);
                }
            }
            for &pi in &e.net_pipes {
                match &mut self.net.pipes[pi].kind {
                    PipeKind::Valve { opening } => *opening = e.opening,
                    PipeKind::Relief { set_p, .. } => *set_p = e.relief_bar * 1e5,
                    _ => {}
                }
            }
        }
        let before: Vec<Comp> = self.net.vessels.iter().map(|v| v.n).collect();
        self.net.step(DT);
        // Pump impellers keep their wear across rebuilds of the network; say when one goes.
        for e in self.entities.values_mut() {
            for &pi in &e.net_pipes {
                if let PipeKind::Pump { wear, .. } = self.net.pipes[pi].kind {
                    if wear >= 1.0 && e.wear < 1.0 {
                        self.events.push(format!("{} #{}: cavitation has worn its impeller through. Pick it up and put it back to fit a new one.", e.proto().name, e.id));
                    } else if wear >= 0.5 && e.wear < 0.5 {
                        self.events.push(format!("{} #{}: its impeller is badly pitted by cavitation.", e.proto().name, e.id));
                    }
                    e.wear = wear;
                }
            }
        }
        // Electrolysers make their oxygen in the anode vessel: move it there.
        for e in self.entities.values() {
            if e.proto().electrolyser {
                let (c, a) = (e.net_vessels[0], e.net_vessels[1]);
                let o2 = index_of("o2").unwrap();
                let made = (self.net.vessels[c].n[o2] - before[c][o2]).max(0.0);
                if made > 0.0 {
                    let fl = self.net.vessels[c].state;
                    let h = SPECIES[o2].h_ig(fl.t);
                    self.net.vessels[c].n[o2] -= made;
                    self.net.vessels[c].u -= made * h;
                    self.net.vessels[a].n[o2] += made;
                    self.net.vessels[a].u += made * h;
                }
            }
        }
        // Gas leaving through vents and stacks counts as emissions.
        for e in self.entities.values_mut() {
            if matches!(e.proto().link, Some(LinkDef::Open { .. })) {
                if let Some(&pi) = e.net_pipes.first() {
                    let pipe = &self.net.pipes[pi];
                    if pipe.mdot < 0.0 {
                        let from = &self.net.vessels[pipe.b];
                        let z = if pipe.vapour { from.state.y } else { from.state.x };
                        let mol = -pipe.mdot * DT / Flash::mw(&z).max(1e-6);
                        let mut out = z.map(|x| x * mol);
                        if e.proto().burns {
                            burn_off(&mut out);
                        }
                        for i in 0..NS {
                            self.emitted[i] += out[i];
                            e.emitted_kg += out[i] * SPECIES[i].mw * 1e-3;
                        }
                    }
                }
            }
        }
        // Generators: turbines deliver their shaft power, solar follows the sun.
        for e in self.entities.values() {
            let (Some(n), Some(g)) = (e.network, e.generator) else { continue };
            let p = e.proto();
            let frequency = self.grids[n].frequency;
            let gen = &mut self.grids[n].generators[g];
            gen.p_mech = match e.net_pipes.first().map(|&pi| &self.net.pipes[pi].kind) {
                Some(PipeKind::Turbine { power_out, .. }) => *power_out,
                // Inverters back off above 50.2 Hz (zero by 51.2 Hz), ramping with a 0.5 s lag.
                // Burner generators answer the same way, to the fuel they have.
                // A burner generator's governor asks for its share, up to what its fire can give.
                _ if p.fueled => {
                    let target = gen.target_w.min(p.generator_w * e.demand * e.enabled as u8 as f64);
                    gen.p_mech + (target - gen.p_mech) * (DT / 0.5)
                }
                _ => {
                    let target = p.generator_w * daylight * (1.0 - (frequency - F_NOMINAL - 0.2)).clamp(0.0, 1.0);
                    gen.p_mech + (target - gen.p_mech) * (DT / 0.5)
                }
            };
        }
        for (n, grid) in self.grids.iter_mut().enumerate() {
            grid.step(DT);
            // A grid of inverters alone (no rotating machines to restart) reconnects by itself once
            // there is generation again, the way solar inverters do after a dark grid.
            let mine = |e: &&Entity| e.network == Some(n);
            let synchronous = self.entities.values().filter(mine).any(|e| matches!(e.proto().link, Some(LinkDef::Turbine { .. })));
            if grid.blackout && !synchronous && daylight > 0.05 {
                grid.black_start();
            }
        }
        // Governors move turbine admission valves toward their power target; a manual opening
        // below 1 caps them. A turbine with no grid to feed is shut.
        for e in self.entities.values() {
            let gen = match (e.network, e.generator) {
                (Some(n), Some(g)) => Some(&self.grids[n].generators[g]),
                _ => None,
            };
            for &pi in &e.net_pipes {
                if let PipeKind::Turbine { opening, rated_w, power_out, .. } = &mut self.net.pipes[pi].kind {
                    *opening = match gen {
                        Some(gen) if gen.online => (*opening + 0.5 * (gen.target_w - *power_out) / *rated_w * DT).clamp(0.0, e.opening),
                        _ => 0.0,
                    };
                }
            }
        }
        for r in self.net.ruptures.drain(..) {
            let who = self.entities.values().find(|e| e.net_vessels.contains(&r.vessel));
            let name = who.map(|e| e.proto().name).unwrap_or("A pipe");
            self.events.push(format!("{name} ruptured at {:.0} bar!", r.pressure / 1e5));
        }
    }

    pub fn black_start(&mut self) {
        for g in &mut self.grids {
            if g.blackout {
                g.black_start();
            }
        }
    }

    /// Wires poles to the poles within reach (a spanning forest, nearest first, like Factorio's
    /// auto-wiring) and puts every electric building on the network of a pole that covers it.
    fn build_power_networks(&mut self, old: &HashMap<u32, (f64, bool, f64)>) {
        let poles: Vec<(u32, f64, f64, f64, f64)> = self
            .entities
            .values()
            .filter(|e| e.proto().wire > 0.0)
            .map(|e| {
                let p = e.proto();
                let c = p.size as f64 / 2.0;
                (e.id, e.x as f64 + c, e.y as f64 + c, p.wire, p.supply)
            })
            .collect();
        let mut edges = vec![];
        for i in 0..poles.len() {
            for j in i + 1..poles.len() {
                let d = ((poles[i].1 - poles[j].1).powi(2) + (poles[i].2 - poles[j].2).powi(2)).sqrt();
                if d <= poles[i].3.min(poles[j].3) {
                    edges.push((d, i, j));
                }
            }
        }
        edges.sort_by(|a, b| a.0.total_cmp(&b.0));
        let mut parent: Vec<usize> = (0..poles.len()).collect();
        fn root(parent: &mut [usize], mut i: usize) -> usize {
            while parent[i] != i {
                parent[i] = parent[parent[i]];
                i = parent[i];
            }
            i
        }
        self.wires.clear();
        for &(_, i, j) in &edges {
            let (a, b) = (root(&mut parent, i), root(&mut parent, j));
            if a != b {
                parent[a] = b;
                self.wires.push((poles[i].0, poles[j].0));
            }
        }
        let mut index_of_root: HashMap<usize, usize> = HashMap::new();
        let mut pole_net = vec![0; poles.len()];
        let mut carried = std::collections::HashSet::new();
        self.grids.clear();
        for i in 0..poles.len() {
            let r = root(&mut parent, i);
            let n = *index_of_root.entry(r).or_insert_with(|| {
                self.grids.push(Grid::default());
                self.grids.len() - 1
            });
            pole_net[i] = n;
            // Carry the grid's state over from any pole that was already on it.
            if let Some(&(frequency, blackout, setpoint)) = old.get(&poles[i].0) {
                if carried.insert(n) {
                    let g = &mut self.grids[n];
                    g.frequency = frequency;
                    g.blackout = blackout;
                    g.setpoint = setpoint;
                }
            }
        }
        for e in self.entities.values_mut() {
            let p = &PROTOS[e.proto];
            e.network = if p.wire > 0.0 {
                poles.iter().position(|q| q.0 == e.id).map(|i| pole_net[i])
            } else if p.power_w > 0.0 || p.generator_w > 0.0 || p.battery_j > 0.0 {
                let (x0, y0, x1, y1) = (e.x as f64, e.y as f64, (e.x + p.size) as f64, (e.y + p.size) as f64);
                poles
                    .iter()
                    .position(|q| x0 < q.1 + q.4 && x1 > q.1 - q.4 && y0 < q.2 + q.4 && y1 > q.2 - q.4)
                    .map(|i| pole_net[i])
            } else {
                None
            };
        }
    }

    /// The biggest grid by capacity, for the UI's summary.
    pub fn main_grid(&self) -> Option<usize> {
        (0..self.grids.len()).max_by(|&a, &b| capacity(&self.grids[a]).total_cmp(&capacity(&self.grids[b])))
    }
}

fn capacity(g: &Grid) -> f64 {
    g.generators.iter().map(|x| x.rated_w).sum::<f64>() + g.batteries.iter().map(|b| b.rated_w).sum::<f64>()
}

/// What a flame leaves of a gas: fuels become CO₂ and water.
fn burn_off(n: &mut Comp) {
    let (ch4, h2, co, co2, h2o) = (index_of("ch4").unwrap(), index_of("h2").unwrap(), index_of("co").unwrap(), index_of("co2").unwrap(), index_of("h2o").unwrap());
    let take = |i: usize, c: f64, h: f64, n: &mut Comp| {
        let x = n[i];
        n[i] = 0.0;
        n[co2] += c * x;
        n[h2o] += h * x;
    };
    take(ch4, 1.0, 2.0, n);
    take(h2, 0.0, 1.0, n);
    take(co, 1.0, 0.0, n);
    for (id, c, h) in [("c2h6", 2.0, 3.0), ("c2h4", 2.0, 2.0), ("ch3oh", 1.0, 2.0)] {
        if let Some(i) = index_of(id) {
            take(i, c, h, n);
        }
    }
}

// ── Snapshots for the UI ──────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct VesselView {
    pub t: f64,
    pub p: f64,
    pub beta: f64,
    pub level: f64,
    pub moles: f64,
    pub mass: f64,
    /// Overall composition, mole fraction by species id (only species present).
    pub z: BTreeMap<&'static str, f64>,
    pub x: BTreeMap<&'static str, f64>,
    pub y: BTreeMap<&'static str, f64>,
    pub rho_liq: f64,
    pub rho_vap: f64,
    /// Viscosities [Pa·s] and the liquid's vapour pressure [Pa] (Raoult with Wilson's estimate
    /// of each condensable's saturation pressure), for pipe flow and pump suction read-outs.
    pub mu_liq: f64,
    pub mu_vap: f64,
    pub p_vap: f64,
    pub q_net: f64,
    pub design_p: f64,
    pub ruptured: bool,
    pub reactions: Vec<ReactionView>,
}

#[derive(Serialize)]
pub struct ReactionView {
    pub name: &'static str,
    /// Extent rate [mol/s], and ln(Q/K): 0 at equilibrium, negative while it runs forward.
    pub rate: f64,
    pub ln_q_over_k: f64,
}

#[derive(Serialize)]
pub struct PipeView {
    pub mdot: f64,
    pub velocity: f64,
    pub vapour: bool,
    pub choked: bool,
    pub kind: PipeKind,
    pub ports: [Option<usize>; 2],
}

#[derive(Serialize)]
pub struct EntityView {
    pub id: u32,
    pub proto: &'static str,
    pub x: i32,
    pub y: i32,
    pub rot: u8,
    pub opening: f64,
    pub enabled: bool,
    pub vessels: Vec<VesselView>,
    pub pipes: Vec<PipeView>,
    pub power_w: f64,
    pub generation_w: f64,
    pub battery: Option<(f64, f64)>,
    pub network: Option<usize>,
    /// Fraction of its demand the grid is serving (0 when unwired).
    pub served: f64,
    /// Gas it has vented or burnt off to the sky so far [kg].
    pub emitted_kg: f64,
}

#[derive(Serialize)]
pub struct SegmentView {
    pub tiles: Vec<Tile>,
    pub vessel: VesselView,
    pub diameter: f64,
    pub racks: Vec<Node>,
}

#[derive(Serialize)]
pub struct GridView {
    pub frequency: f64,
    pub nominal: f64,
    pub generation_w: f64,
    pub load_w: f64,
    pub shed_fraction: f64,
    pub blackout: bool,
    pub capacity_w: f64,
}

#[derive(Serialize)]
pub struct Snapshot {
    pub time: f64,
    pub daylight: f64,
    pub ambient: f64,
    pub entities: Vec<EntityView>,
    pub segments: Vec<SegmentView>,
    pub grid: GridView,
    pub main_grid: Option<usize>,
    pub grids: Vec<GridView>,
    pub wires: Vec<(u32, u32)>,
    pub events: Vec<String>,
    pub emitted_kg: BTreeMap<&'static str, f64>,
}

fn comp_map(c: &Comp) -> BTreeMap<&'static str, f64> {
    (0..NS).filter(|&i| c[i] > 1e-6).map(|i| (SPECIES[i].id, c[i])).collect()
}

fn vessel_view(v: &Vessel) -> VesselView {
    let s = &v.state;
    let moles = v.moles();
    let z: Comp = if moles > 0.0 { v.n.map(|x| x / moles) } else { [0.0; NS] };
    let gas_volume = (v.volume - v.liquid_volume()).max(1e-3 * v.volume);
    let reactions = v
        .reactions
        .iter()
        .enumerate()
        .map(|(k, &r)| {
            let rx = &REACTIONS[r];
            let nu = crate::thermodynamics::reaction::nu_vec(rx);
            let bar = 8.314462618 * s.t / gas_volume / 1e5;
            let ln_q: f64 = (0..NS).filter(|&i| nu[i] != 0.0).map(|i| nu[i] * (v.n[i].max(1e-12) * bar).ln()).sum();
            ReactionView {
                name: rx.name,
                rate: v.reaction_rate.get(k).copied().unwrap_or(0.0),
                ln_q_over_k: ln_q - crate::thermodynamics::reaction::ln_kp(rx, s.t),
            }
        })
        .collect();
    VesselView {
        t: s.t, p: s.p, beta: s.beta, level: if v.reservoir.is_some() { 0.0 } else { v.level() / v.height }, moles,
        mass: (0..NS).map(|i| v.n[i] * SPECIES[i].mw * 1e-3).sum(), z: comp_map(&z), x: comp_map(&s.x), y: comp_map(&s.y),
        rho_liq: if s.beta < 1.0 { s.rho_liq() } else { 0.0 }, rho_vap: if s.beta > 0.0 { s.rho_vap() } else { 0.0 },
        mu_liq: if s.beta < 1.0 { s.mu_liq() } else { 0.0 }, mu_vap: if s.beta > 0.0 { s.mu_vap() } else { 0.0 },
        p_vap: if s.beta < 1.0 { crate::physics::fluid::vapour_pressure(&s.x, s.t) } else { 0.0 },
        q_net: v.q_net, design_p: v.design_p, ruptured: v.ruptured, reactions,
    }
}

impl World {
    pub fn snapshot(&mut self) -> Snapshot {
        self.rebuild_if_dirty();
        let entities = self
            .entities
            .values()
            .filter(|e| e.proto().levels.is_empty() && !e.proto().plain())
            .map(|e| (e, e.network.map(|n| &self.grids[n])))
            .map(|(e, grid)| EntityView {
                id: e.id, proto: e.proto().id, x: e.x, y: e.y, rot: e.rot, opening: e.opening, enabled: e.enabled,
                vessels: e.net_vessels.iter().filter(|&&vi| self.net.vessels[vi].reservoir.is_none()).map(|&vi| vessel_view(&self.net.vessels[vi])).collect(),
                pipes: e
                    .net_pipes
                    .iter()
                    .map(|&pi| {
                        let p = &self.net.pipes[pi];
                        PipeView { mdot: p.mdot, velocity: p.velocity, vapour: p.vapour, choked: p.choked, kind: p.kind.clone(), ports: p.ports }
                    })
                    .collect(),
                power_w: grid.and_then(|g| e.load.map(|l| g.loads[l].demand_w * g.loads[l].served)).unwrap_or(0.0),
                generation_w: grid.and_then(|g| e.generator.map(|i| g.generators[i].p_mech)).unwrap_or(0.0)
                    + grid.and_then(|g| e.battery.map(|b| g.batteries[b].p_out)).unwrap_or(0.0),
                battery: grid.and_then(|g| e.battery.map(|b| (g.batteries[b].charge_j, g.batteries[b].capacity_j))),
                network: e.network,
                served: grid.and_then(|g| e.load.map(|l| g.loads[l].served)).unwrap_or(0.0),
                emitted_kg: e.emitted_kg,
            })
            .collect();
        let segments = self.segments.iter().map(|s| SegmentView { tiles: s.tiles.clone(), vessel: vessel_view(&self.net.vessels[s.vessel]), diameter: s.diameter, racks: s.racks.clone() }).collect();
        let view = |g: &Grid| GridView {
            frequency: g.frequency, nominal: F_NOMINAL, generation_w: g.generation_w, load_w: g.load_w,
            shed_fraction: g.shed_fraction, blackout: g.blackout, capacity_w: capacity(g),
        };
        let empty = Grid { frequency: 0.0, ..Grid::default() };
        Snapshot {
            time: self.time,
            daylight: (std::f64::consts::TAU * self.time / DAY).sin().max(0.0),
            ambient: self.ambient(),
            entities,
            segments,
            grid: view(self.main_grid().map(|n| &self.grids[n]).unwrap_or(&empty)),
            main_grid: self.main_grid(),
            grids: self.grids.iter().map(view).collect(),
            wires: self.wires.clone(),
            events: std::mem::take(&mut self.events),
            emitted_kg: (0..NS).filter(|&i| self.emitted[i] > 0.0).map(|i| (SPECIES[i].id, self.emitted[i] * SPECIES[i].mw * 1e-3)).collect(),
        }
    }
}

#[cfg(test)]
mod tests;
