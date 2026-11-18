/**
 * Cargo ships: small coal-fired steamers that carry goods between docks, the way Factorio's
 * trains run between stations. Each follows a schedule of docks, loading or unloading at each
 * until its condition is met, then sails on to the next by the shortest way over water. They burn
 * fuel while under way and top up their bunkers from any fuel waiting on a dock.
 *
 * Ships live with the factory's entities (negative ids, as the process engine never places
 * them), so the machine window, saving and fuel work for them as for any burner.
 */

import { TerrainType, type PlanetMap } from '../types';
import { Inventory } from './inventory';
import { ITEMS } from './items';
import type { FEntity, Factory, FactoryContext } from './factory';

export interface Stop {
  dock: number;
  action: 'load' | 'unload';
  /** When to sail on: hold full, hold empty, nothing moved for a while, or after a fixed wait. */
  until: 'full' | 'empty' | 'idle' | 'time';
}

export const SHIP_SPEED = 3;      // tiles/s under way
export const SHIP_POWER = 400e3;  // W its boiler burns under way
const TRANSFER = 10;              // items/s between hold and dock
const IDLE_S = 5;
const WAIT_S = 30;
/** Fuel a ship keeps in its bunker when a dock has some to spare. */
const BUNKER = 10;

export const UNTIL_LABEL: Record<Stop['until'], string> = {
  full: 'until full', empty: 'until empty', idle: 'until idle 5 s', time: 'for 30 s',
};

export function navigable(map: PlanetMap, x: number, y: number): boolean {
  const t = map.tiles[y]?.[x];
  return !!t && (t.terrain === TerrainType.SHALLOW_WATER || t.terrain === TerrainType.DEEP_WATER);
}

/** The water tiles beside a dock that a ship can tie up at. */
export function berths(map: PlanetMap, d: FEntity): [number, number][] {
  const out = new Map<number, [number, number]>();
  for (let i = -1; i <= d.size; i++) {
    for (const [x, y] of [[d.x + i, d.y - 1], [d.x + i, d.y + d.size], [d.x - 1, d.y + i], [d.x + d.size, d.y + i]]) {
      if (navigable(map, x, y)) out.set(y * 100000 + x, [x, y]);
    }
  }
  return [...out.values()];
}

/** The shortest way over water to any of the goals, as tiles to pass through; null if none. */
export function route(map: PlanetMap, sx: number, sy: number, goals: [number, number][]): [number, number][] | null {
  const W = map.width, H = map.height;
  const goal = new Set(goals.map(([x, y]) => y * W + x));
  const start = sy * W + sx;
  if (goal.has(start)) return [];
  const prev = new Int32Array(W * H).fill(-1);
  prev[start] = start;
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q];
    const cx = c % W, cy = (c - cx) / W;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !navigable(map, nx, ny)) continue;
        // No cutting corners across land.
        if (dx && dy && (!navigable(map, cx + dx, cy) || !navigable(map, cx, cy + dy))) continue;
        const n = ny * W + nx;
        if (prev[n] >= 0) continue;
        prev[n] = c;
        if (goal.has(n)) {
          const path: [number, number][] = [];
          for (let k = n; k !== start; k = prev[k]) path.push([k % W, Math.floor(k / W)]);
          return path.reverse();
        }
        queue.push(n);
      }
    }
  }
  return null;
}

export function newShip(id: number, x: number, y: number): FEntity {
  return {
    id, kind: 'cargo_ship', x, y, rot: 0, size: 1, hp: 400, maxHp: 400,
    inv: new Inventory(20), fuel: new Inventory(1), burn: 0,
    schedule: [], stop: 0, auto: false, heading: Math.PI / 4, path: null, voyage: 'idle', waited: 0, idle: 0, moved: 0, retry: 0,
  };
}

const isFull = (inv: Inventory) => inv.slots.every(s => s && s.count >= (ITEMS[s.item]?.stack ?? 100));

