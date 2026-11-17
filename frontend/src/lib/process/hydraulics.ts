/**
 * Pipe hydraulics for display: how much flows along each tile of a pipe run, how fast, and
 * whether that's sensible for the line's service. Methods follow Franks Chemical Simulator's
 * Hydraulic Studio: Darcy–Weisbach with Swamee–Jain friction, service velocity and friction
 * gradient limits, and the API RP 14E erosional velocity.
 *
 * The engine treats each pipe run as one well-mixed vessel and only knows the flow at the ports
 * where it meets buildings. Along the run the flow is worked out from those: on a spanning tree
 * of the run's tiles, what crosses a tile edge is what enters on one side of it. That is exact
 * for runs without loops; in a loop the closing edge is shown carrying nothing.
 */

import { PROTO, portTiles, type EntityView, type Snapshot, type VesselView } from './engine';

/** Bore and roughness of every pipe (the engine's PIPE_DIAMETER, commercial steel). */
export const PIPE_D = 0.15;
const ROUGH = 4.5e-5;
const AREA = Math.PI * PIPE_D * PIPE_D / 4;
const G = 9.80665;

export type Service = 'suction' | 'discharge' | 'liquid' | 'gas';

/** Design limits per service (Hydraulic Studio's line-sizing presets). */
export const LIMITS: Record<Service, { label: string; vMax: number; dpMax: number; rhoV2Max?: number }> = {
  suction: { label: 'pump suction', vMax: 1.5, dpMax: 10 },
  discharge: { label: 'pump discharge', vMax: 3, dpMax: 45 },
  liquid: { label: 'liquid line', vMax: 3, dpMax: 40 },
  gas: { label: 'gas line', vMax: 20, dpMax: 20, rhoV2Max: 15000 },
};

/** API RP 14E erosional velocity [m/s] for C (100 for continuous service). */
export const erosional = (rho: number, C = 100) => C * 0.3048 / Math.sqrt(rho * 0.062428);

/** Darcy friction factor, as the engine has it: laminar, Swamee–Jain, blended between. */
export function friction(re: number): number {
  if (re < 1) return 64;
  const lam = 64 / re;
  const turb = 0.25 / Math.log10(ROUGH / PIPE_D / 3.7 + 5.74 / Math.pow(Math.max(re, 2300), 0.9)) ** 2;
  if (re <= 2300) return lam;
  if (re >= 4000) return turb;
  const t = (re - 2300) / 1700;
  return lam * (1 - t) + turb * t;
}

export interface RunFluid { gas: boolean; rho: number; mu: number }

/** What flows in a run: its vapour if it's mostly vapour, else its liquid. */
export function runFluid(v: VesselView): RunFluid {
  const gas = v.beta >= 0.5 || v.rho_liq <= 0;
  return gas
    ? { gas, rho: Math.max(v.rho_vap, 1e-3), mu: Math.max(v.mu_vap, 1e-6) }
    : { gas, rho: Math.max(v.rho_liq, 1), mu: Math.max(v.mu_liq, 1e-6) };
}

export interface FlowStats {
  mdot: number; v: number; q: number; re: number; regime: 'laminar' | 'transitional' | 'turbulent';
  f: number; dp100: number; rhoV2: number; ve: number;
}

/** Velocity, Reynolds number, friction and pressure gradient [kPa/100 m] of a mass flow. */
export function stats(mdot: number, fl: RunFluid): FlowStats {
  const v = Math.abs(mdot) / (fl.rho * AREA);
  const re = fl.rho * v * PIPE_D / fl.mu;
  const f = friction(re);
  return {
    mdot, v, q: Math.abs(mdot) / fl.rho, re, f,
    regime: re < 2300 ? 'laminar' : re < 4000 ? 'transitional' : 'turbulent',
    dp100: f * (100 / PIPE_D) * fl.rho * v * v / 2 / 1000,
    rhoV2: fl.rho * v * v, ve: erosional(fl.rho),
  };
}

