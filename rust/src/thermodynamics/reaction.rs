//! Reactions: equilibrium constants from ideal-gas Gibbs energies and reversible rate laws that
//! stop exactly at equilibrium. Heat of reaction is not modelled separately: species enthalpies
//! include their formation enthalpy, so a vessel that conserves energy heats or cools by itself.

use super::eos::Comp;
use super::species::{index_of, NS, R, SPECIES};

pub struct Reaction {
    pub id: &'static str,
    pub name: &'static str,
    /// Stoichiometry: negative for reactants.
    pub nu: &'static [(&'static str, f64)],
    /// Rate constant at `t_ref` [mol/(s·m³ catalyst·bar^order)] and activation energy [J/mol].
    pub k_ref: f64,
    pub t_ref: f64,
    pub ea: f64,
    /// Below this temperature the catalyst is inactive (or the flame goes out).
    pub t_min: f64,
    /// Combustion keeps going below `t_min` in equipment with a pilot flame.
    pub combustion: bool,
}

pub const REACTIONS: &[Reaction] = &[
    Reaction {
        id: "smr", name: "Steam methane reforming", nu: &[("ch4", -1.0), ("h2o", -1.0), ("co", 1.0), ("h2", 3.0)],
        k_ref: 0.5, t_ref: 1100.0, ea: 240e3, t_min: 750.0, combustion: false,
    },
    Reaction {
        id: "wgs", name: "Water–gas shift", nu: &[("co", -1.0), ("h2o", -1.0), ("co2", 1.0), ("h2", 1.0)],
        k_ref: 0.5, t_ref: 650.0, ea: 80e3, t_min: 450.0, combustion: false,
    },
    Reaction {
        id: "haber", name: "Ammonia synthesis", nu: &[("n2", -1.0), ("h2", -3.0), ("nh3", 2.0)],
        k_ref: 3e-7, t_ref: 700.0, ea: 170e3, t_min: 600.0, combustion: false,
    },
    Reaction {
        id: "methanol", name: "Methanol synthesis", nu: &[("co", -1.0), ("h2", -2.0), ("ch3oh", 1.0)],
        k_ref: 2e-3, t_ref: 520.0, ea: 90e3, t_min: 450.0, combustion: false,
    },
    Reaction {
        id: "cracking", name: "Ethane cracking", nu: &[("c2h6", -1.0), ("c2h4", 1.0), ("h2", 1.0)],
        k_ref: 10.0, t_ref: 1100.0, ea: 290e3, t_min: 900.0, combustion: false,
    },
    Reaction {
        id: "burn_ch4", name: "Methane combustion", nu: &[("ch4", -1.0), ("o2", -2.0), ("co2", 1.0), ("h2o", 2.0)],
        k_ref: 1e6, t_ref: 1200.0, ea: 150e3, t_min: 850.0, combustion: true,
    },
    Reaction {
        id: "burn_h2", name: "Hydrogen combustion", nu: &[("h2", -2.0), ("o2", -1.0), ("h2o", 2.0)],
        k_ref: 1e6, t_ref: 1200.0, ea: 100e3, t_min: 800.0, combustion: true,
    },
    Reaction {
        id: "burn_co", name: "CO combustion", nu: &[("co", -2.0), ("o2", -1.0), ("co2", 2.0)],
        k_ref: 1e6, t_ref: 1200.0, ea: 120e3, t_min: 900.0, combustion: true,
    },
];

pub fn reaction(id: &str) -> Option<usize> {
    REACTIONS.iter().position(|r| r.id == id)
}

/// Stoichiometry as a dense vector.
pub fn nu_vec(r: &Reaction) -> Comp {
    let mut v = [0.0; NS];
    for (id, n) in r.nu {
        v[index_of(id).expect("reaction species")] += n;
    }
    v
}

/// ln Kp at temperature t, standard state 1 bar (so Kp is in bar^Δν).
pub fn ln_kp(r: &Reaction, t: f64) -> f64 {
    let nu = nu_vec(r);
    let dg: f64 = (0..NS).filter(|&i| nu[i] != 0.0).map(|i| nu[i] * SPECIES[i].g_ig(t)).sum();
    -dg / (R * t)
}

/// Heat released per mole of extent at temperature t [J/mol] (positive = exothermic).
pub fn heat_of_reaction(r: &Reaction, t: f64) -> f64 {
    let nu = nu_vec(r);
    -(0..NS).filter(|&i| nu[i] != 0.0).map(|i| nu[i] * SPECIES[i].h_ig(t)).sum::<f64>()
}

