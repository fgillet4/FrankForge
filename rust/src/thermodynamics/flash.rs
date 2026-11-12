//! Phase equilibrium: the PT flash (Rachford–Rice with successive substitution on PR fugacities),
//! the VT flash a closed vessel needs (find P so the contents fill the volume) and the UV flash
//! (find T from internal energy as well), which is what a vessel with a conserved energy balance uses.

use super::eos::{phase, stable_phase, Comp, Params, Phase, Root};
use super::species::{NS, P_REF, R, SPECIES};

#[derive(Clone, Copy, Debug)]
pub struct Flash {
    pub t: f64,
    pub p: f64,
    /// Vapour mole fraction.
    pub beta: f64,
    /// Liquid and vapour compositions, normalised (equal to the feed for a single phase).
    pub x: Comp,
    pub y: Comp,
    pub liq: Phase,
    pub vap: Phase,
}

fn normalise(v: &mut Comp) {
    let s: f64 = v.iter().sum();
    if s > 0.0 {
        v.iter_mut().for_each(|x| *x /= s);
    }
}

fn wilson(t: f64, p: f64) -> Comp {
    std::array::from_fn(|i| {
        let s = &SPECIES[i];
        s.pc / p * (5.373 * (1.0 + s.omega) * (1.0 - s.tc / t)).exp()
    })
}

/// Rachford–Rice vapour fraction, clamped to [0, 1].
fn rachford_rice(z: &Comp, k: &Comp) -> f64 {
    let f = |b: f64| -> f64 { (0..NS).filter(|&i| z[i] > 0.0).map(|i| z[i] * (k[i] - 1.0) / (1.0 + b * (k[i] - 1.0))).sum() };
    if f(0.0) <= 0.0 {
        return 0.0;
    }
    if f(1.0) >= 0.0 {
        return 1.0;
    }
    // f falls monotonically across [0, 1]; plain bisection is cheap at this size and never fails.
    let (mut lo, mut hi) = (0.0_f64, 1.0_f64);
    for _ in 0..64 {
        let mid = 0.5 * (lo + hi);
        if f(mid) > 0.0 { lo = mid } else { hi = mid }
    }
    0.5 * (lo + hi)
}

impl Flash {
    pub fn single(t: f64, p: f64, z: &Comp, ph: Phase, root: Root) -> Self {
        let beta = if root == Root::Vapor { 1.0 } else { 0.0 };
        Flash { t, p, beta, x: *z, y: *z, liq: ph, vap: ph }
    }

    /// Molar volume [m³/mol].
    pub fn v(&self) -> f64 {
        self.beta * self.vap.v + (1.0 - self.beta) * self.liq.v
    }

    fn h_phase(&self, x: &Comp, ph: &Phase) -> f64 {
        (0..NS).filter(|&i| x[i] > 0.0).map(|i| x[i] * SPECIES[i].h_ig(self.t)).sum::<f64>() + ph.h_dep
    }

    fn s_phase(&self, x: &Comp, ph: &Phase) -> f64 {
        (0..NS)
            .filter(|&i| x[i] > 0.0)
            .map(|i| x[i] * (SPECIES[i].s_ig(self.t) - R * (x[i] * self.p / P_REF).ln()))
            .sum::<f64>()
            + ph.s_dep
    }

