/**
 * Draws the survival layer in the isometric world: belts and what's on them, inserter arms,
 * chests, burner machines and turrets, trees and rocks, nests, gunfire, power wires and
 * supply areas.
 */

import Phaser from 'phaser';
import { TILE_H, TILE_W, isoToScreen, screenToIso } from '../phaser/isoMath';
import { PROTO, type Snapshot } from '../process/engine';
import { ANIMS, drawInserterFlow, hitsSprite, type Pick } from '../process/render';
import { BELT_SPEED, DIRS, type FEntity, type Factory } from './factory';
import type { Combat } from './combat';
import { RECIPES } from './items';
import type { NatureObject } from './nature';

const SPRITE_TILE_PX = 128;

export interface View { x: number; y: number; zoom: number; w: number; h: number }

/** The tile rectangle covering the screen, padded. */
export function visibleTiles(v: View, pad = 3) {
  const c = [screenToIso(0, 0, v.x, v.y, v.zoom), screenToIso(v.w, 0, v.x, v.y, v.zoom), screenToIso(0, v.h, v.x, v.y, v.zoom), screenToIso(v.w, v.h, v.x, v.y, v.zoom)];
  return {
    x0: Math.floor(Math.min(...c.map(p => p.x))) - pad, x1: Math.ceil(Math.max(...c.map(p => p.x))) + pad,
    y0: Math.floor(Math.min(...c.map(p => p.y))) - pad, y1: Math.ceil(Math.max(...c.map(p => p.y))) + pad,
  };
}

/** Keeps one game object per key alive while it's drawn, destroying the rest. */
class Pool<T extends Phaser.GameObjects.GameObject> {
  private live = new Map<string, T>();
  private seen = new Set<string>();
  constructor(private make: () => T) {}
  get(key: string): T {
    this.seen.add(key);
    let o = this.live.get(key);
    if (!o) this.live.set(key, o = this.make());
    return o;
  }
  sweep() {
    for (const [k, o] of this.live) if (!this.seen.has(k)) { o.destroy(); this.live.delete(k); }
    this.seen.clear();
  }
  destroy() { this.live.forEach(o => o.destroy()); this.live.clear(); }
  entries() { return this.live.entries(); }
}

/** Buildings the process layer doesn't draw (they're not in the engine's snapshot). */
const SPRITED = new Set(['wooden_chest', 'iron_chest', 'burner_drill', 'stone_furnace', 'gun_turret']);
/** Problems worth a badge over the building, Factorio-style: colour and the item to show. */
const ALERTS: Record<string, [number, (e: FEntity) => string | null]> = {
  'Out of fuel': [0xff5a4f, () => 'wood'],
  'No ore left': [0xff5a4f, () => 'iron_ore'],
  'Output full': [0xffc23a, e => e.output?.first() ?? null],
  'Output blocked': [0xffc23a, e => e.held ?? null],
  'Missing science packs': [0xffc23a, () => 'science_red'],
  'No recipe set': [0xffc23a, () => 'iron_gear'],
};
const BURNING = new Set(['stone_furnace', 'burner_drill', 'electric_furnace', 'burner_generator']);

export class WorldRenderer {
  private ground: Phaser.GameObjects.Graphics;
  private belts: Phaser.GameObjects.Graphics;
  private arms: Pool<Phaser.GameObjects.Graphics>;
  private overlay: Phaser.GameObjects.Graphics;
  private power: Phaser.GameObjects.Graphics;
  private items: Pool<Phaser.GameObjects.Image>;
  private sprites: Pool<Phaser.GameObjects.Sprite>;
  private nature: Pool<Phaser.GameObjects.Image>;

  constructor(private scene: Phaser.Scene) {
    this.ground = scene.add.graphics().setDepth(3);
    this.belts = scene.add.graphics().setDepth(4);
    this.arms = new Pool(() => scene.add.graphics());
    this.power = scene.add.graphics().setDepth(800);
    this.overlay = scene.add.graphics().setDepth(990);
    this.items = new Pool(() => scene.add.image(0, 0, '__DEFAULT').setDepth(4.5));
    this.sprites = new Pool(() => scene.add.sprite(0, 0, '__DEFAULT').setOrigin(0.5, 1));
    this.nature = new Pool(() => scene.add.image(0, 0, 'nature').setOrigin(0.5, 0.92));
  }

