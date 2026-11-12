//! The electric grid as a single AC system with frequency dynamics.
//!
//! Factorio gives every consumer the same satisfaction ratio (production ÷ demand) each tick.
//! Here the grid has rotating inertia: any imbalance between mechanical input and electrical load
//! changes the frequency by the swing equation. Turbine governors answer with droop plus a slow
//! integral (secondary) control. Batteries respond to frequency, and as it sags, under-frequency
//! relays shed load in stages. Let it fall far enough and the generators trip: a blackout that
//! needs a black start.

use serde::Serialize;

pub const F_NOMINAL: f64 = 50.0;

#[derive(Clone, Debug, Serialize)]
pub struct Generator {
    pub rated_w: f64,
    /// Inertia constant H [s] (stored kinetic energy ÷ rating).
    pub inertia_h: f64,
    /// Mechanical power currently delivered [W] (from a turbine, the sun, ...).
    pub p_mech: f64,
    /// Governed generators adjust their prime mover toward `target_w`.
    pub governed: bool,
    pub target_w: f64,
    pub online: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct Battery {
    pub capacity_j: f64,
    pub charge_j: f64,
    pub rated_w: f64,
    /// Power delivered to the grid this step [W] (negative while charging).
    pub p_out: f64,
}

#[derive(Clone, Debug, Serialize)]
pub struct Load {
    pub demand_w: f64,
    /// Fraction of demand actually served this step.
    pub served: f64,
}

#[derive(Clone, Debug, Serialize)]
pub struct Grid {
    pub frequency: f64,
    pub generators: Vec<Generator>,
    pub batteries: Vec<Battery>,
    pub loads: Vec<Load>,
    /// Droop: fractional speed change for full power swing (5 %).
    pub droop: f64,
    /// Secondary (integral) control setpoint per unit of governed capacity.
    pub setpoint: f64,
    pub blackout: bool,
    /// Totals for display [W].
    pub generation_w: f64,
    pub load_w: f64,
    pub shed_fraction: f64,
}

impl Default for Grid {
    fn default() -> Self {
        Grid {
            frequency: F_NOMINAL, generators: vec![], batteries: vec![], loads: vec![], droop: 0.05, setpoint: 0.5,
            blackout: false, generation_w: 0.0, load_w: 0.0, shed_fraction: 0.0,
        }
    }
}

/// Fraction of load still connected at frequency f: relays shed in stages below 49 Hz.
fn load_served(f: f64) -> f64 {
    if f >= 49.0 {
        1.0
    } else if f <= 47.0 {
        0.0
    } else {
        // Four 25 % stages between 49 and 47 Hz.
        let stages = ((49.0 - f) / 0.5).ceil();
        (1.0 - 0.25 * stages).max(0.0)
    }
}

impl Grid {
    /// Grid-forming capacity: online generators plus batteries (which act as virtual inertia).
    fn online_rating(&self) -> f64 {
        self.generators.iter().filter(|g| g.online).map(|g| g.rated_w).sum::<f64>()
            + if self.blackout { 0.0 } else { self.batteries.iter().map(|b| b.rated_w).sum::<f64>() }
    }

    /// Restarts a dead grid: generators back online at nominal frequency.
    pub fn black_start(&mut self) {
        self.blackout = false;
        self.frequency = F_NOMINAL;
        for g in &mut self.generators {
            g.online = true;
        }
    }

