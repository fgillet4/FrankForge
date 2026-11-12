/**
 * Draws the process plant in the isometric world: building sprites, pipes coloured by what they
 * carry, port markers, the placement ghost and ruptures.
 *
 * Sprites are 128 px per tile wide and anchored at their bottom centre, which sits on the bottom
 * corner of the footprint's diamond.
 */

import Phaser from 'phaser';
import { TILE_W, TILE_H, isoToScreen } from '../phaser/isoMath';
import { PROTO, portTiles, type Snapshot, type VesselView } from './engine';

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

export function preloadProcessAssets(scene: Phaser.Scene) {
  for (const id of BUILDING_SPRITES) {
    scene.load.image(`pb_${id}`, `assets/process/buildings/${id}.png`);
  }
}

interface Ghost { proto: string; x: number; y: number; rot: number; ok: boolean }

export class ProcessLayer {
  private images = new Map<number, Phaser.GameObjects.Image>();
  private pipeGfx: Phaser.GameObjects.Graphics;
  private overlayGfx: Phaser.GameObjects.Graphics;
  private ghostImg: Phaser.GameObjects.Image | null = null;
  private wrecks: { x: number; y: number; img: Phaser.GameObjects.Image }[] = [];
  private pipeTiles = new Map<string, number>();
  selected: number | null = null;

  constructor(private scene: Phaser.Scene) {
    this.pipeGfx = scene.add.graphics().setDepth(5);
    this.overlayGfx = scene.add.graphics().setDepth(900);
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
      const key = ruptured ? 'pb_wreck' : `pb_${e.proto}`;
      if (!img) {
        img = this.scene.add.image(0, 0, key).setOrigin(0.5, 1);
        this.images.set(e.id, img);
      } else if (img.texture.key !== key) {
        img.setTexture(key);
      }
      const n = proto.size;
      const bottom = isoToScreen(e.x + n, e.y + n, camX, camY, zoom);
      img.setPosition(bottom.x, bottom.y + TILE_H * zoom * 0.08);
      img.setScale((TILE_W * zoom) / SPRITE_TILE_PX);
      img.setFlipX(e.rot % 2 === 1);
      img.setDepth(10 + (e.x + e.y + 2 * n) * 0.01);
      img.setTint(e.id === this.selected ? 0xfff2b0 : 0xffffff);
      // A flame on lit fireboxes and flare stacks.
      const fire = e.vessels.find(v => v.reactions.some(r => r.name.includes('combustion') && r.rate > 1e-3));
      if (fire && !ruptured) {
        const flicker = 0.75 + 0.25 * Math.sin(time * 0.02 + e.id);
        const top = isoToScreen(e.x + n / 2, e.y + n / 2, camX, camY, zoom);
        this.overlayGfx.fillStyle(0xff8a1c, 0.35 * flicker).fillCircle(top.x, top.y - TILE_H * zoom * 0.5, 10 * zoom * flicker);
      }
    }
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
    this.pipeGfx.destroy();
    this.overlayGfx.destroy();
    this.ghostImg?.destroy();
  }
}