  destroy() {
    for (const g of [this.ground, this.belts, this.overlay, this.power]) g.destroy();
    this.arms.destroy();
    this.items.destroy(); this.sprites.destroy(); this.nature.destroy();
  }

  private at(v: View, x: number, y: number) {
    return isoToScreen(x, y, v.x, v.y, v.zoom);
  }

  draw(v: View, time: number, f: Factory, objects: Map<number, NatureObject>, combat: Combat) {
    this.ground.clear(); this.belts.clear(); this.overlay.clear();
    const box = visibleTiles(v);
    const inView = (x: number, y: number, n = 1) => x + n >= box.x0 && x <= box.x1 && y + n >= box.y0 && y <= box.y1;
    const scale = (TILE_W * v.zoom) / SPRITE_TILE_PX;

    // Alien remains, on the ground.
    for (const s of combat.splats) {
      if (!inView(s.x, s.y)) continue;
      const p = this.at(v, s.x, s.y);
      const a = Math.min(0.55, (s.until - time) / 20000);
      this.ground.fillStyle(0x4a2a5a, a).fillEllipse(p.x, p.y, 26 * v.zoom, 12 * v.zoom);
      this.ground.fillStyle(0x7ad04a, a * 0.7).fillEllipse(p.x + 4 * v.zoom, p.y - 2 * v.zoom, 10 * v.zoom, 5 * v.zoom);
    }

    for (const e of f.entities.values()) {
      if (!inView(e.x, e.y, e.size)) continue;
      if (e.kind === 'transport_belt' || e.kind === 'underground_belt' || e.kind === 'splitter') this.drawBelt(v, e, f, time);
      else if (e.kind === 'inserter' || e.kind === 'burner_inserter') {
        this.drawInserter(v, e);
        if (this.flowFor === 'all' || this.flowFor === e.id) drawInserterFlow(this.overlay, e.x, e.y, e.rot, v.x, v.y, v.zoom, this.flowFor === 'all' ? 0.6 : 1);
      }
      if (SPRITED.has(e.kind)) {
        const s = this.sprites.get(`b${e.id}`);
        // Working machines play their animation; idle ones show the still sprite.
        const anim = e.active && this.scene.anims.exists(`pa_${e.kind}`) ? `pa_${e.kind}` : null;
        if (anim) {
          if (s.anims.currentAnim?.key !== anim || !s.anims.isPlaying) {
            const m = ANIMS[e.kind];
            s.play({ key: anim, startFrame: e.id % m.frames }).setOrigin(m.ox, m.oy);
          }
        } else if (s.anims.isPlaying || s.texture.key !== `pb_${e.kind}`) {
          s.stop();
          s.setTexture(`pb_${e.kind}`).setOrigin(0.5, 1);
        }
        const b = this.at(v, e.x + e.size, e.y + e.size);
        // Working machines shake a little.
        const shake = e.active && e.kind === 'burner_drill' ? Math.sin(time * 0.05) * v.zoom : 0;
        s.setPosition(b.x + shake, b.y + TILE_H * v.zoom * 0.08).setScale(scale).setDepth(10 + (e.x + e.y + 2 * e.size) * 0.01);
        s.setFlipX(e.kind === 'gun_turret' ? Math.cos(e.aim ?? 0) - Math.sin(e.aim ?? 0) < 0 : e.rot % 2 === 1);
      }
      // Fire glow in working burner machines.
      if (e.active && BURNING.has(e.kind)) {
        const c = this.at(v, e.x + e.size * 0.5, e.y + e.size * 0.5);
        const fl = 0.7 + 0.3 * Math.sin(time * 0.02 + e.id);
        this.overlay.fillStyle(0xff8a1c, 0.22 * fl).fillCircle(c.x, c.y - TILE_H * v.zoom * 0.6, 16 * v.zoom * fl);
      }
      const making = this.altMode && e.recipe ? RECIPES[e.recipe]?.out : undefined;
      if (making) this.recipeBadge(v, e, making);
      const alert = e.status ? ALERTS[e.status] : undefined;
      if (alert) this.alertBadge(v, e, alert[0], alert[1](e), time);
      if (e.firing && e.kind === 'gun_turret' && Math.floor(time / 50) % 2) {
        const c = this.at(v, e.x + 1, e.y + 1);
        const dx = Math.cos(e.aim!) - Math.sin(e.aim!), dy = (Math.cos(e.aim!) + Math.sin(e.aim!)) / 2;
        this.overlay.fillStyle(0xffe08a, 0.9).fillCircle(c.x + dx * 26 * v.zoom, c.y - 40 * v.zoom + dy * 26 * v.zoom, 6 * v.zoom);
      }
    }

    // Trees and rocks.
    for (let y = Math.max(0, box.y0); y <= box.y1; y++) {
      for (let x = Math.max(0, box.x0); x <= box.x1; x++) {
        const o = objects.get(y * 100000 + x);
        if (!o) continue;
        const img = this.nature.get(`${x},${y}`);
        if (img.frame.name !== o.kind) img.setFrame(o.kind);
        const p = this.at(v, x + 0.5 + o.ox, y + 0.5 + o.oy);
        img.setPosition(p.x, p.y + TILE_H * v.zoom * 0.25).setScale(scale).setFlipX(o.flip).setDepth(10 + (x + y + 1.2) * 0.01);
      }
    }
    // Nests.
    for (const n of combat.nests) {
      if (!inView(n.x, n.y, 3)) continue;
      const img = this.nature.get(`nest${n.id}`);
      if (img.frame.name !== 'alien_nest') img.setFrame('alien_nest');
      const b = this.at(v, n.x + 3, n.y + 3);
      const pulse = 1 + Math.sin(time * 0.003 + n.id) * 0.02;
      img.setPosition(b.x, b.y + TILE_H * v.zoom * 0.3).setScale(scale * pulse).setFlipX(false).setDepth(10 + (n.x + n.y + 6) * 0.01);
      if (n.hp < n.maxHp) this.healthBar(b.x, b.y - 150 * v.zoom, n.hp / n.maxHp, v.zoom, 0xff5a4f);
    }

    // Health bars on damaged buildings.
    for (const e of f.entities.values()) {
      if (e.hp < e.maxHp && inView(e.x, e.y, e.size)) {
        const c = this.at(v, e.x + e.size / 2, e.y + e.size / 2);
        this.healthBar(c.x, c.y - TILE_H * v.zoom * (e.size + 1), e.hp / e.maxHp, v.zoom);
      }
    }
    for (const [x, y, n, frac] of this.processDamage) {
      if (!inView(x, y, n)) continue;
      const c = this.at(v, x + n / 2, y + n / 2);
      this.healthBar(c.x, c.y - TILE_H * v.zoom * (n + 1.5), frac, v.zoom);
    }

    // Gunfire.
    for (const s of combat.shots) {
      const a = this.at(v, s.x0, s.y0);
      const b = this.at(v, s.x1, s.y1);
      const lift = 30 * v.zoom;
      if (s.laser) {
        this.overlay.lineStyle(5 * v.zoom, 0xff3030, 0.35).lineBetween(a.x, a.y - lift, b.x, b.y - 8 * v.zoom);
        this.overlay.lineStyle(2 * v.zoom, 0xffd0d0, 0.95).lineBetween(a.x, a.y - lift, b.x, b.y - 8 * v.zoom);
      } else {
        this.overlay.lineStyle(1.5 * v.zoom, 0xfff2a0, 0.9).lineBetween(a.x, a.y - lift, b.x, b.y - 8 * v.zoom);
        this.overlay.fillStyle(0xffe08a, 0.9).fillCircle(b.x, b.y - 8 * v.zoom, 2.5 * v.zoom);
      }
    }
    this.items.sweep(); this.sprites.sweep(); this.nature.sweep(); this.arms.sweep();
  }

