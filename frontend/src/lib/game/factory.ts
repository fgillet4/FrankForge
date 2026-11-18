/**
 * The solid side of the factory: belts, underground belts, splitters, inserters, chests,
 * drills, furnaces, assemblers, chemical plants, labs and turrets.
 *
 * Every one of them is also placed in the process engine, which owns which tile holds what and
 * powers the electric ones. This module keeps their items and runs them.
 */

import { ResourceType, type PlanetMap } from '../types';
import { Inventory, type Stack } from './inventory';
import { ITEMS, RECIPES, TECH, type Recipe } from './items';
import { SHIP_POWER, tickShip, type Stop } from './ships';

/** Rotation 0..3 faces north, east, south, west (−y, +x, +y, −x). */
export const DIRS: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export const BELT_SPEED = 1.875;  // tiles/s: 7.5 items/s at 4 per tile
const GAP = 0.25;
const UNDERGROUND_REACH = 5;
const INSERTER_CYCLE = 1.2;       // s for a pick, swing and return at full power

/** Ore each resource tile holds when full, scaled by its density. */
const ORE_PER_TILE = 1500;

export const MINED_ITEM: Partial<Record<ResourceType, string>> = {
  [ResourceType.IRON]: 'iron_ore',
  [ResourceType.COPPER]: 'copper_ore',
  [ResourceType.SILICON]: 'silicon_ore',
  [ResourceType.SULFUR]: 'sulfur',
  [ResourceType.COAL]: 'coal',
};

export const FACTORY_KINDS = new Set([
  'transport_belt', 'underground_belt', 'splitter', 'inserter', 'burner_inserter', 'wooden_chest', 'iron_chest', 'burner_drill',
  'electric_drill', 'stone_furnace', 'electric_furnace', 'assembler', 'chemical_plant', 'lab', 'gun_turret', 'laser_turret',
  'burner_generator', 'charcoal_kiln', 'dock',
]);

const BELTLIKE = new Set(['transport_belt', 'underground_belt', 'splitter']);
const BURNER: Record<string, number> = { burner_drill: 150e3, stone_furnace: 90e3, burner_generator: 0, burner_inserter: 50e3, cargo_ship: SHIP_POWER };
/** Things inserters fill and empty like chests. */
const isStore = (kind: string) => kind.endsWith('_chest') || kind === 'dock';
/** Burner generators turn this much of their fuel into electricity. */
const GENERATOR_EFFICIENCY = 0.35;
const ELECTRIC = new Set(['inserter', 'electric_drill', 'electric_furnace', 'assembler', 'chemical_plant', 'lab', 'laser_turret']);

export interface BeltItem { item: string; pos: number }

export interface FEntity {
  id: number;
  kind: string;
  x: number;
  y: number;
  rot: number;
  size: number;
  hp: number;
  maxHp: number;
  /** Belts: items along the tile, front (pos 1) first. */
  items?: BeltItem[];
  /** Underground belts: entrance or exit, and the other end. Splitters: the other half. */
  mode?: 'in' | 'out';
  pair?: number;
  toggle?: number;
  /** Inserters: what's in the hand and where the arm is in its cycle (0..1). */
  hand?: string | null;
  swing?: number;
  /** Storage, fuel, inputs and outputs. */
  inv?: Inventory;
  fuel?: Inventory;
  input?: Inventory;
  output?: Inventory;
  /** Energy left in the current piece of fuel [J]. */
  burn?: number;
  recipe?: string | null;
  progress?: number;
  /** Chemical plants: feed gas drawn so far toward the next batch [mol]. */
  fluid?: Record<string, number>;
  /** A mined or smelted item waiting for room. */
  held?: string | null;
  /** Turrets. */
  cooldown?: number;
  rounds?: number;
  aim?: number;
  firing?: boolean;
  /** Whether it did anything this tick (for power demand and animation). */
  active?: boolean;
  /** What stops it, shown in its tooltip. */
  status?: string;
  /** Docks: their name, for ships' schedules. */
  label?: string;
  /** Ships: where they call, which stop is next and whether they're following the schedule. */
  schedule?: Stop[];
  stop?: number;
  auto?: boolean;
  /** Ships: which way the bow points [rad, tile space] and the tiles still to sail through. */
  heading?: number;
  path?: [number, number][] | null;
  voyage?: 'idle' | 'sailing' | 'docked';
  /** Ships at a dock: time there, time since anything moved, and items it may move now. */
  waited?: number;
  idle?: number;
  moved?: number;
  /** Ships: when to look for a way to the dock again [s]. */
  retry?: number;
}

