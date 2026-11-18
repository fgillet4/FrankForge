/**
 * Pollution on the ground, as in Factorio: the map is cut into 8×8-tile chunks, each holding how
 * much smoke and gas hangs over it. Buildings put theirs into the chunk they stand in. Every
 * second a little of each chunk drifts to its four neighbours and the ground soaks some up:
 * forests most, grass and water less, sand, rock and snow hardly at all. Alien nests breathe in
 * what reaches them, and what they take in builds up their next attack.
 *
 * Amounts are kg-equivalent: a kilogram of gas vented to the sky, or the smoke of burning fuel
 * (see FUEL_SMOKE).
 */

import { TerrainType, type PlanetMap } from '../types';

export const CHUNK = 8;
/** Share of a chunk's pollution that drifts to each neighbour per second. */
const SPREAD = 0.02;
/** Chunks thinner than this don't spread any further [kg]. */
const THRESHOLD = 0.3;

/** What each tile of ground soaks up [kg/s]. */
const ABSORB: Partial<Record<TerrainType, number>> = {
  [TerrainType.FOREST]: 6e-4, [TerrainType.ALIEN_FOREST]: 5e-4, [TerrainType.GRASS]: 1.5e-4, [TerrainType.ALIEN_GRASS]: 2e-4,
  [TerrainType.SHALLOW_WATER]: 1e-4, [TerrainType.DEEP_WATER]: 1e-4, [TerrainType.HILLS]: 8e-5,
};
const ABSORB_OTHER = 3e-5;

/**
 * Smoke per joule of fuel burnt [kg/J]: coal is the dirtiest, wood next; charcoal and solid fuel
 * burn clean, their volatiles already driven off.
 */
export const FUEL_SMOKE: Record<string, number> = { wood: 3.3e-7, coal: 4e-7, charcoal: 2e-7, solid_fuel: 1.5e-7 };

export class Pollution {
  readonly w: number;
  readonly h: number;
  level: Float32Array;
  private absorb: Float32Array;
  private clock = 0;
  /** Everything emitted so far [kg]. */
  total = 0;

  constructor(map: PlanetMap) {
    this.w = Math.ceil(map.width / CHUNK);
    this.h = Math.ceil(map.height / CHUNK);
    this.level = new Float32Array(this.w * this.h);
    this.absorb = new Float32Array(this.w * this.h);
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        this.absorb[this.index(x, y)] += ABSORB[map.tiles[y][x].terrain] ?? ABSORB_OTHER;
      }
    }
  }

  private index(x: number, y: number) {
    const cx = Math.min(this.w - 1, Math.max(0, Math.floor(x / CHUNK)));
    const cy = Math.min(this.h - 1, Math.max(0, Math.floor(y / CHUNK)));
    return cy * this.w + cx;
  }

  emit(x: number, y: number, kg: number) {
    if (!(kg > 0)) return;
    this.level[this.index(x, y)] += kg;
    this.total += kg;
  }

  /** Pollution over the chunk holding a tile [kg]. */
  at(x: number, y: number) {
    return this.level[this.index(x, y)];
  }

  /** Takes up to `kg` from the chunk over a tile, returning how much there was to take. */
  take(x: number, y: number, kg: number) {
    const i = this.index(x, y);
    const k = Math.min(kg, this.level[i]);
    this.level[i] -= k;
    return k;
  }

  /** Spreads and soaks up, once a second of game time. */
  step(dt: number) {
    this.clock += dt;
    while (this.clock >= 1) {
      this.clock -= 1;
      const next = this.level.slice();
      for (let cy = 0; cy < this.h; cy++) {
        for (let cx = 0; cx < this.w; cx++) {
          const i = cy * this.w + cx;
          const l = this.level[i];
          if (l < THRESHOLD) continue;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
            next[i] -= l * SPREAD;
            next[ny * this.w + nx] += l * SPREAD;
          }
        }
      }
      for (let i = 0; i < next.length; i++) next[i] = Math.max(0, next[i] - this.absorb[i]);
      this.level = next;
    }
  }

  save() {
    return { level: Array.from(this.level, v => Math.round(v * 100) / 100), total: this.total };
  }

  load(d: { level?: number[]; total?: number } | undefined) {
    if (d?.level?.length === this.level.length) this.level = Float32Array.from(d.level);
    this.total = d?.total ?? 0;
  }
}
