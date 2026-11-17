/**
 * The engineer's side of the game: pockets and gear, hand crafting, research, and the
 * production statistics.
 */

import { Inventory, type Stack } from './inventory';
import { ITEMS, RECIPES, STARTING_RECIPES, TECH, TECHS, type Recipe } from './items';

export const BASE_SLOTS = 60;
export const BASE_REACH = 10;
export const MAX_HEALTH = 250;

export interface CraftJob { recipe: string; progress: number }

/** Per-second history for the production graphs: ten minutes at one-second resolution. */
const HISTORY = 600;

export class Series {
  data = new Float64Array(HISTORY);
  /** Index of the current (still filling) second. */
  head = 0;
  add(v: number) { this.data[this.head] += v; }
  /** The last `n` complete seconds, oldest first. */
  last(n: number): number[] {
    const out: number[] = [];
    for (let k = n; k >= 1; k--) out.push(this.data[(this.head - k + HISTORY * 2) % HISTORY]);
    return out;
  }
  roll() {
    this.head = (this.head + 1) % HISTORY;
    this.data[this.head] = 0;
  }
}

export class Stats {
  produced = new Map<string, Series>();
  consumed = new Map<string, Series>();
  /** Watts averaged over each second, and kg vented. */
  generation = new Series();
  load = new Series();
  emissions = new Series();
  private acc = 0;
  private samples = 0;

  private series(m: Map<string, Series>, item: string) {
    let s = m.get(item);
    if (!s) m.set(item, s = new Series());
    return s;
  }
  produce(item: string, n: number) { this.series(this.produced, item).add(n); }
  consume(item: string, n: number) { this.series(this.consumed, item).add(n); }

  /** Feeds a power sample; rolls the history over each second. */
  tick(dt: number, genW: number, loadW: number) {
    this.generation.data[this.generation.head] += genW;
    this.load.data[this.load.head] += loadW;
    this.samples++;
    this.acc += dt;
    if (this.acc < 1) return;
    this.acc -= 1;
    this.generation.data[this.generation.head] /= this.samples;
    this.load.data[this.load.head] /= this.samples;
    this.samples = 0;
    for (const s of [...this.produced.values(), ...this.consumed.values(), this.generation, this.load, this.emissions]) s.roll();
  }
}

export class Engineer {
  inv = new Inventory(BASE_SLOTS);
  armor: string | null = null;
  weapon: string | null = 'pistol';
  ammo: Stack | null = { item: 'ammo', count: 10 };
  health = MAX_HEALTH;
  queue: CraftJob[] = [];
  research = { current: null as string | null, units: 0, done: new Set<string>() };
  /** Index of the survival goal being worked on. */
  goal = 0;
  stats = new Stats();
  /** Rounds left in the loaded magazine, and what kind. */
  rounds = 0;
  loaded = 'ammo';
  cooldown = 0;

  constructor(public sandbox = false) {
    if (sandbox) for (const t of TECHS) this.research.done.add(t.id);
  }

  /** A new game's starting kit. */
  startingKit() {
    this.inv.add('iron_plate', 8);
    this.inv.add('wood', 10);
    this.inv.add('burner_drill', 1);
    this.inv.add('stone_furnace', 1);
  }

  get unlocked(): Set<string> {
    const s = new Set(STARTING_RECIPES);
    for (const id of this.research.done) for (const r of TECH[id]?.unlocks ?? []) s.add(r);
    return s;
  }

  private bonus(key: 'damage' | 'inventory' | 'reach'): number {
    let n = 0;
    for (const id of this.research.done) n += TECH[id]?.effects?.[key] ?? 0;
    return n;
  }
  get damageBonus() { return this.bonus('damage'); }
  get reach() { return BASE_REACH + this.bonus('reach'); }
  get armorFactor() { return this.armor === 'armor_heavy' ? 0.5 : this.armor === 'armor_light' ? 0.7 : 1; }

  /** Grows the pockets when research adds slots. */
  applyResearch() {
    this.inv.resize(BASE_SLOTS + this.bonus('inventory'));
  }

  /** Whether a building can be placed: owned, or free in sandbox. */
  has(item: string) {
    return this.sandbox || this.inv.count(item) > 0;
  }

  // ── Hand crafting ────────────────────────────────────────────────────────

  /**
   * The crafts needed to make `times` of a recipe from what's in the pockets, crafting missing
   * intermediates first (as Factorio does). Null if the raw materials aren't there.
   */
  plan(recipeId: string, times = 1): string[] | null {
    const counts = this.inv.totals();
    const steps: string[] = [];
    const unlocked = this.unlocked;
    const need = (item: string, n: number, depth: number): boolean => {
      const have = counts.get(item) ?? 0;
      if (have >= n) { counts.set(item, have - n); return true; }
      counts.set(item, 0);
      const short = n - have;
      const r = Object.values(RECIPES).find(x => x.out === item && x.station === 'hand' && unlocked.has(x.id));
      if (!r || depth > 6) return false;
      const batches = Math.ceil(short / r.count);
      for (let k = 0; k < batches; k++) {
        for (const [id, m] of Object.entries(r.in)) if (!need(id, m, depth + 1)) return false;
        steps.push(r.id);
      }
      // Leftovers from the last batch stay in the pockets.
      counts.set(item, (counts.get(item) ?? 0) + batches * r.count - short);
      return true;
    };
    const r = RECIPES[recipeId];
    if (!r || r.station !== 'hand' || !unlocked.has(recipeId)) return null;
    for (let k = 0; k < times; k++) {
      for (const [id, m] of Object.entries(r.in)) if (!need(id, m, 0)) return null;
      steps.push(recipeId);
    }
    return steps;
  }