export interface FactoryContext {
  map: PlanetMap;
  /** Grid power served (0..1) to an electric building. */
  served(id: number): number;
  /** What a generator is delivering to its grid [W]. */
  generation(id: number): number;
  entityAt(x: number, y: number): number;
  unlocked(recipe: string): boolean;
  research: { current: string | null };
  researchUnit(): void;
  takeFluid(id: number, species: string, mol: number): number;
  produced(item: string, n: number): void;
  /** A resource tile has run out. */
  depleted(x: number, y: number): void;
  consumed(item: string, n: number): void;
}

function maxHp(kind: string, size: number) {
  if (kind.endsWith('_turret')) return 400;
  return [0, 150, 300, 500, 700][size] ?? 500;
}

/**
 * The tile a drill at (x, y) facing rot drops onto: the middle of the side it faces, the nearer
 * of the two middles on an even side, which is where the paintings put the chute.
 */
export function drillOutput(x: number, y: number, size: number, rot: number): [number, number] {
  const m = Math.floor((size - 1) / 2);
  switch (rot) {
    case 1: return [x + size, y + m];
    case 2: return [x + m, y + size];
    case 3: return [x - 1, y + m];
    default: return [x + m, y - 1];
  }
}

export class Factory {
  entities = new Map<number, FEntity>();
  /** Ore taken from each tile, keyed y·100000+x. */
  mined = new Map<number, number>();

  add(id: number, kind: string, x: number, y: number, rot: number, size: number): FEntity {
    const e: FEntity = { id, kind, x, y, rot, size, hp: maxHp(kind, size), maxHp: maxHp(kind, size) };
    if (BELTLIKE.has(kind)) e.items = [];
    if (kind === 'inserter' || kind === 'burner_inserter') { e.hand = null; e.swing = 0; }
    if (kind === 'wooden_chest') e.inv = new Inventory(16);
    if (kind === 'iron_chest') e.inv = new Inventory(32);
    if (kind === 'dock') {
      e.inv = new Inventory(24);
      const names = new Set([...this.entities.values()].map(d => d.label));
      let k = 0;
      while (names.has(dockName(k))) k++;
      e.label = dockName(k);
    }
    if (kind in BURNER) { e.fuel = new Inventory(1); e.burn = 0; }
    if (kind.endsWith('_furnace') || kind === 'assembler' || kind === 'chemical_plant' || kind === 'charcoal_kiln') {
      e.input = new Inventory(kind === 'assembler' ? 6 : 1);
      e.output = new Inventory(1);
      e.progress = 0;
      e.recipe = null;
    }
    if (kind.endsWith('_drill')) { e.progress = 0; e.held = null; }
    if (kind === 'chemical_plant') e.fluid = {};
    if (kind === 'lab') { e.inv = new Inventory(3); e.progress = 0; }
    if (kind === 'gun_turret') { e.inv = new Inventory(1); e.rounds = 0; e.cooldown = 0; e.aim = 0; }
    if (kind === 'laser_turret') { e.cooldown = 0; e.aim = 0; }
    this.entities.set(id, e);
    if (kind === 'underground_belt') this.pairUnderground(e);
    return e;
  }

  /** Removes a building and returns what it held. */
  remove(id: number): Stack[] {
    const e = this.entities.get(id);
    if (!e) return [];
    this.entities.delete(id);
    if (e.pair !== undefined) {
      const other = this.entities.get(e.pair);
      if (other) {
        other.pair = undefined;
        if (other.kind === 'underground_belt') this.pairUnderground(other);
      }
    }
    const out: Stack[] = [];
    for (const inv of [e.inv, e.fuel, e.input, e.output]) {
      for (const s of inv?.slots ?? []) if (s) out.push({ ...s });
    }
    for (const b of e.items ?? []) out.push({ item: b.item, count: 1 });
    if (e.hand) out.push({ item: e.hand, count: 1 });
    if (e.held) out.push({ item: e.held, count: 1 });
    return out;
  }

