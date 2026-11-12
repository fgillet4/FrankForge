//! Peng–Robinson equation of state for mixtures: compressibility, fugacity coefficients and the
//! enthalpy and entropy departures from the ideal gas.

use super::species::{NS, R, SPECIES};

pub type Comp = [f64; NS];

const SQRT2: f64 = std::f64::consts::SQRT_2;

/// Binary interaction parameters for pairs PR gets badly wrong without one (water with gases is
/// the important case: kij = 0 would dissolve far too much gas in water).
fn kij_table() -> &'static [[f64; NS]; NS] {
    static TABLE: std::sync::OnceLock<[[f64; NS]; NS]> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| std::array::from_fn(|i| std::array::from_fn(|j| kij_lookup(i, j))))
}

fn kij_lookup(i: usize, j: usize) -> f64 {
    let pair = |a: &str, b: &str| {
        let (x, y) = (SPECIES[i].id, SPECIES[j].id);
        (x == a && y == b) || (x == b && y == a)
    };
    for (a, b, k) in [
        ("h2o", "ch4", 0.50),
        ("h2o", "c2h6", 0.50),
        ("h2o", "c2h4", 0.50),
        ("h2o", "n2", 0.48),
        ("h2o", "o2", 0.48),
        ("h2o", "h2", 0.50),
        ("h2o", "co", 0.48),
        ("h2o", "co2", 0.19),
        ("h2o", "nh3", -0.25),
        ("h2o", "ch3oh", -0.07),
        ("co2", "ch4", 0.10),
        ("co2", "n2", -0.02),
    ] {
        if pair(a, b) {
            return k;
        }
    }
    0.0
}

/// Temperature-dependent pure-component parameters, computed once per temperature.
pub struct Params {
    pub t: f64,
    pub a: Comp,
    pub b: Comp,
    pub da: Comp,
    /// Mixing-rule cross terms aij and their temperature derivatives.
    aij: [[f64; NS]; NS],
    daij: [[f64; NS]; NS],
}

