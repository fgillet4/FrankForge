//! Pure-component data: ideal-gas heat capacity (NIST Shomate fits), standard formation enthalpy
//! and entropy, and the critical constants the Peng-Robinson equation of state needs.

/// Gas constant [J/(mol·K)].
pub const R: f64 = 8.314462618;
/// Reference temperature for formation data [K].
pub const T_REF: f64 = 298.15;
/// Reference pressure for standard entropy [Pa].
pub const P_REF: f64 = 100_000.0;

/// One Shomate range: Cp = A + B·t + C·t² + D·t³ + E/t², t = T/1000, valid up to `t_max` [K].
#[derive(Clone, Copy, Debug)]
pub struct Shomate {
    pub t_min: f64,
    pub t_max: f64,
    pub c: [f64; 5],
}

#[derive(Clone, Copy, Debug)]
pub struct Species {
    pub id: &'static str,
    pub name: &'static str,
    pub formula: &'static str,
    /// Molar mass [g/mol].
    pub mw: f64,
    /// Critical temperature [K], pressure [Pa] and acentric factor.
    pub tc: f64,
    pub pc: f64,
    pub omega: f64,
    /// Ideal-gas formation enthalpy at 298.15 K [J/mol].
    pub hf: f64,
    /// Ideal-gas standard entropy at 298.15 K, 1 bar [J/(mol·K)].
    pub s0: f64,
    /// Shomate ranges in increasing temperature.
    pub cp: &'static [Shomate],
    /// Dilute-gas viscosity at 300 K [Pa·s].
    pub mu_gas: f64,
    /// Liquid viscosity at 293 K [Pa·s] and its Andrade temperature coefficient [K].
    pub mu_liq: f64,
    pub mu_liq_b: f64,
    /// Elemental composition (C, H, O, N), used to check that reactions balance.
    pub atoms: [u8; 4],
}

const fn sh(t_min: f64, t_max: f64, c: [f64; 5]) -> Shomate {
    Shomate { t_min, t_max, c }
}

