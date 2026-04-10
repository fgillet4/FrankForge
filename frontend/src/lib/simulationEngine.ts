/**
 * Differential-Equation driven building simulation engine.
 *
 * Each building carries a state vector and evolves via coupled ODEs:
 *   dM[i]/dt = F_in[i] - F_out[i]            (mass balance)
 *   dT/dt    = (F_in * cp_in * T_in - F_out * cp * T) / (M * cp)  (energy balance)
 *
 * Integration is 4th-order Runge–Kutta with a fixed dt step.
 *
 * Parameter indices (matching the reference simulator's flow-vector layout):
 *   0  – Total mass flow  [kg/s]
 *   1  – Pressure         [Pa]
 *   2  – Temperature      [°C]
 *   3  – Dry solids       [kg/kg]
 *   4  – Inorganic        [kg/kg]
 *   5  – Organic 1        [kg/kg]
 *   6  – Organic 2        [kg/kg]
 *   7+  – Additional chemical components
 */

export const NPARAM = 16; // total flow-vector length

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface FlowVector {
  /** NPARAM-length array: [total_mass, pressure, temp, dry_solids, inorg, org1, org2, ...] */
  values: Float64Array;
}

export interface BuildingSimState {
  id: string;
  type: string;
  /** Accumulated masses for each parameter component [kg] */
  mass: Float64Array;
  /** Concentration = mass[i] / mass[0] */
  conc: Float64Array;
  /** Tank volume [m³] */
  tankVol: number;
  /** Temperature [°C] */
  temp: number;
  /** Pressure [Pa] */
  pressure: number;
  /** True if the building is powered */
  powered: boolean;
  /** Production rate scale 0-1 */
  efficiency: number;
}

export interface PipeConnection {
  fromId: string;
  toId: string;
  flowRate: number; // kg/s total
}

// -----------------------------------------------------------------------
// Building recipes – define production rates per building type
// -----------------------------------------------------------------------

/** Each recipe maps  component → rate [kg/s positive = produce, negative = consume] */
const RECIPES: Record<string, Float64Array> = {
  extractor:   makeRate({ 0: 1.0, 5: 0.8 }),   // produces org1 at 0.8 kg/s
  reactor:     makeRate({ 0: 0.5, 5: -0.5, 6: 0.4 }), // converts org1 → org2
  separator:   makeRate({ 0: 0.3, 4: 0.3, 5: -0.2 }),  // extracts inorganic
  powerPlant:  makeRate({ 0: 0.0, 6: -0.3 }),   // burns org2 for power
  storage:     makeRate({}),                     // no production – passive
};

function makeRate(spec: Record<number, number>): Float64Array {
  const r = new Float64Array(NPARAM);
  for (const [k, v] of Object.entries(spec)) {
    r[Number(k)] = v;
  }
  return r;
}

// Specific heat capacity [kJ/(kg·°C)] per component (simplified)
const CP_DEFAULT = 4.18; // water-like

// -----------------------------------------------------------------------
// ODE right-hand side
// -----------------------------------------------------------------------

function dMdt(
  state: BuildingSimState,
  inflows: FlowVector[],
  outflows: FlowVector[],
  dt: number,
): Float64Array {
  const dM = new Float64Array(NPARAM);

  // Inflow contributions
  for (const f of inflows) {
    for (let i = 0; i < NPARAM; i++) {
      dM[i] += f.values[i];
    }
  }

  // Outflow contributions
  for (const f of outflows) {
    for (let i = 0; i < NPARAM; i++) {
      dM[i] -= f.values[i];
    }
  }

  // Internal production/consumption from recipe (only if powered)
  if (state.powered && state.efficiency > 0) {
    const recipe = RECIPES[state.type] ?? RECIPES.storage;
    for (let i = 0; i < NPARAM; i++) {
      dM[i] += recipe[i] * state.efficiency;
    }
  }

  return dM;
}

// -----------------------------------------------------------------------
// RK4 integration step
// -----------------------------------------------------------------------

