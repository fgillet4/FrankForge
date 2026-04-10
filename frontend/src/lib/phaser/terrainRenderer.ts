/**
 * Terrain tile rendering — Factorio-style industrial palette.
 *
 * Tile diamond corners relative to top point (cx, cy) from isoToScreen:
 *   top:    (cx,        cy)
 *   right:  (cx + tw/2, cy + th/2)
 *   bottom: (cx,        cy + th)
 *   left:   (cx - tw/2, cy + th/2)
 *
 * where tw = TILE_W * zoom = 64*zoom, th = TILE_H * zoom = 32*zoom.
 * Diamond is 64 px wide × 32 px tall at zoom=1  →  correct 2:1 ratio.
 */

import Phaser from 'phaser';
import { TILE_W, TILE_H, isoToScreen, darken } from './isoMath';
import { TerrainType, ResourceType } from '../types';

// ── Factorio-inspired top-face colours ──────────────────────────────────────
export const TERRAIN_COLORS: Record<number, number> = {
  [TerrainType.DEEP_WATER]:    0x0a2a45,
  [TerrainType.SHALLOW_WATER]: 0x0d4a73,
  [TerrainType.SAND]:          0x7a6a3a,
  [TerrainType.GRASS]:         0x2a4a1a,
  [TerrainType.FOREST]:        0x1e3612,
  [TerrainType.HILLS]:         0x4a4a3a,
  [TerrainType.MOUNTAINS]:     0x5a5a50,
  [TerrainType.SNOW]:          0xddeeff,
  [TerrainType.VOLCANIC]:      0x4a1a0a,
  [TerrainType.LAVA]:          0xcc3300,
  [TerrainType.CAVE]:          0x1a1220,
  [TerrainType.ALIEN_GRASS]:   0x1a4a2a,
  [TerrainType.ALIEN_FOREST]:  0x0a3020,
  [TerrainType.ALIEN_CRYSTAL]: 0x2a1a4a,
  [TerrainType.METHANE_LAKE]:  0x1a3030,
  [TerrainType.ICE]:           0x8ab0d0,
};

// ── Resource gem colours ─────────────────────────────────────────────────────
export const RESOURCE_COLORS: Record<number, number> = {
  [ResourceType.METHANE]:      0x00ccbb,
  [ResourceType.OXYGEN]:       0x88ddff,
  [ResourceType.WATER]:        0x2288ff,
  [ResourceType.IRON]:         0xcc7733,
  [ResourceType.COPPER]:       0xe8843a,
  [ResourceType.SILICON]:      0xddcc44,
  [ResourceType.SULFUR]:       0xffee00,
  [ResourceType.URANIUM]:      0x44ff44,
  [ResourceType.RARE_METALS]:  0xdd44cc,
  [ResourceType.XENOCRYSTALS]: 0xff44ff,
};

export const RESOURCE_NAMES: Partial<Record<number, string>> = {
  [ResourceType.IRON]:         'iron',
  [ResourceType.COPPER]:       'copper',
  [ResourceType.WATER]:        'water',
  [ResourceType.OXYGEN]:       'oxygen',
  [ResourceType.METHANE]:      'methane',
  [ResourceType.SILICON]:      'silicon',
  [ResourceType.SULFUR]:       'sulfur',
  [ResourceType.URANIUM]:      'uranium',
  [ResourceType.RARE_METALS]:  'rare_metals',
  [ResourceType.XENOCRYSTALS]: 'xenocrystals',
};