/** What's wrong with a line, worst first; empty when it's within its limits. */
export function problems(s: FlowStats, service: Service, fl: RunFluid): string[] {
  const lim = LIMITS[service];
  const out: string[] = [];
  if (s.v > s.ve) out.push(`Above the erosional velocity (${s.ve.toFixed(1)} m/s): the pipe wall will wear through.`);
  if (s.v > lim.vMax) out.push(`Too fast for a ${lim.label} (limit ${lim.vMax} m/s).`);
  else if (s.dp100 > lim.dpMax) out.push(`Friction loss over ${lim.dpMax} kPa/100 m for a ${lim.label}.`);
  if (lim.rhoV2Max && s.rhoV2 > lim.rhoV2Max) out.push(`ρv² ${(s.rhoV2 / 1000).toFixed(0)} kPa: noise and vibration.`);
  if (service === 'suction' && !fl.gas && s.v > lim.vMax * 0.8 && s.v <= lim.vMax) out.push('Close to the suction limit: watch the pump\'s NPSH.');
  return out;
}

export interface RunFlows {
  service: Service;
  fluid: RunFluid;
  /** Mass flow across each tile edge, keyed "x,y,x" or "x,y,y" for the edge to x+1 or y+1; positive toward +x / +y [kg/s]. */
  edges: Map<string, number>;
  /** Where buildings' ports open onto the run: tile, the step into the building, and flow into the run [kg/s]. */
  ports: { x: number; y: number; dx: number; dy: number; mdot: number }[];
  /** The biggest flow at each tile [kg/s]. */
  tile: Map<string, number>;
}

export interface Hydraulics {
  runs: RunFlows[];
  /** Which run a tile belongs to. */
  runAt: Map<string, number>;
}

const cache = new WeakMap<Snapshot, Hydraulics>();

/** Flows along every pipe run of a snapshot. */
export function hydraulics(snap: Snapshot): Hydraulics {
  const hit = cache.get(snap);
  if (hit) return hit;
  const runAt = new Map<string, number>();
  snap.segments.forEach((seg, si) => seg.tiles.forEach(([x, y]) => runAt.set(`${x},${y}`, si)));
  const runs: RunFlows[] = snap.segments.map(seg => ({
    service: 'liquid', fluid: runFluid(seg.vessel), edges: new Map(), ports: [], tile: new Map(),
  }));
  const pumps: [number, 0 | 1][] = [];
  for (const e of snap.entities) {
    const proto = PROTO[e.proto];
    if (!proto) continue;
    const tiles = portTiles(proto, e.x, e.y, e.rot);
    for (const p of e.pipes) {
      p.ports?.forEach((k, end) => {
        if (k === null || k === undefined || !tiles[k]) return;
        const [x, y] = tiles[k].outside;
        const si = runAt.get(`${x},${y}`);
        if (si === undefined) return;
        // a → b is positive: the run is end a, so flow leaves it; or end b, so flow arrives.
        const mdot = end === 0 ? -p.mdot : p.mdot;
        runs[si].ports.push({ x, y, dx: tiles[k].inside[0] - x, dy: tiles[k].inside[1] - y, mdot });
        if (p.kind.kind === 'Pump') pumps.push([si, end as 0 | 1]);
      });
    }
  }
  for (const [si, end] of pumps) runs[si].service = end === 0 ? 'suction' : runs[si].service === 'suction' ? 'suction' : 'discharge';
  snap.segments.forEach((seg, si) => {
    const run = runs[si];
    if (run.fluid.gas) run.service = 'gas';
    if (!seg.tiles.length) return;
    const net = new Map<string, number>();
    for (const p of run.ports) net.set(`${p.x},${p.y}`, (net.get(`${p.x},${p.y}`) ?? 0) + p.mdot);
    // Spanning tree from the first tile; then each tile's subtree inflow crosses to its parent.
    const key = (x: number, y: number) => `${x},${y}`;
    const parent = new Map<string, [number, number] | null>();
    const order: [number, number][] = [];
    const [x0, y0] = seg.tiles[0];
    parent.set(key(x0, y0), null);
    const queue: [number, number][] = [[x0, y0]];
    while (queue.length) {
      const [x, y] = queue.shift()!;
      order.push([x, y]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = key(x + dx, y + dy);
        if (runAt.get(n) === si && !parent.has(n)) { parent.set(n, [x, y]); queue.push([x + dx, y + dy]); }
      }
    }
    const up = new Map<string, number>();
    for (let i = order.length - 1; i >= 0; i--) {
      const [x, y] = order[i];
      const k = key(x, y);
      const m = (up.get(k) ?? 0) + (net.get(k) ?? 0);
      const par = parent.get(k);
      if (!par) continue;
      up.set(key(...par), (up.get(key(...par)) ?? 0) + m);
      // m flows from (x, y) to its parent.
      if (par[0] === x + 1) run.edges.set(`${x},${y},x`, m);
      else if (par[0] === x - 1) run.edges.set(`${par[0]},${par[1]},x`, -m);
      else if (par[1] === y + 1) run.edges.set(`${x},${y},y`, m);
      else run.edges.set(`${par[0]},${par[1]},y`, -m);
    }
    const bump = (k: string, m: number) => run.tile.set(k, Math.max(run.tile.get(k) ?? 0, Math.abs(m)));
    for (const [k, m] of run.edges) {
      const [x, y, axis] = k.split(',');
      bump(`${x},${y}`, m);
      bump(axis === 'x' ? `${+x + 1},${y}` : `${x},${+y + 1}`, m);
    }
    for (const p of run.ports) bump(`${p.x},${p.y}`, p.mdot);
  });
  const h = { runs, runAt };
  cache.set(snap, h);
  return h;
}

