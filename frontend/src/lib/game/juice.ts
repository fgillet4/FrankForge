/**
 * The small things that make the world feel solid: chips flying off a tree being chopped, dust
 * kicked up underfoot, brass casings bouncing from the gun, goo when an alien bursts, items
 * arcing into the engineer's pockets, buildings landing with a bounce, and a jolt of the camera
 * for anything heavy. All of it is cosmetic and lives in tile space, so it pans and zooms with
 * the world.
 */

import Phaser from 'phaser';
import { isoToScreen } from '../phaser/isoMath';

interface Particle {
  x: number; y: number;
  /** Height above the ground [px at zoom 1] and its speed. */
  z: number; vz: number;
  /** Ground speed [tiles/s]. */
  vx: number; vy: number;
  life: number; max: number;
  colour: number; size: number;
  /** Falls and bounces (chips, casings) or drifts up and fades (dust, smoke). */
  heavy: boolean;
}

interface Flyer { item: string; x: number; y: number; z: number; t: number; img: Phaser.GameObjects.Image | null }

export interface View { x: number; y: number; zoom: number }

const GRAVITY = 520;

/** When each recently placed building landed [ms]. */
const pops = new Map<number, number>();

/** A building just placed lands with a little bounce. */
export function pop(id: number, time: number) {
  pops.set(id, time);
}

/** Scale factor for a building's sprite: 1 once it has settled. */
export function popScale(id: number, time: number): number {
  const t0 = pops.get(id);
  if (t0 === undefined) return 1;
  const t = (time - t0) / 1000;
  if (t > 0.45) { pops.delete(id); return 1; }
  // Squashed flat for an instant, overshoots, then settles.
  return 1 + 0.16 * Math.exp(-t * 9) * Math.cos(t * 26) - 0.16 * Math.exp(-t * 60);
}

export class Juice {
  private parts: Particle[] = [];
  private flyers: Flyer[] = [];
  private gfx: Phaser.GameObjects.Graphics;
  private shakeAmp = 0;
  /** The camera's offset this frame [px]. */
  shake = { x: 0, y: 0 };

  constructor(private scene: Phaser.Scene) {
    this.gfx = scene.add.graphics().setDepth(950);
  }

  destroy() {
    this.gfx.destroy();
    this.flyers.forEach(f => f.img?.destroy());
  }

  /** A spray of particles from a point. */
  burst(x: number, y: number, n: number, o: { colour: number | number[]; size?: number; speed?: number; up?: number; z?: number; life?: number; heavy?: boolean; dir?: [number, number] }) {
    const colours = Array.isArray(o.colour) ? o.colour : [o.colour];
    for (let k = 0; k < n && this.parts.length < 600; k++) {
      const a = Math.random() * Math.PI * 2;
      const s = (o.speed ?? 1.5) * (0.4 + Math.random() * 0.8);
      const [dx, dy] = o.dir ?? [0, 0];
      const life = (o.life ?? 0.6) * (0.7 + Math.random() * 0.6);
      this.parts.push({
        x, y, z: o.z ?? 4, vz: (o.up ?? 120) * (0.5 + Math.random()),
        vx: Math.cos(a) * s + dx, vy: Math.sin(a) * s + dy,
        life, max: life, colour: colours[k % colours.length], size: (o.size ?? 2.5) * (0.7 + Math.random() * 0.6),
        heavy: o.heavy ?? true,
      });
    }
  }

  /** A soft puff of dust, e.g. underfoot. */
  dust(x: number, y: number, colour = 0x9a8a70, n = 3) {
    this.burst(x, y, n, { colour, size: 5, speed: 0.35, up: 25, z: 1, life: 0.7, heavy: false });
  }

  /** An item arcs from somewhere into the engineer's pockets. */
  fly(item: string, x: number, y: number, z = 20) {
    if (this.flyers.length < 40) this.flyers.push({ item, x, y, z, t: 0, img: null });
  }

  /** Jolts the camera; strength in pixels. */
  kick(strength: number) {
    this.shakeAmp = Math.min(18, Math.max(this.shakeAmp, strength));
  }

  update(dt: number, player: { x: number; y: number }) {
    for (const p of this.parts) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.heavy) {
        p.vz -= GRAVITY * dt;
        p.z += p.vz * dt;
        // Bounce once or twice, losing most of the energy, then skid to a stop.
        if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.35; p.vx *= 0.5; p.vy *= 0.5; }
      } else {
        p.z += p.vz * dt;
        p.vx *= 1 - 2 * dt; p.vy *= 1 - 2 * dt;
      }
    }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const f of this.flyers) {
      // Speeds up as it goes, homing on the engineer, who may be walking.
      f.t += dt * (1.6 + f.t * 3);
      const k = Math.min(1, dt * (4 + f.t * 14));
      f.x += (player.x - f.x) * k;
      f.y += (player.y - f.y) * k;
    }
    this.flyers = this.flyers.filter(f => {
      if (f.t < 1) return true;
      f.img?.destroy();
      return false;
    });
    this.shakeAmp *= Math.pow(0.002, dt);
    if (this.shakeAmp < 0.3) this.shakeAmp = 0;
    this.shake = { x: (Math.random() - 0.5) * 2 * this.shakeAmp, y: (Math.random() - 0.5) * 2 * this.shakeAmp };
  }

  draw(v: View) {
    const g = this.gfx.clear();
    for (const p of this.parts) {
      const s = isoToScreen(p.x, p.y, v.x, v.y, v.zoom);
      const a = Math.min(1, p.life / p.max * (p.heavy ? 3 : 1.2));
      const r = p.size * v.zoom * (p.heavy ? 1 : 1 + (1 - p.life / p.max) * 1.5);
      g.fillStyle(p.colour, a * (p.heavy ? 1 : 0.45)).fillCircle(s.x, s.y - p.z * v.zoom, r);
    }
    for (const f of this.flyers) {
      if (!f.img) {
        if (!this.scene.textures.exists(`ic_${f.item}`)) { f.t = 1; continue; }
        f.img = this.scene.add.image(0, 0, `ic_${f.item}`).setDepth(996);
      }
      const s = isoToScreen(f.x, f.y, v.x, v.y, v.zoom);
      // Up in an arc, shrinking into the pocket at the end.
      const lift = (f.z + Math.sin(Math.min(1, f.t) * Math.PI) * 40) * v.zoom;
      f.img.setPosition(s.x, s.y - lift).setScale(v.zoom * 0.42 * (1 - Math.max(0, f.t - 0.75) * 2.4));
    }
  }
}