/** Draw one isometric ground tile at grid position (ix, iy). */
export function drawTile(
  gfx: Phaser.GameObjects.Graphics,
  ix: number, iy: number,
  terrain: number,
  camX: number, camY: number,
  zoom: number,
) {
  const { x: cx, y: cy } = isoToScreen(ix, iy, camX, camY, zoom);
  const tw    = TILE_W * zoom;   // 64 * zoom  (full width)
  const th    = TILE_H * zoom;   // 32 * zoom  (full height)
  const sideH = th * 0.5;        // visible side-wall height

  const top   = TERRAIN_COLORS[terrain] ?? 0x333333;
  const left  = darken(top, 0.68);
  const right = darken(top, 0.50);

  // Top diamond face  (top → right → bottom → left)
  gfx.fillStyle(top, 1);
  gfx.fillPoints([
    { x: cx,        y: cy        },   // top
    { x: cx + tw/2, y: cy + th/2 },   // right
    { x: cx,        y: cy + th   },   // bottom
    { x: cx - tw/2, y: cy + th/2 },   // left
  ], true);

  // Side walls — only when tiles are big enough to matter visually
  if (zoom >= 0.5) {
    // Left face (bottom-left wall)
    gfx.fillStyle(left, 1);
    gfx.fillPoints([
      { x: cx - tw/2, y: cy + th/2          },
      { x: cx,        y: cy + th            },
      { x: cx,        y: cy + th   + sideH  },
      { x: cx - tw/2, y: cy + th/2 + sideH  },
    ], true);

    // Right face (bottom-right wall)
    gfx.fillStyle(right, 1);
    gfx.fillPoints([
      { x: cx,        y: cy + th            },
      { x: cx + tw/2, y: cy + th/2          },
      { x: cx + tw/2, y: cy + th/2 + sideH  },
      { x: cx,        y: cy + th   + sideH  },
    ], true);
  }

  // Grid outline — only worth drawing when tiles are large enough to see it
  if (zoom > 1.1) {
    gfx.lineStyle(1, 0x000000, 0.18);
    gfx.strokePoints([
      { x: cx,        y: cy        },
      { x: cx + tw/2, y: cy + th/2 },
      { x: cx,        y: cy + th   },
      { x: cx - tw/2, y: cy + th/2 },
    ], true);
  }
}

/** Draw a resource deposit as a bright diamond gem with glow. */
export function drawResource(
  gfx: Phaser.GameObjects.Graphics,
  ix: number, iy: number,
  resource: number,
  density: number,
  camX: number, camY: number,
  zoom: number,
) {
  const { x: cx, y: cy } = isoToScreen(ix, iy, camX, camY, zoom);
  const color = RESOURCE_COLORS[resource] ?? 0xffffff;
  const tw    = TILE_W * zoom;
  const th    = TILE_H * zoom;
  const midX  = cx;
  const midY  = cy + th / 2;

  // At very low zoom just draw a bright dot — cheap and still visible
  if (zoom < 0.35) {
    gfx.fillStyle(color, 0.9);
    gfx.fillCircle(midX, midY, Math.max(1.5, tw * 0.15));
    return;
  }

  const r = Math.max(4, tw * 0.19) * (0.6 + density * 0.4);

  // Glow halo — skip at medium-low zoom (expensive fillCircle calls)
  if (zoom >= 0.6) {
    gfx.fillStyle(color, 0.15);
    gfx.fillCircle(midX, midY, r * 2.4);
    gfx.fillStyle(color, 0.25);
    gfx.fillCircle(midX, midY, r * 1.5);
  }

  // Gem body
  gfx.fillStyle(color, 0.92);
  gfx.fillPoints([
    { x: midX,       y: midY - r         },
    { x: midX + r,   y: midY             },
    { x: midX,       y: midY + r * 0.65  },
    { x: midX - r,   y: midY             },
  ], true);

  // Specular highlight + outline — only at higher zoom
  if (zoom >= 0.6) {
    gfx.fillStyle(0xffffff, 0.55);
    gfx.fillPoints([
      { x: midX,            y: midY - r        },
      { x: midX + r * 0.45, y: midY - r*0.15  },
      { x: midX,            y: midY - r*0.05   },
    ], true);

    gfx.lineStyle(1, 0xffffff, 0.5);
    gfx.strokePoints([
      { x: midX,       y: midY - r         },
      { x: midX + r,   y: midY             },
      { x: midX,       y: midY + r * 0.65  },
      { x: midX - r,   y: midY             },
    ], true);
  }
}

/** Draw a hover highlight outline on tile (ix, iy). */
export function drawHover(
  gfx: Phaser.GameObjects.Graphics,
  ix: number, iy: number,
  camX: number, camY: number,
  zoom: number,
) {
  const { x: cx, y: cy } = isoToScreen(ix, iy, camX, camY, zoom);
  const tw = TILE_W * zoom;
  const th = TILE_H * zoom;
  gfx.lineStyle(2, 0xffffff, 0.8);
  gfx.strokePoints([
    { x: cx,        y: cy        },
    { x: cx + tw/2, y: cy + th/2 },
    { x: cx,        y: cy + th   },
    { x: cx - tw/2, y: cy + th/2 },
  ], true);
}
