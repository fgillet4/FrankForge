//! The process network: vessels that hold real mixtures, joined by pipes that carry flow driven by
//! pressure.
//!
//! Factorio moves fluid between boxes by how full they are. Here a vessel's state comes from its
//! contents: moles of each species plus internal energy, in a fixed volume, flashed with
//! Peng–Robinson to get T, P and the liquid/vapour split. Each pipe carries a mass flow with inertia,
//! pushed by the pressure difference plus hydrostatic head and held back by Darcy–Weisbach
//! friction. Gas flow chokes at sonic speed. Pumps, compressors, valves and turbines are pipes with
//! extra terms. Energy moves with the flow as enthalpy, so mixing, compression heating, reaction
//! heat and boiling all come out of the same balance.

use crate::thermodynamics::eos::Comp;
use crate::thermodynamics::flash::{ps_flash, pt_flash, uv_flash_k, Flash};
use crate::thermodynamics::reaction::{advance, REACTIONS};
use crate::thermodynamics::species::{NS, SPECIES};
use serde::Serialize;

pub const G: f64 = 9.80665;
pub const P_ATM: f64 = 101_325.0;
const STEFAN_BOLTZMANN: f64 = 5.670374e-8;
/// Bulk modulus used for a vessel full of liquid [Pa].
const LIQUID_BULK_MODULUS: f64 = 1.5e9;
/// No more than this fraction of a phase may leave a vessel in one step.
const MAX_DRAW: f64 = 0.4;

/// A boundary at fixed conditions: the atmosphere, an aquifer, a gas reservoir.
#[derive(Clone, Debug)]
pub struct Reservoir {
    pub z: Comp,
    pub t: f64,
    pub p: f64,
}

#[derive(Clone, Debug)]
pub struct Vessel {
    pub volume: f64,
    /// Internal height [m] (so liquid has a level) and elevation of the bottom [m].
    pub height: f64,
    pub elevation: f64,
    pub n: Comp,
    /// Internal energy [J].
    pub u: f64,
    pub state: Flash,
    /// Pressure the vessel is rated for [Pa]; past 1.5× it ruptures.
    pub design_p: f64,
    pub ruptured: bool,
    pub reservoir: Option<Reservoir>,
    /// Indices into REACTIONS, catalyst volume [m³], and whether a pilot flame keeps combustion lit.
    pub reactions: Vec<usize>,
    pub cat_volume: f64,
    pub pilot: bool,
    /// Losses to ambient: convective conductance [W/K] and radiating area [m²].
    pub ua_ambient: f64,
    pub radiating_area: f64,
    /// External heat input [W] (electric heaters, electrolysers).
    pub heat_in: f64,
    /// Electrolysis: electrical power [W] spent splitting water.
    pub electrolysis_w: f64,
    /// Bookkeeping for display: heat gained this step [W] and reaction extent rate [mol/s].
    pub q_net: f64,
    pub reaction_rate: Vec<f64>,
    /// Last converged K-values, to warm-start the next flash.
    pub k_cache: Option<Comp>,
}

impl Vessel {
    pub fn new(volume: f64, height: f64, t: f64) -> Self {
        let mut n = [0.0; NS];
        // Start filled with a little nitrogen at atmospheric pressure, as if purged.
        n[2] = P_ATM * volume / (8.314462618 * t);
        let state = pt_flash(&n, t, P_ATM);
        let u = state.u() * n.iter().sum::<f64>();
        Vessel {
            volume, height, elevation: 0.0, n, u, state, design_p: 10e5, ruptured: false, reservoir: None,
            reactions: vec![], cat_volume: 0.0, pilot: false, ua_ambient: 0.0, radiating_area: 0.0,
            heat_in: 0.0, electrolysis_w: 0.0, q_net: 0.0, reaction_rate: vec![], k_cache: None,
        }
    }

    pub fn reservoir(r: Reservoir) -> Self {
        let state = pt_flash(&r.z, r.t, r.p);
        let mut v = Vessel::new(1.0, 1.0, r.t);
        v.state = state;
        v.n = r.z;
        v.reservoir = Some(r);
        v
    }

    pub fn moles(&self) -> f64 {
        self.n.iter().sum()
    }
    pub fn t(&self) -> f64 {
        self.state.t
    }
    pub fn p(&self) -> f64 {
        self.state.p
    }

    fn area(&self) -> f64 {
        self.volume / self.height
    }