  /** Inserters whose pickup and drop tiles to mark: one by id, or all of them while placing one. */
  flowFor: number | 'all' | null = null;
  /** Alt mode: what each machine is making, shown over it. */
  altMode = false;

  /** The frontmost building, tree or rock drawn under a screen point. */
  pick(x: number, y: number, f: Factory): Pick | null {
    let best: Pick | null = null;
    for (const [key, s] of this.sprites.entries()) {
      if (best && s.depth <= best.depth) continue;
      const e = f.entities.get(Number(key.slice(1)));
      if (e && hitsSprite(s, x, y)) best = { tx: e.x, ty: e.y, depth: s.depth };
    }
    for (const [key, img] of this.nature.entries()) {
      if (key.startsWith('nest') || (best && img.depth <= best.depth) || !hitsSprite(img, x, y)) continue;
      const [tx, ty] = key.split(',').map(Number);
      best = { tx, ty, depth: img.depth };
    }
    return best;
  }

  /** Damaged process buildings as [x, y, size, health fraction], filled in by the scene. */
  processDamage: [number, number, number, number][] = [];

  /** Alt mode's dark plate with the machine's product on it. */
  private recipeBadge(v: View, e: FEntity, item: string) {
    const c = this.at(v, e.x + e.size / 2, e.y + e.size / 2);
    const y = c.y - TILE_H * v.zoom * e.size * 0.5;
    const r = 13 * v.zoom;
    this.overlay.fillStyle(0x10141a, 0.78).fillRoundedRect(c.x - r, y - r, r * 2, r * 2, 4 * v.zoom);
    if (!this.scene.textures.exists(`ic_${item}`)) return;
    const img = this.items.get(`rc${e.id}`);
    if (img.texture.key !== `ic_${item}`) img.setTexture(`ic_${item}`);
    img.setPosition(c.x, y).setScale((r * 1.7) / 64).setAlpha(1).setDepth(991);
  }