  at(ctx: FactoryContext, x: number, y: number): FEntity | undefined {
    const id = ctx.entityAt(x, y);
    return id >= 0 ? this.entities.get(id) : undefined;
  }

  /**
   * An underground belt becomes the exit of an unpaired entrance pointing at it from behind
   * within reach; otherwise it is an entrance.
   */
  private pairUnderground(e: FEntity) {
    const [dx, dy] = DIRS[e.rot];
    for (let k = 1; k <= UNDERGROUND_REACH; k++) {
      const o = [...this.entities.values()].find(u => u.kind === 'underground_belt' && u !== e
        && u.x === e.x - dx * k && u.y === e.y - dy * k);
      if (!o) continue;
      if (o.rot === e.rot && o.mode === 'in' && o.pair === undefined) {
        e.mode = 'out';
        e.pair = o.id;
        o.pair = e.id;
        return;
      }
      break;
    }
    e.mode = 'in';
    e.pair = undefined;
  }

  /** Pairs a splitter half with the one beside it. */
  pairSplitter(a: FEntity, b: FEntity) {
    a.pair = b.id;
    b.pair = a.id;
    a.toggle = b.toggle = 0;
  }

  // ── Moving items between things ──────────────────────────────────────────

  /** Whether `e` will take `item` now (inserters and drills feeding it). */
  wants(e: FEntity, item: string, ctx: FactoryContext): boolean {
    if (BELTLIKE.has(e.kind)) return this.beltRoom(e, 0.5);
    if (e.inv && isStore(e.kind)) return e.inv.room(item) > 0;
    if (e.fuel && ITEMS[item]?.fuel && e.fuel.count(item) < 10 && e.fuel.room(item) > 0) return true;
    if (e.kind === 'charcoal_kiln') {
      const r = kilnRecipe(item, ctx);
      return !!r && e.input!.room(item) > 0 && e.input!.count(item) < r.in[item] * 5;
    }
    if (e.kind.endsWith('_furnace')) {
      const r = smeltRecipe(item, ctx);
      return !!r && e.input!.room(item) > 0 && e.input!.count(item) < Math.max(10, r.in[item] * 2) && (e.input!.isEmpty() || e.input!.count(item) > 0);
    }
    if (e.kind === 'assembler' && e.recipe) {
      const need = RECIPES[e.recipe]?.in[item];
      return !!need && e.input!.count(item) < need * 2 + 1 && e.input!.room(item) > 0;
    }
    if (e.kind === 'lab') {
      const tech = ctx.research.current ? TECH[ctx.research.current] : null;
      return !!tech?.packs.includes(item) && e.inv!.count(item) < 10 && e.inv!.room(item) > 0;
    }
    if (e.kind === 'gun_turret') return !!ITEMS[item]?.gear && ITEMS[item].gear === 'ammo' && e.inv!.count(item) < 20 && e.inv!.room(item) > 0;
    return false;
  }

  /** The inventory of `e` a player's item goes into by hand, if any. */
  slotFor(e: FEntity, item: string, smeltable: (item: string) => boolean): Inventory | undefined {
    if (isStore(e.kind)) return e.inv;
    if (e.kind === 'cargo_ship') return ITEMS[item]?.fuel && e.fuel!.room(item) > 0 ? e.fuel : e.inv;
    if (e.kind === 'lab') return item.startsWith('science_') ? e.inv : undefined;
    if (e.kind === 'gun_turret') return ITEMS[item]?.gear === 'ammo' ? e.inv : undefined;
    if (e.kind.endsWith('_furnace') && smeltable(item)) return e.input;
    if (e.kind === 'charcoal_kiln') return Object.values(RECIPES).some(r => r.station === 'kiln' && item in r.in) ? e.input : undefined;
    if (e.fuel && ITEMS[item]?.fuel) return e.fuel;
    if (e.kind === 'assembler' && e.recipe && RECIPES[e.recipe]?.in[item]) return e.input;
    return undefined;
  }

