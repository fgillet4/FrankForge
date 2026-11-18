/**
 * Draws the process plant in the isometric world: building sprites, pipes coloured by what they
 * carry, port markers, the placement ghost and ruptures.
 *
 * Sprites are 128 px per tile wide and anchored at their bottom centre, which sits on the bottom
 * corner of the footprint's diamond.
 */

import Phaser from 'phaser';
import { TILE_W, TILE_H, isoToScreen } from '../phaser/isoMath';
import { ITEMS, iconUrl } from '../game/items';
import { popScale } from '../game/juice';
import { drillPainting } from '../game/draw';
import { JOIN_BIT, PROTO, layout, placedById, portTiles, type EntityView, type Snapshot, type VesselView } from './engine';
import { LIMITS, OVER, RAMP_CSS, hydraulics, nodeKey, problems, ramp, stats, type PipeNode } from './hydraulics';

/**
 * The painted rack trestles: where their beams sit and their feet stand, as fractions of the
 * image's height. Pipes rest on the beams.
 */
const TRESTLE = { low: { beam: 0.27, foot: 0.87 }, high: { mid: 0.53, top: 0.2, foot: 0.89 } };

/** How high a rack height is drawn above the ground [screen px]. */
export function rackLift(level: number, zoom: number): number {
  if (!level) return 0;
  const lowH = TILE_H * zoom * 2.2;
  const lift1 = (TRESTLE.low.foot - TRESTLE.low.beam) * lowH;
  if (level === 1) return lift1 + 3 * zoom;
  return (TRESTLE.high.foot - TRESTLE.high.top) * lift1 / (TRESTLE.high.foot - TRESTLE.high.mid) + 3 * zoom;
}

const SPRITE_TILE_PX = 128;

export const BUILDING_SPRITES = [
  'valve', 'check_valve', 'relief_valve', 'pump', 'compressor', 'storage_tank', 'gas_sphere', 'water_well', 'gas_well',
  'air_intake', 'vent', 'flare_stack', 'fired_boiler', 'steam_turbine', 'condenser', 'solar_array',
  'battery_bank', 'heat_exchanger', 'electric_heater', 'flash_drum', 'smr_reformer', 'shift_reactor',
  'ammonia_converter', 'methanol_reactor', 'cracker_furnace', 'electrolyser', 'power_pole', 'wreck',
  'burner_drill', 'electric_drill', 'stone_furnace', 'electric_furnace', 'assembler', 'lab', 'chemical_plant',
  'wooden_chest', 'iron_chest', 'inserter', 'gun_turret', 'laser_turret', 'substation', 'cstr', 'burner_generator',
  'charcoal_kiln', 'water_wheel',
];

/** Colour of a fluid by what dominates it. */
const SPECIES_COLOUR: Record<string, number> = {
  h2: 0x5fe3ff, o2: 0x8fb8ff, n2: 0xb7a8d9, ch4: 0xff9d3c, co: 0x5a5a64, co2: 0xd8d8d8, h2o: 0x2f7fff,
  nh3: 0xc6e85a, c2h4: 0xff8fd0, c2h6: 0xffbf8f, ch3oh: 0xb48cff,
};

/** A fluid's colour washed over grey steel: a hint of what's inside. */
function wash(c: number): number {
  const mix = (v: number) => Math.round(255 - (255 - v) * 0.4);
  return (mix(c >> 16 & 255) << 16) | (mix(c >> 8 & 255) << 8) | mix(c & 255);
}

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
  // Inserter parts, assembled and moved by the world renderer.
  for (const kind of ['inserter', 'burner_inserter']) {
    for (const part of ['base', 'arm', 'hand']) scene.load.image(`ip_${kind}_${part}`, `assets/process/parts/${kind}_${part}.png`);
  }
  for (const kind of ['gun_turret', 'laser_turret']) {
    for (const part of ['base', 'head', 'barrel']) scene.load.image(`ip_${kind}_${part}`, `assets/process/parts/${kind}_${part}.png`);
  }
  for (const kind of ['burner_drill', 'electric_drill', 'stone_furnace', 'electric_furnace', 'assembler']) scene.load.image(`ip_${kind}_frame`, `assets/process/parts/${kind}_frame.png`);
  for (const id of Object.keys(PAINTED)) scene.load.image(`pf_${id}`, `assets/process/parts/${id}_frame.png`);
  for (const part of ['drill_bit', 'electric_furnace_crucible', 'assembler_arm', 'assembler_tool', 'pipe', 'pipe_nozzle', 'pipe_joint', 'rack_low', 'rack_high',
    'fire_coals', 'fire_flame_a', 'fire_flame_b', 'burner_drill_frame_back', 'electric_drill_frame_back']) {
    scene.load.image(`ip_${part}`, `assets/process/parts/${part}.png`);
  }
  // Item icons, for things carried on belts and in hands.
  for (const id of Object.keys(ITEMS)) scene.load.image(`ic_${id}`, iconUrl(id));
  scene.load.atlas('nature', 'assets/process/nature.png', 'assets/process/nature.json');
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

/**
 * Inline fittings, bolted into the line by their flanges: the centres of the two flange faces in
 * the painting [px, left one first], and how far out from the fitting's centre they reach on the
 * line [tiles]. The paintings run up to the right, so a line that falls to the right flips them.
 */
const INLINE: Record<string, [[number, number], [number, number]]> = {
  valve: [[6, 106], [120, 70]],
  check_valve: [[6, 64], [122, 36]],
  relief_valve: [[6, 112], [117, 64]],
};
const INLINE_REACH = 0.62;

/**
 * The wind at a moment of the game [s]: a breeze that strengthens, eases and swings round over
 * the day. Its way across the map in tiles (x, y, a unit vector) and its speed [m/s].
 */
export function wind(time: number) {
  const speed = Math.max(0.3, 3.2 + 2.1 * Math.sin(time / 173) + 1.1 * Math.sin(time / 41 + 1.3) + 0.5 * Math.sin(time / 13));
  const a = 0.8 + 0.9 * Math.sin(time / 311) + 0.3 * Math.sin(time / 67);
  return { x: Math.cos(a), y: Math.sin(a), speed };
}

/** A row of like things on a painted frame: the first and last, as fractions of the image. */
interface Row { from: [number, number]; to: [number, number]; count: number }

/**
 * Process buildings painted as a still frame with their fire drawn on live: the row of peep
 * windows and the size of a pane (half its width as a share of the spacing, half its height as a
 * share of the image), floor burners where they show, a roof that shimmers over roof burners, and
 * the top of the flue.
 */