  /** How many of a recipe could be hand-crafted now (up to 99). */
  craftable(recipeId: string): number {
    let lo = 0;
    for (let n = 1; n <= 99; n *= 2) {
      if (!this.plan(recipeId, n)) break;
      lo = n;
    }
    for (let n = lo + 1; n < Math.min(99, lo * 2 + 1); n++) {
      if (!this.plan(recipeId, n)) break;
      lo = n;
    }
    return lo;
  }

  /** Queues crafts; ingredients come out of the pockets as each one starts. */
  craft(recipeId: string, times = 1): boolean {
    const steps = this.plan(recipeId, times);
    if (!steps) return false;
    for (const s of steps) this.queue.push({ recipe: s, progress: 0 });
    return true;
  }

  /** Cancels a queued craft, refunding it if it had started. */
  cancel(index: number) {
    const job = this.queue[index];
    if (!job) return;
    if (job.progress > 0) for (const [id, n] of Object.entries(RECIPES[job.recipe].in)) this.inv.add(id, n);
    this.queue.splice(index, 1);
  }

  tickCrafting(dt: number) {
    const job = this.queue[0];
    if (!job) return;
    const r: Recipe = RECIPES[job.recipe];
    if (job.progress === 0) {
      if (!this.inv.has(r.in)) { this.queue.shift(); return; }
      for (const [id, n] of Object.entries(r.in)) { this.inv.remove(id, n); this.stats.consume(id, n); }
      job.progress = 1e-6;
    }
    job.progress += dt / r.time;
    if (job.progress >= 1) {
      this.queue.shift();
      this.inv.add(r.out, r.count);
      this.stats.produce(r.out, r.count);
    }
  }

  // ── Research ─────────────────────────────────────────────────────────────

  available(techId: string): boolean {
    const t = TECH[techId];
    return !!t && !this.research.done.has(techId) && t.prereqs.every(p => this.research.done.has(p));
  }

  /** One unit researched in a lab; returns the tech if that finished it. */
  researchUnit(): string | null {
    const id = this.research.current;
    if (!id) return null;
    this.research.units++;
    if (this.research.units < TECH[id].units) return null;
    this.research.done.add(id);
    this.research.current = null;
    this.research.units = 0;
    this.applyResearch();
    return id;
  }

  // ── Gear ─────────────────────────────────────────────────────────────────

  /** Puts an item from the pockets into its gear slot, swapping out what was there. */
  equip(item: string) {
    const g = ITEMS[item]?.gear;
    if (!g || !this.inv.count(item)) return;
    if (g === 'ammo') {
      const n = this.inv.remove(item, ITEMS[item].stack);
      if (this.ammo) this.inv.add(this.ammo.item, this.ammo.count);
      this.ammo = { item, count: n };
      this.rounds = 0;
      return;
    }
    this.inv.remove(item, 1);
    const old = g === 'armor' ? this.armor : this.weapon;
    if (old) this.inv.add(old, 1);
    if (g === 'armor') this.armor = item; else this.weapon = item;
  }

  unequip(slot: 'armor' | 'weapon' | 'ammo') {
    if (slot === 'ammo' && this.ammo) { this.inv.add(this.ammo.item, this.ammo.count); this.ammo = null; this.rounds = 0; }
    if (slot === 'armor' && this.armor) { this.inv.add(this.armor, 1); this.armor = null; }
    if (slot === 'weapon' && this.weapon) { this.inv.add(this.weapon, 1); this.weapon = null; }
  }

  /** Spends a round; loads a new magazine from the ammo slot, then the pockets. Null when out. */
  takeRound(): string | null {
    if (this.rounds <= 0) {
      if (!this.ammo || this.ammo.count <= 0) {
        const spare = this.inv.first(i => ITEMS[i]?.gear === 'ammo');
        if (!spare) return null;
        this.ammo = { item: spare, count: this.inv.remove(spare, ITEMS[spare].stack) };
      }
      this.loaded = this.ammo.item;
      this.ammo.count--;
      this.stats.consume(this.loaded, 1);
      if (this.ammo.count <= 0) this.ammo = null;
      this.rounds = 10;
    }
    this.rounds--;
    return this.loaded;
  }

  save() {
    return {
      inv: this.inv.slots, armor: this.armor, weapon: this.weapon, ammo: this.ammo, health: this.health,
      queue: this.queue, research: { current: this.research.current, units: this.research.units, done: [...this.research.done] },
      rounds: this.rounds, loaded: this.loaded, goal: this.goal,
    };
  }

  load(d: ReturnType<Engineer['save']>) {
    this.inv = new Inventory(d.inv.length, d.inv);
    this.armor = d.armor;
    this.weapon = d.weapon;
    this.ammo = d.ammo;
    this.health = d.health ?? MAX_HEALTH;
    this.queue = d.queue ?? [];
    this.research = { current: d.research.current, units: d.research.units, done: new Set(d.research.done) };
    this.rounds = d.rounds ?? 0;
    this.loaded = d.loaded ?? 'ammo';
    this.goal = d.goal ?? 0;
    if (this.sandbox) for (const t of TECHS) this.research.done.add(t.id);
    this.applyResearch();
  }
}