  /** Puts an item into `e` (after `wants`). */
  give(e: FEntity, item: string, ctx: FactoryContext, beltPos = 0.5) {
    if (BELTLIKE.has(e.kind)) { this.insertOnBelt(e, item, beltPos); return; }
    if (e.fuel && ITEMS[item]?.fuel && !(e.kind.endsWith('_furnace') && smeltRecipe(item, ctx))) { e.fuel.add(item, 1); return; }
    if (e.input && (e.kind.endsWith('_furnace') || e.kind === 'assembler' || e.kind === 'charcoal_kiln')) { e.input.add(item, 1); return; }
    e.inv?.add(item, 1);
  }

  /** What an inserter could take from `e` for `target`. */
  private offer(e: FEntity, target: FEntity, ctx: FactoryContext): string | null {
    if (BELTLIKE.has(e.kind)) {
      const b = e.items!.find(i => this.wants(target, i.item, ctx));
      return b?.item ?? null;
    }
    if (e.output) return e.output.first(i => this.wants(target, i, ctx));
    if (isStore(e.kind)) return e.inv!.first(i => this.wants(target, i, ctx));
    return null;
  }

  private take(e: FEntity, item: string) {
    if (BELTLIKE.has(e.kind)) {
      const k = e.items!.findIndex(i => i.item === item);
      if (k >= 0) e.items!.splice(k, 1);
      return;
    }
    if (e.output?.count(item)) { e.output.remove(item, 1); return; }
    e.inv?.remove(item, 1);
  }

  private beltRoom(e: FEntity, pos: number): boolean {
    return e.items!.length < 4 && e.items!.every(i => Math.abs(i.pos - pos) >= GAP);
  }

  private insertOnBelt(e: FEntity, item: string, pos: number) {
    e.items!.push({ item, pos });
    e.items!.sort((a, b) => b.pos - a.pos);
  }

  /** The belt-like thing an item leaving `e`'s front end goes to. */
  private beltNext(e: FEntity, ctx: FactoryContext): FEntity | undefined {
    if (e.kind === 'underground_belt' && e.mode === 'in') return e.pair !== undefined ? this.entities.get(e.pair) : undefined;
    const [dx, dy] = DIRS[e.rot];
    const n = this.at(ctx, e.x + dx, e.y + dy);
    if (!n || !BELTLIKE.has(n.kind)) return undefined;
    // An underground exit only takes items from its own entrance; nothing runs into a belt head-on.
    if (n.kind === 'underground_belt' && n.mode === 'out') return undefined;
    if ((n.rot + 2) % 4 === e.rot) return undefined;
    return n;
  }

  /** Length an item travels over this belt piece [tiles]. */
  beltLength(e: FEntity): number {
    if (e.kind === 'underground_belt' && e.mode === 'in' && e.pair !== undefined) {
      const p = this.entities.get(e.pair);
      if (p) return Math.abs(p.x - e.x) + Math.abs(p.y - e.y);
    }
    return 1;
  }

  // ── The tick ─────────────────────────────────────────────────────────────

  tick(dt: number, ctx: FactoryContext) {
    for (const e of this.entities.values()) {
      e.active = false;
      if (BELTLIKE.has(e.kind)) this.tickBelt(e, dt, ctx);
    }
    for (const e of this.entities.values()) {
      switch (e.kind) {
        case 'inserter': case 'burner_inserter': this.tickInserter(e, dt, ctx); break;
        case 'burner_drill': case 'electric_drill': this.tickDrill(e, dt, ctx); break;
        case 'stone_furnace': case 'electric_furnace': case 'assembler': case 'chemical_plant': case 'charcoal_kiln': this.tickCrafter(e, dt, ctx); break;
        case 'lab': this.tickLab(e, dt, ctx); break;
        case 'burner_generator': this.tickGenerator(e, dt, ctx); break;
        case 'cargo_ship': tickShip(this, e, dt, ctx); break;
      }
    }
  }

  private tickBelt(e: FEntity, dt: number, ctx: FactoryContext) {
    const items = e.items!;
    if (!items.length) return;
    const step = BELT_SPEED * dt / this.beltLength(e);
    let limit = 1;
    for (let k = 0; k < items.length; k++) {
      const it = items[k];
      let pos = it.pos + step;
      if (k === 0 && pos >= 1) {
        if (this.passOn(e, it.item, ctx)) {
          items.shift();
          k--;
          continue;
        }
        pos = 1;
      }
      it.pos = Math.min(pos, limit);
      limit = it.pos - GAP;
    }
  }

