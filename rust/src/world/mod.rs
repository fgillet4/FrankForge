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
    // Where this entity's parts live in the current network and grid.
    net_vessels: Vec<usize>,
    net_pipes: Vec<usize>,
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
}

pub struct World {
    pub entities: BTreeMap<u32, Entity>,
    occupied: HashMap<Tile, u32>,
    pub net: Network,
    pub grid: Grid,
    pub segments: Vec<Segment>,
    segment_of: HashMap<Tile, usize>,
    pub time: f64,
    accumulator: f64,
    dirty: bool,
    pub events: Vec<String>,
    /// Totals vented to the atmosphere [mol], by species.
    pub emitted: Comp,
    /// Pipe contents per tile, saved when the network is about to be rebuilt.
    pending_shares: Option<HashMap<Tile, TileShare>>,
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
            entities: BTreeMap::new(), occupied: HashMap::new(), net: Network::new(ambient_t), grid: Grid::default(),
            segments: vec![], segment_of: HashMap::new(), time: DAY * 0.3, accumulator: 0.0, dirty: true, events: vec![],
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
            id, proto, x, y, rot: rot % 4, vessels, opening: 1.0, enabled: true, battery_charge: p.battery_j * 0.5,
            net_vessels: vec![], net_pipes: vec![], load: None, generator: None, battery: None,
        };
        let tiles: Vec<Tile> = e.tiles().collect();
        if let Some(t) = tiles.iter().find(|t| self.occupied.contains_key(t)) {
            return Err(format!("tile {t:?} is taken"));
        }
        self.sync_back();
        for t in tiles {
            self.occupied.insert(t, id);
        }
        self.entities.insert(id, e);
        self.dirty = true;
        Ok(())
    }

    pub fn remove(&mut self, id: u32) -> bool {
        self.sync_back();
        let Some(e) = self.entities.remove(&id) else { return false };
        for t in e.tiles() {
            self.occupied.remove(&t);
        }
        self.dirty = true;
        true
    }

    pub fn entity_at(&self, x: i32, y: i32) -> Option<u32> {
        self.occupied.get(&(x, y)).copied()
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

    pub fn set_enabled(&mut self, id: u32, on: bool) {
        if let Some(e) = self.entities.get_mut(&id) {
            e.enabled = on;
        }
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
            if let Some(b) = e.battery {
                e.battery_charge = self.grid.batteries[b].charge_j;
            }
        }
        for s in &self.segments {
            let v = &self.net.vessels[s.vessel];
            let k = s.tiles.len() as f64;
            for &t in &s.tiles {
                shares.insert(t, TileShare { n: v.n.map(|x| x / k), u: v.u / k, t: v.t(), p: v.p() });
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
        let frequency = self.grid.frequency;
        let (blackout, setpoint) = (self.grid.blackout, self.grid.setpoint);
        let old_flows: HashMap<(u32, usize), f64> = self
            .entities
            .values()
            .flat_map(|e| e.net_pipes.iter().enumerate().filter_map(move |(k, &pi)| Some(((e.id, k), pi))))
            .filter_map(|(key, pi)| self.net.pipes.get(pi).map(|p| (key, p.mdot)))
            .collect();
        let ruptures = std::mem::take(&mut self.net.ruptures);
        self.net = Network::new(ambient);
        self.net.ruptures = ruptures;
        self.grid = Grid { frequency, blackout, setpoint, ..Grid::default() };
        self.segments.clear();
        self.segment_of.clear();

        // Pipe segments: connected components of pipe tiles.
        let pipe_proto = protos::proto("pipe").unwrap();
        let pipe_tiles: Vec<Tile> = self.entities.values().filter(|e| e.proto == pipe_proto).map(|e| (e.x, e.y)).collect();
        let is_pipe: std::collections::HashSet<Tile> = pipe_tiles.iter().copied().collect();
        let area = std::f64::consts::PI * PIPE_DIAMETER * PIPE_DIAMETER / 4.0;
        for &start in &pipe_tiles {
            if self.segment_of.contains_key(&start) {
                continue;
            }
            let si = self.segments.len();
            let mut tiles = vec![];
            let mut queue = VecDeque::from([start]);
            self.segment_of.insert(start, si);
            while let Some(t) = queue.pop_front() {
                tiles.push(t);
                for d in [(1, 0), (-1, 0), (0, 1), (0, -1)] {
                    let nb = (t.0 + d.0, t.1 + d.1);
                    if is_pipe.contains(&nb) && !self.segment_of.contains_key(&nb) {
                        self.segment_of.insert(nb, si);
                        queue.push_back(nb);
                    }
                }
            }
            let k = tiles.len() as f64;
            // Fittings, headers and the run into each machine add hold-up beyond the straight pipe;
            // it also keeps a segment's contents larger than one step's throughput.
            let mut v = Vessel::new((area * k).max(SEGMENT_MIN_VOLUME), PIPE_DIAMETER, ambient);
            v.design_p = 150e5;
            v.ua_ambient = 0.5 * k;
            // Contents: the old tiles' shares, and fresh tiles purged with nitrogen at 1 atm.
            let fresh = Vessel::new(v.volume / k, PIPE_DIAMETER, ambient);
            let (mut n, mut u, mut t_guess, mut p_guess, mut known) = ([0.0; NS], 0.0, 0.0, 0.0, 0.0);
            for t in &tiles {
                if let Some(s) = shares.get(t) {
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
            self.segments.push(Segment { tiles, vessel: vi });
        }

        // Buildings: their vessels, reservoirs, power hookups.
        let ids: Vec<u32> = self.entities.keys().copied().collect();
        for id in &ids {
            let e = self.entities.get_mut(id).unwrap();
            let p = &PROTOS[e.proto];
            e.net_vessels.clear();
            e.net_pipes.clear();
            e.load = None;
            e.generator = None;
            e.battery = None;
            for v in &e.vessels {
                e.net_vessels.push(self.net.add_vessel(v.clone()));
            }
            if let Some(src) = p.source {
                e.net_vessels.push(self.net.add_vessel(Vessel::reservoir(source_reservoir(src, ambient))));
            }
            if p.power_w > 0.0 {
                self.grid.loads.push(Load { demand_w: 0.0, served: 1.0 });
                e.load = Some(self.grid.loads.len() - 1);
            }
            if p.battery_j > 0.0 {
                self.grid.batteries.push(Battery { capacity_j: p.battery_j, charge_j: e.battery_charge, rated_w: p.generator_w, p_out: 0.0 });
                e.battery = Some(self.grid.batteries.len() - 1);
            } else if p.generator_w > 0.0 {
                let turbine = matches!(p.link, Some(LinkDef::Turbine { .. }));
                self.grid.generators.push(Generator {
                    rated_w: p.generator_w, inertia_h: if turbine { 5.0 } else { 0.5 }, p_mech: 0.0, governed: turbine,
                    target_w: 0.0, online: !blackout,
                });
                e.generator = Some(self.grid.generators.len() - 1);
            }
            for &(a, b, ua) in p.thermal {
                let (va, vb) = (e.net_vessels[a], e.net_vessels[b]);
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
            if e.proto == pipe_proto {
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
            let mut dist: HashMap<Tile, i32> = HashMap::from([(hub, 0)]);
            let mut queue = VecDeque::from([hub]);
            while let Some(t) = queue.pop_front() {
                for d in [(1, 0), (-1, 0), (0, 1), (0, -1)] {
                    let nb = (t.0 + d.0, t.1 + d.1);
                    if self.segment_of.get(&nb) == Some(&si) && !dist.contains_key(&nb) {
                        dist.insert(nb, dist[&t] + 1);
                        queue.push_back(nb);
                    }
                }
            }
            for a in ports {
                lengths.insert((a.id, a.port), 1.0 + *dist.get(&tile_of(a)).unwrap_or(&0) as f64);
            }
        }

        let seg_for = |id: u32, port: usize| attaches.iter().find(|a| a.id == id && a.port == port).map(|a| a.seg);
        for id in &ids {
            let (proto, ports_len) = {
                let e = &self.entities[id];
                (e.proto, e.proto().ports.len())
            };
            let p = &PROTOS[proto];
            if proto == pipe_proto {
                continue;
            }
            let mut pipes: Vec<usize> = vec![];
            match p.link {
                Some(link) => {
                    // Link buildings: one element between side 0 and side 1. With a source, side 0
                    // is the building's own reservoir.
                    let e = &self.entities[id];
                    let side = |s: usize| -> Option<(usize, f64)> {
                        if p.source.is_some() && s == 0 {
                            return Some((*e.net_vessels.last().unwrap(), 2.0));
                        }
                        let k = (0..ports_len).find(|&k| p.ports[k].vessel == s)?;
                        seg_for(*id, k).map(|si| (self.segments[si].vessel, lengths[&(*id, k)]))
                    };
                    if let (Some((a, la)), Some((b, lb))) = (side(0), side(1)) {
                        let kind = match link {
                            LinkDef::Valve => PipeKind::Valve { opening: e.opening },
                            LinkDef::Check => PipeKind::Check,
                            LinkDef::Pump { dp_bar, q_max } => PipeKind::Pump {
                                dp_max: dp_bar * 1e5, q_max, eff: 0.7, rated_w: p.power_w, power_avail: 0.0, power_used: 0.0,
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
                            _ if p.source.is_some() => 0.08,
                            _ => PIPE_DIAMETER,
                        };
                        let mut pipe = Pipe::new(a, b, la + lb, diameter, kind);
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
                        let mut pipe = Pipe::new(vi, self.segments[si].vessel, lengths[&(*id, k)], PIPE_DIAMETER, PipeKind::Plain);
                        pipe.ha = port_height(def.at, &self.net.vessels[vi]);
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
            if let Some(l) = e.load {
                self.grid.loads[l].demand_w = if e.enabled { p.power_w } else { 0.0 };
                let got = if e.enabled { p.power_w * self.grid.loads[l].served } else { 0.0 };
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
                if p.fans {
                    let base = p.vessels[0].ua_ambient;
                    self.net.vessels[e.net_vessels[0]].ua_ambient = base * (0.2 + 0.8 * got / p.power_w);
                }
            }
            for &pi in &e.net_pipes {
                if let PipeKind::Valve { opening } = &mut self.net.pipes[pi].kind {
                    *opening = e.opening;
                }
            }
        }
        let before: Vec<Comp> = self.net.vessels.iter().map(|v| v.n).collect();
        self.net.step(DT);
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
        for e in self.entities.values() {
            if matches!(e.proto().link, Some(LinkDef::Open { .. })) {
                if let Some(&pi) = e.net_pipes.first() {
                    let pipe = &self.net.pipes[pi];
                    if pipe.mdot < 0.0 {
                        let from = &self.net.vessels[pipe.b];
                        let z = if pipe.vapour { from.state.y } else { from.state.x };
                        let mol = -pipe.mdot * DT / Flash::mw(&z).max(1e-6);
                        for i in 0..NS {
                            self.emitted[i] += mol * z[i];
                        }
                    }
                }
            }
        }
        // Generators: turbines deliver their shaft power, solar follows the sun.
        for e in self.entities.values() {
            let Some(g) = e.generator else { continue };
            let p = e.proto();
            let gen = &mut self.grid.generators[g];
            gen.p_mech = match e.net_pipes.first().map(|&pi| &self.net.pipes[pi].kind) {
                Some(PipeKind::Turbine { power_out, .. }) => *power_out,
                // Inverters back off above 50.2 Hz (zero by 51.2 Hz), ramping with a 0.5 s lag.
                _ => {
                    let target = p.generator_w * daylight * (1.0 - (self.grid.frequency - F_NOMINAL - 0.2)).clamp(0.0, 1.0);
                    gen.p_mech + (target - gen.p_mech) * (DT / 0.5)
                }
            };
        }
        self.grid.step(DT);
        // A grid of inverters alone (no rotating machines to restart) reconnects by itself once
        // there is generation again, the way solar inverters do after a dark grid.
        let synchronous = self.entities.values().any(|e| matches!(e.proto().link, Some(LinkDef::Turbine { .. })));
        if self.grid.blackout && !synchronous && daylight > 0.05 {
            self.grid.black_start();
        }
        // Governors move turbine admission valves toward their power target; a manual opening
        // below 1 caps them.
        for e in self.entities.values() {
            let Some(g) = e.generator else { continue };
            let gen = &self.grid.generators[g];
            for &pi in &e.net_pipes {
                if let PipeKind::Turbine { opening, rated_w, power_out, .. } = &mut self.net.pipes[pi].kind {
                    let err = (gen.target_w - *power_out) / *rated_w;
                    *opening = if gen.online { (*opening + 0.5 * err * DT).clamp(0.0, e.opening) } else { 0.0 };
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
        self.grid.black_start();
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
}

#[derive(Serialize)]
pub struct SegmentView {
    pub tiles: Vec<Tile>,
    pub vessel: VesselView,
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
        q_net: v.q_net, design_p: v.design_p, ruptured: v.ruptured, reactions,
    }
}

impl World {
    pub fn snapshot(&mut self) -> Snapshot {
        self.rebuild_if_dirty();
        let entities = self
            .entities
            .values()
            .filter(|e| e.proto().id != "pipe")
            .map(|e| EntityView {
                id: e.id, proto: e.proto().id, x: e.x, y: e.y, rot: e.rot, opening: e.opening, enabled: e.enabled,
                vessels: e.net_vessels.iter().filter(|&&vi| self.net.vessels[vi].reservoir.is_none()).map(|&vi| vessel_view(&self.net.vessels[vi])).collect(),
                pipes: e
                    .net_pipes
                    .iter()
                    .map(|&pi| {
                        let p = &self.net.pipes[pi];
                        PipeView { mdot: p.mdot, velocity: p.velocity, vapour: p.vapour, choked: p.choked, kind: p.kind.clone() }
                    })
                    .collect(),
                power_w: e.load.map(|l| self.grid.loads[l].demand_w * self.grid.loads[l].served).unwrap_or(0.0),
                generation_w: e.generator.map(|g| self.grid.generators[g].p_mech).unwrap_or(0.0)
                    + e.battery.map(|b| self.grid.batteries[b].p_out).unwrap_or(0.0),
                battery: e.battery.map(|b| (self.grid.batteries[b].charge_j, self.grid.batteries[b].capacity_j)),
            })
            .collect();
        let segments = self.segments.iter().map(|s| SegmentView { tiles: s.tiles.clone(), vessel: vessel_view(&self.net.vessels[s.vessel]) }).collect();
        let g = &self.grid;
        Snapshot {
            time: self.time,
            daylight: (std::f64::consts::TAU * self.time / DAY).sin().max(0.0),
            ambient: self.ambient(),
            entities,
            segments,
            grid: GridView {
                frequency: g.frequency, nominal: F_NOMINAL, generation_w: g.generation_w, load_w: g.load_w,
                shed_fraction: g.shed_fraction, blackout: g.blackout,
                capacity_w: g.generators.iter().map(|x| x.rated_w).sum::<f64>() + g.batteries.iter().map(|b| b.rated_w).sum::<f64>(),
            },
            events: std::mem::take(&mut self.events),
            emitted_kg: (0..NS).filter(|&i| self.emitted[i] > 0.0).map(|i| (SPECIES[i].id, self.emitted[i] * SPECIES[i].mw * 1e-3)).collect(),
        }
    }
}

#[cfg(test)]
mod tests;