    /// Molar enthalpy of the liquid and vapour phases [J/mol] (formation enthalpy included).
    pub fn h_liq(&self) -> f64 {
        self.h_phase(&self.x, &self.liq)
    }
    pub fn h_vap(&self) -> f64 {
        self.h_phase(&self.y, &self.vap)
    }
    pub fn h(&self) -> f64 {
        let hl = if self.beta < 1.0 { self.h_liq() } else { 0.0 };
        let hv = if self.beta > 0.0 { self.h_vap() } else { 0.0 };
        self.beta * hv + (1.0 - self.beta) * hl
    }
    pub fn s(&self) -> f64 {
        let sl = if self.beta < 1.0 { self.s_phase(&self.x, &self.liq) } else { 0.0 };
        let sv = if self.beta > 0.0 { self.s_phase(&self.y, &self.vap) } else { 0.0 };
        self.beta * sv + (1.0 - self.beta) * sl
    }
    /// Molar internal energy [J/mol].
    pub fn u(&self) -> f64 {
        self.h() - self.p * self.v()
    }
    /// Molar mass of a phase [kg/mol].
    pub fn mw(x: &Comp) -> f64 {
        (0..NS).map(|i| x[i] * SPECIES[i].mw * 1e-3).sum()
    }
    pub fn rho_liq(&self) -> f64 {
        Self::mw(&self.x) / self.liq.v
    }
    pub fn rho_vap(&self) -> f64 {
        Self::mw(&self.y) / self.vap.v
    }
    pub fn mu_liq(&self) -> f64 {
        // Logarithmic mixing (Arrhenius) for liquids.
        (0..NS).filter(|&i| self.x[i] > 0.0).map(|i| self.x[i] * SPECIES[i].mu_liq_at(self.t).ln()).sum::<f64>().exp()
    }
    pub fn mu_vap(&self) -> f64 {
        (0..NS).filter(|&i| self.y[i] > 0.0).map(|i| self.y[i] * SPECIES[i].mu_gas_at(self.t)).sum()
    }
    /// Ideal-gas heat capacity ratio of the vapour, for sonic speed and compressor work.
    pub fn gamma_vap(&self) -> f64 {
        let cp: f64 = (0..NS).filter(|&i| self.y[i] > 0.0).map(|i| self.y[i] * SPECIES[i].cp_ig(self.t)).sum();
        cp / (cp - R)
    }
}

/// Flash of feed `z` at temperature `t` [K] and pressure `p` [Pa].
pub fn pt_flash(z: &Comp, t: f64, p: f64) -> Flash {
    let par = Params::new(t);
    pt_flash_with(&par, z, p)
}

pub fn pt_flash_with(par: &Params, z: &Comp, p: f64) -> Flash {
    pt_flash_k(par, z, p, &mut None)
}

/// PT flash that starts from (and returns) K-values in `k_cache`: neighbouring states converge in
/// a few iterations instead of dozens.
pub fn pt_flash_k(par: &Params, z: &Comp, p: f64, k_cache: &mut Option<Comp>) -> Flash {
    let t = par.t;
    let mut zn = *z;
    normalise(&mut zn);
    let present = zn.iter().filter(|&&v| v > 0.0).count();
    if present > 1 {
        let mut k = match k_cache {
            Some(k) if k.iter().all(|v| v.is_finite() && *v > 0.0) => *k,
            _ => wilson(t, p),
        };
        let mut beta = rachford_rice(&zn, &k);
        let mut x = [0.0; NS];
        let mut y = [0.0; NS];
        let mut l = None;
        let mut v = None;
        for it in 0..80 {
            for i in 0..NS {
                x[i] = zn[i] / (1.0 + beta * (k[i] - 1.0));
                y[i] = k[i] * x[i];
            }
            normalise(&mut x);
            normalise(&mut y);
            let lp = phase(par, p, &x, Root::Liquid);
            let vp = phase(par, p, &y, Root::Vapor);
            let mut change: f64 = 0.0;
            for i in 0..NS {
                if zn[i] > 0.0 {
                    let kn = (lp.ln_phi[i] - vp.ln_phi[i]).exp();
                    change = change.max((kn / k[i]).ln().abs());
                    k[i] = kn;
                }
            }
            l = Some(lp);
            v = Some(vp);
            beta = rachford_rice(&zn, &k);
            // Collapsing onto the trivial solution (K → 1) means one phase.
            let trivial = (0..NS).filter(|&i| zn[i] > 0.0).all(|i| (k[i].ln()).abs() < 1e-4);
            if change < 1e-9 || trivial || (it > 6 && (beta <= 0.0 || beta >= 1.0) && change < 1e-4) {
                break;
            }
        }
        if !(0..NS).filter(|&i| zn[i] > 0.0).all(|i| (k[i].ln()).abs() < 1e-4) {
            *k_cache = Some(k);
        }
        if beta > 1e-10 && beta < 1.0 - 1e-10 {
            for i in 0..NS {
                x[i] = zn[i] / (1.0 + beta * (k[i] - 1.0));
                y[i] = k[i] * x[i];
            }
            normalise(&mut x);
            normalise(&mut y);
            let dist: f64 = (0..NS).map(|i| (x[i] - y[i]).abs()).sum();
            if dist > 1e-6 {
                return Flash { t, p, beta, x, y, liq: l.unwrap(), vap: v.unwrap() };
            }
        }
    }
    let (ph, root) = stable_phase(par, p, &zn);
    Flash::single(t, p, &zn, ph, root)
}