  /** Hands an item off the front of a belt piece; splitters alternate between their two outputs. */
  private passOn(e: FEntity, item: string, ctx: FactoryContext): boolean {
    if (e.kind === 'splitter' && e.pair !== undefined) {
      const other = this.entities.get(e.pair);
      const halves = other ? (e.toggle === 0 ? [e, other] : [other, e]) : [e];
      for (const h of halves) {
        const n = this.beltNext(h, ctx);
        if (n && this.beltRoom(n, 0)) {
          this.insertOnBelt(n, item, 0);
          e.toggle = other!.toggle = h === e ? 1 : 0;
          return true;
        }
      }
      return false;
    }
    const n = this.beltNext(e, ctx);
    if (!n) return false;
    // Side-loading onto a belt running across this one lands mid-tile.
    const pos = n.rot === e.rot || n.kind !== 'transport_belt' ? 0 : 0.5;
    if (!this.beltRoom(n, pos)) return false;
    this.insertOnBelt(n, item, pos);
    return true;
  }

  private tickInserter(e: FEntity, dt: number, ctx: FactoryContext) {
    const burner = e.kind === 'burner_inserter';
    // A burner inserter keeps a piece of any fuel it picks up for itself when it runs dry.
    if (burner && e.hand && ITEMS[e.hand]?.fuel && e.burn! <= 0 && e.fuel!.isEmpty()) { e.fuel!.add(e.hand, 1); e.hand = null; }
    const power = burner ? (e.hand || e.swing! > 0 || this.canPick(e, ctx) ? this.burnFuel(e, BURNER.burner_inserter, dt, ctx) * 0.5 : 0.5) : ctx.served(e.id);
    if (power <= 0) { e.status = burner ? 'Out of fuel' : 'No power'; return; }
    const [dx, dy] = DIRS[e.rot];
    const from = this.at(ctx, e.x - dx, e.y - dy);
    const to = this.at(ctx, e.x + dx, e.y + dy);
    e.status = undefined;
    if (!e.hand && e.swing! <= 0) {
      if (!from || !to) { e.status = 'Nothing to move'; return; }
      const item = this.offer(from, to, ctx);
      if (!item) return;
      this.take(from, item);
      e.hand = item;
    }
    e.active = true;
    const half = INSERTER_CYCLE / 2;
    if (e.hand) {
      e.swing = Math.min(1, e.swing! + power * dt / half);
      if (e.swing >= 1) {
        if (to && this.wants(to, e.hand, ctx)) {
          this.give(to, e.hand, ctx);
          e.hand = null;
        } else {
          e.status = 'Waiting for room';
          e.active = false;
        }
      }
    } else {
      e.swing = Math.max(0, e.swing! - power * dt / half);
    }
  }

  /** Whether an inserter has something to pick up for where it drops. */
  private canPick(e: FEntity, ctx: FactoryContext): boolean {
    const [dx, dy] = DIRS[e.rot];
    const from = this.at(ctx, e.x - dx, e.y - dy);
    const to = this.at(ctx, e.x + dx, e.y + dy);
    return !!from && !!to && !!this.offer(from, to, ctx);
  }

  /** Burns fuel for `watts` over dt; returns the fraction of dt it ran. */
  burnFuel(e: FEntity, watts: number, dt: number, ctx: FactoryContext): number {
    const need = watts * dt;
    if (e.burn! < need) {
      const f = e.fuel!.first();
      if (f && ITEMS[f]?.fuel) {
        e.fuel!.remove(f, 1);
        ctx.consumed(f, 1);
        e.burn! += ITEMS[f].fuel!;
      }
    }
    const used = Math.min(need, e.burn!);
    e.burn! -= used;
    return used / need;
  }