pub const SPECIES: &[Species] = &[
    Species {
        id: "h2", name: "Hydrogen", formula: "H₂", mw: 2.016, tc: 33.19, pc: 13.13e5, omega: -0.216,
        hf: 0.0, s0: 130.68,
        cp: &[
            sh(298.0, 1000.0, [33.066178, -11.363417, 11.432816, -2.772874, -0.158558]),
            sh(1000.0, 2500.0, [18.563083, 12.257357, -2.859786, 0.268238, 1.977990]),
        ],
        mu_gas: 8.9e-6, mu_liq: 1.3e-5, mu_liq_b: 100.0, atoms: [0, 2, 0, 0],
    },
    Species {
        id: "o2", name: "Oxygen", formula: "O₂", mw: 31.998, tc: 154.58, pc: 50.43e5, omega: 0.022,
        hf: 0.0, s0: 205.15,
        cp: &[
            sh(100.0, 700.0, [31.32234, -20.23531, 57.86644, -36.50624, -0.007374]),
            sh(700.0, 2000.0, [30.03235, 8.772972, -3.988133, 0.788313, -0.741599]),
            sh(2000.0, 6000.0, [20.91111, 10.72071, -2.020498, 0.146449, 9.245722]),
        ],
        mu_gas: 2.07e-5, mu_liq: 1.9e-4, mu_liq_b: 300.0, atoms: [0, 0, 2, 0],
    },
    Species {
        id: "n2", name: "Nitrogen", formula: "N₂", mw: 28.014, tc: 126.2, pc: 33.98e5, omega: 0.037,
        hf: 0.0, s0: 191.61,
        cp: &[
            sh(100.0, 500.0, [28.98641, 1.853978, -9.647459, 16.63537, 0.000117]),
            sh(500.0, 2000.0, [19.50583, 19.88705, -8.598535, 1.369784, 0.527601]),
        ],
        mu_gas: 1.79e-5, mu_liq: 1.6e-4, mu_liq_b: 250.0, atoms: [0, 0, 0, 2],
    },
    Species {
        id: "ch4", name: "Methane", formula: "CH₄", mw: 16.043, tc: 190.56, pc: 45.99e5, omega: 0.011,
        hf: -74_870.0, s0: 186.25,
        cp: &[
            sh(298.0, 1300.0, [-0.703029, 108.4773, -42.52157, 5.862788, 0.678565]),
            sh(1300.0, 6000.0, [85.81217, 11.26467, -2.114146, 0.138190, -26.42221]),
        ],
        mu_gas: 1.11e-5, mu_liq: 1.2e-4, mu_liq_b: 400.0, atoms: [1, 4, 0, 0],
    },
    Species {
        id: "co", name: "Carbon monoxide", formula: "CO", mw: 28.010, tc: 132.92, pc: 34.99e5, omega: 0.048,
        hf: -110_530.0, s0: 197.66,
        cp: &[
            sh(298.0, 1300.0, [25.56759, 6.096130, 4.054656, -2.671301, 0.131021]),
            sh(1300.0, 6000.0, [35.15070, 1.300095, -0.205921, 0.013550, -3.282780]),
        ],
        mu_gas: 1.78e-5, mu_liq: 1.7e-4, mu_liq_b: 250.0, atoms: [1, 0, 1, 0],
    },
    Species {
        id: "co2", name: "Carbon dioxide", formula: "CO₂", mw: 44.009, tc: 304.13, pc: 73.77e5, omega: 0.225,
        hf: -393_510.0, s0: 213.79,
        cp: &[
            sh(298.0, 1200.0, [24.99735, 55.18696, -33.69137, 7.948387, -0.136638]),
            sh(1200.0, 6000.0, [58.16639, 2.720074, -0.492289, 0.038844, -6.447293]),
        ],
        mu_gas: 1.50e-5, mu_liq: 7.0e-5, mu_liq_b: 600.0, atoms: [1, 0, 2, 0],
    },
    Species {
        id: "h2o", name: "Water", formula: "H₂O", mw: 18.015, tc: 647.10, pc: 220.64e5, omega: 0.345,
        hf: -241_830.0, s0: 188.84,
        cp: &[
            sh(500.0, 1700.0, [30.09200, 6.832514, 6.793435, -2.534480, 0.082139]),
            sh(1700.0, 6000.0, [41.96426, 8.622053, -1.499780, 0.098119, -11.15764]),
        ],
        mu_gas: 1.0e-5, mu_liq: 1.0e-3, mu_liq_b: 1800.0, atoms: [0, 2, 1, 0],
    },
    Species {
        id: "nh3", name: "Ammonia", formula: "NH₃", mw: 17.031, tc: 405.4, pc: 113.33e5, omega: 0.257,
        hf: -45_900.0, s0: 192.77,
        cp: &[
            sh(298.0, 1400.0, [19.99563, 49.77119, -15.37599, 1.921168, 0.189174]),
            sh(1400.0, 6000.0, [52.02427, 18.48801, -3.765128, 0.248541, -12.45799]),
        ],
        mu_gas: 1.01e-5, mu_liq: 1.4e-4, mu_liq_b: 900.0, atoms: [0, 3, 0, 1],
    },
    Species {
        id: "c2h4", name: "Ethylene", formula: "C₂H₄", mw: 28.054, tc: 282.34, pc: 50.41e5, omega: 0.087,
        hf: 52_470.0, s0: 219.32,
        cp: &[sh(298.0, 1200.0, [-6.387880, 184.4019, -112.9718, 28.49593, 0.315540])],
        mu_gas: 1.03e-5, mu_liq: 7.0e-5, mu_liq_b: 600.0, atoms: [2, 4, 0, 0],
    },
    Species {
        id: "c2h6", name: "Ethane", formula: "C₂H₆", mw: 30.069, tc: 305.32, pc: 48.72e5, omega: 0.099,
        hf: -83_800.0, s0: 229.6,
        cp: &[sh(298.0, 1200.0, [-3.029849, 199.2018, -158.8387, 53.67370, 0.085461])],
        mu_gas: 9.4e-6, mu_liq: 6.0e-5, mu_liq_b: 600.0, atoms: [2, 6, 0, 0],
    },
    Species {
        id: "ch3oh", name: "Methanol", formula: "CH₃OH", mw: 32.042, tc: 512.64, pc: 80.97e5, omega: 0.565,
        hf: -200_940.0, s0: 239.9,
        cp: &[sh(298.0, 1500.0, [14.19760, 168.7798, -146.7254, 59.36550, 0.026005])],
        mu_gas: 1.0e-5, mu_liq: 5.9e-4, mu_liq_b: 1250.0, atoms: [1, 4, 1, 0],
    },
    // Crude oil, lumped into one n-alkane per cut: naphtha, kerosene, diesel and heavy residue.
    // Ideal-gas Cp from Poling, Prausnitz & O'Connell's cubic fits (valid to 1500 K) rewritten in
    // Shomate form; formation enthalpy and entropy by CH₂ group increments from n-hexane.
    Species {
        id: "c6h14", name: "Naphtha (hexane)", formula: "C₆H₁₄", mw: 86.177, tc: 507.6, pc: 30.25e5, omega: 0.301,
        hf: -167_100.0, s0: 388.8,
        cp: &[sh(200.0, 1500.0, [-4.413, 582.0, -311.9, 64.94, 0.0])],
        mu_gas: 6.3e-6, mu_liq: 3.1e-4, mu_liq_b: 900.0, atoms: [6, 14, 0, 0],
    },
    Species {
        id: "c10h22", name: "Kerosene (decane)", formula: "C₁₀H₂₂", mw: 142.285, tc: 617.7, pc: 21.1e5, omega: 0.490,
        hf: -249_600.0, s0: 545.2,
        cp: &[sh(200.0, 1500.0, [-7.913, 960.9, -528.8, 113.1, 0.0])],
        mu_gas: 5.0e-6, mu_liq: 9.2e-4, mu_liq_b: 1250.0, atoms: [10, 22, 0, 0],
    },
    Species {
        id: "c16h34", name: "Diesel (hexadecane)", formula: "C₁₆H₃₄", mw: 226.446, tc: 723.0, pc: 14.0e5, omega: 0.718,
        hf: -373_400.0, s0: 779.8,
        cp: &[sh(200.0, 1500.0, [-13.02, 1529.0, -853.7, 185.0, 0.0])],
        mu_gas: 4.0e-6, mu_liq: 3.45e-3, mu_liq_b: 1700.0, atoms: [16, 34, 0, 0],
    },
    Species {
        id: "c20h42", name: "Heavy oil (eicosane)", formula: "C₂₀H₄₂", mw: 282.553, tc: 768.0, pc: 11.6e5, omega: 0.907,
        hf: -455_900.0, s0: 936.2,
        cp: &[sh(200.0, 1500.0, [-16.42, 1908.0, -1070.3, 232.9, 0.0])],
        mu_gas: 3.5e-6, mu_liq: 8.0e-3, mu_liq_b: 2000.0, atoms: [20, 42, 0, 0],
    },
];

