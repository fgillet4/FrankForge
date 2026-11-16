/**
 * Draws the process plant in the isometric world: building sprites, pipes coloured by what they
 * carry, port markers, the placement ghost and ruptures.
 *
 * Sprites are 128 px per tile wide and anchored at their bottom centre, which sits on the bottom
 * corner of the footprint's diamond.
 */

import Phaser from 'phaser';
import { TILE_W, TILE_H, isoToScreen } from '../phaser/isoMath';
import { PROTO, portTiles, type EntityView, type Snapshot, type VesselView } from './engine';

const SPRITE_TILE_PX = 128;

export const BUILDING_SPRITES = [
  'valve', 'check_valve', 'pump', 'compressor', 'storage_tank', 'gas_sphere', 'water_well', 'gas_well',
  'air_intake', 'vent', 'flare_stack', 'fired_boiler', 'steam_turbine', 'condenser', 'solar_array',
  'battery_bank', 'heat_exchanger', 'electric_heater', 'flash_drum', 'smr_reformer', 'shift_reactor',
  'ammonia_converter', 'methanol_reactor', 'cracker_furnace', 'electrolyser', 'power_pole', 'wreck',
];

/** Colour of a fluid by what dominates it. */
const SPECIES_COLOUR: Record<string, number> = {
  h2: 0x5fe3ff, o2: 0x8fb8ff, n2: 0xb7a8d9, ch4: 0xff9d3c, co: 0x5a5a64, co2: 0xd8d8d8, h2o: 0x2f7fff,
  nh3: 0xc6e85a, c2h4: 0xff8fd0, c2h6: 0xffbf8f, ch3oh: 0xb48cff,
};

export function fluidColour(v: VesselView): number {
  let best = 'n2';
  let max = -1;
  for (const [id, frac] of Object.entries(v.z)) {
    if (frac > max) { max = frac; best = id; }
  }
  // Steam reads differently from liquid water.
  if (best === 'h2o' && v.beta > 0.5) return 0xf0f0f0;
  return SPECIES_COLOUR[best] ?? 0x999999;
}

/** A sprite sheet from art/animate.py: cell size, playback, and where the static sprite's anchor sits. */
interface AnimMeta { frames: number; w: number; h: number; fps: number; loop: boolean; ox: number; oy: number }

export let ANIMS: Record<string, AnimMeta> = {};

export function preloadProcessAssets(scene: Phaser.Scene) {
  for (const id of BUILDING_SPRITES) {
    scene.load.image(`pb_${id}`, `assets/process/buildings/${id}.png`);
  }
  scene.load.json('pp_anims', 'assets/process/anim/anims.json');
  scene.load.once('filecomplete-json-pp_anims', (_key: string, _type: string, data: Record<string, AnimMeta>) => {
    ANIMS = data;
    for (const [name, m] of Object.entries(data)) {
      scene.load.spritesheet(`pa_${name}`, `assets/process/anim/${name}.webp`, { frameWidth: m.w, frameHeight: m.h });
    }
  });
}

export function createAnims(scene: Phaser.Scene) {
  for (const [name, m] of Object.entries(ANIMS)) {
    if (scene.anims.exists(`pa_${name}`) || !scene.textures.exists(`pa_${name}`)) continue;
    scene.anims.create({
      key: `pa_${name}`, frameRate: m.fps, repeat: m.loop ? -1 : 0,
      frames: scene.anims.generateFrameNumbers(`pa_${name}`, { start: 0, end: m.frames - 1 }),
    });
  }
}

const FLAMMABLE = ['h2', 'ch4', 'co', 'c2h4', 'c2h6', 'ch3oh', 'nh3'];

/** Whether a building is doing something worth animating. */
function isRunning(e: EntityView, snap: Snapshot): boolean {
  if (!e.enabled) return false;
  if (e.proto === 'power_pole') return !snap.grid.blackout && Math.abs(snap.grid.frequency - snap.grid.nominal) > 0.5;
  if (e.battery) return !snap.grid.blackout && snap.grid.generation_w > 0;
  return e.generation_w > 1 || e.power_w > 1
    || e.pipes.some(p => Math.abs(p.mdot) > 1e-3)
    || e.vessels.some(v => v.reactions.some(r => r.rate > 1e-4));
}

