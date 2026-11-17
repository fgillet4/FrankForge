/**
 * The process engine (Rust → WASM): real thermodynamics, pressure-driven flow, reactions and an
 * AC grid. This module loads it, holds the one ProcessWorld for the game, and types its JSON.
 */

import init, { ProcessWorld, prototypes, species } from '../../../../rust/pkg/frankforge_core.js';

export type At = 'Bottom' | 'Middle' | 'Top';

export interface PortDef { dx: number; dy: number; vessel: number; at: At; label: string }

export interface Proto {
  id: string;
  name: string;
  category: string;
  description: string;
  size: number;
  ports: PortDef[];
  vessels: { volume: number; height: number; design_bar: number; reactions: string[] }[];
  link: unknown;
  source: string | null;
  power_w: number;
  generator_w: number;
  battery_j: number;
  needs: string | null;
  /** Poles: wire reach and supply half-width [tiles]. */
  wire: number;
  supply: number;
  burns: boolean;
  agitated: boolean;
  selectable: boolean;
  /** Burner generators: driven by fuel the frontend burns. */
  fueled: boolean;
}

export interface SpeciesInfo { id: string; name: string; formula: string; mw: number }

export interface VesselView {
  t: number; p: number; beta: number; level: number; moles: number; mass: number;
  z: Record<string, number>; x: Record<string, number>; y: Record<string, number>;
  rho_liq: number; rho_vap: number; q_net: number; design_p: number; ruptured: boolean;
  /** Viscosities [Pa·s] and the liquid's vapour pressure [Pa]. */
  mu_liq: number; mu_vap: number; p_vap: number;
  reactions: { name: string; rate: number; ln_q_over_k: number }[];
}

export interface PipeView {
  mdot: number; velocity: number; vapour: boolean; choked: boolean;
  /** Which of the building's ports each end attaches through, when it meets a pipe run. */
  ports: [number | null, number | null];
  kind: {
    kind: string; opening?: number; power_used?: number; power_out?: number; rated_w?: number;
    /** Pumps: rated curve, settings and operating point (see the engine's PipeKind::Pump). */
    dp_max?: number; q_max?: number; eff?: number; trim?: number; speed?: number;
    q?: number; dp?: number; eff_now?: number; n?: number; rho?: number;
    /** Pumps: NPSH available and required [m], how hard it's cavitating (0..1), impeller wear (0..1). */
    npsha?: number; npshr?: number; cavitation?: number; wear?: number;
  };
}

export interface EntityView {
  id: number; proto: string; x: number; y: number; rot: number;
  opening: number; enabled: boolean;
  vessels: VesselView[]; pipes: PipeView[];
  power_w: number; generation_w: number; battery: [number, number] | null;
  /** The power network it's wired into, and how much of its demand that grid serves. */
  network: number | null; served: number;
}

export interface GridView {
  frequency: number; nominal: number; generation_w: number; load_w: number;
  shed_fraction: number; blackout: boolean; capacity_w: number;
}

export interface Snapshot {
  time: number; daylight: number; ambient: number;
  entities: EntityView[];
  segments: { tiles: [number, number][]; vessel: VesselView; diameter: number }[];
  /** The biggest network, and all of them. */
  grid: GridView;
  main_grid: number | null;
  grids: GridView[];
  /** Wires between poles, as pole ids. */
  wires: [number, number][];
  events: string[];
  emitted_kg: Record<string, number>;
}

export interface Placed {
  id: number; proto: string; x: number; y: number; rot: number; opening: number; enabled: boolean; reaction?: string;
  /** Pumps: impeller trim and VFD speed, as fractions of full. */
  trim?: number; speed?: number;
  /** Pumps: impeller worn by cavitation, 0..1. */
  wear?: number;
  /** Pipes: bore [m], when not the standard one. */
  diameter?: number;
}

let world: ProcessWorld | null = null;
export let PROTOS: Proto[] = [];
export let PROTO: Record<string, Proto> = {};
export let SPECIES: Record<string, SpeciesInfo> = {};
let nextId = 1;
const placed = new Map<number, Placed>();

export async function startEngine(ambientK = 293.15): Promise<void> {
  if (world) return;
  await init();
  PROTOS = JSON.parse(prototypes());
  PROTO = Object.fromEntries(PROTOS.map(p => [p.id, p]));
  SPECIES = Object.fromEntries((JSON.parse(species()) as SpeciesInfo[]).map(s => [s.id, s]));
  world = new ProcessWorld(ambientK);
}

/** Clears the plant for a fresh world. */
export function reset(ambientK = 293.15) {
  if (!world) return;
  world.free();
  world = new ProcessWorld(ambientK);
  placed.clear();
  nextId = 1;
}

export function engineReady(): boolean {
  return world !== null;
}

