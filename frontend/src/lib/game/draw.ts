/**
 * Draws the survival layer in the isometric world: belts and what's on them, inserter arms,
 * chests, burner machines and turrets, trees and rocks, nests, gunfire, power wires and
 * supply areas.
 */

import Phaser from 'phaser';
import { TILE_H, TILE_W, isoToScreen, screenToIso } from '../phaser/isoMath';
import { PROTO, type Snapshot } from '../process/engine';
import { ANIMS, drawDrillOutput, drawInserterFlow, hitsSprite, type Pick } from '../process/render';
import { BELT_SPEED, DIRS, drillOutput, type FEntity, type Factory } from './factory';
import type { Combat } from './combat';
import { RECIPES } from './items';
import { popScale } from './juice';
import type { NatureObject } from './nature';
import type { PlanetMap } from '../types';

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
const SPRITED = new Set(['wooden_chest', 'iron_chest', 'burner_drill', 'stone_furnace', 'gun_turret', 'charcoal_kiln']);
/** Problems worth a badge over the building, Factorio-style: colour and the item to show. */
const ALERTS: Record<string, [number, (e: FEntity) => string | null]> = {
  'Out of fuel': [0xff5a4f, () => 'wood'],
  'No wood': [0xffc23a, () => 'wood'],
  'No ore left': [0xff5a4f, () => 'iron_ore'],
  'Output full': [0xffc23a, e => e.output?.first() ?? null],
  'Output blocked': [0xffc23a, e => e.held ?? null],
  'Missing science packs': [0xffc23a, () => 'science_red'],
  'No recipe set': [0xffc23a, () => 'iron_gear'],
};
/**
 * Turrets and drills built from painted parts: where the head sits on the base, where the bit
 * goes into the frame (fractions of the image), and how big the moving parts are [tiles].
 */
const TURRET_PARTS: Record<string, { ring: [number, number]; head: number; pivot: number; barrel: number; thick: number }> = {
  gun_turret: { ring: [0.5, 0.17], head: 0.85, pivot: 0.85, barrel: 1.7, thick: 15 },
  laser_turret: { ring: [0.5, 0.19], head: 0.85, pivot: 0.85, barrel: 1.6, thick: 14 },
};
/** Drill bits are as long as a fraction of the frame's height. */
const DRILL_PARTS: Record<string, { hole: [number, number]; backHole: [number, number]; chimney?: [number, number]; backChimney?: [number, number]; bit: number; thick: number }> = {
  burner_drill: { hole: [0.45, 0.51], backHole: [0.51, 0.56], chimney: [0.11, 0.28], backChimney: [0.87, 0.48], bit: 0.42, thick: 12 },
  electric_drill: { hole: [0.48, 0.69], backHole: [0.567, 0.643], bit: 0.55, thick: 16 },
};

/**
 * Which painting of a drill to show, and mirrored or not, so its ore chute points where the ore
 * really goes: the front one's chute is painted going down to the right, the back one's up to the
 * left.
 */
export function drillPainting(rot: number): { back: boolean; flip: boolean } {
  return { back: rot === 0 || rot === 3, flip: rot === 0 || rot === 2 };
}
/** Furnaces: where the fire burns or the crucible sits, the chimney, and the output tray. */
const FURNACE_PARTS: Record<string, { mouth?: [number, number, number, number]; well?: [number, number, number, number]; chimney?: [number, number]; tray?: [number, number] }> = {
  // Mouth: bottom centre, width and height. Well: centre, front rim and the crucible's width.
  stone_furnace: { mouth: [0.385, 0.81, 0.2, 0.19], chimney: [0.53, 0.04], tray: [0.86, 0.78] },
  electric_furnace: { well: [0.53, 0.21, 0.3, 0.24] },
};
/** Assemblers: the work table, and the socket the arm stands in. */
const ASSEMBLER_PARTS: Record<string, { table: [number, number]; socket: [number, number] }> = {
  assembler: { table: [0.46, 0.41], socket: [0.59, 0.12] },
};
/** Painted parts loaded for this kind. */
const partBody = (kind: string) => kind.endsWith('_turret') ? `ip_${kind}_base` : `ip_${kind}_frame`;
const PARTED = (kind: string) => kind in TURRET_PARTS || kind in DRILL_PARTS || kind in FURNACE_PARTS || kind in ASSEMBLER_PARTS;