  /** A pulsing badge with an item in it, floating over a building that needs attention. */
  private alertBadge(v: View, e: FEntity, colour: number, item: string | null, time: number) {
    const c = this.at(v, e.x + e.size / 2, e.y + e.size / 2);
    const y = c.y - TILE_H * v.zoom * (e.size * 1.1 + 0.8);
    const a = 0.65 + 0.35 * Math.sin(time * 0.006);
    const r = 11 * v.zoom;
    this.overlay.fillStyle(0x000000, 0.55 * a).fillCircle(c.x, y, r + 2);
    this.overlay.fillStyle(colour, 0.85 * a).fillCircle(c.x, y, r);
    if (item && this.scene.textures.exists(`ic_${item}`)) {
      const img = this.items.get(`al${e.id}`);
      if (img.texture.key !== `ic_${item}`) img.setTexture(`ic_${item}`);
      img.setPosition(c.x, y).setScale((r * 1.5) / 64).setAlpha(a).setDepth(991);
    }
  }

  private healthBar(x: number, y: number, frac: number, zoom: number, colour = 0x6fd36f) {
    const w = 36 * zoom;
    this.overlay.fillStyle(0x000000, 0.7).fillRect(x - w / 2 - 1, y - 1, w + 2, 5);
    this.overlay.fillStyle(frac > 0.4 ? colour : 0xff5a4f, 1).fillRect(x - w / 2, y, w * Math.max(0, frac), 3);
  }

