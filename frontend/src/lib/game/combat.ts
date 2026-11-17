/**
 * Aliens, their nests, and everything that shoots them.
 *
 * Nests sit away from the landing site and send attack groups whose size and frequency grow
 * with pollution: gas vented to the sky and smoke from burners. Groups go for the nearest
 * buildings or the engineer, and chew through whatever is in their way. Nearby aliens defend
 * their nest from anyone who comes close.
 */

import seedrandom from 'seedrandom';
import type { PlanetMap } from '../types';
import type { FEntity } from './factory';

export interface Alien {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  /** What it's going for: a building id, or the engineer. */
  target: number | 'player' | null;
  nest: number;
  /** When it was last hit [ms], for the flash. */
  hitAt?: number;
  /** Moved since the last frame, for the walk animation. */
  vx: number;
  vy: number;
  attacking: boolean;
}

export interface Nest { id: number; x: number; y: number; hp: number; maxHp: number; spawnTimer: number }

export interface Shot { x0: number; y0: number; x1: number; y1: number; until: number; laser: boolean }

/** What combat needs from the world. */
export interface Arena {
  map: PlanetMap;
  player: { x: number; y: number };
  /** Buildings by id, with footprint and health. */
  buildings(): { id: number; x: number; y: number; size: number }[];
  entityAt(x: number, y: number): number;
  damageBuilding(id: number, dmg: number): void;
  damagePlayer(dmg: number): void;
  /** Pollution so far [kg-equivalent], drives attacks. */
  pollution: number;
  peaceful: boolean;
}

export const WEAPONS: Record<string, { range: number; rate: number }> = {
  pistol: { range: 12, rate: 4 },
  smg: { range: 14, rate: 10 },
};
export const AMMO_DAMAGE: Record<string, number> = { ammo: 5, ammo_piercing: 8 };
const ROUNDS_PER_MAGAZINE = 10;

/** Something to hear: a shot, a hit, a death, where it happened. */
export interface CombatSound { kind: 'gunshot' | 'laser' | 'alien_hit' | 'alien_die'; x: number; y: number }

export class Combat {
  aliens: Alien[] = [];
  sounds: CombatSound[] = [];
  nests: Nest[] = [];
  shots: Shot[] = [];
  /** Corpses and bursts to draw: position and when they fade. */
  splats: { x: number; y: number; until: number }[] = [];
  private nextId = 1;
  private attackTimer = 240;
  /** Evolution 0..1: tougher aliens over time and with pollution. */
  evolution = 0;
  kills = 0;

  /** Scatters nests across the map, away from the landing site. */
  placeNests(map: PlanetMap, seed: number, spawn: { x: number; y: number }) {
    const rng = seedrandom(`${seed}:nests`);
    const count = Math.round(map.width * map.height / 1600);
    for (let k = 0, tries = 0; k < count && tries < 2000; tries++) {
      const x = Math.floor(rng() * (map.width - 4)) + 1;
      const y = Math.floor(rng() * (map.height - 4)) + 1;
      if (Math.hypot(x - spawn.x, y - spawn.y) < Math.min(40, map.width * 0.3)) continue;
      if (!this.clear(map, x, y, 3) || this.nests.some(n => Math.hypot(n.x - x, n.y - y) < 12)) continue;
      this.nests.push({ id: this.nextId++, x, y, hp: 600, maxHp: 600, spawnTimer: 0 });
      k++;
    }
  }