const PAINTED: Record<string, { windows?: Row; pane?: [number, number]; burners?: Row; roof?: [number, number, number]; stack?: [number, number]; fan?: [number, number, number, number] }> = {
  cracker_furnace: {
    windows: { from: [0.2, 0.548], to: [0.664, 0.748], count: 10 }, pane: [0.3, 0.017],
    burners: { from: [0.19, 0.738], to: [0.625, 0.927], count: 10 }, stack: [0.738, 0.02],
  },
  // The fan: centre of its shroud's opening, and the opening's half width and height.
  compressor: { fan: [0.68, 0.275, 0.096, 0.051] },
  smr_reformer: {
    windows: { from: [0.065, 0.492], to: [0.531, 0.697], count: 9 }, pane: [0.36, 0.022],
    roof: [0.36, 0.3, 0.5], stack: [0.935, 0.021],
  },
};

/** Roughly what colour steel and brick glow at a temperature [K], and how brightly. */
function heatGlow(t: number): [number, number] {
  const stops: [number, number][] = [[750, 0x4a0800], [900, 0xb02008], [1050, 0xff5a10], [1200, 0xffa030], [1400, 0xffe0a0]];
  if (t <= stops[0][0]) return [stops[0][1], 0];
  const a = Math.min(1, (t - 750) / 300);
  for (let i = 1; i < stops.length; i++) {
    if (t > stops[i][0]) continue;
    const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(c0), Phaser.Display.Color.ValueToColor(c1), 100, (t - t0) / (t1 - t0) * 100);
    return [Phaser.Display.Color.GetColor(c.r, c.g, c.b), a];
  }
  return [stops[stops.length - 1][1], a];
}

const FLAMMABLE = ['h2', 'ch4', 'co', 'c2h4', 'c2h6', 'ch3oh', 'nh3'];

/** Whether a building is doing something worth animating. */
function isRunning(e: EntityView, snap: Snapshot): boolean {
  if (!e.enabled) return false;
  // Flares keep a pilot flame.
  if (e.proto === 'flare_stack') return true;
  // The river turns a wheel whether or not anything draws on it.
  if (e.proto === 'water_wheel') return true;
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
/**
 * Gait of each character's walk sheet, measured from the sheets: frames per full stride (left
 * and right step) and the ground a stride covers [tiles]. Walk playback scales with speed so the
 * feet don't slide.
 */
const GAIT: Record<string, { frames: number; stride: number }> = {
  char: { frames: 12, stride: 1.4 },
  alien: { frames: 5, stride: 0.7 },
};

export class CharacterSprite {
  private sprite: Phaser.GameObjects.Sprite | null = null;
  /** How fast it is moving [tiles/s], for the walk cycle. */
  speed = 0;
  private away = false;
  private flip = false;
  moving = false;
  /** An action that overrides walking and idling while its sheets exist, e.g. 'build' or 'attack'. */
  action: string | null = null;
  /** Flashes white until then [ms], after a hit. */
  flashUntil = 0;

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
    const gait = GAIT[this.kind];
    this.sprite.anims.timeScale = name.includes('_walk_') && this.moving && gait && this.speed > 0
      ? (this.speed / gait.stride) * gait.frames / m.fps
      : 1;
    const p = isoToScreen(x, y, camX, camY, zoom);
    this.sprite.setPosition(p.x, p.y + (TILE_H * zoom) / 2).setScale((TILE_W * zoom) / SPRITE_TILE_PX);
    this.sprite.setFlipX(this.flip).setDepth(10 + (x + y) * 0.01);
    // A white flash when hit.
    if (this.scene.time.now < this.flashUntil) this.sprite.setTintFill(0xffffff); else if (this.sprite.tintFill) this.sprite.clearTint();
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

/** A point on screen that hits a sprite where it's drawn opaque, not just its bounding box. */
export function hitsSprite(s: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image, x: number, y: number): boolean {
  if (!s.visible || !s.getBounds().contains(x, y)) return false;
  // Flipped sprites mirror about their origin.
  let lx = (x - s.x) / s.scaleX + s.displayOriginX;
  const ly = (y - s.y) / s.scaleY + s.displayOriginY;
  if (s.flipX) lx = 2 * s.displayOriginX - lx;
  return (s.scene.textures.getPixelAlpha(Math.floor(lx), Math.floor(ly), s.texture.key, s.frame.name) ?? 0) > 60;
}

/**
 * Where an inserter takes from (green) and puts to (yellow), with an arrow across. Rot is the
 * drop direction, as for belts.
 */
export function drawInserterFlow(g: Phaser.GameObjects.Graphics, x: number, y: number, rot: number,
  camX: number, camY: number, zoom: number, alpha = 1) {
  const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][rot % 4];
  const at = (ix: number, iy: number) => isoToScreen(ix, iy, camX, camY, zoom);
  const diamond = (cx: number, cy: number, colour: number) => {
    const r = 0.36;
    const pts = [at(cx - r, cy - r), at(cx + r, cy - r), at(cx + r, cy + r), at(cx - r, cy + r)];
    g.fillStyle(colour, 0.18 * alpha).fillPoints(pts, true);
    g.lineStyle(Math.max(1.5, 2 * zoom), colour, 0.9 * alpha).strokePoints(pts, true);
  };
  const cx = x + 0.5, cy = y + 0.5;
  diamond(cx - dx, cy - dy, 0x6fe08a);
  diamond(cx + dx, cy + dy, 0xffd23a);
  // Arrow from the pickup tile to the drop tile.
  const [px, py] = [-dy, dx];
  const from = at(cx - dx * 0.75, cy - dy * 0.75), tip = at(cx + dx * 0.95, cy + dy * 0.95);
  const l = at(cx + dx * 0.6 + px * 0.22, cy + dy * 0.6 + py * 0.22), r = at(cx + dx * 0.6 - px * 0.22, cy + dy * 0.6 - py * 0.22);
  g.lineStyle(Math.max(3, 5 * zoom), 0x000000, 0.45 * alpha).lineBetween(from.x, from.y, tip.x, tip.y);
  g.lineStyle(Math.max(1.5, 2.5 * zoom), 0xffffff, 0.95 * alpha).lineBetween(from.x, from.y, tip.x, tip.y);
  g.fillStyle(0xffffff, 0.95 * alpha).fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
}

/** Where a drill's ore comes out: an arrow from the middle of the side it faces to the tile it drops on. */
export function drawDrillOutput(g: Phaser.GameObjects.Graphics, x: number, y: number, size: number, rot: number,
  out: [number, number], camX: number, camY: number, zoom: number, alpha = 1) {
  const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][rot % 4];
  const at = (ix: number, iy: number) => isoToScreen(ix, iy, camX, camY, zoom);
  const cx = out[0] + 0.5, cy = out[1] + 0.5, r = 0.36;
  const pts = [at(cx - r, cy - r), at(cx + r, cy - r), at(cx + r, cy + r), at(cx - r, cy + r)];
  g.fillStyle(0xffd23a, 0.22 * alpha).fillPoints(pts, true);
  g.lineStyle(Math.max(1.5, 2 * zoom), 0xffd23a, 0.95 * alpha).strokePoints(pts, true);
  const [px, py] = [-dy, dx];
  const from = at(cx - dx * 0.95, cy - dy * 0.95), tip = at(cx + dx * 0.15, cy + dy * 0.15);
  const l = at(cx - dx * 0.15 + px * 0.2, cy - dy * 0.15 + py * 0.2), rr = at(cx - dx * 0.15 - px * 0.2, cy - dy * 0.15 - py * 0.2);
  g.lineStyle(Math.max(3, 5 * zoom), 0x000000, 0.45 * alpha).lineBetween(from.x, from.y, tip.x, tip.y);
  g.lineStyle(Math.max(1.5, 2.5 * zoom), 0xffffff, 0.95 * alpha).lineBetween(from.x, from.y, tip.x, tip.y);
  g.fillStyle(0xffffff, 0.95 * alpha).fillTriangle(tip.x, tip.y, l.x, l.y, rr.x, rr.y);
  void size;
}

