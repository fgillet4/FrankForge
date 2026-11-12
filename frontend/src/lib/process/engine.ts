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
}

export interface SpeciesInfo { id: string; name: string; formula: string; mw: number }

export interface VesselView {
  t: number; p: number; beta: number; level: number; moles: number; mass: number;
  z: Record<string, number>; x: Record<string, number>; y: Record<string, number>;
  rho_liq: number; rho_vap: number; q_net: number; design_p: number; ruptured: boolean;
  reactions: { name: string; rate: number; ln_q_over_k: number }[];
}

export interface PipeView {
  mdot: number; velocity: number; vapour: boolean; choked: boolean;
  kind: { kind: string; opening?: number; power_used?: number; power_out?: number; rated_w?: number };
}

export interface EntityView {
  id: number; proto: string; x: number; y: number; rot: number;
  opening: number; enabled: boolean;
  vessels: VesselView[]; pipes: PipeView[];
  power_w: number; generation_w: number; battery: [number, number] | null;
}

export interface Snapshot {
  time: number; daylight: number; ambient: number;
  entities: EntityView[];
  segments: { tiles: [number, number][]; vessel: VesselView }[];
  grid: {
    frequency: number; nominal: number; generation_w: number; load_w: number;
    shed_fraction: number; blackout: boolean; capacity_w: number;
  };
  events: string[];
  emitted_kg: Record<string, number>;
}

export interface Placed { id: number; proto: string; x: number; y: number; rot: number; opening: number; enabled: boolean }

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
  return world ? JSON.parse(world.snapshot()) : null;
}

/** The layout (not the contents) for saving. */
export function layout(): Placed[] {
  return [...placed.values()];
}

export function restore(list: Placed[]) {
  for (const p of list) {
    if (place(p.proto, p.x, p.y, p.rot, p.id)) continue;
    if (p.opening !== 1) setOpening(p.id, p.opening);
    if (!p.enabled) setEnabled(p.id, false);
  }
}