    pub fn step(&mut self, dt: f64) {
        let rating = self.online_rating();
        // A grid with nothing on it is simply dead; it comes up when the first source does.
        if rating <= 0.0 {
            self.frequency = 0.0;
        } else if self.frequency == 0.0 && !self.blackout {
            self.frequency = F_NOMINAL;
        }
        let df = (self.frequency - F_NOMINAL) / F_NOMINAL;
        // Governors: droop around a setpoint that slowly integrates the frequency error away.
        self.setpoint = (self.setpoint - 0.05 * df / self.droop * dt).clamp(0.0, 1.0);
        for g in &mut self.generators {
            if g.governed {
                g.target_w = if g.online { (g.rated_w * (self.setpoint - df / self.droop)).clamp(0.0, g.rated_w) } else { 0.0 };
            }
        }
        let served = if self.blackout || rating <= 0.0 { 0.0 } else { load_served(self.frequency) };
        let demand: f64 = self.loads.iter().map(|l| l.demand_w).sum();
        for l in &mut self.loads {
            l.served = served;
        }
        let p_load = demand * served;
        let p_gen: f64 = self.generators.iter().filter(|g| g.online).map(|g| g.p_mech.min(g.rated_w * 1.1)).sum();
        // Batteries: fast frequency response, ±rating for ±0.2 Hz, plus filling up on surplus.
        let mut p_batt = 0.0;
        for b in &mut self.batteries {
            let want = (-(self.frequency - F_NOMINAL) / 0.2 * b.rated_w).clamp(-b.rated_w, b.rated_w);
            let p = if want > 0.0 { want.min(b.charge_j / dt) } else { want.max(-(b.capacity_j - b.charge_j) / dt) };
            b.charge_j -= p * dt;
            b.p_out = p;
            p_batt += p;
        }
        self.generation_w = p_gen + p_batt;
        self.load_w = p_load;
        self.shed_fraction = 1.0 - served;
        if self.blackout || rating <= 0.0 {
            return;
        }
        // Swing equation on the system's stored rotational energy, with load damping.
        let rotating = rating.max(1.0);
        let h: f64 = if rating > 0.0 {
            (self.generators.iter().filter(|g| g.online).map(|g| g.inertia_h * g.rated_w).sum::<f64>()
                + self.batteries.iter().map(|b| 2.0 * b.rated_w).sum::<f64>())
                / rating
        } else {
            1.0
        };
        let damping = 0.01 * p_load * (self.frequency - F_NOMINAL) / F_NOMINAL;
        // Windage and bearing friction: an undriven machine spins down.
        let windage = 0.005 * rating * self.frequency / F_NOMINAL;
        let dfdt = (self.generation_w - p_load - damping - windage) * F_NOMINAL / (2.0 * h * rotating);
        self.frequency = (self.frequency + dfdt * dt).clamp(0.0, 1.2 * F_NOMINAL);
        // Generators trip below 46 Hz.
        if rating > 0.0 && self.frequency < 46.0 {
            self.blackout = true;
            self.frequency = 0.0;
            for g in &mut self.generators {
                g.online = false;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_empty_grid_is_dead_but_not_tripped() {
        let mut g = Grid::default();
        g.loads.push(Load { demand_w: 1e5, served: 1.0 });
        g.step(0.05);
        assert_eq!((g.frequency, g.blackout, g.loads[0].served), (0.0, false, 0.0));
        g.generators.push(Generator { rated_w: 2e5, inertia_h: 0.5, p_mech: 1e5, governed: false, target_w: 0.0, online: true });
        g.step(0.05);
        assert!((g.frequency - 50.0).abs() < 0.5 && g.loads[0].served == 1.0);
    }

    fn governed_grid() -> Grid {
        let mut g = Grid::default();
        g.generators.push(Generator { rated_w: 10e6, inertia_h: 5.0, p_mech: 5e6, governed: true, target_w: 5e6, online: true });
        g.loads.push(Load { demand_w: 5e6, served: 1.0 });
        g
    }

    /// The governor's prime mover follows its target with a lag, like steam through a valve.
    fn run(g: &mut Grid, seconds: f64) {
        for _ in 0..(seconds / 0.05) as usize {
            g.step(0.05);
            for gen in &mut g.generators {
                gen.p_mech += (gen.target_w - gen.p_mech) * 0.05 / 2.0;
            }
        }
    }

    #[test]
    fn load_step_dips_frequency_then_governors_restore_it() {
        let mut g = governed_grid();
        run(&mut g, 30.0);
        assert!((g.frequency - 50.0).abs() < 0.05, "{}", g.frequency);
        g.loads[0].demand_w = 7e6;
        run(&mut g, 2.0);
        assert!(g.frequency < 49.9, "dip: {}", g.frequency);
        run(&mut g, 120.0);
        assert!((g.frequency - 50.0).abs() < 0.05, "restored: {}", g.frequency);
        assert!(!g.blackout);
    }

    #[test]
    fn overload_sheds_load_and_a_collapse_is_a_blackout() {
        let mut g = governed_grid();
        g.loads[0].demand_w = 12e6;
        run(&mut g, 10.0);
        assert!(g.shed_fraction > 0.0 && !g.blackout, "f = {}", g.frequency);
        // With no prime mover at all, the grid collapses.
        g.generators[0].governed = false;
        g.generators[0].p_mech = 0.0;
        for _ in 0..6_000 {
            g.step(0.05);
        }
        assert!(g.blackout);
        g.black_start();
        assert!(!g.blackout);
        assert_eq!(g.frequency, 50.0);
    }

    #[test]
    fn batteries_catch_a_sudden_loss() {
        let mut g = governed_grid();
        g.batteries.push(Battery { capacity_j: 3.6e10, charge_j: 1.8e10, rated_w: 3e6, p_out: 0.0 });
        run(&mut g, 30.0);
        g.loads[0].demand_w = 7e6;
        let mut min_f: f64 = 50.0;
        for _ in 0..100 {
            run(&mut g, 0.05);
            min_f = min_f.min(g.frequency);
        }
        assert!(min_f > 49.8, "{min_f}");
    }
}