/** Something picked on screen: the tile it stands on and how far forward it's drawn. */
export interface Pick { tx: number; ty: number; depth: number }

export class ProcessLayer {
  private images = new Map<number, Phaser.GameObjects.Sprite>();
  private fx: Fx[] = [];
  /** Effects that last as long as a condition holds, by entity id: leaks while over-pressured, fires on wrecks. */
  private held = new Map<string, Fx>();
  private wasRuptured = new Set<number>();
  private wasBlackout = false;
  private pipeGfx: Phaser.GameObjects.Graphics;
  /** The plant's clock at the last snapshot [s], for the wind. */
  private gameTime = 0;
  /** The live fire on painted buildings, just in front of each. */
  private fireGfx = new Map<number, Phaser.GameObjects.Graphics>();
  /** Each cooler fan's angle and speed (0..1), carried from frame to frame. */
  private fans = new Map<number, { angle: number; speed: number; t: number }>();
  private overlayGfx: Phaser.GameObjects.Graphics;
  private ghostImg: Phaser.GameObjects.Image | null = null;
  private wrecks: { x: number; y: number; img: Phaser.GameObjects.Image }[] = [];
  private pipeTiles = new Map<string, number>();
  /** Pipe on racks: run by nodeKey. */
  private rackNodes = new Map<string, number>();
  /** The height the engineer is working at; what's above it fades. */
  viewLevel = 0;
  /** Painted pipe pieces by tile and direction, and those drawn this frame. */
  private pipeImgs = new Map<string, Phaser.GameObjects.Image>();
  private pipeSeen = new Set<string>();
  /** The flow view: off, pipes coloured by velocity against their limit, or by pressure. */
  flowView: 'off' | 'velocity' | 'pressure' = 'off';
  private flowGfx: Phaser.GameObjects.Graphics;
  private legend: HTMLDivElement | null = null;
  selected: number | null = null;