/// PR saturation pressure of pure species `i` at `t` (below its critical temperature), by
/// successive substitution on the fugacity ratio. Returns the liquid and vapour phases there.
fn saturation(par: &Params, i: usize, z: &Comp, p_guess: f64) -> Option<(f64, Phase, Phase)> {
    let s = &SPECIES[i];
    if par.t >= 0.999 * s.tc {
        return None;
    }
    let wilson = s.pc * (5.373 * (1.0 + s.omega) * (1.0 - s.tc / par.t)).exp();
    let mut p = if p_guess > 0.0 && (p_guess / wilson).ln().abs() < 1.0 { p_guess } else { wilson };
    for _ in 0..100 {
        let l = phase(par, p, z, Root::Liquid);
        let v = phase(par, p, z, Root::Vapor);
        if !l.two_roots {
            // Outside the cubic's three-root region: step toward it.
            p *= if l.z < 0.3 { 0.7 } else { 1.3 };
            continue;
        }
        let ratio = (l.ln_phi[i] - v.ln_phi[i]).exp();
        p *= ratio;
        if (ratio - 1.0).abs() < 1e-10 {
            return Some((p, l, v));
        }
    }
    let l = phase(par, p, z, Root::Liquid);
    let v = phase(par, p, z, Root::Vapor);
    Some((p, l, v))
}

/// VT flash for a single species: inside the dome the pressure is the saturation pressure and
/// the split follows from the volume; outside it, one branch of the cubic is solved for P.
fn vt_flash_pure(par: &Params, i: usize, z: &Comp, vt: f64, p_guess: f64) -> Flash {
    let t = par.t;
    let mut root = None;
    if let Some((psat, l, v)) = saturation(par, i, z, p_guess) {
        if vt >= l.v && vt <= v.v {
            let beta = (vt - l.v) / (v.v - l.v);
            return Flash { t, p: psat, beta, x: *z, y: *z, liq: l, vap: v };
        }
        root = Some(if vt < l.v { Root::Liquid } else { Root::Vapor });
    }
    let root = root.unwrap_or(Root::Vapor);
    // Newton on ln P along one branch (v falls smoothly with P there).
    let mut p = if p_guess > 0.0 { p_guess } else { R * t / vt };
    let mut ph = phase(par, p, z, root);
    for _ in 0..60 {
        let dp = p * 1e-6;
        let ph2 = phase(par, p + dp, z, root);
        let dvdlnp = (ph2.v - ph.v) / dp * p;
        if dvdlnp >= 0.0 || !dvdlnp.is_finite() {
            break;
        }
        let step = ((vt - ph.v) / dvdlnp).clamp(-2.0, 2.0);
        p = (p * step.exp()).clamp(1.0, 1e10);
        ph = phase(par, p, z, root);
        if step.abs() < 1e-10 {
            break;
        }
    }
    Flash::single(t, p, z, ph, root)
}

/// Finds the pressure at which `n` moles [mol] fill `volume` [m³] at temperature `t`.
pub fn vt_flash(n: &Comp, volume: f64, t: f64, p_guess: f64) -> Flash {
    vt_flash_k(n, volume, t, p_guess, &mut None)
}