/**
 * A walking character (the engineer, or an alien): walks and idles in the four isometric
 * diagonals. Sheets exist for facing the viewer (se) and facing away (ne); the other two are those
 * mirrored. Characters without idle sheets keep their walk.
 */
export class CharacterSprite {
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private away = false;
  private flip = false;
  moving = false;
  /** An action that overrides walking and idling while its sheets exist, e.g. 'build' or 'attack'. */
  action: string | null = null;

  constructor(private scene: Phaser.Scene, private kind = 'char') {}

  /** Faces the way an iso-space step (dx, dy) goes on screen. */
  face(dx: number, dy: number) {
    const sx = dx - dy;
    const sy = dx + dy;
    if (sy !== 0) this.away = sy < 0;
    if (sx !== 0) this.flip = sx < 0;
  }

  /** Draws at a tile position; false when the sheets aren't loaded, so the caller can fall back. */
  draw(x: number, y: number, camX: number, camY: number, zoom: number): boolean {
    const dir = this.away ? 'ne' : 'se';
    const name = this.action && ANIMS[`${this.kind}_${this.action}_${dir}`] ? `${this.kind}_${this.action}_${dir}`
      : this.moving || !ANIMS[`${this.kind}_idle_${dir}`] ? `${this.kind}_walk_${dir}` : `${this.kind}_idle_${dir}`;
    const m = ANIMS[name];
    if (!m || !this.scene.anims.exists(`pa_${name}`)) {
      createAnims(this.scene);
      if (!this.scene.anims.exists(`pa_${name}`)) return false;
    }
    if (!this.sprite) this.sprite = this.scene.add.sprite(0, 0, `pa_${name}`);
    if (this.sprite.anims.currentAnim?.key !== `pa_${name}`) this.sprite.play(`pa_${name}`).setOrigin(m.ox, m.oy);
    const p = isoToScreen(x, y, camX, camY, zoom);
    this.sprite.setPosition(p.x, p.y + (TILE_H * zoom) / 2).setScale((TILE_W * zoom) / SPRITE_TILE_PX);
    this.sprite.setFlipX(this.flip).setDepth(10 + (x + y) * 0.01);
    return true;
  }

  destroy() {
    this.sprite?.destroy();
    this.sprite = null;
  }
}

/** A one-off or timed effect pinned to a tile position. */
interface Fx { sprite: Phaser.GameObjects.Sprite; x: number; y: number; size: number; until: number }

interface Ghost { proto: string; x: number; y: number; rot: number; ok: boolean }

export class ProcessLayer {
  private images = new Map<number, Phaser.GameObjects.Sprite>();
  private fx: Fx[] = [];
  /** Effects that last as long as a condition holds, by entity id: leaks while over-pressured, fires on wrecks. */
  private held = new Map<string, Fx>();
  private wasRuptured = new Set<number>();
  private wasBlackout = false;
  private pipeGfx: Phaser.GameObjects.Graphics;
  private overlayGfx: Phaser.GameObjects.Graphics;
  private ghostImg: Phaser.GameObjects.Image | null = null;
  private wrecks: { x: number; y: number; img: Phaser.GameObjects.Image }[] = [];
  private pipeTiles = new Map<string, number>();
  selected: number | null = null;

  constructor(private scene: Phaser.Scene) {
    this.pipeGfx = scene.add.graphics().setDepth(5);
    this.overlayGfx = scene.add.graphics().setDepth(900);
    createAnims(scene);
  }

  private spawn(name: string, x: number, y: number, size: number, until = Infinity): Fx | null {
    // Pick between an effect's variants (fx_fire, fx_fire2, ...) when there are several.
    if (ANIMS[`${name}2`] && Math.random() < 0.5) name = `${name}2`;
    const m = ANIMS[name];
    if (!m || !this.scene.anims.exists(`pa_${name}`)) return null;
    const sprite = this.scene.add.sprite(0, 0, `pa_${name}`).setOrigin(m.ox, m.oy);
    sprite.play(`pa_${name}`);
    const fx = { sprite, x, y, size, until };
    if (!m.loop) sprite.once('animationcomplete', () => { fx.until = 0; });
    this.fx.push(fx);
    return fx;
  }

