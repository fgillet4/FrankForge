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
        this.terrain.create(lx - 65, ly - 1, tFrames.includes(frame) ? frame : tFrames[0]);
        const deposit = tile.resource !== ResourceType.NONE ? RESOURCE_NAMES[tile.resource] : undefined;
        // A scattering of decals, denser where the deposit is rich, nudged off the grid so
        // patches don't read as rows.
        const h = Math.imul(variant ^ (variant >>> 15), 0x2c1b3c6d) >>> 0;
        const shown = h % 100 < 12 + 30 * (tile.resourceDensity ?? 0.5);
        if (deposit && shown && this.deposits && dFrames.has(deposit)) {
          const f = this.textures.getFrame('deposits', deposit);
          const jx = ((h >>> 8) % 49) - 24;
          const jy = ((h >>> 16) % 25) - 12;
          // Decals stand on the tile's bottom corner, a little smaller than the tile.
          this.deposits.create(lx - f.width / 2 + jx, ly + 64 - f.height + jy, deposit).setFlipX((h >>> 24) % 2 === 1);
        }
      }
    }
  }

  /** Matches WorldScene's view: map origin at screen (camX, camY), at its zoom. */
  setView(camX: number, camY: number, zoom: number) {
    if (!this.sys.isActive()) return;
    const z = zoom / TEXTURE_SCALE;
    this.cameras.main.setZoom(z).setScroll(-camX / z, -camY / z);
  }
}