pub fn vt_flash_k(n: &Comp, volume: f64, t: f64, p_guess: f64, k_cache: &mut Option<Comp>) -> Flash {
    let par = Params::new(t);
    let ntot: f64 = n.iter().sum();
    let vt = volume / ntot;
    let present: Vec<usize> = (0..NS).filter(|&i| n[i] > 1e-12 * ntot).collect();
    if present.len() == 1 {
        let mut z = [0.0; NS];
        z[present[0]] = 1.0;
        return vt_flash_pure(&par, present[0], &z, vt, p_guess);
    }
    let mut f = |p: f64| {
        let fl = pt_flash_k(&par, n, p, k_cache);
        (fl.v() - vt, fl)
    };
    let mut p0 = if p_guess > 0.0 && p_guess.is_finite() { p_guess } else { ntot * R * t / volume };
    p0 = p0.clamp(1.0, 1e10);
    let (f0, fl0) = f(p0);
    if f0.abs() < 1e-6 * vt {
        return fl0;
    }
    // Bracket in ln P: volume falls as pressure rises.
    let (mut lo, mut hi) = if f0 > 0.0 { ((p0, f0, fl0), (p0, f0, fl0)) } else { ((p0, f0, fl0), (p0, f0, fl0)) };
    let mut step = 1.25_f64;
    if f0 > 0.0 {
        loop {
            let p = (hi.0 * step).min(1e10);
            let (fp, fl) = f(p);
            if fp > 0.0 {
                lo = (p, fp, fl);
                hi = lo;
            } else {
                hi = (p, fp, fl);
                break;
            }
            if p >= 1e10 {
                return fl;
            }
            step *= step;
        }
    } else {
        loop {
            let p = (lo.0 / step).max(1.0);
            let (fp, fl) = f(p);
            if fp < 0.0 {
                hi = (p, fp, fl);
                lo = hi;
            } else {
                lo = (p, fp, fl);
                break;
            }
            if p <= 1.0 {
                return fl;
            }
            step *= step;
        }
    }
    // Illinois regula falsi on ln P.
    let mut side = 0;
    for _ in 0..40 {
        let (la, lb) = (lo.0.ln(), hi.0.ln());
        let lp = (la * hi.1 - lb * lo.1) / (hi.1 - lo.1);
        let lp = if lp.is_finite() && lp > la.min(lb) && lp < la.max(lb) { lp } else { 0.5 * (la + lb) };
        let (fp, fl) = f(lp.exp());
        if fp.abs() < 1e-6 * vt {
            return fl;
        }
        if fp > 0.0 {
            lo = (lp.exp(), fp, fl);
            if side == 1 {
                hi.1 *= 0.5;
            }
            side = 1;
        } else {
            hi = (lp.exp(), fp, fl);
            if side == -1 {
                lo.1 *= 0.5;
            }
            side = -1;
        }
        if hi.0 / lo.0 < 1.0 + 1e-6 {
            break;
        }
    }
    // Mixtures change volume continuously with pressure (pure fluids, whose volume jumps at
    // saturation, took the exact path above), so take whichever side is closer.
    let (rl, rh) = (lo.2.v() - vt, hi.2.v() - vt);
    if rl.abs() < rh.abs() { lo.2 } else { hi.2 }
}

/// Finds T (and P) for `n` moles in `volume` with internal energy `u` [J].
pub fn uv_flash(n: &Comp, volume: f64, u: f64, t_guess: f64, p_guess: f64) -> Flash {
    uv_flash_k(n, volume, u, t_guess, p_guess, &mut None)
}