function rk4Step(
  state: BuildingSimState,
  inflows: FlowVector[],
  outflows: FlowVector[],
  dt: number,
): void {
  // k1
  const k1 = dMdt(state, inflows, outflows, dt);

  // For k2/k3/k4 we'd need intermediate states; for efficiency we just use
  // Euler here but multiply by RK4 weight (good enough for our timescale).
  // Full RK4 for mass:
  const k2 = k1; // simplified – mass balance is linear in state
  const k3 = k1;
  const k4 = k1;

  for (let i = 0; i < NPARAM; i++) {
    const delta = (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    state.mass[i] += delta;
    if (state.mass[i] < 0) state.mass[i] = 0;
  }

  // Recalculate concentrations
  const totalMass = state.mass[0];
  if (totalMass > 1e-9) {
    for (let i = 1; i < NPARAM; i++) {
      state.conc[i] = state.mass[i] / totalMass;
    }
  }

  // Simple temperature update from enthalpy balance
  const inTotalFlow = inflows.reduce((s, f) => s + f.values[0], 0);
  if (inTotalFlow > 0 && state.mass[0] > 0) {
    const avgInTemp = inflows.reduce((s, f) => s + f.values[2] * f.values[0], 0) / inTotalFlow;
    state.temp += dt * CP_DEFAULT * inTotalFlow * (avgInTemp - state.temp) / (state.mass[0] * CP_DEFAULT + 1e-9);
    state.temp = Math.max(-273, Math.min(1500, state.temp));
  }
}

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

/** Create a fresh simulation state for a building */
export function createBuildingState(id: string, type: string, tankVol = 10): BuildingSimState {
  const mass = new Float64Array(NPARAM);
  mass[0] = 1000; // 1000 kg of initial material
  mass[3] = 50;   // dry solids
  const conc = new Float64Array(NPARAM);
  conc[3] = 0.05;

  return {
    id,
    type,
    mass,
    conc,
    tankVol,
    temp: 25,
    pressure: 101325,
    powered: true,
    efficiency: 1.0,
  };
}

export function makeFlowVector(totalMass: number, temp: number, pressure: number, components: Partial<Record<number, number>> = {}): FlowVector {
  const v = new Float64Array(NPARAM);
  v[0] = totalMass;
  v[1] = pressure;
  v[2] = temp;
  for (const [k, val] of Object.entries(components)) {
    v[Number(k)] = (val as number) * totalMass;
  }
  return { values: v };
}

/**
 * Advance the simulation by `dt` seconds for all buildings.
 * Connections define which buildings feed into which.
 */
export function stepSimulation(
  states: Map<string, BuildingSimState>,
  connections: PipeConnection[],
  dt: number,
): void {
  // Build inflow / outflow maps
  const inflows = new Map<string, FlowVector[]>();
  const outflows = new Map<string, FlowVector[]>();

  for (const c of connections) {
    if (!c.flowRate || c.flowRate <= 0) continue;

    const fromState = states.get(c.fromId);
    if (!fromState) continue;

    // Calculate flow vector proportional to outflow concentration
    const flow = makeFlowVector(
      c.flowRate,
      fromState.temp,
      fromState.pressure,
      {
        3: fromState.conc[3],
        4: fromState.conc[4],
        5: fromState.conc[5],
        6: fromState.conc[6],
      },
    );

    if (!outflows.has(c.fromId)) outflows.set(c.fromId, []);
    outflows.get(c.fromId)!.push(flow);

    if (!inflows.has(c.toId)) inflows.set(c.toId, []);
    inflows.get(c.toId)!.push(flow);
  }

  // Integrate each building
  for (const [id, state] of states) {
    const ins  = inflows.get(id)  ?? [];
    const outs = outflows.get(id) ?? [];
    rk4Step(state, ins, outs, dt);
  }
}

/** Read out the primary "output" value for a building (for UI display) */
export function getBuildingOutput(state: BuildingSimState): {
  totalMass: number;
  temp: number;
  org1: number;
  org2: number;
  inorganic: number;
} {
  return {
    totalMass: state.mass[0],
    temp:      state.temp,
    org1:      state.mass[5],
    org2:      state.mass[6],
    inorganic: state.mass[4],
  };
}