    /// Volume of liquid [m³] and its level above the bottom [m].
    pub fn liquid_volume(&self) -> f64 {
        if self.reservoir.is_some() {
            return 0.0;
        }
        (1.0 - self.state.beta) * self.moles() * self.state.liq.v
    }
    pub fn level(&self) -> f64 {
        (self.liquid_volume() / self.area()).min(self.height)
    }

    /// Phase drawn by a port at `h` above the bottom: liquid when submerged. Returns
    /// (is_vapour, pressure at the port).
    fn port(&self, h: f64) -> (bool, f64) {
        if let Some(r) = &self.reservoir {
            return (self.state.beta > 0.5, r.p);
        }
        let level = self.level();
        let has_liquid = self.state.beta < 1.0 && level > 1e-4;
        if has_liquid && h < level {
            (false, self.state.p + self.state.rho_liq() * G * (level - h))
        } else if self.state.beta > 0.0 {
            (true, self.state.p)
        } else {
            (false, self.state.p)
        }
    }

    /// Heat capacity of the contents [J/K], for limiting heat-exchange steps.
    fn heat_capacity(&self) -> f64 {
        let cp: f64 = (0..NS).map(|i| self.n[i] * SPECIES[i].cp_ig(self.t())).sum();
        // Liquids hold roughly 40 J/(mol·K) more than their vapour.
        (cp + (1.0 - self.state.beta) * self.moles() * 40.0).max(1.0)
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind")]
pub enum PipeKind {
    Plain,
    /// Shut-off / control valve, opening 0..1.
    Valve { opening: f64 },
    /// One-way.
    Check,
    /// Centrifugal pump: shut-off head [Pa], flow at zero head [m³/s], efficiency, electrical
    /// power available this step [W] (set by the grid) and power used.
    Pump { dp_max: f64, q_max: f64, eff: f64, rated_w: f64, power_avail: f64, power_used: f64 },
    /// Compressor: maximum pressure ratio, isentropic efficiency, power.
    Compressor { ratio_max: f64, eff: f64, rated_w: f64, power_avail: f64, power_used: f64 },
    /// Turbine: flow coefficient (Stodola), isentropic efficiency, admission valve opening, rated
    /// power [W] and power produced [W].
    Turbine { flow_coeff: f64, eff: f64, opening: f64, rated_w: f64, power_out: f64 },
    /// Relief valve that lifts when the inlet passes `set_p`.
    Relief { set_p: f64 },
}

#[derive(Clone, Debug)]
pub struct Pipe {
    pub a: usize,
    pub b: usize,
    /// Port heights above each vessel's bottom [m].
    pub ha: f64,
    pub hb: f64,
    pub length: f64,
    pub diameter: f64,
    pub roughness: f64,
    /// Fittings, entrances and exits as a loss coefficient.
    pub k_minor: f64,
    pub kind: PipeKind,
    /// Mass flow [kg/s], positive from a to b.
    pub mdot: f64,
    /// For display: velocity [m/s], whether it carries vapour, and whether it is choked.
    pub velocity: f64,
    pub vapour: bool,
    pub choked: bool,
}

impl Pipe {
    pub fn new(a: usize, b: usize, length: f64, diameter: f64, kind: PipeKind) -> Self {
        Pipe {
            a, b, ha: 0.0, hb: 0.0, length: length.max(0.5), diameter, roughness: 4.5e-5, k_minor: 1.5, kind,
            mdot: 0.0, velocity: 0.0, vapour: false, choked: false,
        }
    }
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.diameter * self.diameter / 4.0
    }
}

/// A thermal connection between two vessels (a heat-exchanger wall, a furnace's tubes).
#[derive(Clone, Debug)]
pub struct ThermalLink {
    pub a: usize,
    pub b: usize,
    pub ua: f64,
    pub q: f64,
}

#[derive(Clone, Debug, Serialize)]
pub struct Rupture {
    pub vessel: usize,
    pub pressure: f64,
}

#[derive(Default)]
pub struct Network {
    pub vessels: Vec<Vessel>,
    pub pipes: Vec<Pipe>,
    pub links: Vec<ThermalLink>,
    pub ambient_t: f64,
    pub ruptures: Vec<Rupture>,
}

/// Darcy friction factor: laminar below Re 2300, Swamee–Jain above, blended between.
fn friction_factor(re: f64, rel_rough: f64) -> f64 {
    let lam = 64.0 / re.max(1.0);
    let turb = 0.25 / (rel_rough / 3.7 + 5.74 / re.max(1.0).powf(0.9)).log10().powi(2);
    if re < 2300.0 {
        lam
    } else if re > 4000.0 {
        turb
    } else {
        let w = (re - 2300.0) / 1700.0;
        lam * (1.0 - w) + turb * w
    }
}

struct Draw {
    vapour: bool,
    z: Comp,
    mw: f64,
    rho: f64,
    mu: f64,
    h: f64,
    gamma: f64,
}

fn draw_of(v: &Vessel, vapour: bool) -> Draw {
    let s = &v.state;
    let (z, ph_rho, mu) = if vapour { (s.y, s.rho_vap(), s.mu_vap()) } else { (s.x, s.rho_liq(), s.mu_liq()) };
    let mw = Flash::mw(&z);
    let h = if vapour { s.h_vap() } else { s.h_liq() };
    Draw { vapour, z, mw, rho: ph_rho.max(1e-3), mu: mu.max(1e-6), h, gamma: s.gamma_vap() }
}

impl Network {
    pub fn new(ambient_t: f64) -> Self {
        Network { ambient_t, ..Default::default() }
    }

