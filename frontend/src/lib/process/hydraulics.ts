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

import { PROTO, climbs as climbsNow, layout, portTiles, type EntityView, type Snapshot, type VesselView } from './engine';

/** A pipe node: height (0 ground, 1 low rack, 2 high rack) and tile. */
export type PipeNode = [number, number, number];
/** Its key: "x,y" on the ground, "l:x,y" on a rack. */
export const nodeKey = (l: number, x: number, y: number) => (l ? `${l}:${x},${y}` : `${x},${y}`);

/** Standard bore (the engine's PIPE_DIAMETER) and roughness (commercial steel). */
export const PIPE_D = 0.15;
const ROUGH = 4.5e-5;
const area = (d: number) => Math.PI * d * d / 4;

/** Bores a run can be given [m], with their nominal sizes. */
export const BORES: [number, string][] = [[0.05, 'DN 50 · 2″'], [0.08, 'DN 80 · 3″'], [0.1, 'DN 100 · 4″'], [0.15, 'DN 150 · 6″'], [0.2, 'DN 200 · 8″'], [0.3, 'DN 300 · 12″']];
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
export function friction(re: number, d = PIPE_D): number {
  if (re < 1) return 64;
  const lam = 64 / re;
  const turb = 0.25 / Math.log10(ROUGH / d / 3.7 + 5.74 / Math.pow(Math.max(re, 2300), 0.9)) ** 2;
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
export function stats(mdot: number, fl: RunFluid, d = PIPE_D): FlowStats {
  const v = Math.abs(mdot) / (fl.rho * area(d));
  const re = fl.rho * v * d / fl.mu;
  const f = friction(re, d);
  return {
    mdot, v, q: Math.abs(mdot) / fl.rho, re, f,
    regime: re < 2300 ? 'laminar' : re < 4000 ? 'transitional' : 'turbulent',
    dp100: f * (100 / d) * fl.rho * v * v / 2 / 1000,
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
  /** Bore [m]. */
  d: number;
  fluid: RunFluid;
  /** Mass flow between neighbouring pipe nodes (beside each other, or up and down a riser), positive from a to b [kg/s]. */
  edges: { a: PipeNode; b: PipeNode; m: number }[];
  /** Where buildings' ports open onto the run: height, tile, the step into the building, and flow into the run [kg/s]. */
  ports: { l: number; x: number; y: number; dx: number; dy: number; mdot: number }[];
  /** The biggest flow at each node, by nodeKey [kg/s]. */
  tile: Map<string, number>;
}

export interface Hydraulics {
  runs: RunFlows[];
  /** Which run a node belongs to, by nodeKey. */
  runAt: Map<string, number>;
  /** Heights joined on a tile (risers and inclined pipe), by "x,y". */
  climbs: Map<string, number[]>;
}

const cache = new WeakMap<Snapshot, Hydraulics>();

/** The pipe node a port opens onto, as the engine picks it: its rack height if a pipe is there, else the ground. */
export function portNode(runAt: Map<string, number>, level: number, x: number, y: number): string | null {
  if (level && runAt.has(nodeKey(level, x, y))) return nodeKey(level, x, y);
  return runAt.has(`${x},${y}`) ? `${x},${y}` : null;
}

/** Flows along every pipe run of a snapshot. */
export function hydraulics(snap: Snapshot): Hydraulics {
  const hit = cache.get(snap);
  if (hit) return hit;
  const runAt = new Map<string, number>();
  const nodesOf = (seg: Snapshot['segments'][number]): PipeNode[] =>
    [...seg.tiles.map(([x, y]) => [0, x, y] as PipeNode), ...(seg.racks ?? []).map(([l, [x, y]]) => [l, x, y] as PipeNode)];
  snap.segments.forEach((seg, si) => nodesOf(seg).forEach(([l, x, y]) => runAt.set(nodeKey(l, x, y), si)));
  const climbs = climbsNow();
  const runs: RunFlows[] = snap.segments.map(seg => ({
    service: 'liquid', d: seg.diameter || PIPE_D, fluid: runFluid(seg.vessel), edges: [], ports: [], tile: new Map(),
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
        const node = portNode(runAt, tiles[k].port.level, x, y);
        if (!node) return;
        const si = runAt.get(node)!;
        // a → b is positive: the run is end a, so flow leaves it; or end b, so flow arrives.
        const mdot = end === 0 ? -p.mdot : p.mdot;
        runs[si].ports.push({ l: node === `${x},${y}` ? 0 : tiles[k].port.level, x, y, dx: tiles[k].inside[0] - x, dy: tiles[k].inside[1] - y, mdot });
        if (p.kind.kind === 'Pump') pumps.push([si, end as 0 | 1]);
      });
    }
  }
  for (const [si, end] of pumps) runs[si].service = end === 0 ? 'suction' : runs[si].service === 'suction' ? 'suction' : 'discharge';
  snap.segments.forEach((seg, si) => {
    const run = runs[si];
    if (run.fluid.gas) run.service = 'gas';
    const nodes = nodesOf(seg);
    if (!nodes.length) return;
    const net = new Map<string, number>();
    for (const p of run.ports) net.set(nodeKey(p.l, p.x, p.y), (net.get(nodeKey(p.l, p.x, p.y)) ?? 0) + p.mdot);
    // Spanning tree from the first node; then each node's subtree inflow crosses to its parent.
    const parent = new Map<string, PipeNode | null>();
    const order: PipeNode[] = [];
    parent.set(nodeKey(...nodes[0]), null);
    const queue: PipeNode[] = [nodes[0]];
    while (queue.length) {
      const [l, x, y] = queue.shift()!;
      order.push([l, x, y]);
      const next: PipeNode[] = [[l, x + 1, y], [l, x - 1, y], [l, x, y + 1], [l, x, y - 1]];
      const up = climbs.get(`${x},${y}`);
      if (up?.includes(l)) for (const m of up) if (m !== l) next.push([m, x, y]);
      for (const n of next) {
        const k = nodeKey(...n);
        if (runAt.get(k) === si && !parent.has(k)) { parent.set(k, [l, x, y]); queue.push(n); }
      }
    }
    const up = new Map<string, number>();
    for (let i = order.length - 1; i >= 0; i--) {
      const node = order[i];
      const k = nodeKey(...node);
      const m = (up.get(k) ?? 0) + (net.get(k) ?? 0);
      const par = parent.get(k);
      if (!par) continue;
      up.set(nodeKey(...par), (up.get(nodeKey(...par)) ?? 0) + m);
      // m flows from the node to its parent.
      run.edges.push({ a: node, b: par, m });
    }
    const bump = (k: string, m: number) => run.tile.set(k, Math.max(run.tile.get(k) ?? 0, Math.abs(m)));
    for (const e of run.edges) { bump(nodeKey(...e.a), e.m); bump(nodeKey(...e.b), e.m); }
    for (const p of run.ports) bump(nodeKey(p.l, p.x, p.y), p.mdot);
  });
  const h = { runs, runAt, climbs };
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
    const node = portNode(runAt, tiles[k].port.level, tiles[k].outside[0], tiles[k].outside[1]);
    if (!node) return;
    const si = runAt.get(node)!;
    if (end === 0) out.suction = snap.segments[si].vessel; else out.discharge = snap.segments[si].vessel;
  });
  return out;
}

/**
 * NPSH available at a pump's suction [m]: absolute pressure less the liquid's vapour pressure,
 * as head, plus the velocity head in the suction line.
 */
export function npshAvailable(suction: VesselView, q: number, rho: number, d = PIPE_D): number {
  const v = q / area(d);
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