  private clear(map: PlanetMap, x: number, y: number, n: number) {
    for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) if (!map.tiles[y + dy]?.[x + dx]?.traversable) return false;
    return true;
  }

  nestAt(x: number, y: number): Nest | undefined {
    return this.nests.find(n => x >= n.x && x < n.x + 3 && y >= n.y && y < n.y + 3);
  }

  private spawn(n: Nest, target: Alien['target']) {
    const big = Math.random() < this.evolution * 0.6;
    const hp = big ? 75 : 15 + 30 * this.evolution;
    this.aliens.push({
      id: this.nextId++, x: n.x + 1.5 + Math.random() - 0.5, y: n.y + 3.2, hp, maxHp: hp,
      speed: (big ? 2.2 : 2.6) + Math.random() * 0.4, damage: big ? 15 : 7, target, nest: n.id, vx: 0, vy: 0, attacking: false,
    });
  }

  update(dt: number, a: Arena, time: number) {
    this.shots = this.shots.filter(s => s.until > time);
    this.splats = this.splats.filter(s => s.until > time);
    if (a.peaceful) return;
    this.evolution = Math.min(1, this.evolution + dt * (1 / 7200 + a.pollution * 1e-9));

    // Attack waves start once pollution reaches the nests, then come sooner and bigger as it builds.
    const buildings = a.buildings();
    if (a.pollution > 40) this.attackTimer -= dt * (1 + Math.min(4, a.pollution / 2000));
    if (this.attackTimer <= 0 && this.nests.length && buildings.length) {
      this.attackTimer = 300 - 120 * this.evolution;
      const nest = this.nests.reduce((best, n) => {
        const d = (m: Nest) => Math.min(...buildings.map(b => Math.hypot(b.x - m.x, b.y - m.y)));
        return d(n) < d(best) ? n : best;
      });
      const size = 3 + Math.round(this.evolution * 12 + Math.min(10, a.pollution / 3000));
      for (let k = 0; k < size && this.aliens.length < 120; k++) this.spawn(nest, null);
    }
    // Nests defend themselves.
    for (const n of this.nests) {
      n.spawnTimer -= dt;
      const near = Math.hypot(a.player.x - n.x - 1.5, a.player.y - n.y - 1.5) < 14;
      if (near && n.spawnTimer <= 0 && this.aliens.filter(x => x.nest === n.id).length < 6) {
        n.spawnTimer = 4;
        this.spawn(n, 'player');
      }
    }

    for (const al of this.aliens) this.moveAlien(al, dt, a, buildings);
    for (const al of this.aliens) {
      if (al.hp <= 0) {
        this.splats.push({ x: al.x, y: al.y, until: time + 20000 });
        this.sounds.push({ kind: 'alien_die', x: al.x, y: al.y });
        this.kills++;
      }
    }
    this.aliens = this.aliens.filter(x => x.hp > 0);
  }

  private moveAlien(al: Alien, dt: number, a: Arena, buildings: ReturnType<Arena['buildings']>) {
    // Pick a target: the engineer if close, else the nearest building.
    const dp = Math.hypot(a.player.x - al.x, a.player.y - al.y);
    if (dp < 10) al.target = 'player';
    if (al.target === null || (typeof al.target === 'number' && !buildings.some(b => b.id === al.target))) {
      let best = Infinity;
      al.target = dp < 30 ? 'player' : null;
      for (const b of buildings) {
        const d = Math.hypot(b.x - al.x, b.y - al.y);
        if (d < best) { best = d; al.target = b.id; }
      }
    }
    let tx: number, ty: number;
    if (al.target === 'player') { tx = a.player.x; ty = a.player.y; }
    else {
      const b = buildings.find(x => x.id === al.target);
      if (!b) { al.vx = al.vy = 0; return; }
      tx = Math.min(Math.max(al.x, b.x), b.x + b.size);
      ty = Math.min(Math.max(al.y, b.y), b.y + b.size);
    }
    const dx = tx - al.x;
    const dy = ty - al.y;
    const d = Math.hypot(dx, dy);
    al.attacking = false;
    if (d < 0.9) {
      al.attacking = true;
      al.vx = dx; al.vy = dy;
      if (al.target === 'player') a.damagePlayer(al.damage * dt);
      else a.damageBuilding(al.target as number, al.damage * dt);
      return;
    }
    const step = Math.min(d, al.speed * dt);
    let nx = al.x + dx / d * step;
    let ny = al.y + dy / d * step;
    // Blocked by a building: chew through it. Blocked by water or cliffs: slide along.
    const id = a.entityAt(Math.floor(nx), Math.floor(ny));
    if (id >= 0) {
      al.attacking = true;
      al.vx = dx; al.vy = dy;
      a.damageBuilding(id, al.damage * dt);
      return;
    }
    const ok = (x: number, y: number) => a.map.tiles[Math.floor(y)]?.[Math.floor(x)]?.traversable;
    if (!ok(nx, ny)) {
      if (ok(nx, al.y)) ny = al.y;
      else if (ok(al.x, ny)) nx = al.x;
      else {
        // Turn aside.
        nx = al.x - dy / d * step;
        ny = al.y + dx / d * step;
        if (!ok(nx, ny)) return;
      }
    }
    al.vx = nx - al.x; al.vy = ny - al.y;
    al.x = nx; al.y = ny;
  }

  /** The alien or nest nearest a point within range of a shooter. */
  targetNear(fromX: number, fromY: number, range: number, nearX = fromX, nearY = fromY): Alien | Nest | null {
    let best: Alien | Nest | null = null;
    let bestD = Infinity;
    for (const al of this.aliens) {
      if (Math.hypot(al.x - fromX, al.y - fromY) > range) continue;
      const d = Math.hypot(al.x - nearX, al.y - nearY);
      if (d < bestD) { bestD = d; best = al; }
    }
    if (best) return best;
    for (const n of this.nests) {
      const cx = n.x + 1.5, cy = n.y + 1.5;
      if (Math.hypot(cx - fromX, cy - fromY) > range + 1.5) continue;
      const d = Math.hypot(cx - nearX, cy - nearY);
      if (d < bestD) { bestD = d; best = n; }
    }
    return best;
  }

  /** Damages a target and draws the shot; returns true if it killed it. */
  hit(target: Alien | Nest, dmg: number, x0: number, y0: number, time: number, laser = false): boolean {
    const isNest = 'spawnTimer' in target;
    const tx = isNest ? target.x + 1.5 : target.x;
    const ty = isNest ? target.y + 1.5 : target.y;
    this.shots.push({ x0, y0, x1: tx + (Math.random() - 0.5) * 0.3, y1: ty + (Math.random() - 0.5) * 0.3, until: time + (laser ? 120 : 60), laser });
    this.sounds.push({ kind: laser ? 'laser' : 'gunshot', x: x0, y: y0 }, { kind: 'alien_hit', x: tx, y: ty });
    target.hp -= dmg;
    if (!isNest) {
      // Knocked back a little, away from the shot.
      target.hitAt = time;
      const d = Math.hypot(tx - x0, ty - y0) || 1;
      target.x += (tx - x0) / d * 0.08;
      target.y += (ty - y0) / d * 0.08;
    }
    if (isNest && target.hp <= 0) {
      this.nests = this.nests.filter(n => n !== target);
      this.splats.push({ x: tx, y: ty, until: time + 60000 });
      return true;
    }
    return target.hp <= 0;
  }

  /** Runs turrets: gun turrets spend magazines, laser turrets grid power. */
  turrets(turrets: FEntity[], dt: number, time: number, served: (id: number) => number, damageBonus: number, consumed: (item: string, n: number) => void) {
    for (const t of turrets) {
      t.firing = false;
      t.cooldown = Math.max(0, (t.cooldown ?? 0) - dt);
      const cx = t.x + 1, cy = t.y + 1;
      const laser = t.kind === 'laser_turret';
      const target = this.targetNear(cx, cy, laser ? 24 : 18);
      if (!target) { t.status = undefined; continue; }
      const tx = 'spawnTimer' in target ? target.x + 1.5 : target.x;
      const ty = 'spawnTimer' in target ? target.y + 1.5 : target.y;
      t.aim = Math.atan2(ty - cy, tx - cx);
      t.firing = true;
      if (laser) {
        const p = served(t.id);
        if (p < 0.2) { t.status = 'No power'; continue; }
        t.status = undefined;
        if (t.cooldown! > 0) continue;
        t.cooldown = 0.75 / p;
        this.hit(target, 20 * (1 + damageBonus), cx, cy - 0.4, time, true);
      } else {
        if (!t.rounds) {
          const mag = t.inv!.first();
          if (!mag) { t.status = 'Out of ammo'; t.firing = false; continue; }
          t.inv!.remove(mag, 1);
          consumed(mag, 1);
          t.rounds = ROUNDS_PER_MAGAZINE;
          (t as FEntity & { ammoType?: string }).ammoType = mag;
        }
        t.status = undefined;
        if (t.cooldown! > 0) continue;
        t.cooldown = 0.1;
        t.rounds!--;
        const kind = (t as FEntity & { ammoType?: string }).ammoType ?? 'ammo';
        this.hit(target, (AMMO_DAMAGE[kind] ?? 5) * (1 + damageBonus), cx, cy - 0.4, time);
      }
    }
  }

  save() {
    return { aliens: this.aliens, nests: this.nests, evolution: this.evolution, attackTimer: this.attackTimer, nextId: this.nextId, kills: this.kills };
  }

  load(d: ReturnType<Combat['save']>) {
    this.aliens = d.aliens ?? [];
    this.nests = d.nests ?? [];
    this.evolution = d.evolution ?? 0;
    this.attackTimer = d.attackTimer ?? 240;
    this.nextId = d.nextId ?? 1;
    this.kills = d.kills ?? 0;
  }
}

export { ROUNDS_PER_MAGAZINE };