    pub fn add_vessel(&mut self, v: Vessel) -> usize {
        self.vessels.push(v);
        self.vessels.len() - 1
    }

    pub fn add_pipe(&mut self, p: Pipe) -> usize {
        self.pipes.push(p);
        self.pipes.len() - 1
    }

    /// Sets a vessel's contents to `n` at temperature `t` (used to fill tanks and to restore
    /// contents when the network is rebuilt).
    pub fn fill(&mut self, i: usize, n: Comp, t: f64) {
        let v = &mut self.vessels[i];
        v.n = n;
        let fl = crate::thermodynamics::flash::vt_flash(&n, v.volume, t, v.state.p);
        v.u = fl.u() * n.iter().sum::<f64>();
        v.state = fl;
    }

    /// Advances the network by `dt` seconds.
    pub fn step(&mut self, dt: f64) {
        self.flow(dt);
        self.heat(dt);
        self.react(dt);
        self.reflash();
    }

    fn flow(&mut self, dt: f64) {
        let nv = self.vessels.len();
        let np = self.pipes.len();

        // 1. What each pipe would carry: its upstream phase, fixed pressure terms and resistance.
        struct Lin {
            active: bool,
            d: Option<Draw>,
            /// Pressure terms that don't depend on the solve: port hydrostatics, elevation, pump.
            fixed_dp: f64,
            k: f64,
            lam: f64,
            inertia: f64,
            /// Turbines: flow set algebraically (no inertia, not part of the pressure solve).
            algebraic: Option<f64>,
            extra_w: f64,
        }
        let mut lins: Vec<Lin> = Vec::with_capacity(np);
        for p in self.pipes.iter_mut() {
            let (va, vb) = (&self.vessels[p.a], &self.vessels[p.b]);
            let off = Lin { active: false, d: None, fixed_dp: 0.0, k: 0.0, lam: 0.0, inertia: 1.0, algebraic: None, extra_w: 0.0 };
            if va.ruptured || vb.ruptured {
                p.mdot = 0.0;
                lins.push(off);
                continue;
            }
            let (vap_a, pa) = va.port(p.ha);
            let (vap_b, pb) = vb.port(p.hb);
            // The upstream side decides what flows: by current direction, or by pressure from rest.
            let forward = if p.mdot.abs() > 1e-9 { p.mdot > 0.0 } else { pa >= pb };
            let (up, up_vap) = if forward { (va, vap_a) } else { (vb, vap_b) };
            if up.moles() <= 0.0 {
                p.mdot = 0.0;
                lins.push(off);
                continue;
            }
            let d = draw_of(up, up_vap);
            let area = p.area();
            let head = d.rho * G * ((vb.elevation + p.hb) - (va.elevation + p.ha));
            // Port pressures differ from the vessels' by their liquid head.
            let mut fixed_dp = (pa - va.p()) - (pb - vb.p()) - head;
            let mut extra_w = 0.0;
            let q = p.mdot.abs() / d.rho;
            match &mut p.kind {
                PipeKind::Pump { dp_max, q_max, eff, rated_w, power_avail, power_used } => {
                    // The pump's curve, scaled by the power it actually gets.
                    let share = if *rated_w > 0.0 { (*power_avail / *rated_w).clamp(0.0, 1.0) } else { 0.0 };
                    let pump_dp = *dp_max * share.sqrt() * (1.0 - (q / *q_max).powi(2)).max(0.0);
                    fixed_dp += pump_dp;
                    *power_used = (q * pump_dp / *eff).min(*power_avail);
                    extra_w = *power_used;
                }
                PipeKind::Compressor { ratio_max, eff, rated_w: _, power_avail, power_used } => {
                    // Pressure ratio the available shaft power supports at this flow (ideal gas).
                    let t1 = up.t();
                    let k = (d.gamma - 1.0) / d.gamma;
                    let cp = 8.314462618 / k; // J/(mol·K)
                    let ndot = p.mdot.abs() / d.mw;
                    let ratio = if ndot > 1e-9 {
                        (1.0 + *power_avail * *eff / (ndot * cp * t1)).powf(1.0 / k).min(*ratio_max)
                    } else if *power_avail > 0.0 {
                        *ratio_max
                    } else {
                        1.0
                    };
                    let p1 = if forward { pa } else { pb };
                    fixed_dp += p1 * (ratio - 1.0);
                    *power_used = ndot * cp * t1 * (ratio.powf(k) - 1.0) / *eff;
                    extra_w = *power_used;
                }
                _ => {}
            }
            // Resistance: pipe friction, fittings, and a throttling valve.
            let re = p.mdot.abs() / area * p.diameter / d.mu;
            let f = friction_factor(re, p.roughness / p.diameter);
            let mut k = (f * p.length / p.diameter + p.k_minor) / (2.0 * d.rho * area * area);
            let lam = 32.0 * d.mu * p.length / (d.rho * area * p.diameter * p.diameter);
            let mut blocked = false;
            match &p.kind {
                PipeKind::Valve { opening } => {
                    if *opening <= 0.001 {
                        blocked = true;
                    } else {
                        // Equal-percentage trim (rangeability 10⁴): each step of opening multiplies
                        // the flow coefficient by the same factor, so control is usable at any flow.
                        k += 2.0 * 1e8_f64.powf(1.0 - opening) / (2.0 * d.rho * area * area);
                    }
                }
                PipeKind::Relief { set_p } => {
                    let over = (pa - *set_p) / (0.1 * *set_p);
                    if over <= 0.0 {
                        blocked = true;
                    } else {
                        let opening = over.min(1.0);
                        k += 2.0 / (opening * opening) / (2.0 * d.rho * area * area);
                    }
                }
                _ => {}
            }
            if blocked {
                p.mdot = 0.0;
                p.velocity = 0.0;
                lins.push(off);
                continue;
            }
            let mut algebraic = None;
            if let PipeKind::Turbine { flow_coeff, eff, opening, power_out, .. } = &mut p.kind {
                // Stodola's cone law: flow set by inlet and outlet pressure, no inertia.
                let (p1, p2) = if pa >= pb { (pa, pb) } else { (pb, pa) };
                let mdot = *flow_coeff * *opening * ((p1 * p1 - p2 * p2).max(0.0) / up.t()).sqrt() * 1e-3;
                let ndot = mdot / d.mw;
                // Isentropic expansion to the outlet pressure gives the work.
                *power_out = if ndot > 1e-9 && p2 < p1 {
                    let inlet = pt_flash(&d.z, up.t(), p1);
                    let out = ps_flash(&d.z, p2, inlet.s(), up.t());
                    (ndot * (d.h - out.h()) * *eff).max(0.0)
                } else {
                    0.0
                };
                extra_w = -*power_out;
                algebraic = Some(if pa >= pb { mdot } else { -mdot });
            }
            lins.push(Lin { active: true, d: Some(d), fixed_dp, k, lam, inertia: p.length / area, algebraic, extra_w });
        }

        // 2. Solve flows and end-of-step pressures together (backward Euler over the whole
        // network). Each pipe: m = α + β·(Pa − Pb), with friction linearised about the current
        // estimate. Each vessel: P = P0 + c·dt·(net volumetric inflow), c = dP/dV. Gauss–Seidel
        // on the pressures, then relinearise once.
        let compliance: Vec<f64> = self
            .vessels
            .iter()
            .map(|v| {
                if v.reservoir.is_some() || v.ruptured {
                    0.0
                } else {
                    let gas = v.volume - v.liquid_volume();
                    if gas > 0.02 * v.volume { v.p() / gas } else { LIQUID_BULK_MODULUS / v.volume }
                }
            })
            .collect();
        let p0: Vec<f64> = self.vessels.iter().map(|v| v.p()).collect();
        let mut pnew = p0.clone();
        let mut est: Vec<f64> = self.pipes.iter().map(|p| p.mdot).collect();
        let mut alpha = vec![0.0; np];
        let mut beta = vec![0.0; np];
        let mut rho = vec![1.0; np];
        for _pass in 0..2 {
            for (j, l) in lins.iter().enumerate() {
                if !l.active {
                    alpha[j] = 0.0;
                    beta[j] = 0.0;
                    continue;
                }
                rho[j] = l.d.as_ref().unwrap().rho;
                if let Some(m) = l.algebraic {
                    alpha[j] = m;
                    beta[j] = 0.0;
                    continue;
                }
                let m0 = est[j];
                let r = 2.0 * l.k * m0.abs() + l.lam;
                let f0 = l.k * m0 * m0.abs();
                let b = dt / l.inertia;
                let denom = 1.0 + b * r;
                alpha[j] = (self.pipes[j].mdot + b * (l.fixed_dp - f0 + r * m0)) / denom;
                beta[j] = b / denom;
            }
            for _sweep in 0..60 {
                let mut worst: f64 = 0.0;
                for i in 0..nv {
                    if compliance[i] == 0.0 {
                        continue;
                    }
                    let cdt = compliance[i] * dt;
                    let (mut num, mut den) = (p0[i], 1.0);
                    for (j, pp) in self.pipes.iter().enumerate() {
                        if !lins[j].active {
                            continue;
                        }
                        if pp.b == i {
                            num += cdt * (alpha[j] + beta[j] * pnew[pp.a]) / rho[j];
                            den += cdt * beta[j] / rho[j];
                        } else if pp.a == i {
                            num -= cdt * (alpha[j] - beta[j] * pnew[pp.b]) / rho[j];
                            den += cdt * beta[j] / rho[j];
                        }
                    }
                    let pi = (num / den).max(1.0);
                    worst = worst.max((pi - pnew[i]).abs() / pnew[i].max(1.0));
                    pnew[i] = pi;
                }
                if worst < 1e-7 {
                    break;
                }
            }
            for (j, pp) in self.pipes.iter().enumerate() {
                est[j] = alpha[j] + beta[j] * (pnew[pp.a] - pnew[pp.b]);
            }
        }

        // 3. Apply flows, with the one-way and sonic limits, and work out what moves.
        let mut moves: Vec<(usize, usize, f64, Draw, f64)> = Vec::with_capacity(np); // (from, to, moles, draw, extra energy)
        let mut requested = vec![[0.0f64; 2]; nv]; // [liquid, vapour] moles asked of each vessel
        for (j, (p, l)) in self.pipes.iter_mut().zip(lins.into_iter()).enumerate() {
            if !l.active {
                continue;
            }
            let d = l.d.unwrap();
            let area = p.area();
            p.mdot = est[j];
            if matches!(p.kind, PipeKind::Check) && p.mdot < 0.0 {
                p.mdot = 0.0;
            }
            // A gas cannot leave faster than sound.
            p.choked = false;
            if d.vapour {
                let up = if p.mdot >= 0.0 { &self.vessels[p.a] } else { &self.vessels[p.b] };
                let c = (d.gamma * up.state.p / d.rho).sqrt();
                let max = d.rho * c * area;
                if p.mdot.abs() > max {
                    p.mdot = max * p.mdot.signum();
                    p.choked = true;
                }
            }
            p.vapour = d.vapour;
            p.velocity = p.mdot / (d.rho * area);
            let moles = p.mdot.abs() * dt / d.mw;
            let (from, to) = if p.mdot >= 0.0 { (p.a, p.b) } else { (p.b, p.a) };
            if moles > 0.0 {
                requested[from][d.vapour as usize] += moles;
                moves.push((from, to, moles, d, l.extra_w * dt));
            }
        }
        // Scale back any vessel asked for more than it can give this step: a share of what it
        // holds plus what flows in meanwhile (a pipe segment passes far more than its own
        // volume). Two passes, so inflows that were themselves cut back are counted as cut.
        let mut scale = vec![[1.0f64; 2]; nv];
        for _ in 0..2 {
            let mut incoming = vec![[0.0f64; 2]; nv];
            for (from, to, moles, d, _) in &moves {
                incoming[*to][d.vapour as usize] += moles * scale[*from][d.vapour as usize];
            }
            for (i, v) in self.vessels.iter().enumerate() {
                if v.reservoir.is_some() {
                    continue;
                }
                let total = v.moles();
                let avail = [total * (1.0 - v.state.beta), total * v.state.beta];
                for ph in 0..2 {
                    let limit = MAX_DRAW * avail[ph] + 0.9 * incoming[i][ph];
                    scale[i][ph] = if requested[i][ph] > limit { limit / requested[i][ph] } else { 1.0 };
                }
            }
        }
        for (from, to, moles, d, energy) in moves {
            let s = scale[from][d.vapour as usize];
            let m = moles * s;
            for v in [from, to] {
                if self.vessels[v].reservoir.is_some() {
                    continue;
                }
                let sign = if v == from { -1.0 } else { 1.0 };
                let vs = &mut self.vessels[v];
                for i in 0..NS {
                    vs.n[i] = (vs.n[i] + sign * m * d.z[i]).max(0.0);
                }
                vs.u += sign * m * d.h;
                // Shaft work goes into (or comes out of) the fluid arriving downstream.
                if v == to {
                    vs.u += energy * s;
                }
            }
        }
        for p in self.pipes.iter_mut() {
            // Keep the stored flow consistent with what actually moved.
            let from = if p.mdot >= 0.0 { p.a } else { p.b };
            let s = scale[from][p.vapour as usize];
            if s < 1.0 {
                p.mdot *= s;
                p.velocity *= s;
            }
        }
    }