/** Rotated port positions: the tile outside the footprint, and the footprint tile it faces. */
export function portTiles(proto: Proto, x: number, y: number, rot: number) {
  const s = proto.size;
  const turn = (px: number, py: number): [number, number] => {
    switch (rot % 4) {
      case 1: return [s - 1 - py, px];
      case 2: return [s - 1 - px, s - 1 - py];
      case 3: return [py, s - 1 - px];
      default: return [px, py];
    }
  };
  return proto.ports.map(p => {
    const [ox, oy] = turn(p.dx, p.dy);
    const [ix, iy] = turn(Math.min(Math.max(p.dx, 0), s - 1), Math.min(Math.max(p.dy, 0), s - 1));
    return { port: p, outside: [x + ox, y + oy] as [number, number], inside: [x + ix, y + iy] as [number, number] };
  });
}

export function place(proto: string, x: number, y: number, rot: number, id = nextId++): string {
  if (!world) return 'engine not loaded';
  const err = world.place(id, proto, x, y, rot);
  if (!err) {
    placed.set(id, { id, proto, x, y, rot, opening: 1, enabled: true });
    nextId = Math.max(nextId, id + 1);
  }
  return err;
}

export function remove(id: number): boolean {
  placed.delete(id);
  return world?.remove(id) ?? false;
}

export function entityAt(x: number, y: number): number {
  return world ? Number(world.entity_at(x, y)) : -1;
}

export function setOpening(id: number, v: number) {
  world?.set_opening(id, v);
  const p = placed.get(id);
  if (p) p.opening = v;
}

export function setEnabled(id: number, on: boolean) {
  world?.set_enabled(id, on);
  const p = placed.get(id);
  if (p) p.enabled = on;
}

/** Picks the reaction in a building that lets you choose (the CSTR); 'none' clears it. */
export function setReaction(id: number, reaction: string) {
  world?.set_reaction(id, reaction);
  const p = placed.get(id);
  if (p) p.reaction = reaction;
}

/** Trims a pump's impeller (0.7–1) and sets its VFD speed (0–1). */
export function setPump(id: number, trim: number, speed: number) {
  world?.set_pump(id, trim, speed);
  const p = placed.get(id);
  if (p) { p.trim = trim; p.speed = speed; }
}

/** How much of its rated power an electric building asks for (0–1). */
export function setDemand(id: number, fraction: number) {
  world?.set_demand(id, fraction);
}

/** Takes up to `mol` of a species out of a building's first vessel; returns what it got. */
export function take(id: number, speciesId: string, mol: number): number {
  return world?.take(id, speciesId, mol) ?? 0;
}

export function fill(id: number, speciesId: string, mol: number, tK: number) {
  world?.fill(id, speciesId, mol, tK);
}

export function blackStart() {
  world?.black_start();
}

export function advance(seconds: number) {
  world?.advance(seconds);
}

export function snapshot(): Snapshot | null {
  if (!world) return null;
  const snap: Snapshot = JSON.parse(world.snapshot());
  // Keep pipe bores with the layout, so a save remembers them (new pipes take their run's).
  for (const seg of snap.segments) {
    const pipes = seg.tiles.map(([x, y]) => placed.get(entityAt(x, y)));
    if (Math.abs(seg.diameter - 0.15) < 1e-6 && !pipes.some(p => p?.diameter)) continue;
    for (const p of pipes) if (p) p.diameter = seg.diameter;
  }
  // Keep pump wear with the layout, so a save remembers it.
  for (const e of snap.entities) {
    const wear = e.pipes.find(p => p.kind.kind === 'Pump')?.kind.wear;
    const p = placed.get(e.id);
    if (p && wear) p.wear = wear;
  }
  return snap;
}

/** Re-bores the whole pipe run a pipe belongs to [m]. */
export function setPipeDiameter(id: number, diameter: number) {
  world?.set_pipe_diameter(id, diameter);
}

/** Sets how worn a pump's impeller is (0..1). */
export function setPumpWear(id: number, wear: number) {
  world?.set_pump_wear(id, wear);
  const p = placed.get(id);
  if (p) p.wear = wear;
}

/** The layout (not the contents) for saving. */
export function placedById(id: number): Placed | undefined {
  return placed.get(id);
}

export function layout(): Placed[] {
  return [...placed.values()];
}

export function restore(list: Placed[]) {
  for (const p of list) {
    if (place(p.proto, p.x, p.y, p.rot, p.id)) continue;
    if (p.opening !== 1) setOpening(p.id, p.opening);
    if (!p.enabled) setEnabled(p.id, false);
    if (p.reaction) setReaction(p.id, p.reaction);
    if (p.trim !== undefined || p.speed !== undefined) setPump(p.id, p.trim ?? 1, p.speed ?? 1);
    if (p.wear) setPumpWear(p.id, p.wear);
    if (p.diameter && p.proto === 'pipe') setPipeDiameter(p.id, p.diameter);
  }
}