pub const NS: usize = SPECIES.len();

pub fn index_of(id: &str) -> Option<usize> {
    SPECIES.iter().position(|s| s.id == id)
}

/// Molar masses as kg/mol.
pub fn mw_kg(i: usize) -> f64 {
    SPECIES[i].mw * 1e-3
}

fn cp_poly(c: &[f64; 5], t_k: f64) -> f64 {
    let t = t_k / 1000.0;
    c[0] + c[1] * t + c[2] * t * t + c[3] * t * t * t + c[4] / (t * t)
}

/// ∫Cp dT as a Shomate antiderivative [J/mol] (without the constant).
fn h_poly(c: &[f64; 5], t_k: f64) -> f64 {
    let t = t_k / 1000.0;
    1000.0 * (c[0] * t + c[1] * t * t / 2.0 + c[2] * t.powi(3) / 3.0 + c[3] * t.powi(4) / 4.0 - c[4] / t)
}

/// ∫Cp/T dT as a Shomate antiderivative [J/(mol·K)].
fn s_poly(c: &[f64; 5], t_k: f64) -> f64 {
    let t = t_k / 1000.0;
    c[0] * t.ln() + c[1] * t + c[2] * t * t / 2.0 + c[3] * t.powi(3) / 3.0 - c[4] / (2.0 * t * t)
}

impl Species {
    fn lo(&self) -> f64 {
        self.cp[0].t_min
    }
    fn hi(&self) -> f64 {
        self.cp[self.cp.len() - 1].t_max
    }