/// Advances one reaction in a gas space of `volume` [m³] at temperature `t`, with `cat_volume`
/// [m³] of catalyst, for `dt` seconds. Partial pressures come from concentrations (p = nRT/V),
/// which is right for a fixed vessel. Returns the extent [mol]; `n` is updated in place.
/// The step never overshoots equilibrium or drives a species negative.
pub fn advance(r: &Reaction, n: &mut Comp, volume: f64, t: f64, cat_volume: f64, pilot: bool, dt: f64) -> f64 {
    if cat_volume <= 0.0 || volume <= 0.0 || (t < r.t_min && !(pilot && r.combustion)) {
        return 0.0;
    }
    let nu = nu_vec(r);
    let t_rate = if pilot && r.combustion { t.max(r.t_ref) } else { t };
    let k = r.k_ref * (-r.ea / R * (1.0 / t_rate - 1.0 / r.t_ref)).exp();
    let lnk = ln_kp(r, t);
    let bar = R * t / volume / 1e5; // bar per mole
    // ln of the forward and reverse driving terms.
    let ln_terms = |n: &Comp| -> Option<(f64, f64)> {
        let (mut f, mut b) = (0.0, 0.0);
        for i in 0..NS {
            if nu[i] < 0.0 {
                if n[i] <= 0.0 {
                    f = f64::NEG_INFINITY;
                } else {
                    f += -nu[i] * (n[i] * bar).ln();
                }
            } else if nu[i] > 0.0 {
                if n[i] <= 0.0 {
                    b = f64::NEG_INFINITY;
                } else {
                    b += nu[i] * (n[i] * bar).ln();
                }
            }
        }
        if f == f64::NEG_INFINITY && b == f64::NEG_INFINITY { None } else { Some((f, b)) }
    };
    let Some((lf, lb)) = ln_terms(n) else { return 0.0 };
    let rate = k * (lf.exp() - (lb - lnk).exp()); // mol/(s·m³ cat)
    if !rate.is_finite() || rate == 0.0 {
        return 0.0;
    }
    let mut xi = rate * cat_volume * dt;
    // How far the extent can go before a species runs out.
    let mut limit = f64::INFINITY;
    for i in 0..NS {
        if nu[i] * xi < 0.0 {
            limit = limit.min(n[i] / nu[i].abs());
        }
    }
    let dir = xi.signum();
    // Equilibrium extent along this direction: ln Q(ξ) = ln K, found by bisection.
    let gap = |x: f64| -> f64 {
        let m: Comp = std::array::from_fn(|i| n[i] + nu[i] * x * dir);
        match ln_terms(&m) {
            Some((f, b)) => (b - f) - lnk,
            None => if dir > 0.0 { f64::INFINITY } else { f64::NEG_INFINITY },
        }
    };
    // Forward steps raise Q and reverse steps lower it, so "past equilibrium" depends on direction.
    let past = |x: f64| if dir > 0.0 { gap(x) > 0.0 } else { gap(x) < 0.0 };
    let (mut lo, mut hi) = (0.0, limit.min(xi.abs()));
    if past(hi) {
        // Equilibrium lies before the full step: bisect for it.
        for _ in 0..60 {
            let mid = 0.5 * (lo + hi);
            if past(mid) { hi = mid } else { lo = mid }
        }
        xi = dir * lo;
    } else {
        xi = dir * hi;
    }
    for i in 0..NS {
        n[i] = (n[i] + nu[i] * xi).max(0.0);
    }
    xi
}

#[cfg(test)]
mod tests {
    use super::*;

    fn r(id: &str) -> &'static Reaction {
        &REACTIONS[reaction(id).unwrap()]
    }

    #[test]
    fn reactions_balance() {
        for rx in REACTIONS {
            let nu = nu_vec(rx);
            for e in 0..4 {
                let s: f64 = (0..NS).map(|i| nu[i] * SPECIES[i].atoms[e] as f64).sum();
                assert!(s.abs() < 1e-9, "{} element {e}", rx.id);
            }
        }
    }

    #[test]
    fn equilibrium_constants_match_literature() {
        // Water–gas shift: K ≈ 1 near 1100 K, ≈ 9 at 700 K.
        let k = |id, t| ln_kp(r(id), t).exp();
        assert!((k("wgs", 1100.0) - 1.0).abs() < 0.3, "{}", k("wgs", 1100.0));
        assert!((k("wgs", 700.0) / 9.0 - 1.0).abs() < 0.35, "{}", k("wgs", 700.0));
        // Steam reforming: K = 1 bar² near 890 K.
        assert!(k("smr", 890.0) > 0.3 && k("smr", 890.0) < 3.0, "{}", k("smr", 890.0));
        // Haber–Bosch: Kp ≈ 8.3e-5 bar⁻² at 700 K (0.0091² for half the reaction).
        let kh = k("haber", 700.0);
        assert!(kh > 6e-5 && kh < 1.1e-4, "{kh}");
        // Exothermic reactions release heat: WGS ≈ 41 kJ/mol, combustion ≈ 802 kJ/mol.
        assert!((heat_of_reaction(r("wgs"), 298.15) - 41_160.0).abs() < 300.0);
        assert!((heat_of_reaction(r("burn_ch4"), 298.15) - 802_300.0).abs() < 1_000.0);
    }

    #[test]
    fn shift_reaction_stops_at_equilibrium() {
        let mut n = [0.0; NS];
        n[index_of("co").unwrap()] = 100.0;
        n[index_of("h2o").unwrap()] = 100.0;
        for _ in 0..2_000 {
            advance(r("wgs"), &mut n, 1.0, 700.0, 1.0, false, 0.05);
        }
        let (co, h2o, co2, h2) = (n[index_of("co").unwrap()], n[index_of("h2o").unwrap()], n[index_of("co2").unwrap()], n[index_of("h2").unwrap()]);
        let q = co2 * h2 / (co * h2o);
        let k = ln_kp(r("wgs"), 700.0).exp();
        assert!((q / k - 1.0).abs() < 1e-3, "{q} vs {k}");
        assert!((co + co2 - 100.0).abs() < 1e-9);
    }
}