  /** Starts and stops effects from what changed in the plant since the last frame. */
  private updateEffects(snap: Snapshot, time: number) {
    const held = new Set<string>();
    for (const e of snap.entities) {
      const n = PROTO[e.proto]?.size ?? 1;
      const ruptured = e.vessels.some(v => v.ruptured);
      if (ruptured && !this.wasRuptured.has(e.id)) this.spawn('fx_explosion', e.x + n, e.y + n, Math.max(1, n) / 4.5);
      if (ruptured) this.wasRuptured.add(e.id); else this.wasRuptured.delete(e.id);
      // A burst vessel that held anything flammable keeps burning.
      if (ruptured && e.vessels.some(v => FLAMMABLE.some(s => (v.z[s] ?? 0) > 0.05))) {
        held.add(`fire${e.id}`);
        if (!this.held.has(`fire${e.id}`)) {
          const f = this.spawn('fx_fire', e.x + n * 0.75, e.y + n * 0.95, n * 0.8);
          if (f) this.held.set(`fire${e.id}`, f);
        }
      }
      // A burst vessel that held liquid leaves a spreading puddle.
      if (ruptured && e.vessels.some(v => v.ruptured && v.level > 0.02)) held.add(`spill${e.id}`);
      if (held.has(`spill${e.id}`) && !this.held.has(`spill${e.id}`)) {
        const f = this.spawn('fx_spill', e.x + n * 0.5, e.y + n * 1.05, n * 0.7);
        if (f) this.held.set(`spill${e.id}`, f);
      }
      // Toxic gas drifting off a vent that is releasing ammonia or carbon monoxide.
      if (e.proto === 'vent' && e.pipes.some(p => Math.abs(p.mdot) > 1e-3)
        && e.vessels.some(v => (v.z.nh3 ?? 0) + (v.z.co ?? 0) > 0.02)) {
        held.add(`toxic${e.id}`);
        if (!this.held.has(`toxic${e.id}`)) {
          const f = this.spawn('fx_toxic', e.x + 1.4, e.y + 1.4, 1.2);
          if (f) this.held.set(`toxic${e.id}`, f);
        }
      }
      // Hissing at the seams as a vessel nears its burst pressure.
      if (!ruptured && e.vessels.some(v => v.p > 0.85 * v.design_p && v.design_p > 0)) {
        held.add(`leak${e.id}`);
        if (!this.held.has(`leak${e.id}`)) {
          const f = this.spawn('fx_leak', e.x + n * 0.6, e.y + n * 0.5, 0.6);
          if (f) this.held.set(`leak${e.id}`, f);
        }
      }
    }
    for (const [k, f] of this.held) {
      if (!held.has(k)) { f.until = 0; this.held.delete(k); }
    }
    // When the grid trips, every pole and generator arcs for a moment.
    if (snap.grid.blackout && !this.wasBlackout) {
      for (const e of snap.entities) {
        if (e.proto === 'power_pole' || e.generation_w > 0 || PROTO[e.proto]?.generator_w) {
          const n = PROTO[e.proto]?.size ?? 1;
          this.spawn('fx_sparks', e.x + n * 0.5, e.y + n * 0.5, 1, time + 1500);
        }
      }
    }
    this.wasBlackout = snap.grid.blackout;
  }

  /** Dust and welding sparks where something was just built. */
  built(proto: string, x: number, y: number) {
    const n = PROTO[proto]?.size ?? 1;
    this.spawn('fx_build', x + n, y + n, n * 0.5);
  }

  private drawEffects(camX: number, camY: number, zoom: number, time: number) {
    this.fx = this.fx.filter(f => {
      if (time > f.until) { f.sprite.destroy(); return false; }
      const p = isoToScreen(f.x, f.y, camX, camY, zoom);
      f.sprite.setPosition(p.x, p.y).setScale((TILE_W * zoom * f.size) / SPRITE_TILE_PX);
      f.sprite.setDepth(11 + (f.x + f.y) * 0.01);
      return true;
    });
  }

