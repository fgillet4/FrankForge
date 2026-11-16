/**
 * The textured ground, drawn by its own scene beneath WorldScene.
 *
 * The ground is one Blitter bob per tile, which is fast but ignores the Blitter's scale, so it
 * can't follow WorldScene's zoom by itself. Here it sits in texture space (128 px per tile) and
 * this scene's camera does the zooming and panning.
 */

import Phaser from 'phaser';
import { ResourceType, TerrainType, type PlanetMap } from '../types';
import { RESOURCE_NAMES } from './terrainRenderer';

/** Ground texture for each terrain type (atlas frames are `<name>_<0..3>`). */
const TERRAIN_TEXTURES: Record<number, string> = {
  [TerrainType.DEEP_WATER]: 'deep_water', [TerrainType.SHALLOW_WATER]: 'shallow_water', [TerrainType.SAND]: 'sand',
  [TerrainType.GRASS]: 'grass', [TerrainType.FOREST]: 'forest', [TerrainType.HILLS]: 'hills',
  [TerrainType.MOUNTAINS]: 'mountains', [TerrainType.SNOW]: 'snow', [TerrainType.VOLCANIC]: 'volcanic',
  [TerrainType.LAVA]: 'lava', [TerrainType.CAVE]: 'cave', [TerrainType.ALIEN_GRASS]: 'alien_grass',
  [TerrainType.ALIEN_FOREST]: 'alien_forest', [TerrainType.ALIEN_CRYSTAL]: 'alien_crystal',
  [TerrainType.METHANE_LAKE]: 'methane_lake', [TerrainType.ICE]: 'ice',
};

/** Texture pixels per world pixel at zoom 1 (textures are 128 px per tile, the iso grid 64). */
const TEXTURE_SCALE = 2;

export class GroundScene extends Phaser.Scene {
  private terrain: Phaser.GameObjects.Blitter | null = null;
  private deposits: Phaser.GameObjects.Blitter | null = null;
  private depositBobs = new Map<number, Phaser.GameObjects.Bob>();

  constructor() { super({ key: 'GroundScene' }); }

  create() {
    this.cameras.main.setOrigin(0, 0);
    this.events.once('shutdown', () => {
      this.terrain = this.deposits = null;
    });
  }

  /** Lays out the ground for a map. */
  show(map: PlanetMap) {
    this.terrain?.destroy();
    this.deposits?.destroy();
    this.depositBobs.clear();
    const height = (x: number, y: number) => map.tiles[Math.min(map.height - 1, Math.max(0, y))][Math.min(map.width - 1, Math.max(0, x))].height ?? 0;
    this.terrain = this.add.blitter(0, 0, 'terrain');
    this.deposits = this.textures.exists('deposits') ? this.add.blitter(0, 0, 'deposits') : null;
    const tFrames = this.textures.get('terrain').getFrameNames();
    const dFrames = new Set(this.deposits ? this.textures.get('deposits').getFrameNames() : []);
    for (let iy = 0; iy < map.height; iy++) {
      for (let ix = 0; ix < map.width; ix++) {
        const tile = map.tiles[iy][ix];
        // The tile's top corner sits at ((ix−iy)·64, (ix+iy)·32).
        const lx = (ix - iy) * 64;
        const ly = (ix + iy) * 32;
        const variant = (ix * 73856093 ^ iy * 19349663) >>> 0;
        const frame = `${TERRAIN_TEXTURES[tile.terrain] ?? 'grass'}_${variant % 4}`;
        const bob = this.terrain.create(lx - 65, ly - 1, tFrames.includes(frame) ? frame : tFrames[0]);
        // Hill shading: slopes facing the light (top left of the screen, the −x side) are lit,
        // the far sides shaded, and high ground a little brighter.
        const slope = height(ix - 1, iy) - height(ix + 1, iy) + 0.5 * (height(ix, iy - 1) - height(ix, iy + 1));
        const light = Phaser.Math.Clamp(0.86 + slope * 3.5 + (height(ix, iy) - 0.5) * 0.12, 0.62, 1);
        const c = Math.round(light * 255);
        bob.tint = (c << 16) | (c << 8) | c;
        const deposit = tile.resource !== ResourceType.NONE ? RESOURCE_NAMES[tile.resource] : undefined;
        // A decal centred on each deposit tile, so you can see exactly which tiles hold it.
        if (deposit && this.deposits && dFrames.has(deposit)) {
          const f = this.textures.getFrame('deposits', deposit);
          const h = Math.imul(variant ^ (variant >>> 15), 0x2c1b3c6d) >>> 0;
          // Nudged a little within its own tile; richer tiles show stronger.
          const jx = ((h >>> 8) % 17) - 8, jy = ((h >>> 16) % 9) - 4;
          const d = this.deposits.create(lx - f.width / 2 + jx, ly + 32 - f.height / 2 + jy, deposit).setFlipX(h % 2 === 1);
          d.setAlpha(0.6 + 0.4 * (tile.resourceDensity ?? 0.5));
          this.depositBobs.set(iy * 100000 + ix, d);
        }
      }
    }
  }

  /** Hides a deposit that has been mined out. */
  hideDeposit(x: number, y: number) {
    this.depositBobs.get(y * 100000 + x)?.setVisible(false);
  }

  /** Matches WorldScene's view: map origin at screen (camX, camY), at its zoom. */
  setView(camX: number, camY: number, zoom: number) {
    if (!this.sys.isActive()) return;
    const z = zoom / TEXTURE_SCALE;
    this.cameras.main.setZoom(z).setScroll(-camX / z, -camY / z);
  }
}