    fn heat(&mut self, dt: f64) {
        let t_amb = self.ambient_t;
        for v in self.vessels.iter_mut() {
            v.q_net = 0.0;
            if v.reservoir.is_some() || v.moles() <= 0.0 {
                continue;
            }
            let t = v.t();
            let loss = v.ua_ambient * (t - t_amb) + v.radiating_area * 0.85 * STEFAN_BOLTZMANN * (t.powi(4) - t_amb.powi(4));
            let q = v.heat_in - loss;
            v.u += q * dt;
            v.q_net += q;
        }
        for l in self.links.iter_mut() {
            let (a, b) = (&self.vessels[l.a], &self.vessels[l.b]);
            if a.moles() <= 0.0 || b.moles() <= 0.0 {
                l.q = 0.0;
                continue;
            }
            let dtemp = a.t() - b.t();
            // Never move more heat than would bring the two sides level.
            let c = 1.0 / (1.0 / a.heat_capacity() + 1.0 / b.heat_capacity());
            let q = (l.ua * dtemp).abs().min(0.5 * c * dtemp.abs() / dt) * dtemp.signum();
            l.q = q;
            self.vessels[l.a].u -= q * dt;
            self.vessels[l.a].q_net -= q;
            self.vessels[l.b].u += q * dt;
            self.vessels[l.b].q_net += q;
        }
    }