  /** Redraws everything for the current camera. */
  draw(snap: Snapshot | null, camX: number, camY: number, zoom: number, ghost: Ghost | null, time: number) {
    this.pipeGfx.clear();
    this.overlayGfx.clear();
    if (!snap) return;
    const seen = new Set<number>();

    // Pipes: a segment's tiles share one colour; join each tile to its pipe neighbours and to
    // building ports that open onto it.
    this.pipeTiles.clear();
    snap.segments.forEach((seg, si) => seg.tiles.forEach(([x, y]) => this.pipeTiles.set(`${x},${y}`, si)));
    const centre = (x: number, y: number) => {
      const p = isoToScreen(x + 0.5, y + 0.5, camX, camY, zoom);
      return { x: p.x, y: p.y - TILE_H * zoom * 0.18 };
    };
    const portLinks: { from: { x: number; y: number }; to: { x: number; y: number }; colour: number }[] = [];
    for (const e of snap.entities) {
      const proto = PROTO[e.proto];
      if (!proto) continue;
      for (const pt of portTiles(proto, e.x, e.y, e.rot)) {
        const si = this.pipeTiles.get(`${pt.outside[0]},${pt.outside[1]}`);
        if (si === undefined) continue;
        portLinks.push({ from: centre(...pt.outside), to: centre(...pt.inside), colour: fluidColour(snap.segments[si].vessel) });
      }
    }
    const w = Math.max(2, 7 * zoom);
    for (const pass of [0, 1]) {
      snap.segments.forEach(seg => {
        const colour = fluidColour(seg.vessel);
        for (const [x, y] of seg.tiles) {
          const c = centre(x, y);
          const links = [[1, 0], [0, 1]].filter(([dx, dy]) => this.pipeTiles.has(`${x + dx},${y + dy}`));
          for (const [dx, dy] of links) {
            const n = centre(x + dx, y + dy);
            this.pipeGfx.lineStyle(pass ? w * 0.45 : w, pass ? colour : 0x2a2f36, 1).lineBetween(c.x, c.y, n.x, n.y);
          }
          // Flanged joint.
          this.pipeGfx.fillStyle(pass ? colour : 0x3a4048, 1).fillCircle(c.x, c.y, pass ? w * 0.3 : w * 0.62);
        }
      });
      for (const l of portLinks) {
        const mx = l.from.x + (l.to.x - l.from.x) * 0.5;
        const my = l.from.y + (l.to.y - l.from.y) * 0.5;
        this.pipeGfx.lineStyle(pass ? w * 0.45 : w, pass ? l.colour : 0x2a2f36, 1).lineBetween(l.from.x, l.from.y, mx, my);
      }
    }

    // Buildings.
    for (const e of snap.entities) {
      const proto = PROTO[e.proto];
      if (!proto) continue;
      seen.add(e.id);
      let img = this.images.get(e.id);
      const ruptured = e.vessels.some(v => v.ruptured);
      const name = ruptured ? 'wreck' : e.proto;
      const anim = ANIMS[name] && (ruptured || isRunning(e, snap)) && this.scene.anims.exists(`pa_${name}`) ? ANIMS[name] : null;
      if (!img) {
        img = this.scene.add.sprite(0, 0, `pb_${name}`).setOrigin(0.5, 1);
        this.images.set(e.id, img);
      }
      if (anim) {
        if (img.anims.currentAnim?.key !== `pa_${name}` || !img.anims.isPlaying) {
          // Start identical machines at different points of their cycle.
          img.play({ key: `pa_${name}`, startFrame: e.id % anim.frames });
          img.setOrigin(anim.ox, anim.oy);
        }
      } else if (img.anims.isPlaying || img.texture.key !== `pb_${name}`) {
        img.stop();
        img.setTexture(`pb_${name}`).setOrigin(0.5, 1);
      }
      const n = proto.size;
      const bottom = isoToScreen(e.x + n, e.y + n, camX, camY, zoom);
      img.setPosition(bottom.x, bottom.y + TILE_H * zoom * 0.08);
      img.setScale((TILE_W * zoom) / SPRITE_TILE_PX);
      img.setFlipX(e.rot % 2 === 1);
      img.setDepth(10 + (e.x + e.y + 2 * n) * 0.01);
      img.setTint(e.id === this.selected ? 0xfff2b0 : 0xffffff);
      // A glow on lit fireboxes and flare stacks that have no animation of their own.
      const fire = e.vessels.find(v => v.reactions.some(r => r.name.includes('combustion') && r.rate > 1e-3));
      if (fire && !ruptured && !anim) {
        const flicker = 0.75 + 0.25 * Math.sin(time * 0.02 + e.id);
        const top = isoToScreen(e.x + n / 2, e.y + n / 2, camX, camY, zoom);
        this.overlayGfx.fillStyle(0xff8a1c, 0.35 * flicker).fillCircle(top.x, top.y - TILE_H * zoom * 0.5, 10 * zoom * flicker);
      }
    }
    this.updateEffects(snap, time);
    this.drawEffects(camX, camY, zoom, time);
    for (const [id, img] of this.images) {
      if (!seen.has(id)) {
        img.destroy();
        this.images.delete(id);
      }
    }

    // Ports of the selected building, so its orientation is clear.
    const sel = snap.entities.find(e => e.id === this.selected);
    if (sel) this.drawPorts(sel.proto, sel.x, sel.y, sel.rot, camX, camY, zoom);
    if (ghost) this.drawGhost(ghost, camX, camY, zoom);
    else this.ghostImg?.setVisible(false);
  }