/** Where the painted inserter bases stand and take their arm (fractions of the image). */
const INSERTER_PARTS: Record<string, { width: number; foot: [number, number]; socket: [number, number] }> = {
  burner_inserter: { width: 0.6, foot: [0.5, 0.95], socket: [0.44, 0.33] },
  inserter: { width: 0.72, foot: [0.58, 0.95], socket: [0.58, 0.14] },
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
  private parts: Pool<Phaser.GameObjects.Image>;
  /** The ground, for its rivers. */
  map: PlanetMap | null = null;
  /** Stacks lying on the ground. */
  piles: { item: string; count: number; x: number; y: number }[] = [];

  constructor(private scene: Phaser.Scene) {
    this.ground = scene.add.graphics().setDepth(3);
    this.belts = scene.add.graphics().setDepth(4);
    this.arms = new Pool(() => scene.add.graphics());
    this.power = scene.add.graphics().setDepth(800);
    this.overlay = scene.add.graphics().setDepth(990);
    this.items = new Pool(() => scene.add.image(0, 0, '__DEFAULT').setDepth(4.5));
    this.sprites = new Pool(() => scene.add.sprite(0, 0, '__DEFAULT').setOrigin(0.5, 1));
    this.nature = new Pool(() => scene.add.image(0, 0, 'nature').setOrigin(0.5, 0.92));
    this.parts = new Pool(() => scene.add.image(0, 0, '__DEFAULT'));
  }

  destroy() {
    for (const g of [this.ground, this.belts, this.overlay, this.power]) g.destroy();
    this.arms.destroy();
    this.items.destroy(); this.sprites.destroy(); this.nature.destroy(); this.parts.destroy();
  }

  private at(v: View, x: number, y: number) {
    return isoToScreen(x, y, v.x, v.y, v.zoom);
  }

  draw(v: View, time: number, f: Factory, objects: Map<number, NatureObject>, combat: Combat) {
    this.ground.clear(); this.belts.clear(); this.overlay.clear();
    const box = visibleTiles(v);
    const inView = (x: number, y: number, n = 1) => x + n >= box.x0 && x <= box.x1 && y + n >= box.y0 && y <= box.y1;
    const scale = (TILE_W * v.zoom) / SPRITE_TILE_PX;

    // Rivers run: pale glints drift downstream, quicker where the water is.
    if (this.map) {
      const g = this.ground;
      for (let y = Math.max(0, box.y0); y <= Math.min(this.map.height - 1, box.y1); y++) {
        for (let x = Math.max(0, box.x0); x <= Math.min(this.map.width - 1, box.x1); x++) {
          const fl = this.map.tiles[y][x].flow;
          if (!fl) continue;
          const speed = Math.hypot(fl[0], fl[1]);
          const ux = fl[0] / speed, uy = fl[1] / speed;
          for (let k = 0; k < 2; k++) {
            const h = ((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0;
            const ph = (time * 0.00045 * speed + (h % 1000) / 1000) % 1;
            // Across the flow, each glint keeps its own lane.
            const off = ((h >>> 10) % 100) / 100 - 0.5;
            const sx = x + 0.5 + ux * (ph - 0.5) - uy * off * 0.8, sy = y + 0.5 + uy * (ph - 0.5) + ux * off * 0.8;
            const a = this.at(v, sx, sy), b = this.at(v, sx + ux * 0.28, sy + uy * 0.28);
            g.lineStyle(1.6 * v.zoom, 0xd8f0ff, 0.32 * Math.sin(ph * Math.PI)).lineBetween(a.x, a.y, b.x, b.y);
          }
        }
      }
    }

    // Alien remains, on the ground.
    for (const s of combat.splats) {
      if (!inView(s.x, s.y)) continue;
      const p = this.at(v, s.x, s.y);
      const a = Math.min(0.55, (s.until - time) / 20000);
      this.ground.fillStyle(0x4a2a5a, a).fillEllipse(p.x, p.y, 26 * v.zoom, 12 * v.zoom);
      this.ground.fillStyle(0x7ad04a, a * 0.7).fillEllipse(p.x + 4 * v.zoom, p.y - 2 * v.zoom, 10 * v.zoom, 5 * v.zoom);
    }

    // Dropped stacks: a little heap of the item's icon, more of them for a bigger stack.
    this.piles.forEach((g, k) => {
      if (!inView(g.x - 1, g.y - 1, 2) || !this.scene.textures.exists(`ic_${g.item}`)) return;
      const p = this.at(v, g.x, g.y);
      this.ground.fillStyle(0x000000, 0.25).fillEllipse(p.x, p.y + 2 * v.zoom, 22 * v.zoom, 9 * v.zoom);
      const n = g.count >= 20 ? 3 : g.count > 1 ? 2 : 1;
      for (let j = 0; j < n; j++) {
        const icon = this.items.get(`g${k},${j}`);
        if (icon.texture.key !== `ic_${g.item}`) icon.setTexture(`ic_${g.item}`);
        icon.setPosition(p.x + (j - (n - 1) / 2) * 6 * v.zoom, p.y - (4 + (j % 2) * 3) * v.zoom)
          .setScale(TILE_W * v.zoom * 0.3 / 64).setAlpha(1).setDepth(10 + (g.x + g.y) * 0.01 + j * 0.0001);
      }
    });

    for (const e of f.entities.values()) {
      if (!inView(e.x, e.y, e.size)) continue;
      if (e.kind === 'transport_belt' || e.kind === 'underground_belt' || e.kind === 'splitter') this.drawBelt(v, e, f, time);
      else if (e.kind === 'inserter' || e.kind === 'burner_inserter') {
        this.drawInserter(v, e, time);
        if (this.flowFor === 'all' || this.flowFor === e.id) drawInserterFlow(this.overlay, e.x, e.y, e.rot, v.x, v.y, v.zoom, this.flowFor === 'all' ? 0.6 : 1);
      }
      if ((e.kind === 'burner_drill' || e.kind === 'electric_drill') && (this.drillsFor === 'all' || this.drillsFor === e.id)) {
        drawDrillOutput(this.overlay, e.x, e.y, e.size, e.rot, f.outputTile(e), v.x, v.y, v.zoom, this.drillsFor === 'all' ? 0.7 : 1);
      }
      const parted = PARTED(e.kind) && this.scene.textures.exists(partBody(e.kind));
      if (parted) {
        if (e.kind in TURRET_PARTS) this.drawTurret(v, e, time);
        else if (e.kind in DRILL_PARTS) this.drawDrill(v, e, time);
        else if (e.kind in FURNACE_PARTS) this.drawFurnace(v, e, time);
        else this.drawAssembler(v, e, time);
      } else if (SPRITED.has(e.kind)) {
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
        s.setPosition(b.x + shake, b.y + TILE_H * v.zoom * 0.08).setScale(scale * popScale(e.id, time)).setDepth(10 + (e.x + e.y + 2 * e.size) * 0.01);
        s.setFlipX(e.kind === 'gun_turret' ? Math.cos(e.aim ?? 0) - Math.sin(e.aim ?? 0) < 0 : e.rot % 2 === 1);
        // A smouldering kiln seeps smoke from vents all over its mound.
        if (e.active && e.kind === 'charcoal_kiln' && this.fx && Math.random() < 0.18) {
          const a = Math.random() * Math.PI * 2, r = 0.45 + Math.random() * 0.5;
          const h = s.displayHeight / v.zoom * (0.75 - r * 0.45);
          this.fx.smoke(e.x + e.size / 2 + Math.cos(a) * r, e.y + e.size / 2 + Math.sin(a) * r, h);
        }
      }
      // Fire glow in working burner machines.
      if (e.active && BURNING.has(e.kind) && !parted) {
        const c = this.at(v, e.x + e.size * 0.5, e.y + e.size * 0.5);
        const fl = 0.7 + 0.3 * Math.sin(time * 0.02 + e.id);
        this.overlay.fillStyle(0xff8a1c, 0.22 * fl).fillCircle(c.x, c.y - TILE_H * v.zoom * 0.6, 16 * v.zoom * fl);
      }
      const making = this.altMode && e.recipe ? RECIPES[e.recipe]?.out : undefined;
      if (making) this.recipeBadge(v, e, making);
      const alert = e.status ? ALERTS[e.status] : undefined;
      if (alert) this.alertBadge(v, e, alert[0], alert[1](e), time);
      if (e.firing && e.kind === 'gun_turret' && Math.floor(time / 50) % 2 && !this.scene.textures.exists(partBody(e.kind))) {
        const c = this.at(v, e.x + 1, e.y + 1);
        const dx = Math.cos(e.aim!) - Math.sin(e.aim!), dy = (Math.cos(e.aim!) + Math.sin(e.aim!)) / 2;
        this.overlay.fillStyle(0xffe08a, 0.9).fillCircle(c.x + dx * 26 * v.zoom, c.y - 40 * v.zoom + dy * 26 * v.zoom, 6 * v.zoom);
      }
    }

    if (this.drillGhost) {
      const d = this.drillGhost;
      drawDrillOutput(this.overlay, d.x, d.y, d.size, d.rot, drillOutput(d.x, d.y, d.size, d.rot), v.x, v.y, v.zoom);
    }

    // Trees and rocks.
    for (let y = Math.max(0, box.y0); y <= box.y1; y++) {
      for (let x = Math.max(0, box.x0); x <= box.x1; x++) {
        const o = objects.get(y * 100000 + x);
        if (!o) continue;
        const img = this.nature.get(`${x},${y}`);
        if (img.frame.name !== o.kind) img.setFrame(o.kind);
        const p = this.at(v, x + 0.5 + o.ox, y + 0.5 + o.oy);
        const wob = this.wobble === `${x},${y}` ? Math.sin(time * 0.045) * 2.5 * v.zoom : 0;
        img.setPosition(p.x + wob, p.y + TILE_H * v.zoom * 0.25).setScale(scale).setFlipX(o.flip).setDepth(10 + (x + y + 1.2) * 0.01);
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
    this.items.sweep(); this.sprites.sweep(); this.nature.sweep(); this.arms.sweep(); this.parts.sweep();
  }

  /** Inserters whose pickup and drop tiles to mark: one by id, or all of them while placing one. */
  flowFor: number | 'all' | null = null;
  /** Drills whose output tile to mark: one by id, or all of them while laying what they feed. */
  drillsFor: number | 'all' | null = null;
  /** A drill being placed: where its ore will come out. */
  drillGhost: { x: number; y: number; size: number; rot: number } | null = null;
  /** The tree or rock being mined, which shakes: its tile as "x,y". */
  wobble: string | null = null;
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
    for (const [key, img] of this.parts.entries()) {
      if (key[0] !== 'F' || (best && img.depth <= best.depth)) continue;
      const e = f.entities.get(Number(key.slice(1)));
      if (e && hitsSprite(img, x, y)) best = { tx: e.x, ty: e.y, depth: img.depth };
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

  private drawInserter(v: View, e: FEntity, time: number) {
    const depth = 10 + (e.x + e.y + 2) * 0.01;
    // Each arm sorts with the buildings around it; the ground chevron sits under the base.
    const g = this.arms.get(`a${e.id}`).clear().setDepth(depth - 0.0005);
    const [dx, dy] = DIRS[e.rot];
    const [px, py] = [-dy, dx];
    const ox = e.x + 0.5, oy = e.y + 0.5;
    const c = this.at(v, ox, oy);
    // Which way items go, on the ground in front of the base.
    const tip = this.at(v, ox + dx * 0.46, oy + dy * 0.46);
    const l = this.at(v, ox + dx * 0.28 + px * 0.16, oy + dy * 0.28 + py * 0.16);
    const r = this.at(v, ox + dx * 0.28 - px * 0.16, oy + dy * 0.28 - py * 0.16);
    g.fillStyle(e.kind === 'burner_inserter' ? 0xc8b8a0 : 0xf0c040, 0.9).fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
    if (!this.scene.textures.exists(`ip_${e.kind}_arm`)) { this.drawInserterShapes(v, e, g); return; }

    // The base, painted, its foot on the tile's centre.
    const spec = INSERTER_PARTS[e.kind];
    const base = this.parts.get(`b${e.id}`);
    if (base.texture.key !== `ip_${e.kind}_base`) base.setTexture(`ip_${e.kind}_base`);
    const bs = spec.width * TILE_W * v.zoom / base.width;
    base.setOrigin(spec.foot[0], spec.foot[1]).setPosition(c.x, c.y + TILE_H * v.zoom * 0.12).setScale(bs).setDepth(depth);
    const shoulderScreen = {
      x: base.x + (spec.socket[0] - spec.foot[0]) * base.width * bs,
      y: base.y + (spec.socket[1] - spec.foot[1]) * base.height * bs,
    };
    // How high the shoulder stands, in tiles, from where it lands on screen above the centre.
    const unit = TILE_H * v.zoom * 1.2;
    const shoulderZ = (c.y - shoulderScreen.y) / unit;

    // The claw sweeps round the base in a half circle, from the pickup tile behind to the drop
    // tile in front, rising over the top as it goes.
    const s = e.swing ?? 0;
    const phi = Math.PI * (1 - s);
    const reach = 0.95;
    const hand = { x: ox + reach * (Math.cos(phi) * dx + Math.sin(phi) * px), y: oy + reach * (Math.cos(phi) * dy + Math.sin(phi) * py), z: 0.28 + 0.25 * Math.sin(phi) };
    const shoulder = { x: ox, y: oy, z: shoulderZ };
    // Two segments of fixed length: the elbow rises above their midpoint by what's left over.
    const L = 0.62;
    const D = Math.hypot(hand.x - shoulder.x, hand.y - shoulder.y, hand.z - shoulder.z);
    const lift = Math.sqrt(Math.max(0, L * L - (D / 2) ** 2));
    const elbow = { x: (hand.x + shoulder.x) / 2, y: (hand.y + shoulder.y) / 2, z: (hand.z + shoulder.z) / 2 + lift };
    const proj = (p: { x: number; y: number; z: number }) => { const q = this.at(v, p.x, p.y); return { x: q.x, y: q.y - p.z * unit }; };
    const S = proj(shoulder), E = proj(elbow), H = proj(hand);
    // The segment nearer the camera draws over the other.
    const front = hand.x + hand.y > ox + oy;
    this.segment(`l${e.id}`, `ip_${e.kind}_arm`, S, E, v.zoom, depth + (front ? 0.0001 : 0.0002), 0xffffff);
    this.segment(`u${e.id}`, `ip_${e.kind}_arm`, E, H, v.zoom, depth + (front ? 0.0002 : 0.0001), 0xe8e8e8);
    // The claw hangs from the end of the arm, pointing down past it.
    const claw = this.parts.get(`h${e.id}`);
    if (claw.texture.key !== `ip_${e.kind}_hand`) claw.setTexture(`ip_${e.kind}_hand`);
    const cl = 0.4 * TILE_W * v.zoom / claw.width;
    const ang = Math.atan2(H.y - E.y, H.x - E.x);
    claw.setOrigin(0.1, 0.5).setPosition(H.x, H.y).setScale(cl).setRotation(ang * 0.5 + Math.PI / 4).setDepth(depth + 0.0003);
    const grip = { x: H.x + Math.cos(claw.rotation) * claw.width * cl * 0.75, y: H.y + Math.sin(claw.rotation) * claw.width * cl * 0.75 };
    if (e.hand) {
      const img = this.items.get(`h${e.id}`);
      if (img.texture.key !== `ic_${e.hand}`) img.setTexture(`ic_${e.hand}`);
      img.setPosition(grip.x, grip.y).setScale((TILE_W * v.zoom * 0.2) / 64).setDepth(depth + 0.0004);
    }
    // A burner's firebox glows while it has fuel.
    if (e.kind === 'burner_inserter' && (e.burn ?? 0) > 0) {
      const fx = base.x + (0.24 - spec.foot[0]) * base.width * bs, fy = base.y + (0.77 - spec.foot[1]) * base.height * bs;
      const fl = 0.6 + 0.4 * Math.sin(time * 0.025 + e.id * 1.7);
      this.overlay.fillStyle(0xff8a1c, 0.35 * fl).fillCircle(fx, fy, 3.5 * v.zoom * (0.8 + fl * 0.4));
    }
  }

  /** One arm segment stretched between two screen points, its pivot rings on the points. */
  private segment(key: string, tex: string, a: { x: number; y: number }, b: { x: number; y: number }, zoom: number, depth: number,
    tint: number, thick = 11, from = 0.1, span = 0.79) {
    const img = this.parts.get(key);
    if (img.texture.key !== tex) img.setTexture(tex);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    // `from` is where point a sits along the image, `span` the fraction from a to b (pivot to
    // pivot on an arm).
    img.setOrigin(from, 0.5).setPosition(a.x, a.y).setRotation(Math.atan2(b.y - a.y, b.x - a.x))
      .setScale(len / (img.width * span), (thick * zoom) / img.height).setDepth(depth).setTint(tint).setFlipY(false);
    return img;
  }

  /** Effects the renderer asks the scene for: ore chips, smoke and sparks, in tile space. */
  fx: { chips(x: number, y: number): void; smoke(x: number, y: number, z: number): void; sparks(x: number, y: number, z: number, colour: number[]): void } | null = null;

  /** Where a point on screen over a building is in the world: tile position and height. */
  private lift(v: View, e: FEntity, p: { x: number; y: number }) {
    const ground = this.at(v, e.x + e.size / 2, e.y + e.size / 2);
    const t = screenToIso(p.x, ground.y, v.x, v.y, v.zoom);
    return { x: t.x, y: t.y, z: (ground.y - p.y) / v.zoom };
  }

  /** A painted body anchored on its footprint like any building. */
  private body(v: View, e: FEntity, flip: boolean, dx = 0, tex = partBody(e.kind)) {
    const depth = 10 + (e.x + e.y + 2 * e.size) * 0.01;
    const b = this.at(v, e.x + e.size, e.y + e.size);
    const img = this.parts.get(`F${e.id}`);
    if (!this.scene.textures.exists(tex)) tex = partBody(e.kind);
    if (img.texture.key !== tex) img.setTexture(tex);
    const s = e.size * TILE_W * v.zoom / img.width * popScale(e.id, this.scene.time.now);
    img.setOrigin(0.5, 1).setPosition(b.x + dx, b.y + TILE_H * v.zoom * 0.08).setScale(s).setFlipX(flip).setRotation(0).setDepth(depth).clearTint();
    /** A point given as fractions of the (possibly flipped) image, on screen. */
    const at = (fx: number, fy: number) => ({ x: img.x + ((flip ? 1 - fx : fx) - 0.5) * img.width * s, y: img.y + (fy - 1) * img.height * s });
    return { img, depth, at };
  }

  /**
   * A turret: its base, a head that turns toward what it's aiming at, and a barrel that points
   * there, kicks back when it fires, and flashes at its real muzzle. Idle turrets look around.
   */
  private drawTurret(v: View, e: FEntity, time: number) {
    const spec = TURRET_PARTS[e.kind];
    const { depth, at } = this.body(v, e, false);
    const ring = at(spec.ring[0], spec.ring[1]);
    const aim = (e.aim ?? Math.PI / 4) + (e.firing ? 0 : Math.sin(time * 0.0006 + e.id) * 0.6);
    const [ax, ay] = [Math.cos(aim), Math.sin(aim)];
    // On screen a tile step (ax, ay) goes (ax − ay, (ax + ay) / 2).
    const sx = ax - ay, sy = (ax + ay) / 2;
    const head = this.parts.get(`T${e.id}`);
    if (head.texture.key !== `ip_${e.kind}_head`) head.setTexture(`ip_${e.kind}_head`);
    const hs = spec.head * TILE_W * v.zoom / head.width;
    head.setOrigin(0.5, spec.pivot).setPosition(ring.x, ring.y).setScale(hs).setFlipX(sx < 0).setDepth(depth + 0.0002);
    const kick = e.firing && time % (e.kind === 'laser_turret' ? 200 : 110) < 40 ? 0.14 : 0;
    const reach = (spec.barrel - kick) * TILE_W / 2 * v.zoom;
    // The barrel comes out of the middle of the head.
    const mount = { x: ring.x, y: ring.y - (spec.pivot - 0.55) * head.displayHeight };
    const tip = { x: mount.x + sx * reach, y: mount.y + sy * reach };
    // Pointing away from the camera, the barrel goes behind the head.
    this.segment(`G${e.id}`, `ip_${e.kind}_barrel`, mount, tip, v.zoom, depth + (sy < 0 ? 0.0001 : 0.0003), 0xffffff, spec.thick, 0.02, 0.96);
    if (e.firing && Math.floor(time / 50) % 2) {
      const colour = e.kind === 'laser_turret' ? 0xff4030 : 0xffe08a;
      this.overlay.fillStyle(colour, 0.9).fillCircle(tip.x, tip.y, 6 * v.zoom);
      this.overlay.fillStyle(0xffffff, 0.9).fillCircle(tip.x, tip.y, 2.5 * v.zoom);
    }
  }

  /**
   * A drill: its frame, and an auger bit hanging from the derrick into the hole. Working, the
   * bit bores up and down and spins, ore chips fly, and a burner drill smokes.
   */
  private drawDrill(v: View, e: FEntity, time: number) {
    const spec = DRILL_PARTS[e.kind];
    const { back, flip } = drillPainting(e.rot);
    const shake = e.active && e.kind === 'burner_drill' ? Math.sin(time * 0.05) * 0.6 * v.zoom : 0;
    const { img, depth, at } = this.body(v, e, flip, shake, back ? `ip_${e.kind}_frame_back` : undefined);
    const [hx, hy] = back ? spec.backHole : spec.hole;
    const hole = at(hx, hy);
    const len = spec.bit * img.displayHeight;
    const bore = e.active ? 0.5 + 0.5 * Math.sin(time * 0.006 + e.id) : 0;
    // The tip sits in the hole; working, it bores a little deeper and back.
    const bottom = { x: hole.x + shake, y: hole.y + len * 0.1 * bore };
    const top = { x: bottom.x, y: bottom.y - len };
    const bit = this.segment(`B${e.id}`, 'ip_drill_bit', top, bottom, v.zoom, depth + 0.0001, 0xffffff, spec.thick, 0.03, 0.94);
    // Flipping the auger across its axis turns the spiral: it spins.
    bit.setFlipY(!!e.active && Math.floor(time / 55) % 2 === 0);
    if (!e.active || !this.fx) return;
    if (Math.random() < 0.12) this.fx.chips(e.x + e.size / 2, e.y + e.size / 2);
    const chimney = back ? spec.backChimney : spec.chimney;
    if (chimney && Math.random() < 0.1) {
      const t = this.lift(v, e, at(chimney[0], chimney[1]));
      this.fx.smoke(t.x, t.y, t.z);
    }
  }

  /**
   * A furnace. The stone furnace burns in its mouth, smokes from its chimney and sets what it
   * made on its tray; the electric furnace's crucible glows in its induction well and rises out
   * of it as each batch finishes.
   */
  private drawFurnace(v: View, e: FEntity, time: number) {
    const spec = FURNACE_PARTS[e.kind];
    const flip = e.rot % 2 === 1;
    const { img, depth, at } = this.body(v, e, flip);
    const g = this.arms.get(`f${e.id}`).clear().setDepth(depth + 0.0001);
    if (spec.mouth) {
      const [mx, my, mw, mh] = spec.mouth;
      const b = at(mx, my);
      const w = mw * img.displayWidth, h = mh * img.displayHeight;
      const lit = e.active || (e.burn ?? 0) > 0 || !!e.fuel?.first();
      if (lit && this.scene.textures.exists('ip_fire_coals')) {
        const fl = 0.8 + 0.12 * Math.sin(time * 0.021 + e.id) + 0.08 * Math.sin(time * 0.057 + e.id * 3);
        if (e.active) g.fillStyle(0xff5a10, 0.35 * fl).fillEllipse(b.x, b.y - h * 0.35, w * 1.05, h * 0.75);
        // The bed of coals: glowing and breathing while it burns, a dull red once banked.
        const coals = this.parts.get(`k${e.id}`);
        if (coals.texture.key !== 'ip_fire_coals') coals.setTexture('ip_fire_coals');
        const glow = e.active ? Math.round(200 + 55 * fl) : 120;
        coals.setOrigin(0.5, 1).setPosition(b.x, b.y + h * 0.04).setScale(w * 0.86 / coals.width).setRotation(0).setFlipX(false)
          .setDepth(depth + 0.0002).setBlendMode(Phaser.BlendModes.NORMAL).setAlpha(1).setTint(Phaser.Display.Color.GetColor(glow, Math.round(glow * (e.active ? 0.85 : 0.45)), Math.round(glow * (e.active ? 0.75 : 0.35))));
        if (e.active) {
          // Painted flames layered and glowing: each sways, stretches and fades on its own beat,
          // so together they never repeat the same shape.
          const flames: [string, number, number, boolean][] = [['ip_fire_flame_b', 0.78, 0, false], ['ip_fire_flame_a', 0.9, 2.1, false], ['ip_fire_flame_b', 0.62, 4.3, true]];
          flames.forEach(([key, width, ph, flipped], k) => {
            const f = this.parts.get(`q${k}${e.id}`);
            if (f.texture.key !== key) f.setTexture(key);
            const t = time * 0.001 + ph + e.id;
            const stretch = 0.82 + 0.16 * Math.sin(t * 7.3) + 0.08 * Math.sin(t * 17.1);
            const s = w * width / f.width;
            f.setOrigin(0.5, 1).setPosition(b.x + Math.sin(t * 3.1) * w * 0.04, b.y - h * 0.06)
              .setScale(s * (1.04 - 0.08 * stretch), Math.min(s * stretch, h * 0.95 / f.height))
              .setRotation(Math.sin(t * 2.3) * 0.05).setFlipX(flipped).setDepth(depth + 0.0003 + k * 0.00001)
              .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55 + 0.35 * Math.sin(t * 4.7 + k) ** 2).clearTint();
          });
        }
      }
      if (e.active) {
        if (this.fx && spec.chimney && Math.random() < 0.08) {
          const t = this.lift(v, e, at(spec.chimney[0], spec.chimney[1]));
          this.fx.smoke(t.x, t.y, t.z);
        }
        if (this.fx && Math.random() < 0.02) {
          const t = this.lift(v, e, { x: b.x, y: b.y - h * 0.3 });
          this.fx.sparks(t.x, t.y, t.z, [0xffb040, 0xffe080]);
        }
      }
    }
    if (spec.tray) {
      const made = e.output?.first();
      const key = made ? `ic_${made}` : null;
      if (key && this.scene.textures.exists(key)) {
        const t = at(spec.tray[0], spec.tray[1]);
        const icon = this.items.get(`o${e.id}`);
        if (icon.texture.key !== key) icon.setTexture(key);
        icon.setPosition(t.x, t.y).setScale(TILE_W * v.zoom * 0.22 / 64).setAlpha(1).setDepth(depth + 0.0001);
      }
    }
    if (spec.well) {
      const [wx, wy, rimY, cw] = spec.well;
      const c = at(wx, wy);
      const rim = at(wx, rimY).y;
      const p = e.progress ?? 0;
      const cru = this.parts.get(`C${e.id}`);
      if (cru.texture.key !== 'ip_electric_furnace_crucible') cru.setTexture('ip_electric_furnace_crucible');
      const cs = cw * img.displayWidth / cru.width;
      // Sunk in the well with its mouth level with the coils while it melts, lifted out as the
      // batch finishes. The well's front rim hides the rest of it.
      const rise = e.active ? 0.55 * Math.min(1, Math.max(0, (p - 0.75) / 0.2)) ** 2 + Math.sin(time * 0.004 + e.id) * 0.015 : -0.05;
      const top = c.y - cru.height * cs * (0.16 + rise);
      const shown = Math.max(0, (rim - top) / cs);
      if (e.active) {
        const fl = 0.8 + 0.2 * Math.sin(time * 0.017 + e.id);
        g.fillStyle(0xff7020, 0.35 * fl).fillEllipse(c.x, c.y, cw * img.displayWidth * 1.35, cw * img.displayWidth * 0.7);
      }
      cru.setCrop(0, 0, cru.width, Math.min(cru.height, shown)).setOrigin(0.5, 0).setScale(cs).setRotation(0).setFlipX(flip)
        .setPosition(c.x, top).setDepth(depth + 0.0002);
      // Cold, it's just grey metal.
      if (e.active) cru.clearTint(); else cru.setTint(0x55504c);
      if (e.active && this.fx && Math.random() < 0.04) {
        const t = this.lift(v, e, { x: c.x, y: top });
        this.fx.sparks(t.x, t.y, t.z, [0xffa030, 0xfff0a0]);
      }
    }
  }

  /**
   * An assembler: a robot arm standing at the back of its work bay, working over what's being
   * made on the table, welding as it goes. Idle, it rests above the table.
   */
  private drawAssembler(v: View, e: FEntity, time: number) {
    const spec = ASSEMBLER_PARTS[e.kind];
    const flip = e.rot % 2 === 1;
    const { depth, at } = this.body(v, e, flip);
    const unit = TILE_H * v.zoom * 1.2;
    const toWorld = (p: { x: number; y: number }) => { const t = this.lift(v, e, p); return { x: t.x, y: t.y, z: t.z * v.zoom / unit }; };
    const proj = (p: { x: number; y: number; z: number }) => { const q = this.at(v, p.x, p.y); return { x: q.x, y: q.y - p.z * unit }; };
    const tableScreen = at(spec.table[0], spec.table[1]);
    const shoulder = toWorld(at(spec.socket[0], spec.socket[1]));
    const table = toWorld(tableScreen);
    // What it's making sits on the table.
    const making = e.recipe ? RECIPES[e.recipe]?.out : undefined;
    if (making && this.scene.textures.exists(`ic_${making}`)) {
      const icon = this.items.get(`t${e.id}`);
      if (icon.texture.key !== `ic_${making}`) icon.setTexture(`ic_${making}`);
      const grow = e.active ? 0.6 + 0.4 * (e.progress ?? 0) : 1;
      icon.setPosition(tableScreen.x, tableScreen.y - 4 * v.zoom).setScale(TILE_W * v.zoom * 0.3 * grow / 64).setAlpha(1).setDepth(depth + 0.00005);
    }
    // Working, the tool hops between spots around the piece and dips to weld each one.
    let hand = { x: table.x - 0.1, y: table.y - 0.1, z: table.z + 0.6 };
    let welding = false;
    if (e.active) {
      const beat = time / 650 + e.id * 0.37;
      const k = Math.floor(beat), f = beat - k;
      const spot = (n: number) => { const a = n * 2.4; return { x: table.x + Math.cos(a) * 0.22, y: table.y + Math.sin(a) * 0.22 }; };
      const a = spot(k), b = spot(k + 1);
      const m = Math.min(1, f / 0.4);
      const s = m * m * (3 - 2 * m);
      welding = f > 0.5;
      hand = { x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s, z: table.z + 0.3 + (welding ? 0 : 0.25 * Math.sin(m * Math.PI) + 0.08) };
    }
    const L = 0.64 * Math.hypot(table.x - shoulder.x, table.y - shoulder.y, table.z - shoulder.z) + 0.05;
    const D = Math.hypot(hand.x - shoulder.x, hand.y - shoulder.y, hand.z - shoulder.z);
    const up = Math.sqrt(Math.max(0, L * L - (D / 2) ** 2));
    const elbow = { x: (hand.x + shoulder.x) / 2, y: (hand.y + shoulder.y) / 2, z: (hand.z + shoulder.z) / 2 + up };
    const S = proj(shoulder), E = proj(elbow), H = proj(hand);
    this.segment(`l${e.id}`, 'ip_assembler_arm', S, E, v.zoom, depth + 0.0001, 0xd8d8d8, 13);
    this.segment(`u${e.id}`, 'ip_assembler_arm', E, H, v.zoom, depth + 0.0002, 0xffffff, 12);
    // The tool carries on from the forearm, bent down toward the work.
    const tool = this.parts.get(`h${e.id}`);
    if (tool.texture.key !== 'ip_assembler_tool') tool.setTexture('ip_assembler_tool');
    const ang = Math.atan2(H.y - E.y, H.x - E.x);
    const rot = Math.atan2(Math.sin(ang) * 0.4 + 0.6, Math.cos(ang) * 0.4);
    const ts = 0.4 * TILE_W * v.zoom / tool.width;
    tool.setOrigin(0.08, 0.5).setPosition(H.x, H.y).setScale(ts).setRotation(rot).setFlipY(Math.cos(rot) < 0).setDepth(depth + 0.0003).clearTint();
    if (welding) {
      const tip = { x: H.x + Math.cos(rot) * tool.width * ts * 0.9, y: H.y + Math.sin(rot) * tool.width * ts * 0.9 };
      if (Math.floor(time / 40) % 2) {
        this.overlay.fillStyle(0x80c8ff, 0.55).fillCircle(tip.x, tip.y, 5 * v.zoom);
        this.overlay.fillStyle(0xffffff, 0.95).fillCircle(tip.x, tip.y, 2 * v.zoom);
      }
      if (this.fx && Math.random() < 0.15) {
        const t = this.lift(v, e, tip);
        this.fx.sparks(t.x, t.y, t.z, [0xbfe4ff, 0xffffff, 0xffe080]);
      }
    }
  }

  /** The old drawn arm, while the painted parts load. */
  private drawInserterShapes(v: View, e: FEntity, g: Phaser.GameObjects.Graphics) {
    const [dx, dy] = DIRS[e.rot];
    const c = this.at(v, e.x + 0.5, e.y + 0.5);
    const s = e.swing ?? 0;
    const h = this.at(v, e.x + 0.5 + dx * (s - 0.5) * 1.1, e.y + 0.5 + dy * (s - 0.5) * 1.1);
    const lift = 18 * v.zoom;
    const elbow = { x: (c.x + h.x) / 2, y: (c.y + h.y) / 2 - lift * 1.6 };
    g.fillStyle(0x2c3036, 1).fillEllipse(c.x, c.y, 26 * v.zoom, 13 * v.zoom);
    const [c1, c2] = e.kind === 'burner_inserter' ? [0x5a5048, 0x7a6a5a] : [0xe0a82a, 0xf0c040];
    g.lineStyle(5 * v.zoom, c1, 1).lineBetween(c.x, c.y - 6 * v.zoom, elbow.x, elbow.y);
    g.lineStyle(4 * v.zoom, c2, 1).lineBetween(elbow.x, elbow.y, h.x, h.y - lift * 0.5);
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