  private drawBelt(v: View, e: FEntity, f: Factory, time: number) {
    const [dx, dy] = DIRS[e.rot];
    const [px, py] = [-dy, dx];
    const cx = e.x + 0.5, cy = e.y + 0.5;
    const w = 0.32;
    let from = -0.5, to = 0.5;
    if (e.kind === 'underground_belt') { if (e.mode === 'in') to = 0.1; else from = -0.1; }
    const pt = (t: number, s: number) => this.at(v, cx + dx * t + px * s, cy + dy * t + py * s);
    const quad = (t0: number, t1: number, s: number) => [pt(t0, -s), pt(t1, -s), pt(t1, s), pt(t0, s)];
    // Rails, belt and the moving cross-ribs.
    this.belts.fillStyle(0x3b3f45, 1).fillPoints(quad(from, to, w + 0.06), true);
    this.belts.fillStyle(0x23262a, 1).fillPoints(quad(from, to, w), true);
    const phase = (time / 1000 * BELT_SPEED) % 0.2;
    this.belts.lineStyle(Math.max(1, 1.4 * v.zoom), 0x4a4f57, 1);
    for (let t = from + phase; t < to; t += 0.2) {
      const a = pt(t, -w), b = pt(t, w);
      this.belts.lineBetween(a.x, a.y, b.x, b.y);
    }
    // Direction chevron, faint.
    const tip = pt(0.12, 0), l = pt(-0.05, -0.14), r = pt(-0.05, 0.14);
    this.belts.lineStyle(Math.max(1, 1.6 * v.zoom), 0xd8b04a, 0.35).strokePoints([l, tip, r], false);
    if (e.kind === 'underground_belt') {
      // The hood over the tunnel mouth.
      const h0 = e.mode === 'in' ? 0.05 : -0.5, h1 = e.mode === 'in' ? 0.5 : -0.05;
      this.belts.fillStyle(0x5a4a2a, 1).fillPoints(quad(h0, h1, w + 0.1), true);
      this.belts.fillStyle(0xd8b04a, 1).fillPoints(quad(e.mode === 'in' ? 0.05 : -0.15, e.mode === 'in' ? 0.15 : -0.05, w + 0.1), true);
    }
    if (e.kind === 'splitter') {
      this.belts.fillStyle(0xd8b04a, 1).fillPoints(quad(-0.08, 0.08, 0.5), true);
    }
    const iscale = (TILE_W * v.zoom * 0.2) / 64;
    // An entrance's items travel the whole tunnel; only the part before the mouth shows.
    const length = e.kind === 'underground_belt' && e.mode === 'in' ? f.beltLength(e) : 1;
    for (const [k, it] of (e.items ?? []).entries()) {
      const t = -0.5 + it.pos * length;
      if (t > 0.05 && length > 1) continue;
      const p = pt(t, 0);
      const img = this.items.get(`${e.id}:${k}`);
      if (img.texture.key !== `ic_${it.item}`) img.setTexture(`ic_${it.item}`);
      img.setPosition(p.x, p.y - 3 * v.zoom).setScale(iscale);
    }
  }

  private drawInserter(v: View, e: FEntity) {
    // Each arm sorts with the buildings around it.
    const g = this.arms.get(`a${e.id}`).clear().setDepth(10 + (e.x + e.y + 2) * 0.01);
    const [dx, dy] = DIRS[e.rot];
    const c = this.at(v, e.x + 0.5, e.y + 0.5);
    const s = e.swing ?? 0;
    // The hand sweeps from the pickup side (behind) to the drop side (in front).
    const hx = e.x + 0.5 + dx * (s * 1.0 - 0.5) * 1.1;
    const hy = e.y + 0.5 + dy * (s * 1.0 - 0.5) * 1.1;
    const h = this.at(v, hx, hy);
    const lift = 18 * v.zoom;
    const elbow = { x: (c.x + h.x) / 2, y: (c.y + h.y) / 2 - lift * 1.6 };
    g.fillStyle(0x2c3036, 1).fillEllipse(c.x, c.y, 26 * v.zoom, 13 * v.zoom);
    g.fillStyle(0x4a4f57, 1).fillEllipse(c.x, c.y - 3 * v.zoom, 18 * v.zoom, 9 * v.zoom);
    // Which way items go, on the ground in front of the base.
    const [px, py] = [-dy, dx];
    const ox = e.x + 0.5, oy = e.y + 0.5;
    const tip = this.at(v, ox + dx * 0.46, oy + dy * 0.46);
    const l = this.at(v, ox + dx * 0.28 + px * 0.16, oy + dy * 0.28 + py * 0.16);
    const r = this.at(v, ox + dx * 0.28 - px * 0.16, oy + dy * 0.28 - py * 0.16);
    g.fillStyle(e.kind === 'burner_inserter' ? 0xc8b8a0 : 0xf0c040, 0.9).fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
    // Electric inserters are yellow, burner ones sooty iron.
    const [c1, c2] = e.kind === 'burner_inserter' ? [0x5a5048, 0x7a6a5a] : [0xe0a82a, 0xf0c040];
    g.lineStyle(5 * v.zoom, c1, 1).lineBetween(c.x, c.y - 6 * v.zoom, elbow.x, elbow.y);
    g.lineStyle(4 * v.zoom, c2, 1).lineBetween(elbow.x, elbow.y, h.x, h.y - lift * 0.5);
    g.fillStyle(0x30343a, 1).fillCircle(h.x, h.y - lift * 0.5, 3.5 * v.zoom);
    if (e.hand) {
      const img = this.items.get(`h${e.id}`);
      if (img.texture.key !== `ic_${e.hand}`) img.setTexture(`ic_${e.hand}`);
      img.setPosition(h.x, h.y - lift * 0.5).setScale((TILE_W * v.zoom * 0.2) / 64).setDepth(g.depth + 0.001);
    }
  }