  private drawPorts(protoId: string, x: number, y: number, rot: number, camX: number, camY: number, zoom: number) {
    const proto = PROTO[protoId];
    if (!proto) return;
    for (const pt of portTiles(proto, x, y, rot)) {
      const c = isoToScreen(pt.outside[0] + 0.5, pt.outside[1] + 0.5, camX, camY, zoom);
      const colour = pt.port.at === 'Top' ? 0xffe066 : pt.port.at === 'Bottom' ? 0x4fa3ff : 0x9cff8f;
      this.overlayGfx.lineStyle(2, 0x000000, 0.8).fillStyle(colour, 0.9);
      this.overlayGfx.fillCircle(c.x, c.y, 5 * zoom).strokeCircle(c.x, c.y, 5 * zoom);
    }
  }

  private drawGhost(g: Ghost, camX: number, camY: number, zoom: number) {
    const proto = PROTO[g.proto];
    if (!proto) return;
    const n = proto.size;
    // Footprint.
    const pts = [
      isoToScreen(g.x, g.y, camX, camY, zoom), isoToScreen(g.x + n, g.y, camX, camY, zoom),
      isoToScreen(g.x + n, g.y + n, camX, camY, zoom), isoToScreen(g.x, g.y + n, camX, camY, zoom),
    ];
    this.overlayGfx.fillStyle(g.ok ? 0x44ff88 : 0xff4444, 0.22).lineStyle(2, g.ok ? 0x44ff88 : 0xff4444, 0.9);
    this.overlayGfx.fillPoints(pts, true).strokePoints(pts, true);
    if (g.proto !== 'pipe') {
      if (!this.ghostImg) this.ghostImg = this.scene.add.image(0, 0, `pb_${g.proto}`).setOrigin(0.5, 1).setDepth(899);
      if (this.ghostImg.texture.key !== `pb_${g.proto}`) this.ghostImg.setTexture(`pb_${g.proto}`);
      const bottom = isoToScreen(g.x + n, g.y + n, camX, camY, zoom);
      this.ghostImg.setVisible(true).setAlpha(0.6).setPosition(bottom.x, bottom.y).setScale((TILE_W * zoom) / SPRITE_TILE_PX);
      this.ghostImg.setFlipX(g.rot % 2 === 1).setTint(g.ok ? 0xffffff : 0xff8080);
    } else {
      this.ghostImg?.setVisible(false);
    }
    this.drawPorts(g.proto, g.x, g.y, g.rot, camX, camY, zoom);
  }

  /** Segment index under a tile, if it is a pipe. */
  segmentAt(x: number, y: number): number | undefined {
    return this.pipeTiles.get(`${x},${y}`);
  }

  destroy() {
    this.images.forEach(i => i.destroy());
    this.images.clear();
    this.wrecks.forEach(w => w.img.destroy());
    this.fx.forEach(f => f.sprite.destroy());
    this.pipeGfx.destroy();
    this.overlayGfx.destroy();
    this.ghostImg?.destroy();
  }
}