  private tickDrill(e: FEntity, dt: number, ctx: FactoryContext) {
    if (e.held) {
      if (!this.deliver(e, e.held, ctx)) { e.status = 'Output blocked'; return; }
      e.held = null;
    }
    const tiles = this.oreTiles(e, ctx);
    if (!tiles.length) { e.status = 'No ore left'; return; }
    const run = e.kind === 'burner_drill' ? this.burnFuel(e, BURNER.burner_drill, dt, ctx) : ctx.served(e.id);
    if (run <= 0) { e.status = e.kind === 'burner_drill' ? 'Out of fuel' : 'No power'; return; }
    e.status = undefined;
    e.active = true;
    const rate = e.kind === 'burner_drill' ? 0.25 : 0.5;
    e.progress! += rate * run * dt;
    if (e.progress! < 1) return;
    e.progress! -= 1;
    const [tx, ty, item] = tiles[Math.floor(Math.random() * tiles.length)];
    const key = ty * 100000 + tx;
    this.mined.set(key, (this.mined.get(key) ?? 0) + 1);
    if (this.oreLeft(ctx.map, tx, ty) <= 0) ctx.depleted(tx, ty);
    ctx.produced(item, 1);
    if (!this.deliver(e, item, ctx)) e.held = item;
  }

  /** Resource tiles under a drill with ore left: [x, y, item]. */
  oreTiles(e: FEntity, ctx: { map: PlanetMap }): [number, number, string][] {
    const out: [number, number, string][] = [];
    for (let y = e.y; y < e.y + e.size; y++) {
      for (let x = e.x; x < e.x + e.size; x++) {
        const t = ctx.map.tiles[y]?.[x];
        const item = t ? MINED_ITEM[t.resource] : undefined;
        if (item && this.oreLeft(ctx.map, x, y) > 0) out.push([x, y, item]);
      }
    }
    return out;
  }

  oreLeft(map: PlanetMap, x: number, y: number): number {
    const t = map.tiles[y]?.[x];
    if (!t || !MINED_ITEM[t.resource]) return 0;
    return Math.round(ORE_PER_TILE * (0.3 + t.resourceDensity)) - (this.mined.get(y * 100000 + x) ?? 0);
  }

  /** The tile a drill drops onto: the middle of the side it faces. */
  outputTile(e: FEntity): [number, number] {
    return drillOutput(e.x, e.y, e.size, e.rot);
  }

  private deliver(e: FEntity, item: string, ctx: FactoryContext): boolean {
    const [ox, oy] = this.outputTile(e);
    const t = this.at(ctx, ox, oy);
    if (!t || !this.wants(t, item, ctx)) return false;
    this.give(t, item, ctx);
    return true;
  }

  private tickCrafter(e: FEntity, dt: number, ctx: FactoryContext) {
    // Furnaces and kilns work out their recipe from what's in them.
    if (e.kind.endsWith('_furnace') || e.kind === 'charcoal_kiln') {
      const item = e.input!.first();
      const r = !item ? undefined : e.kind === 'charcoal_kiln' ? kilnRecipe(item, ctx) : smeltRecipe(item, ctx);
      if (r?.id !== e.recipe) { e.recipe = r?.id ?? null; e.progress = 0; }
    }
    const r = e.recipe ? RECIPES[e.recipe] : undefined;
    if (!r) { e.status = e.kind === 'assembler' || e.kind === 'chemical_plant' ? 'No recipe set' : e.kind === 'charcoal_kiln' ? 'No wood' : 'No ore'; return; }
    if (e.output!.room(r.out) < r.count) { e.status = 'Output full'; return; }
    if (!e.input!.has(r.in)) { e.status = 'Missing ingredients'; return; }
    if (r.fluids) {
      for (const [sp, mol] of Object.entries(r.fluids)) {
        const have = e.fluid![sp] ?? 0;
        if (have < mol) e.fluid![sp] = have + ctx.takeFluid(e.id, sp, mol - have);
      }
      if (Object.entries(r.fluids).some(([sp, mol]) => (e.fluid![sp] ?? 0) < mol - 1e-9)) { e.status = 'Waiting for feed'; return; }
    }
    // A kiln needs no fuel: part of each charge burns to char the rest, which is why so little
    // comes out.
    const run = e.kind === 'charcoal_kiln' ? 1 : e.kind in BURNER ? this.burnFuel(e, BURNER[e.kind], dt, ctx) : ctx.served(e.id);
    if (run <= 0) { e.status = e.kind in BURNER ? 'Out of fuel' : 'No power'; return; }
    e.status = undefined;
    e.active = true;
    const speed = e.kind === 'electric_furnace' ? 2 : e.kind === 'assembler' ? 0.75 : 1;
    e.progress! += speed * run * dt / r.time;
    if (e.progress! < 1) return;
    e.progress = 0;
    for (const [id, n] of Object.entries(r.in)) { e.input!.remove(id, n); ctx.consumed(id, n); }
    for (const sp of Object.keys(r.fluids ?? {})) e.fluid![sp] = 0;
    e.output!.add(r.out, r.count);
    ctx.produced(r.out, r.count);
  }