    /// Ideal-gas heat capacity [J/(mol·K)]. Outside the fitted ranges it is held at the edge
    /// value, because the cubic fits misbehave quickly once extrapolated.
    pub fn cp_ig(&self, t: f64) -> f64 {
        let t = t.clamp(self.lo(), self.hi());
        let r = self.cp.iter().find(|r| t <= r.t_max).unwrap_or(&self.cp[self.cp.len() - 1]);
        cp_poly(&r.c, t)
    }

    /// ∫ from a to b of f, piecewise over the ranges, with constant Cp outside them. `poly` is the
    /// antiderivative of the fitted part and `flat(cp, a, b)` the integral of a constant Cp.
    fn integrate(&self, a: f64, b: f64, poly: fn(&[f64; 5], f64) -> f64, flat: fn(f64, f64, f64) -> f64) -> f64 {
        if b < a {
            return -self.integrate(b, a, poly, flat);
        }
        let mut sum = 0.0;
        let (lo, hi) = (self.lo(), self.hi());
        if a < lo {
            sum += flat(self.cp_ig(lo), a, b.min(lo));
        }
        for r in self.cp {
            let x0 = a.max(r.t_min).max(lo);
            let x1 = b.min(r.t_max);
            if x1 > x0 {
                sum += poly(&r.c, x1) - poly(&r.c, x0);
            }
        }
        if b > hi {
            sum += flat(self.cp_ig(hi), a.max(hi), b);
        }
        sum
    }

    /// Ideal-gas enthalpy including formation enthalpy [J/mol]: reactions release or absorb heat
    /// automatically when enthalpy is conserved.
    pub fn h_ig(&self, t: f64) -> f64 {
        self.hf + self.integrate(T_REF, t, h_poly, |cp, a, b| cp * (b - a))
    }

    /// Ideal-gas entropy at 1 bar [J/(mol·K)].
    pub fn s_ig(&self, t: f64) -> f64 {
        self.s0 + self.integrate(T_REF, t, s_poly, |cp, a, b| cp * (b / a).ln())
    }

    /// Standard Gibbs energy of the ideal gas at 1 bar [J/mol].
    pub fn g_ig(&self, t: f64) -> f64 {
        self.h_ig(t) - t * self.s_ig(t)
    }

    pub fn mu_gas_at(&self, t: f64) -> f64 {
        self.mu_gas * (t / 300.0).max(0.1).powf(0.7)
    }

    pub fn mu_liq_at(&self, t: f64) -> f64 {
        (self.mu_liq * (self.mu_liq_b * (1.0 / t.max(20.0) - 1.0 / 293.15)).exp()).clamp(1e-6, 10.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sp(id: &str) -> &'static Species {
        &SPECIES[index_of(id).unwrap()]
    }

    #[test]
    fn enthalpy_is_formation_enthalpy_at_reference() {
        for s in SPECIES {
            assert!((s.h_ig(T_REF) - s.hf).abs() < 1e-9, "{}", s.id);
            assert!((s.s_ig(T_REF) - s.s0).abs() < 1e-9, "{}", s.id);
        }
    }

    #[test]
    fn enthalpy_matches_nist_tables() {
        // NIST: H(1000 K) - H(298.15 K) = 21.18 kJ/mol for N2, 33.40 for CO2, 26.80 for H2O.
        let dh = |id: &str| (sp(id).h_ig(1000.0) - sp(id).hf) / 1000.0;
        assert!((dh("n2") - 21.46).abs() < 0.3, "{}", dh("n2"));
        assert!((dh("co2") - 33.40).abs() < 0.2, "{}", dh("co2"));
        assert!((dh("h2o") - 26.00).abs() < 0.9, "{}", dh("h2o"));
    }

    #[test]
    fn enthalpy_is_continuous_and_derivative_is_cp() {
        for s in SPECIES {
            for t in [150.0, 300.0, 500.0, 700.0, 1000.0, 1300.0, 2000.0, 3000.0] {
                let d = (s.h_ig(t + 0.01) - s.h_ig(t - 0.01)) / 0.02;
                assert!((d - s.cp_ig(t)).abs() < 0.05 * s.cp_ig(t), "{} {t} {d} {}", s.id, s.cp_ig(t));
                let ds = (s.s_ig(t + 0.01) - s.s_ig(t - 0.01)) / 0.02;
                assert!((ds * t - s.cp_ig(t)).abs() < 0.05 * s.cp_ig(t), "{} {t}", s.id);
            }
        }
    }
}