  /** A flashing lightning bolt: the building has no power. */
  bolt(x: number, y: number, zoom: number, time: number) {
    if (Math.floor(time / 500) % 2) return;
    const s = 9 * zoom;
    this.power.fillStyle(0xffd23a, 0.95).lineStyle(1.5, 0x000000, 0.8);
    const pts = [{ x: x + 0.2 * s, y: y - s }, { x: x - 0.6 * s, y: y + 0.15 * s }, { x: x - 0.05 * s, y: y + 0.15 * s },
      { x: x - 0.25 * s, y: y + s }, { x: x + 0.6 * s, y: y - 0.2 * s }, { x: x + 0.05 * s, y: y - 0.2 * s }];
    this.power.fillPoints(pts, true).strokePoints(pts, true);
  }

  /**
   * Wires between poles, the supply areas when they matter, and bolts over electric buildings
   * that aren't wired in.
   */
  drawPower(v: View, snap: Snapshot | null, time: number, showSupply: boolean) {
    this.power.clear();
    if (!snap) return;
    const poles = new Map(snap.entities.filter(e => (PROTO[e.proto]?.wire ?? 0) > 0).map(e => [e.id, e]));
    const scale = (TILE_W * v.zoom) / SPRITE_TILE_PX;
    const top = (id: number) => {
      const e = poles.get(id)!;
      const n = PROTO[e.proto].size;
      const tex = this.scene.textures.get(`pb_${e.proto}`).getSourceImage() as HTMLImageElement;
      const b = this.at(v, e.x + n, e.y + n);
      return { x: b.x, y: b.y - (tex?.height ?? 300) * scale * 0.88 };
    };
    if (showSupply) {
      for (const e of poles.values()) {
        const p = PROTO[e.proto];
        const c = p.size / 2;
        const s = p.supply;
        const pts = [this.at(v, e.x + c - s, e.y + c - s), this.at(v, e.x + c + s, e.y + c - s), this.at(v, e.x + c + s, e.y + c + s), this.at(v, e.x + c - s, e.y + c + s)];
        this.power.fillStyle(0x3aa0ff, 0.08).fillPoints(pts, true);
        this.power.lineStyle(1, 0x3aa0ff, 0.5).strokePoints(pts, true);
      }
    }
    for (const [a, b] of snap.wires) {
      if (!poles.has(a) || !poles.has(b)) continue;
      const p = top(a), q = top(b);
      const sag = Math.hypot(q.x - p.x, q.y - p.y) * 0.08;
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(p.x, p.y), new Phaser.Math.Vector2((p.x + q.x) / 2, (p.y + q.y) / 2 + sag * 2), new Phaser.Math.Vector2(q.x, q.y));
      this.power.lineStyle(Math.max(1, 1.2 * v.zoom), 0x1a1208, 0.85);
      curve.draw(this.power, 16);
    }
    for (const e of snap.entities) {
      const p = PROTO[e.proto];
      if (!p?.power_w || !e.enabled || p.wire) continue;
      if (e.network !== null && e.served > 0.25) continue;
      const c = this.at(v, e.x + p.size / 2, e.y + p.size / 2);
      this.bolt(c.x, c.y - TILE_H * v.zoom * (p.size + 0.5), v.zoom, time);
    }
  }
}