pub fn uv_flash_k(n: &Comp, volume: f64, u: f64, t_guess: f64, p_guess: f64, k_cache: &mut Option<Comp>) -> Flash {
    let ntot: f64 = n.iter().sum();
    let target = u / ntot;
    let mut p_last = p_guess;
    let mut eval = |t: f64| {
        let fl = vt_flash_k(n, volume, t, p_last, k_cache);
        p_last = fl.p;
        (fl.u() - target, fl)
    };
    let t0 = t_guess.clamp(30.0, 6000.0);
    let (g0, fl0) = eval(t0);
    if g0.abs() < 0.5 {
        return fl0;
    }
    // Secant from a nominal heat capacity, then Illinois once bracketed.
    let cv: f64 = 30.0;
    let mut a = (t0, g0, fl0);
    let mut t1 = (t0 - g0 / cv).clamp(30.0, 6000.0);
    if (t1 - t0).abs() < 1e-6 {
        t1 = t0 + if g0 > 0.0 { -1.0 } else { 1.0 };
    }
    let (g1, fl1) = eval(t1);
    let mut b = (t1, g1, fl1);
    for _ in 0..60 {
        if b.1.abs() < 0.5 {
            return b.2;
        }
        if a.1.signum() != b.1.signum() {
            break;
        }
        // Not bracketed yet: keep stepping by secant (or double the step if it stalls).
        let slope = (b.1 - a.1) / (b.0 - a.0);
        let mut tn = if slope > 1e-6 { b.0 - b.1 / slope } else { b.0 + 2.0 * (b.0 - a.0) };
        if (tn - b.0).abs() > 500.0 {
            tn = b.0 + 500.0 * (tn - b.0).signum();
        }
        tn = tn.clamp(30.0, 6000.0);
        let (gn, fln) = eval(tn);
        a = b;
        b = (tn, gn, fln);
        if tn <= 30.0 || tn >= 6000.0 {
            return fln;
        }
    }
    let (mut lo, mut hi) = if a.1 < 0.0 { (a, b) } else { (b, a) };
    let mut side = 0;
    for _ in 0..30 {
        let tn = (lo.0 * hi.1 - hi.0 * lo.1) / (hi.1 - lo.1);
        let tn = if tn.is_finite() && tn > lo.0.min(hi.0) && tn < lo.0.max(hi.0) { tn } else { 0.5 * (lo.0 + hi.0) };
        let (gn, fln) = eval(tn);
        if gn.abs() < 0.5 || (hi.0 - lo.0).abs() < 1e-3 {
            return fln;
        }
        if gn < 0.0 {
            lo = (tn, gn, fln);
            if side == -1 {
                hi.1 *= 0.5;
            }
            side = -1;
        } else {
            hi = (tn, gn, fln);
            if side == 1 {
                lo.1 *= 0.5;
            }
            side = 1;
        }
    }
    lo.2
}