impl Params {
    pub fn new(t: f64) -> Self {
        let mut p = Params { t, a: [0.0; NS], b: [0.0; NS], da: [0.0; NS], aij: [[0.0; NS]; NS], daij: [[0.0; NS]; NS] };
        for (i, s) in SPECIES.iter().enumerate() {
            let w = s.omega;
            let kappa = if w <= 0.491 {
                0.37464 + 1.54226 * w - 0.26992 * w * w
            } else {
                0.379642 + 1.48503 * w - 0.164423 * w * w + 0.016666 * w * w * w
            };
            let ac = 0.45724 * R * R * s.tc * s.tc / s.pc;
            let sq = (t / s.tc).sqrt();
            let m = 1.0 + kappa * (1.0 - sq);
            p.a[i] = ac * m * m;
            p.da[i] = -ac * kappa * m / (t * s.tc).sqrt();
            p.b[i] = 0.07780 * R * s.tc / s.pc;
        }
        let kij = kij_table();
        for i in 0..NS {
            for j in 0..NS {
                let k = 1.0 - kij[i][j];
                p.aij[i][j] = (p.a[i] * p.a[j]).sqrt() * k;
                p.daij[i][j] = 0.5 * k * ((p.a[j] / p.a[i]).sqrt() * p.da[i] + (p.a[i] / p.a[j]).sqrt() * p.da[j]);
            }
        }
        p
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Root {
    Liquid,
    Vapor,
}

/// One phase evaluated at (T, P, x).
#[derive(Clone, Copy, Debug)]
pub struct Phase {
    pub z: f64,
    /// Molar volume [m³/mol].
    pub v: f64,
    pub ln_phi: Comp,
    /// Enthalpy and entropy departures [J/mol], [J/(mol·K)].
    pub h_dep: f64,
    pub s_dep: f64,
    /// True when the cubic had three real roots (so liquid and vapour are distinct).
    pub two_roots: bool,
}

/// Real roots of z³ + c2 z² + c1 z + c0, ascending.
fn cubic_roots(c2: f64, c1: f64, c0: f64) -> ([f64; 3], usize) {
    let q = (3.0 * c1 - c2 * c2) / 9.0;
    let r = (9.0 * c2 * c1 - 27.0 * c0 - 2.0 * c2 * c2 * c2) / 54.0;
    let d = q * q * q + r * r;
    let shift = -c2 / 3.0;
    if d > 0.0 {
        let s = (r + d.sqrt()).cbrt();
        let t = (r - d.sqrt()).cbrt();
        ([s + t + shift, 0.0, 0.0], 1)
    } else {
        let th = (r / (-q * q * q).sqrt()).clamp(-1.0, 1.0).acos();
        let m = 2.0 * (-q).sqrt();
        let mut z = [
            m * (th / 3.0).cos() + shift,
            m * ((th + 2.0 * std::f64::consts::PI) / 3.0).cos() + shift,
            m * ((th + 4.0 * std::f64::consts::PI) / 3.0).cos() + shift,
        ];
        z.sort_by(|a, b| a.partial_cmp(b).unwrap());
        (z, 3)
    }
}

/// Evaluates the phase of composition `x` (need not be normalised) at pressure `p` [Pa].
pub fn phase(par: &Params, p: f64, x: &Comp, root: Root) -> Phase {
    let sum: f64 = x.iter().sum();
    let t = par.t;
    let mut am = 0.0;
    let mut dam = 0.0;
    let mut bm = 0.0;
    let mut sa = [0.0; NS]; // Σj xj aij
    let xs: Comp = std::array::from_fn(|i| if sum > 0.0 { x[i] / sum } else { 0.0 });
    let mut present = [0usize; NS];
    let mut np = 0;
    for i in 0..NS {
        if xs[i] > 0.0 {
            present[np] = i;
            np += 1;
        }
    }
    let present = &present[..np];
    for i in 0..NS {
        // Σj xj aij is needed for every species (its fugacity in this phase), present or not.
        for &j in present {
            sa[i] += xs[j] * par.aij[i][j];
        }
    }
    for &i in present {
        bm += xs[i] * par.b[i];
        am += xs[i] * sa[i];
        for &j in present {
            dam += xs[i] * xs[j] * par.daij[i][j];
        }
    }
    let rt = R * t;
    let a = am * p / (rt * rt);
    let b = bm * p / rt;
    let (roots, n) = cubic_roots(-(1.0 - b), a - 3.0 * b * b - 2.0 * b, -(a * b - b * b - b * b * b));
    let valid: Vec<f64> = roots[..n].iter().copied().filter(|&z| z > b).collect();
    let z = match (root, valid.as_slice()) {
        (_, []) => b + 1e-9,
        (Root::Liquid, v) => v[0],
        (Root::Vapor, v) => v[v.len() - 1],
    };
    let log_term = ((z + (1.0 + SQRT2) * b) / (z + (1.0 - SQRT2) * b)).ln();
    let mut ln_phi = [0.0; NS];
    for i in 0..NS {
        if bm <= 0.0 {
            break;
        }
        ln_phi[i] = par.b[i] / bm * (z - 1.0) - (z - b).ln()
            - if b > 0.0 { a / (2.0 * SQRT2 * b) * (2.0 * sa[i] / am.max(1e-300) - par.b[i] / bm) * log_term } else { 0.0 };
    }
    let (h_dep, s_dep) = if bm > 0.0 {
        let c = log_term / (2.0 * SQRT2 * bm);
        (rt * (z - 1.0) + (t * dam - am) * c, R * (z - b).ln() + dam * c)
    } else {
        (0.0, 0.0)
    };
    Phase { z, v: z * rt / p, ln_phi, h_dep, s_dep, two_roots: valid.len() > 1 }
}

/// Molar Gibbs departure, used to choose the stable root when the cubic has three.
pub fn g_dep(ph: &Phase, x: &Comp) -> f64 {
    let sum: f64 = x.iter().sum();
    x.iter().zip(ph.ln_phi.iter()).map(|(xi, l)| xi / sum * l).sum()
}

/// The root a single phase of composition `x` actually takes: the one with lower Gibbs energy.
pub fn stable_phase(par: &Params, p: f64, x: &Comp) -> (Phase, Root) {
    let l = phase(par, p, x, Root::Liquid);
    if !l.two_roots {
        // One real root: call it liquid if it is dense (below the pseudo-critical temperature).
        let tpc: f64 = x.iter().zip(SPECIES).map(|(xi, s)| xi * s.tc).sum::<f64>() / x.iter().sum::<f64>();
        return (l, if par.t < tpc && l.z < 0.3 { Root::Liquid } else { Root::Vapor });
    }
    let v = phase(par, p, x, Root::Vapor);
    if g_dep(&l, x) < g_dep(&v, x) { (l, Root::Liquid) } else { (v, Root::Vapor) }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::thermodynamics::species::index_of;

    fn pure(id: &str) -> Comp {
        let mut x = [0.0; NS];
        x[index_of(id).unwrap()] = 1.0;
        x
    }

    /// Saturation pressure from PR by equal fugacity (successive substitution on P).
    fn psat(id: &str, t: f64) -> f64 {
        let x = pure(id);
        let par = Params::new(t);
        let i = index_of(id).unwrap();
        let mut p = 1e5;
        for _ in 0..200 {
            let l = phase(&par, p, &x, Root::Liquid);
            let v = phase(&par, p, &x, Root::Vapor);
            p *= (l.ln_phi[i] - v.ln_phi[i]).exp();
        }
        p
    }

    #[test]
    fn water_boils_near_100c_at_one_atmosphere() {
        let p = psat("h2o", 373.15);
        assert!((p / 101_325.0 - 1.0).abs() < 0.08, "{p}");
    }

    #[test]
    fn nitrogen_at_room_temperature_is_nearly_ideal() {
        let par = Params::new(300.0);
        let ph = phase(&par, 1e5, &pure("n2"), Root::Vapor);
        assert!((ph.z - 1.0).abs() < 0.002, "{}", ph.z);
        // Methane at 100 bar, 300 K: Z ≈ 0.86 (NIST).
        let ph = phase(&par, 100e5, &pure("ch4"), Root::Vapor);
        assert!((ph.z - 0.86).abs() < 0.03, "{}", ph.z);
    }

    #[test]
    fn latent_heat_of_water_is_close() {
        let t = 373.15;
        let par = Params::new(t);
        let p = psat("h2o", t);
        let l = phase(&par, p, &pure("h2o"), Root::Liquid);
        let v = phase(&par, p, &pure("h2o"), Root::Vapor);
        let hvap = v.h_dep - l.h_dep;
        // Real: 40.65 kJ/mol. PR is usually within ~10 %.
        assert!((hvap / 40_650.0 - 1.0).abs() < 0.12, "{hvap}");
        // Liquid density: real 958 kg/m³; PR underpredicts water's.
        let rho = 0.018015 / l.v;
        assert!(rho > 700.0 && rho < 1100.0, "{rho}");
    }
}