    fn react(&mut self, dt: f64) {
        for v in self.vessels.iter_mut() {
            if v.reservoir.is_some() || v.ruptured {
                continue;
            }
            v.reaction_rate.resize(v.reactions.len(), 0.0);
            let gas_volume = (v.volume - v.liquid_volume()).max(1e-3 * v.volume);
            let t = v.t();
            for (k, &r) in v.reactions.iter().enumerate() {
                let xi = advance(&REACTIONS[r], &mut v.n, gas_volume, t, v.cat_volume, v.pilot, dt);
                v.reaction_rate[k] = xi / dt;
            }
            if v.electrolysis_w > 0.0 {
                // 2 H2O → 2 H2 + O2 at a practical 1.9 V per cell: 2 electrons per H2.
                let h2o = crate::thermodynamics::species::index_of("h2o").unwrap();
                let mol_h2 = (v.electrolysis_w * dt / (2.0 * 96_485.0 * 1.9)).min(v.n[h2o]);
                v.n[h2o] -= mol_h2;
                v.n[0] += mol_h2;
                v.n[1] += mol_h2 / 2.0;
                v.u += v.electrolysis_w * dt;
            }
        }
    }

    fn reflash(&mut self) {
        for (i, v) in self.vessels.iter_mut().enumerate() {
            if v.reservoir.is_some() || v.ruptured {
                continue;
            }
            let moles = v.moles();
            if moles < 1e-9 {
                v.n = [0.0; NS];
                v.u = 0.0;
                continue;
            }
            v.state = uv_flash_k(&v.n, v.volume, v.u, v.state.t, v.state.p, &mut v.k_cache);
            if v.state.p > 1.5 * v.design_p {
                v.ruptured = true;
                self.ruptures.push(Rupture { vessel: i, pressure: v.state.p });
            }
        }
    }