/** The pipe runs on a pump's suction and discharge sides. */
export function pumpSides(snap: Snapshot, e: EntityView): { suction: VesselView | null; discharge: VesselView | null } {
  const proto = PROTO[e.proto];
  const pipe = e.pipes.find(p => p.kind.kind === 'Pump');
  const out = { suction: null as VesselView | null, discharge: null as VesselView | null };
  if (!proto || !pipe?.ports) return out;
  const { runAt } = hydraulics(snap);
  const tiles = portTiles(proto, e.x, e.y, e.rot);
  pipe.ports.forEach((k, end) => {
    if (k === null || k === undefined || !tiles[k]) return;
    const si = runAt.get(`${tiles[k].outside[0]},${tiles[k].outside[1]}`);
    if (si === undefined) return;
    if (end === 0) out.suction = snap.segments[si].vessel; else out.discharge = snap.segments[si].vessel;
  });
  return out;
}

/**
 * NPSH available at a pump's suction [m]: absolute pressure less the liquid's vapour pressure,
 * as head, plus the velocity head in the suction line.
 */
export function npshAvailable(suction: VesselView, q: number, rho: number): number {
  const v = q / AREA;
  return (suction.p - suction.p_vap) / (rho * G) + v * v / (2 * G);
}

/**
 * NPSH the pump needs [m]: 3 m at best-efficiency flow on the full-speed pump, rising with the
 * square of flow past it and scaling with the square of speed (affinity).
 */
export function npshRequired(q: number, qBep: number, n: number): number {
  if (qBep <= 0) return 0;
  const r = q / qBep;
  return 3 * n * n * (0.45 + 0.55 * r * r);
}

/** Hydraulic Studio's result ramp, light for fast: blue, from dark to light. */
const RAMP = [0x256abf, 0x2a78d6, 0x3987e5, 0x5598e7, 0x6da7ec, 0x86b6ef, 0x9ec5f4];
export const OVER = 0xd03b3b;
export const NEAR = 0xfab219;
export const RAMP_CSS = RAMP.map(c => `#${c.toString(16).padStart(6, '0')}`);

/** Colour of a fraction 0..1 on the ramp. */
export function ramp(t: number): number {
  return RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.floor(t * RAMP.length)))];
}