export function tickShip(f: Factory, e: FEntity, dt: number, ctx: FactoryContext) {
  const schedule = e.schedule ?? [];
  if (!schedule.length) { e.status = undefined; return; }
  if (!e.auto) return;
  e.stop = (e.stop ?? 0) % schedule.length;
  const stop = schedule[e.stop];
  const dock = f.entities.get(stop.dock);
  const next = () => { e.stop = (e.stop! + 1) % schedule.length; e.voyage = 'idle'; e.path = null; };
  if (!dock || dock.kind !== 'dock') { e.status = 'Dock gone'; next(); return; }

  if (e.voyage === 'docked') {
    e.status = undefined;
    e.waited! += dt;
    e.moved = Math.min(e.moved! + TRANSFER * dt, TRANSFER);
    let any = false;
    while (e.moved! >= 1) {
      // Bunkers first, from any fuel on the dock.
      const fuelled = e.fuel!.slots.reduce((n, s) => n + (s?.count ?? 0), 0);
      const fuel = fuelled < BUNKER ? dock.inv!.first(i => !!ITEMS[i]?.fuel && e.fuel!.room(i) > 0) : null;
      const [from, to] = stop.action === 'load' ? [dock.inv!, e.inv!] : [e.inv!, dock.inv!];
      const item = fuel ? null : from.first(i => to.room(i) > 0);
      if (fuel) { dock.inv!.remove(fuel, 1); e.fuel!.add(fuel, 1); }
      else if (item) { from.remove(item, 1); to.add(item, 1); }
      else break;
      e.moved! -= 1;
      any = true;
    }
    e.idle = any ? 0 : e.idle! + dt;
    const done = stop.until === 'full' ? isFull(e.inv!) : stop.until === 'empty' ? e.inv!.isEmpty()
      : stop.until === 'idle' ? e.idle! >= IDLE_S : e.waited! >= WAIT_S;
    if (done) next();
    return;
  }

  if (!e.path) {
    e.retry = (e.retry ?? 0) - dt;
    if (e.retry > 0) return;
    const path = route(ctx.map, Math.floor(e.x), Math.floor(e.y), berths(ctx.map, dock));
    if (!path) { e.status = 'No way there'; e.retry = 2; return; }
    e.path = path;
    e.voyage = 'sailing';
  }
  const run = e.path.length ? f.burnFuel(e, SHIP_POWER, dt, ctx) : 1;
  if (run <= 0) { e.status = 'Out of fuel'; return; }
  e.status = undefined;
  e.active = true;
  let step = SHIP_SPEED * run * dt;
  while (step > 0 && e.path.length) {
    const [tx, ty] = e.path[0];
    const dx = tx + 0.5 - e.x, dy = ty + 0.5 - e.y, d = Math.hypot(dx, dy);
    if (d > 1e-6) {
      // Turning takes a moment: the bow swings round toward the next tile.
      let turn = Math.atan2(dy, dx) - e.heading!;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      e.heading! += turn * Math.min(1, dt * 5);
    }
    if (d <= step) { e.x = tx + 0.5; e.y = ty + 0.5; step -= d; e.path.shift(); }
    else { e.x += dx / d * step; e.y += dy / d * step; step = 0; }
  }
  if (!e.path.length) {
    e.path = null;
    e.voyage = 'docked';
    e.waited = 0;
    e.idle = 0;
    e.moved = 0;
  }
}

/** What a ship is doing, in words. */
export function voyageText(f: Factory, e: FEntity): string {
  const s = e.schedule?.[e.stop ?? 0];
  const dock = s ? f.entities.get(s.dock)?.label ?? 'a dock' : null;
  if (!dock) return 'No schedule';
  if (!e.auto) return `Moored, next for ${dock}`;
  if (e.voyage === 'docked') return `At ${dock}, ${s!.action === 'load' ? 'loading' : 'unloading'}`;
  return `Sailing for ${dock}`;
}