    /// Total enthalpy-free bookkeeping helpers for tests: total moles of each element.
    pub fn total_moles(&self) -> f64 {
        self.vessels.iter().filter(|v| v.reservoir.is_none()).map(|v| v.moles()).sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::thermodynamics::species::index_of;

    fn water(mol: f64) -> Comp {
        let mut n = [0.0; NS];
        n[index_of("h2o").unwrap()] = mol;
        n
    }

    #[test]
    fn tanks_equalise_by_pressure_and_conserve_mass_and_energy() {
        let mut net = Network::new(293.15);
        let a = net.add_vessel(Vessel::new(1.0, 1.0, 300.0));
        let b = net.add_vessel(Vessel::new(1.0, 1.0, 300.0));
        let mut n = [0.0; NS];
        n[index_of("ch4").unwrap()] = 400.0; // ~10 bar
        net.fill(a, n, 300.0);
        net.add_pipe(Pipe::new(a, b, 10.0, 0.05, PipeKind::Plain));
        let (m0, u0) = (net.total_moles(), net.vessels[a].u + net.vessels[b].u);
        for _ in 0..2_000 {
            net.step(0.05);
        }
        let (pa, pb) = (net.vessels[a].p(), net.vessels[b].p());
        assert!((pa - pb).abs() / pa < 0.01, "{pa} {pb}");
        assert!((net.total_moles() - m0).abs() / m0 < 1e-9);
        let u1 = net.vessels[a].u + net.vessels[b].u;
        assert!((u1 - u0).abs() / u0.abs() < 1e-6, "{u0} {u1}");
    }

    #[test]
    fn water_drains_downhill_through_a_pipe() {
        let mut net = Network::new(293.15);
        let top = net.add_vessel(Vessel::new(5.0, 5.0, 293.15));
        let mut bottom = Vessel::new(5.0, 5.0, 293.15);
        bottom.elevation = -10.0;
        let bottom = net.add_vessel(bottom);
        // Vent both to atmosphere so the gas spaces stay at 1 atm.
        let atm = net.add_vessel(Vessel::reservoir(Reservoir { z: { let mut z = [0.0; NS]; z[2] = 0.79; z[1] = 0.21; z }, t: 293.15, p: P_ATM }));
        let mut n = water(2.0 * 55_400.0); // 2 m³
        n[2] = 50.0;
        net.fill(top, n, 293.15);
        for v in [top, bottom] {
            let mut vent = Pipe::new(v, atm, 2.0, 0.1, PipeKind::Plain);
            vent.ha = 5.0;
            net.add_pipe(vent);
        }
        net.add_pipe(Pipe::new(top, bottom, 12.0, 0.08, PipeKind::Plain));
        for _ in 0..200 {
            net.step(0.05);
        }
        let flow = net.pipes[2].mdot;
        // Torricelli-ish: ~10 m of head through 12 m of 80 mm pipe gives several kg/s.
        assert!(flow > 5.0 && flow < 60.0, "{flow}");
        assert!(!net.pipes[2].vapour);
        for _ in 0..4_000 {
            net.step(0.05);
        }
        assert!(net.vessels[top].level() < 0.05, "{}", net.vessels[top].level());
    }

    #[test]
    fn heating_a_closed_drum_raises_its_pressure_along_the_saturation_curve() {
        let mut net = Network::new(293.15);
        let mut drum = Vessel::new(2.0, 2.0, 373.15);
        drum.design_p = 100e5;
        let d = net.add_vessel(drum);
        net.fill(d, water(40_000.0), 373.15);
        net.vessels[d].heat_in = 2e6;
        for _ in 0..200 {
            net.step(0.05);
        }
        // 20 MJ into ~720 kg of water: ≈ +6–7 K, so T ≈ 380 K and P ≈ Psat ≈ 1.3 bar.
        let s = &net.vessels[d].state;
        assert!(s.t > 377.0 && s.t < 384.0, "{}", s.t);
        assert!(s.p > 1.1e5 && s.p < 1.6e5, "{}", s.p);
    }
}