/// Temperature at pressure `p` where the feed's molar entropy equals `s` (isentropic expansion
/// or compression).
pub fn ps_flash(z: &Comp, p: f64, s: f64, t_guess: f64) -> Flash {
    let (mut lo, mut hi) = (30.0_f64, 6000.0_f64);
    let (mut fl_lo, mut fl_hi): (Option<Flash>, Option<Flash>) = (None, None);
    let mut t = t_guess.clamp(lo, hi);
    for _ in 0..100 {
        let fl = pt_flash(z, t, p);
        let ds = fl.s() - s;
        if ds.abs() < 1e-6 {
            return fl;
        }
        if ds > 0.0 {
            hi = t;
            fl_hi = Some(fl);
        } else {
            lo = t;
            fl_lo = Some(fl);
        }
        if hi - lo < 1e-7 {
            break;
        }
        // Newton with dS/dT ≈ Cp/T, kept inside the bracket.
        let cp: f64 = (0..NS).map(|i| fl.y[i] * SPECIES[i].cp_ig(t)).sum::<f64>().max(20.0);
        let tn = t - ds * t / cp;
        t = if tn > lo && tn < hi { tn } else { 0.5 * (lo + hi) };
    }
    match (fl_lo, fl_hi) {
        // Entropy jumps across the bracket: a pure fluid boiling. Split by the lever rule.
        (Some(a), Some(b)) if b.s() - a.s() > 1e-3 => {
            let beta = ((s - a.s()) / (b.s() - a.s())).clamp(0.0, 1.0);
            let liq = if a.beta < 1.0 { a.liq } else { a.vap };
            let vap = if b.beta > 0.0 { b.vap } else { b.liq };
            Flash { t: b.t, p, beta, x: a.x, y: b.y, liq, vap }
        }
        (Some(a), _) => a,
        (_, Some(b)) => b,
        _ => pt_flash(z, t, p),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::thermodynamics::species::index_of;

    fn comp(parts: &[(&str, f64)]) -> Comp {
        let mut z = [0.0; NS];
        for (id, v) in parts {
            z[index_of(id).unwrap()] = *v;
        }
        z
    }

    #[test]
    fn steam_and_water_split_like_raoult() {
        // Water with nitrogen at 1 atm, 60 °C: vapour holds ~0.2 bar of water (Psat = 0.199 bar).
        let fl = pt_flash(&comp(&[("h2o", 0.5), ("n2", 0.5)]), 333.15, 101_325.0);
        assert!(fl.beta > 0.4 && fl.beta < 0.7, "{}", fl.beta);
        let yw = fl.y[index_of("h2o").unwrap()];
        assert!((yw * 101_325.0 / 19_900.0 - 1.0).abs() < 0.2, "{yw}");
        // Hardly any nitrogen dissolves.
        assert!(fl.x[index_of("n2").unwrap()] < 1e-3);
    }

    #[test]
    fn vt_flash_recovers_pressure_of_a_gas() {
        let n = comp(&[("ch4", 100.0)]);
        // 100 mol in 1 m³ at 300 K: ideal gas would be 2.49 bar.
        let fl = vt_flash(&n, 1.0, 300.0, 1e5);
        assert!((fl.p / 249_434.0 - 1.0).abs() < 0.01, "{}", fl.p);
        assert_eq!(fl.beta, 1.0);
    }

    #[test]
    fn closed_vessel_of_water_sits_at_saturation() {
        // 1 m³ drum with 20 kmol water (~360 kg) at 150 °C: two-phase, P ≈ Psat = 4.76 bar.
        let n = comp(&[("h2o", 20_000.0)]);
        let fl = vt_flash(&n, 1.0, 423.15, 1e5);
        assert!(fl.beta > 0.0 && fl.beta < 0.1, "{}", fl.beta);
        assert!((fl.p / 476_000.0 - 1.0).abs() < 0.12, "{}", fl.p);
    }

    #[test]
    fn uv_flash_inverts_internal_energy() {
        let n = comp(&[("h2o", 5_000.0), ("n2", 40.0)]);
        let reference = vt_flash(&n, 1.0, 400.0, 1e5);
        let u = reference.u() * n.iter().sum::<f64>();
        let fl = uv_flash(&n, 1.0, u, 350.0, 1e5);
        assert!((fl.t - 400.0).abs() < 0.05, "{}", fl.t);
        assert!((fl.p / reference.p - 1.0).abs() < 1e-3);
    }

    #[test]
    fn isentropic_expansion_of_steam_gets_wet() {
        // 40 bar, 400 °C steam expanded to 0.1 bar ends up wet (quality ≈ 0.8).
        let z = comp(&[("h2o", 1.0)]);
        let inlet = pt_flash(&z, 673.15, 40e5);
        assert_eq!(inlet.beta, 1.0);
        let out = ps_flash(&z, 0.1e5, inlet.s(), 400.0);
        assert!(out.t < 330.0, "{}", out.t);
        let dh = inlet.h() - out.h();
        // Real isentropic drop: 3214 - 2148 ≈ 1066 kJ/kg ≈ 19.2 kJ/mol.
        assert!((dh / 19_200.0 - 1.0).abs() < 0.15, "{dh}");
    }
}

#[cfg(test)]
mod rr_tests {
    use super::*;
    #[test]
    fn rachford_rice_with_extreme_k() {
        let k = [12369399.8429, 10055472.0131, 151704718.088, 133841341.9288, 172612662.3017, 149420.5501, 0.0269, 8.6037, 55.7248, 5986273005.2748, 0.1798];
        let z = [0.0, 0.00093, 0.91022, 0.04293, 0.0, 0.01472, 0.02807, 0.0, 0.0, 0.00313, 0.0];
        // Gases dissolve so little in water that their K reach 10⁸; water's is 0.027.
        let b = rachford_rice(&z, &k);
        assert!((b - 0.9988).abs() < 1e-3);
        let mut traces = z;
        traces[0] = 2.55e-76;
        assert!((rachford_rice(&traces, &k) - b).abs() < 1e-12);
    }
}