  /** Burns fuel for whatever the grid is drawing from it. */
  private tickGenerator(e: FEntity, dt: number, ctx: FactoryContext) {
    const out = ctx.generation(e.id);
    const ran = this.burnFuel(e, Math.max(1, out / GENERATOR_EFFICIENCY), dt, ctx);
    e.active = ran > 0 && out > 1;
    // Ready to run while there's fuel burning or waiting.
    e.firing = e.burn! > 0 || !e.fuel!.isEmpty();
    e.status = e.firing ? undefined : 'Out of fuel';
  }

  private tickLab(e: FEntity, dt: number, ctx: FactoryContext) {
    const tech = ctx.research.current ? TECH[ctx.research.current] : null;
    if (!tech) { e.status = 'No research'; return; }
    if (e.progress! <= 0) {
      if (!e.inv!.has(Object.fromEntries(tech.packs.map(p => [p, 1])))) { e.status = 'Missing science packs'; return; }
      for (const p of tech.packs) { e.inv!.remove(p, 1); ctx.consumed(p, 1); }
      e.progress = 1e-6;
    }
    const run = ctx.served(e.id);
    if (run <= 0) { e.status = 'No power'; return; }
    e.status = undefined;
    e.active = true;
    e.progress! += run * dt / tech.time;
    if (e.progress! >= 1) {
      e.progress = 0;
      ctx.researchUnit();
    }
  }

  /** How much of its rated power an electric building wants right now. */
  demand(e: FEntity): number {
    if (e.kind === 'burner_generator') return e.firing ? 1 : 0;
    if (!ELECTRIC.has(e.kind)) return 0;
    if (e.kind === 'laser_turret') return e.firing ? 1 : 0.02;
    return e.active ? 1 : 0.03;
  }

  // ── Saving ───────────────────────────────────────────────────────────────

  save() {
    return {
      entities: [...this.entities.values()].map(e => ({
        ...e, inv: e.inv?.slots, fuel: e.fuel?.slots, input: e.input?.slots, output: e.output?.slots,
      })),
      mined: [...this.mined],
    };
  }

  load(data: ReturnType<Factory['save']> | undefined) {
    this.entities.clear();
    this.mined = new Map(data?.mined ?? []);
    for (const d of data?.entities ?? []) {
      const e: FEntity = {
        ...d,
        inv: d.inv ? new Inventory(d.inv.length, d.inv) : undefined,
        fuel: d.fuel ? new Inventory(d.fuel.length, d.fuel) : undefined,
        input: d.input ? new Inventory(d.input.length, d.input) : undefined,
        output: d.output ? new Inventory(d.output.length, d.output) : undefined,
      };
      this.entities.set(e.id, e);
    }
  }
}

/** The charring recipe for what's put in a charcoal kiln, if it's unlocked. */
export function kilnRecipe(item: string, ctx: FactoryContext): Recipe | undefined {
  return Object.values(RECIPES).find(r => r.station === 'kiln' && item in r.in && ctx.unlocked(r.id));
}

/** The smelting recipe for an input item, if it's unlocked. */
export function smeltRecipe(item: string, ctx: FactoryContext): Recipe | undefined {
  return Object.values(RECIPES).find(r => r.station === 'smelt' && item in r.in && ctx.unlocked(r.id));
}

export const isBurner = (kind: string) => kind in BURNER;
/** Docks are named A, B, … Z, then AA, AB, … */
const dockName = (k: number): string => `Dock ${k >= 26 ? String.fromCharCode(64 + Math.floor(k / 26)) : ''}${String.fromCharCode(65 + k % 26)}`;
export const isElectricMachine = (kind: string) => ELECTRIC.has(kind) || kind === 'burner_generator';