  constructor(private scene: Phaser.Scene) {
    this.pipeGfx = scene.add.graphics().setDepth(5);
    this.overlayGfx = scene.add.graphics().setDepth(900);
    this.flowGfx = scene.add.graphics().setDepth(902);
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
      // A relief valve lifting roars as it vents.
      const relief = e.pipes.find(p => p.kind.kind === 'Relief')?.kind.lift ?? 0;
      if (relief > 0.02) {
        held.add(`relief${e.id}`);
        if (!this.held.has(`relief${e.id}`)) {
          const f = this.spawn('fx_leak', e.x + 0.5, e.y + 0.2, 0.5 + relief * 0.6);
          if (f) this.held.set(`relief${e.id}`, f);
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
  draw(snap: Snapshot | null, camX: number, camY: number, zoom: number, ghost: Ghost | null, time: number,
    ports: { all: boolean; hovered: number | null } = { all: false, hovered: null },
    /** For factory machines: whether they're working, which beats what the grid says. */
    working: (id: number) => boolean | undefined = () => undefined) {
    if (snap) this.gameTime = snap.time;
    this.pipeGfx.clear();
    this.overlayGfx.clear();
    this.flowGfx.clear();
    if (!snap) { this.showLegend(null); return; }
    const seen = new Set<number>();

    // Pipes: a segment's tiles share one colour; join each tile to its pipe neighbours and to
    // building ports that open onto it.
    this.pipeTiles.clear();
    this.rackNodes.clear();
    snap.segments.forEach((seg, si) => {
      seg.tiles.forEach(([x, y]) => this.pipeTiles.set(`${x},${y}`, si));
      (seg.racks ?? []).forEach(([l, [x, y]]) => this.rackNodes.set(nodeKey(l, x, y), si));
    });
    const centre = (x: number, y: number) => {
      const p = isoToScreen(x + 0.5, y + 0.5, camX, camY, zoom);
      return { x: p.x, y: p.y - TILE_H * zoom * 0.18 };
    };
    // Rack heights on screen, from the trestles: the low beam, and the high one.
    const lowH = TILE_H * zoom * 2.2;
    const lift1 = (TRESTLE.low.foot - TRESTLE.low.beam) * lowH;
    const highH = lift1 / (TRESTLE.high.foot - TRESTLE.high.mid);
    const lifts = [0, rackLift(1, zoom), rackLift(2, zoom)];
    const nc = (l: number, x: number, y: number) => { const c = centre(x, y); return { x: c.x, y: c.y - lifts[l] }; };
    const has = (l: number, x: number, y: number) => (l ? this.rackNodes.has(nodeKey(l, x, y)) : this.pipeTiles.has(`${x},${y}`));
    // Pipe beside pipe joins only where both allow it; runs laid apart pass side by side.
    const joinsAt = new Map<string, number>();
    for (const p of layout()) for (const l of PROTO[p.proto]?.levels ?? []) joinsAt.set(nodeKey(l, p.x, p.y), p.joins ?? 0b1111);
    const linked = (l: number, x: number, y: number, dx: number, dy: number) => has(l, x + dx, y + dy)
      && ((joinsAt.get(nodeKey(l, x, y)) ?? 15) & JOIN_BIT[`${dx},${dy}`]) !== 0
      && ((joinsAt.get(nodeKey(l, x + dx, y + dy)) ?? 15) & JOIN_BIT[`${-dx},${-dy}`]) !== 0;
    const risers = hydraulics(snap).risers;
    const fade = (l: number) => (l > this.viewLevel ? 0.3 : 1);
    // Where pipes meet buildings: the pipe tile outside a port, and which way the port lies.
    const portLinks: { x: number; y: number; dx: number; dy: number; si: number; inline: boolean }[] = [];
    const opens = new Set<string>();
    for (const e of snap.entities) {
      const proto = PROTO[e.proto];
      if (!proto) continue;
      for (const pt of portTiles(proto, e.x, e.y, e.rot)) {
        const si = this.pipeTiles.get(`${pt.outside[0]},${pt.outside[1]}`);
        if (si === undefined) continue;
        const [x, y] = pt.outside;
        portLinks.push({ x, y, dx: pt.inside[0] - x, dy: pt.inside[1] - y, si, inline: e.proto in INLINE });
        opens.add(`${x},${y},${pt.inside[0] - x},${pt.inside[1] - y}`);
      }
    }
    const painted = this.scene.textures.exists('ip_pipe') && this.scene.textures.exists('ip_pipe_joint');
    if (painted) {
      // Painted pipe: flanged lengths bolted together at each tile's centre, a cross fitting where
      // a run turns, branches or ends, and a flanged nozzle where it meets a port. Each run takes
      // a wash of its fluid's colour. Drawn in depth order with the buildings, so they hide it.
      const depthAt = (x: number, y: number) => 10 + (x + y + 2) * 0.01 + 0.0005;
      const DIRS4 = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      const pad = TILE_W * zoom;
      const off = (p: { x: number; y: number }) => p.x < -pad || p.y < -pad || p.x > this.scene.scale.width + pad || p.y > this.scene.scale.height + pad;
      const shadow = (a: { x: number; y: number }, b: { x: number; y: number }) => {
        const lift = TILE_H * zoom * 0.18;
        this.pipeGfx.lineStyle(9 * zoom, 0x000000, 0.18).lineBetween(a.x, a.y + lift, b.x, b.y + lift);
      };
      const trestles = new Map<string, { x: number; y: number; high: boolean; alongX: boolean; end: boolean }>();
      snap.segments.forEach(seg => {
        const tint = wash(fluidColour(seg.vessel));
        // Wider bores draw fatter.
        const fat = Math.min(1.7, Math.max(0.6, Math.pow((seg.diameter || 0.15) / 0.15, 0.6)));
        const nodes: PipeNode[] = [...seg.tiles.map(([x, y]) => [0, x, y] as PipeNode), ...(seg.racks ?? []).map(([l, [x, y]]) => [l, x, y] as PipeNode)];
        for (const [l, x, y] of nodes) {
          const c = nc(l, x, y);
          if (off(c) && off(centre(x, y))) continue;
          const lift = l * 0.002;
          for (const [dx, dy] of [[1, 0], [0, 1]]) {
            if (!linked(l, x, y, dx, dy)) continue;
            const n = nc(l, x + dx, y + dy);
            if (!l) shadow(c, n);
            else this.pipeGfx.lineStyle(6 * zoom, 0x000000, 0.1).lineBetween(centre(x, y).x, centre(x, y).y + TILE_H * zoom * 0.18, centre(x + dx, y + dy).x, centre(x + dx, y + dy).y + TILE_H * zoom * 0.18);
            this.pipeSegment(`p${l},${x},${y},${dx}`, 'ip_pipe', c, n, zoom, depthAt(x + dx, y + dy) - 0.0002 + lift, tint, 13 * fat, 0.035, 0.93).setAlpha(fade(l));
          }
          const riser = risers.has(`${x},${y}`);
          const joined = DIRS4.filter(([dx, dy]) => linked(l, x, y, dx, dy) || (!l && opens.has(`${x},${y},${dx},${dy}`)));
          const straight = !riser && joined.length === 2 && joined[0][0] === -joined[1][0] && joined[0][1] === -joined[1][1];
          if (joined.length === 1 && !riser) {
            // A dead end: the pipe stops at a blind flange.
            const [dx, dy] = joined[0];
            const n = has(l, x + dx, y + dy) ? nc(l, x + dx, y + dy) : centre(x + dx, y + dy);
            const a = { x: c.x + (n.x - c.x) * 0.3, y: c.y + (n.y - c.y) * 0.3 }, b = { x: c.x - (n.x - c.x) * 0.08, y: c.y - (n.y - c.y) * 0.08 };
            this.pipeSegment(`e${l},${x},${y}`, 'ip_pipe_nozzle', a, b, zoom, depthAt(x, y) + lift + 0.0001, tint, 15 * fat, 0, 0.88).setAlpha(fade(l));
          } else if (!straight) {
            const j = this.pipePart(`j${l},${x},${y}`, 'ip_pipe_joint');
            j.setOrigin(0.5, 0.55).setPosition(c.x, c.y).setScale(0.42 * fat * TILE_W * zoom / j.width).setRotation(0).setDepth(depthAt(x, y) + lift + 0.0001).setTint(tint).setAlpha(fade(l));
          }
          // The riser climbs from the ground to the top of the rack.
          if (riser && l === 0) {
            this.pipeSegment(`r${x},${y}`, 'ip_pipe', c, nc(2, x, y), zoom, depthAt(x, y) + 0.003, tint, 15 * fat, 0.035, 0.93).setAlpha(fade(1));
          }
          if (l > 0) {
            const k = `${x},${y}`;
            const t = trestles.get(k) ?? { x, y, high: false, alongX: false, end: false };
            t.high ||= l === 2;
            t.alongX ||= has(l, x + 1, y) || has(l, x - 1, y);
            t.end ||= joined.length < 2;
            trestles.set(k, t);
          }
        }
      });
      // A bent of the rack under every other tile, and at the ends of runs.
      for (const t of trestles.values()) {
        if ((t.x + t.y) % 2 && !t.end) continue;
        const g = centre(t.x, t.y);
        if (off(g)) continue;
        const tex = t.high ? 'ip_rack_high' : 'ip_rack_low';
        if (!this.scene.textures.exists(tex)) continue;
        const img = this.pipePart(`t${t.x},${t.y}`, tex);
        const foot = t.high ? TRESTLE.high.foot : TRESTLE.low.foot;
        // The low bent's beam runs along x and the high one's along y as painted; turn each
        // across its pipes.
        const flip = t.high ? !t.alongX : t.alongX;
        img.setOrigin(0.5, foot).setPosition(g.x, g.y + TILE_H * zoom * 0.18).setScale((t.high ? highH : lowH) / img.height)
          .setRotation(0).setFlipX(flip).setDepth(depthAt(t.x, t.y) + 0.0008).clearTint().setAlpha(fade(t.high ? 2 : 1));
      }
      for (const l of portLinks) {
        const tint = wash(fluidColour(snap.segments[l.si].vessel));
        const fat = Math.min(1.7, Math.max(0.6, Math.pow((snap.segments[l.si].diameter || 0.15) / 0.15, 0.6)));
        const c = centre(l.x, l.y);
        if (off(c)) continue;
        const inner = centre(l.x + l.dx, l.y + l.dy);
        // Half a length out to the building's wall, and the building's own nozzle meeting it there;
        // an inline fitting brings its own flange to meet the pipe.
        const reach = l.inline ? 1 - INLINE_REACH : 0.5;
        const edge = { x: c.x + (inner.x - c.x) * reach, y: c.y + (inner.y - c.y) * reach };
        shadow(c, edge);
        this.pipeSegment(`q${l.x},${l.y},${l.dx},${l.dy}`, 'ip_pipe', c, edge, zoom, depthAt(l.x, l.y) - 0.0002, tint, 13 * fat, 0.035, 0.93);
        if (!l.inline) {
          const into = { x: c.x + (inner.x - c.x) * 0.85, y: c.y + (inner.y - c.y) * 0.85 };
          this.pipeSegment(`n${l.x},${l.y},${l.dx},${l.dy}`, 'ip_pipe_nozzle', into, edge, zoom, depthAt(l.x, l.y) - 0.0001, 0xffffff, 17, 0, 0.88);
        }
      }
    } else {
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
          const c = centre(l.x, l.y), to = centre(l.x + l.dx, l.y + l.dy);
          this.pipeGfx.lineStyle(pass ? w * 0.45 : w, pass ? fluidColour(snap.segments[l.si].vessel) : 0x2a2f36, 1)
            .lineBetween(c.x, c.y, (c.x + to.x) / 2, (c.y + to.y) / 2);
        }
      }
    }
    for (const [k, img] of this.pipeImgs) if (!this.pipeSeen.has(k)) { img.destroy(); this.pipeImgs.delete(k); }
    this.pipeSeen.clear();
    this.drawFlow(snap, centre, nc, zoom, time);

    // Buildings.
    for (const e of snap.entities) {
      const proto = PROTO[e.proto];
      // Inserters are drawn with their arms by the world renderer.
      if (!proto || e.proto === 'inserter' || e.proto === 'burner_inserter') continue;
      // Turrets and drills built from painted parts are the world renderer's too.
      if (this.scene.textures.exists(`ip_${e.proto}_base`) || this.scene.textures.exists(`ip_${e.proto}_frame`)) continue;
      seen.add(e.id);
      let img = this.images.get(e.id);
      const ruptured = e.vessels.some(v => v.ruptured);
      const name = ruptured ? 'wreck' : e.proto;
      const running = working(e.id) ?? isRunning(e, snap);
      const paint = !ruptured && PAINTED[name] && this.scene.textures.exists(`pf_${name}`) ? PAINTED[name] : null;
      const still = paint ? `pf_${name}` : `pb_${name}`;
      const anim = !paint && ANIMS[name] && (ruptured || running) && this.scene.anims.exists(`pa_${name}`) ? ANIMS[name] : null;
      if (!img) {
        img = this.scene.add.sprite(0, 0, still).setOrigin(0.5, 1);
        this.images.set(e.id, img);
      }
      if (anim) {
        if (img.anims.currentAnim?.key !== `pa_${name}` || !img.anims.isPlaying) {
          // Start identical machines at different points of their cycle.
          img.play({ key: `pa_${name}`, startFrame: e.id % anim.frames });
          img.setOrigin(anim.ox, anim.oy);
        }
      } else if (img.anims.isPlaying || img.texture.key !== still) {
        img.stop();
        img.setTexture(still).setOrigin(0.5, 1);
      }
      const n = proto.size;
      const bottom = isoToScreen(e.x + n, e.y + n, camX, camY, zoom);
      // A cavitating pump shudders.
      const cav = e.pipes.find(p => p.kind.kind === 'Pump')?.kind.cavitation ?? 0;
      // A running compressor thrums.
      const thrum = (e.pipes.find(p => p.kind.kind === 'Compressor')?.kind.power_used ?? 0) > 1e3 ? 0.35 : 0;
      const judder = cav > 0.01 ? Math.sin(time * 0.11 + e.id) * zoom * (0.6 + cav * 1.4) : Math.sin(time * 0.09 + e.id) * zoom * thrum;
      img.setPosition(bottom.x + judder, bottom.y + TILE_H * zoom * 0.08);
      img.setScale((paint ? n * TILE_W * zoom / img.width : (TILE_W * zoom) / SPRITE_TILE_PX) * popScale(e.id, time));
      img.setFlipX(e.rot % 2 === 1).setRotation(0).setOrigin(anim ? anim.ox : 0.5, anim ? anim.oy : 1);
      img.setDepth(10 + (e.x + e.y + 2 * n) * 0.01);
      img.setTint(e.id === this.selected ? 0xfff2b0 : 0xffffff);
      if (INLINE[e.proto] && !anim && !ruptured) this.boltIn(e, img, INLINE[e.proto], centre, popScale(e.id, time));
      if (paint) this.drawFire(e, img, paint, zoom, time);
      else if (this.fireGfx.has(e.id)) { this.fireGfx.get(e.id)!.destroy(); this.fireGfx.delete(e.id); }
      // Now and then a puff of vapour lifts the relief valve on a gas sphere in use.
      if (e.proto === 'gas_sphere' && running && !ruptured) {
        const t = ((time + e.id * 1700) % 5000) / 1600;
        if (t < 1) {
          const s = img.scaleX;
          const vx = img.x + (img.flipX ? 64 : -64) * s, vy = img.y - 500 * s;
          for (let k = 0; k < 3; k++) {
            const u = Math.max(0, t - k * 0.12);
            this.overlayGfx.fillStyle(0xf2f4f6, 0.55 * (1 - u) * (u > 0 ? 1 : 0))
              .fillCircle(vx + Math.sin(u * 4 + k) * 6 * s, vy - u * 160 * s, (14 + u * 40) * s);
          }
        }
      }
      // A glow on lit fireboxes and flare stacks that have no animation of their own.
      const fire = e.vessels.find(v => v.reactions.some(r => r.name.includes('combustion') && r.rate > 1e-3));
      if (fire && !ruptured && !anim && !paint) {
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
        this.fireGfx.get(id)?.destroy();
        this.fireGfx.delete(id);
      }
    }

    // Ports of the selected building, so its orientation is clear.
    // Ports: of everything while laying pipe, else of what's selected or under the cursor.
    for (const e of snap.entities) {
      if (!PROTO[e.proto]?.ports.length) continue;
      if (ports.all || e.id === this.selected || e.id === ports.hovered) this.drawPorts(e.proto, e.x, e.y, e.rot, camX, camY, zoom);
    }
    if (ghost) this.drawGhost(ghost, camX, camY, zoom);
    else this.ghostImg?.setVisible(false);
  }

  /**
   * A fired heater: the radiant box glows through its peep windows at the colour its temperature
   * gives, the burners along the floor flicker while they're lit, and the flue breathes hot gas.
   */
  private drawFire(e: EntityView, img: Phaser.GameObjects.Sprite, spec: (typeof PAINTED)[string], zoom: number, time: number) {
    let g = this.fireGfx.get(e.id);
    if (!g) { g = this.scene.add.graphics(); this.fireGfx.set(e.id, g); }
    g.clear().setDepth(img.depth + 0.0001);
    const W = img.displayWidth, H = img.displayHeight;
    const at = (fx: number, fy: number) => ({ x: img.x + ((img.flipX ? 1 - fx : fx) - 0.5) * W, y: img.y + (fy - 1) * H });
    const row = ({ from: [x0, y0], to: [x1, y1], count }: Row, k: number) => at(x0 + (x1 - x0) * k / (count - 1), y0 + (y1 - y0) * k / (count - 1));
    const fired = e.vessels.find(v => v.reactions.some(r => r.name.includes('combustion')));
    const lit = !!fired?.reactions.some(r => r.name.includes('combustion') && r.rate > 1e-3);
    const [colour, a] = heatGlow(fired?.t ?? 0);
    if (spec.fan) this.drawFan(e, g, at, spec.fan, W, H, time);
    if (a > 0 && spec.windows && spec.pane) {
      // Each window a little parallelogram on the slanted face.
      const a0 = row(spec.windows, 0), a1 = row(spec.windows, 1);
      const sx = (a1.x - a0.x) * spec.pane[0], sy = (a1.y - a0.y) * spec.pane[0], hh = H * spec.pane[1];
      for (let k = 0; k < spec.windows.count; k++) {
        const c = row(spec.windows, k);
        const fl = lit ? 0.82 + 0.18 * Math.sin(time * 0.017 + k * 1.7 + e.id) : 1;
        g.fillStyle(colour, 0.22 * a * fl).fillEllipse(c.x, c.y, Math.abs(sx) * 5, hh * 4.5);
        g.fillStyle(colour, Math.min(1, 0.4 + a * 0.6) * fl).fillPoints([
          { x: c.x - sx, y: c.y - sy - hh }, { x: c.x + sx, y: c.y + sy - hh },
          { x: c.x + sx, y: c.y + sy + hh }, { x: c.x - sx, y: c.y - sy + hh }], true);
      }
    }
    if (lit && spec.roof) {
      // Burners firing down from the roof: only a shimmer of heat over it shows from outside.
      const [rx, ry, rw] = spec.roof, c = at(rx, ry);
      for (let k = 0; k < 3; k++) {
        const u = (time * 0.0005 + k / 3 + e.id * 0.21) % 1;
        g.fillStyle(0xff8a3a, 0.1 * Math.sin(u * Math.PI)).fillEllipse(c.x + Math.sin(u * 6 + k * 2) * W * 0.03, c.y - u * H * 0.08, W * rw * (0.6 + 0.4 * u), H * 0.05);
      }
    }
    if (lit && spec.burners) {
      const r = W * 0.012;
      for (let k = 0; k < spec.burners.count; k++) {
        const c = row(spec.burners, k);
        const fl = 0.75 + 0.25 * Math.sin(time * 0.029 + k * 2.3 + e.id);
        g.fillStyle(0xff7a1a, 0.35 * fl).fillCircle(c.x, c.y, r * 1.9 * fl);
        g.fillStyle(0xffb040, 0.9).fillCircle(c.x, c.y, r * fl);
        g.fillStyle(0x9ad8ff, 0.85).fillCircle(c.x, c.y, r * 0.45);
      }
    }
    if (lit && spec.stack) {
      // Hot flue gas wavering up from the stack.
      const w = wind(this.gameTime), push = w.speed * 6 * zoom;
      const drift = { x: (w.x - w.y) * push, y: (w.x + w.y) / 2 * push };
      const top = at(spec.stack[0], spec.stack[1]);
      for (let k = 0; k < 4; k++) {
        const u = (time * 0.00035 + k / 4 + e.id * 0.137) % 1;
        g.fillStyle(0x9a9490, 0.3 * (1 - u)).fillCircle(top.x + Math.sin(u * 5 + k) * 6 * zoom + drift.x * u, top.y - u * 70 * zoom + drift.y * u, (5 + u * 18) * zoom);
      }
    }
  }

  /**
   * The cooler's fan, turning with the compressor's shaft power: blades drawn on the plane of the
   * shroud, spinning up and running down rather than starting and stopping dead.
   */
  private drawFan(e: EntityView, g: Phaser.GameObjects.Graphics, at: (fx: number, fy: number) => { x: number; y: number },
    [fx, fy, frx, fry]: [number, number, number, number], W: number, H: number, time: number) {
    const k = e.pipes.find(p => p.kind.kind === 'Compressor')?.kind;
    const want = e.enabled ? Math.min(1, (k?.power_used ?? 0) / (PROTO[e.proto]?.power_w || 1.5e6) * 3) : 0;
    const f = this.fans.get(e.id) ?? { angle: e.id, speed: 0, t: time };
    const dt = Math.min(0.1, (time - f.t) / 1000);
    f.speed += (want - f.speed) * Math.min(1, dt * 0.8);
    f.angle += f.speed * 14 * dt;
    f.t = time;
    this.fans.set(e.id, f);
    const c = at(fx, fy), rx = frx * W * 0.92, ry = fry * H * 0.92;
    const pt = (a: number, r: number) => ({ x: c.x + Math.cos(a) * rx * r, y: c.y + Math.sin(a) * ry * r });
    // A blur of the disc as it comes up to speed.
    if (f.speed > 0.15) g.fillStyle(0x7a8288, 0.3 * f.speed).fillEllipse(c.x, c.y, rx * 2, ry * 2);
    const alpha = 1 - 0.55 * f.speed;
    for (let b = 0; b < 5; b++) {
      const a = f.angle + b * Math.PI * 2 / 5;
      g.fillStyle(0x4c545c, alpha).fillPoints([pt(a - 0.32, 0.22), pt(a - 0.2, 0.97), pt(a + 0.2, 0.97), pt(a + 0.12, 0.22)], true);
      g.lineStyle(1, 0x8a949c, alpha * 0.8).lineBetween(pt(a - 0.2, 0.97).x, pt(a - 0.2, 0.97).y, pt(a + 0.2, 0.97).x, pt(a + 0.2, 0.97).y);
    }
    g.fillStyle(0x30363c, 1).fillEllipse(c.x, c.y, rx * 0.42, ry * 0.42);
    g.fillStyle(0x8a949c, 1).fillEllipse(c.x - rx * 0.04, c.y - ry * 0.06, rx * 0.16, ry * 0.16);
  }

  private drawPorts(protoId: string, x: number, y: number, rot: number, camX: number, camY: number, zoom: number) {
    const proto = PROTO[protoId];
    if (!proto) return;
    for (const pt of portTiles(proto, x, y, rot)) {
      const c = isoToScreen(pt.outside[0] + 0.5, pt.outside[1] + 0.5, camX, camY, zoom);
      const colour = pt.port.at === 'Top' ? 0xffe066 : pt.port.at === 'Bottom' ? 0x4fa3ff : 0x9cff8f;
      this.overlayGfx.lineStyle(2, 0x000000, 0.8).fillStyle(colour, 0.9);
      this.overlayGfx.fillCircle(c.x, c.y, 5 * zoom).strokeCircle(c.x, c.y, 5 * zoom);
      // A ring where a pipe is already there to connect to.
      if (this.pipeTiles.has(`${pt.outside[0]},${pt.outside[1]}`)) {
        this.overlayGfx.lineStyle(2.5, 0xffffff, 0.95).strokeCircle(c.x, c.y, 9 * zoom);
      }
    }
  }

  private drawGhost(g: Ghost, camX: number, camY: number, zoom: number) {
    const proto = PROTO[g.proto];
    if (!proto) return;
    const n = proto.size;
    // Footprint, up at its height for pipe on a rack.
    const up = rackLift(proto.levels?.length === 1 ? proto.levels[0] : 0, zoom);
    const pts = [
      isoToScreen(g.x, g.y, camX, camY, zoom), isoToScreen(g.x + n, g.y, camX, camY, zoom),
      isoToScreen(g.x + n, g.y + n, camX, camY, zoom), isoToScreen(g.x, g.y + n, camX, camY, zoom),
    ].map(p => ({ x: p.x, y: p.y - up }));
    this.overlayGfx.fillStyle(g.ok ? 0x44ff88 : 0xff4444, 0.22).lineStyle(2, g.ok ? 0x44ff88 : 0xff4444, 0.9);
    this.overlayGfx.fillPoints(pts, true).strokePoints(pts, true);
    // Which way it faces, for anything that has a direction.
    const dir = [[0, -1], [1, 0], [0, 1], [-1, 0]][g.rot % 4];
    if (g.proto === 'inserter' || g.proto === 'burner_inserter') {
      drawInserterFlow(this.overlayGfx, g.x, g.y, g.rot, camX, camY, zoom);
    } else if (['transport_belt', 'underground_belt', 'splitter', 'burner_drill', 'electric_drill'].includes(g.proto)) {
      const c = isoToScreen(g.x + n / 2, g.y + n / 2, camX, camY, zoom);
      const t = isoToScreen(g.x + n / 2 + dir[0] * (n / 2 + 0.3), g.y + n / 2 + dir[1] * (n / 2 + 0.3), camX, camY, zoom);
      this.overlayGfx.lineStyle(Math.max(2, 3 * zoom), 0xffe066, 0.95).lineBetween(c.x, c.y, t.x, t.y);
      this.overlayGfx.fillStyle(0xffe066, 0.95).fillCircle(t.x, t.y, 4 * zoom);
    }
    // Buildings drawn from painted parts preview with their body.
    const tex = [`ip_${g.proto}_base`, `ip_${g.proto}_frame`, `pf_${g.proto}`].find(k => this.scene.textures.exists(k) && !g.proto.endsWith('inserter')) ?? `pb_${g.proto}`;
    if (g.proto !== 'pipe' && this.scene.textures.exists(tex)) {
      if (!this.ghostImg) this.ghostImg = this.scene.add.image(0, 0, tex).setOrigin(0.5, 1).setDepth(899);
      if (this.ghostImg.texture.key !== tex) this.ghostImg.setTexture(tex);
      const bottom = isoToScreen(g.x + n, g.y + n, camX, camY, zoom);
      this.ghostImg.setVisible(true).setAlpha(0.6).setPosition(bottom.x, bottom.y).setScale(n * TILE_W * zoom / this.ghostImg.width);
      // Inline fittings are painted along the other diagonal; drills show their chute where the ore goes.
      const drill = g.proto.endsWith('_drill') ? drillPainting(g.rot) : null;
      if (drill?.back && this.scene.textures.exists(`ip_${g.proto}_frame_back`)) this.ghostImg.setTexture(`ip_${g.proto}_frame_back`).setScale(n * TILE_W * zoom / this.ghostImg.width);
      this.ghostImg.setFlipX(drill ? drill.flip : (g.rot % 2 === 1) !== (g.proto in INLINE)).setTint(g.ok ? 0xffffff : 0xff8080);
    } else {
      this.ghostImg?.setVisible(false);
    }
    this.drawPorts(g.proto, g.x, g.y, g.rot, camX, camY, zoom);
  }

  /**
   * The flow view, over everything like an X-ray: each pipe coloured by its velocity as a share
   * of its service's limit (red when over it) or by pressure, with chevrons moving along it in
   * the direction of flow, faster where it's faster.
   */
  private drawFlow(snap: Snapshot, centre: (x: number, y: number) => { x: number; y: number },
    nc: (l: number, x: number, y: number) => { x: number; y: number }, zoom: number, time: number) {
    if (this.flowView === 'off') { this.showLegend(null); return; }
    const h = hydraulics(snap);
    const ps = snap.segments.map(s => s.vessel.p);
    const pMin = Math.min(...ps), pMax = Math.max(...ps, pMin + 1e3);
    const pad = TILE_W * zoom;
    const off = (p: { x: number; y: number }) => p.x < -pad || p.y < -pad || p.x > this.scene.scale.width + pad || p.y > this.scene.scale.height + pad;
    const g = this.flowGfx;
    const line = (a: { x: number; y: number }, b: { x: number; y: number }, mdot: number, si: number) => {
      const run = h.runs[si];
      const st = stats(mdot, run.fluid, run.d);
      const colour = this.flowView === 'pressure'
        ? ramp((snap.segments[si].vessel.p - pMin) / (pMax - pMin))
        : problems(st, run.service, run.fluid).length && (st.v > LIMITS[run.service].vMax || st.v > st.ve) ? OVER : ramp(st.v / LIMITS[run.service].vMax);
      g.lineStyle(5 * zoom, 0x0b0f14, 0.55).lineBetween(a.x, a.y, b.x, b.y);
      g.lineStyle(3.2 * zoom, colour, 0.95).lineBetween(a.x, a.y, b.x, b.y);
      if (st.v < 0.005) return;
      // Chevrons walking the way it flows; a whole number per tile so they run on across joints.
      const [from, to] = mdot > 0 ? [a, b] : [b, a];
      const len = Math.hypot(to.x - from.x, to.y - from.y);
      const ux = (to.x - from.x) / len, uy = (to.y - from.y) / len;
      const gap = len / Math.max(1, Math.round(len / (16 * zoom)));
      const speed = Math.min(150, 14 + 26 * st.v) * zoom;
      const s = 2.6 * zoom;
      g.fillStyle(0xffffff, 0.9);
      for (let d = (time / 1000 * speed) % gap; d < len; d += gap) {
        const x = from.x + ux * d, y = from.y + uy * d;
        g.fillTriangle(x + ux * s, y + uy * s, x - ux * s - uy * s, y - uy * s + ux * s, x - ux * s + uy * s, y - uy * s - ux * s);
      }
    };
    h.runs.forEach((run, si) => {
      for (const e of run.edges) {
        const a = nc(...e.a), b = nc(...e.b);
        if (off(a) && off(b)) continue;
        line(a, b, e.m, si);
      }
      for (const p of run.ports) {
        const a = centre(p.x, p.y);
        if (off(a)) continue;
        const into = centre(p.x + p.dx, p.y + p.dy);
        // Into the run is toward a, so the building end comes first.
        line({ x: (a.x + into.x) / 2, y: (a.y + into.y) / 2 }, a, p.mdot, si);
      }
    });
    this.showLegend(this.flowView === 'pressure' ? { min: pMin, max: pMax } : null);
  }

  private showLegend(range: { min: number; max: number } | null) {
    if (this.flowView === 'off') { this.legend?.remove(); this.legend = null; return; }
    if (!this.legend) {
      this.legend = document.createElement('div');
      this.legend.className = 'pp-flow-legend';
      document.body.append(this.legend);
    }
    const bar = `<i style="background:linear-gradient(90deg,${RAMP_CSS.join(',')})"></i>`;
    // One line saying what the colours on the pipes mean.
    const html = this.flowView === 'velocity'
      ? `<b>Pipe speed</b><em>still</em>${bar}<em>at its limit</em><em class="over">too fast</em>`
      : `<b>Pipe pressure</b><em>${(range!.min / 1e5).toFixed(1)} bar</em>${bar}<em>${(range!.max / 1e5).toFixed(1)} bar</em>`;
    if (this.legend.dataset.html !== html) { this.legend.innerHTML = html; this.legend.dataset.html = html; }
  }

  /** The flow at a pipe tile, for its hover card. */
  flowAt(snap: Snapshot, x: number, y: number, level = 0) {
    const h = hydraulics(snap);
    const si = h.runAt.get(nodeKey(level, x, y));
    if (si === undefined) return null;
    const run = h.runs[si];
    const st = stats(run.tile.get(nodeKey(level, x, y)) ?? 0, run.fluid, run.d);
    return { run, stats: st, problems: problems(st, run.service, run.fluid) };
  }

  private pipePart(key: string, tex: string) {
    let img = this.pipeImgs.get(key);
    if (!img) { img = this.scene.add.image(0, 0, tex); this.pipeImgs.set(key, img); }
    if (img.texture.key !== tex) img.setTexture(tex);
    img.setAlpha(1).setFlipX(false);
    this.pipeSeen.add(key);
    return img;
  }

  /** A piece of pipe stretched from a to b; `from` is where a sits along the image, `span` how much of it reaches b. */
  /**
   * Sets an inline fitting into its line: scaled and turned so the faces of its two flanges sit
   * on the pipe's centreline, a little out past the edges of its tile, where the pipe stops.
   */
  private boltIn(e: EntityView, img: Phaser.GameObjects.Sprite, flanges: (typeof INLINE)[string],
    centre: (x: number, y: number) => { x: number; y: number }, pop: number) {
    const proto = PROTO[e.proto];
    const mid = centre(e.x, e.y);
    const ends = portTiles(proto, e.x, e.y, e.rot).map(pt => {
      const o = centre(pt.outside[0], pt.outside[1]);
      return { x: mid.x + (o.x - mid.x) * INLINE_REACH, y: mid.y + (o.y - mid.y) * INLINE_REACH };
    }).sort((a, b) => a.x - b.x);
    if (ends.length !== 2) return;
    // Painted rising to the right; a line falling to the right takes the mirror image.
    const flip = ends[1].y > ends[0].y;
    const W = img.width, H = img.height;
    const [[ax, ay], [bx, by]] = flanges;
    const [l, r] = flip ? [[W - bx, by], [W - ax, ay]] : [[ax, ay], [bx, by]];
    const s = Math.hypot(ends[1].x - ends[0].x, ends[1].y - ends[0].y) / Math.hypot(r[0] - l[0], r[1] - l[1]);
    const turn = Math.atan2(ends[1].y - ends[0].y, ends[1].x - ends[0].x) - Math.atan2(r[1] - l[1], r[0] - l[0]);
    // Where the painting's centre lands, carried from its left flange.
    const vx = (W / 2 - l[0]) * s, vy = (H / 2 - l[1]) * s;
    const cx = ends[0].x + vx * Math.cos(turn) - vy * Math.sin(turn), cy = ends[0].y + vx * Math.sin(turn) + vy * Math.cos(turn);
    img.setOrigin(0.5, 0.5).setFlipX(flip).setRotation(turn).setScale(s * pop)
      .setPosition(mid.x + (cx - mid.x) * pop, mid.y + (cy - mid.y) * pop);
  }

  private pipeSegment(key: string, tex: string, a: { x: number; y: number }, b: { x: number; y: number }, zoom: number, depth: number,
    tint: number, thick: number, from: number, span: number) {
    const img = this.pipePart(key, tex);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    img.setOrigin(from, 0.5).setPosition(a.x, a.y).setRotation(Math.atan2(b.y - a.y, b.x - a.x))
      .setScale(len / (img.width * span), thick * zoom / img.height).setDepth(depth).setTint(tint);
    return img;
  }

  /** The frontmost building drawn under a screen point. */
  pick(x: number, y: number): Pick | null {
    let best: Pick | null = null;
    for (const [id, img] of this.images) {
      if (best && img.depth <= best.depth) continue;
      const p = placedById(id);
      if (p && hitsSprite(img, x, y)) best = { tx: p.x, ty: p.y, depth: img.depth };
    }
    return best;
  }

  /** Segment index under a tile, if it is a pipe. */
  segmentAt(x: number, y: number, level = 0): number | undefined {
    return level ? this.rackNodes.get(nodeKey(level, x, y)) : this.pipeTiles.get(`${x},${y}`);
  }

  destroy() {
    this.images.forEach(i => i.destroy());
    this.images.clear();
    this.wrecks.forEach(w => w.img.destroy());
    this.fx.forEach(f => f.sprite.destroy());
    this.pipeImgs.forEach(i => i.destroy());
    this.pipeImgs.clear();
    this.flowGfx.destroy();
    this.legend?.remove();
    this.pipeGfx.destroy();
    this.overlayGfx.destroy();
    this.ghostImg?.destroy();
  }
}
