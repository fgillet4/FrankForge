/**
 * Building rendering — isometric cubes, Factorio industrial style.
 *
 * Top face diamond corners same convention as terrainRenderer:
 *   top: (cx, ty), right: (cx+tw/2, ty+th/2), bottom: (cx, ty+th), left: (cx-tw/2, ty+th/2)
 */

import Phaser from 'phaser';
import { TILE_W, TILE_H, isoToScreen, darken } from './isoMath';

const BUILDING_COLORS: Record<string, number> = {
  extractor:  0x3a7aaa,
  storage:    0xc8a000,
  powerPlant: 0x22aa44,
  reactor:    0xcc2222,
  pipe:       0x888888,
  conveyor:   0x777766,
  assembler:  0xdd7700,
  default:    0x557799,
};

export function drawBuilding(
  gfx: Phaser.GameObjects.Graphics,
  building: { position?: { x: number; y: number }; type?: string },
  camX: number, camY: number,
  zoom: number,
) {
  const ix = building.position?.x ?? 0;
  const iy = building.position?.y ?? 0;
  const { x: cx, y: cy } = isoToScreen(ix, iy, camX, camY, zoom);
  const tw    = TILE_W * zoom;
  const th    = TILE_H * zoom;
  const cubeH = th * 1.4;

  const base  = BUILDING_COLORS[building.type ?? 'default'] ?? BUILDING_COLORS.default;
  const left  = darken(base, 0.62);
  const right = darken(base, 0.45);
  const ty    = cy - cubeH;   // top of the cube (shifted up by cubeH)

  // Top face diamond
  gfx.fillStyle(base, 1);
  gfx.fillPoints([
    { x: cx,        y: ty        },
    { x: cx + tw/2, y: ty + th/2 },
    { x: cx,        y: ty + th   },
    { x: cx - tw/2, y: ty + th/2 },
  ], true);

  // Left face (down from left/bottom of top diamond to ground)
  gfx.fillStyle(left, 1);
  gfx.fillPoints([
    { x: cx - tw/2, y: ty + th/2  },
    { x: cx,        y: ty + th    },
    { x: cx,        y: cy + th    },
    { x: cx - tw/2, y: cy + th/2  },
  ], true);

  // Right face
  gfx.fillStyle(right, 1);
  gfx.fillPoints([
    { x: cx,        y: ty + th    },
    { x: cx + tw/2, y: ty + th/2  },
    { x: cx + tw/2, y: cy + th/2  },
    { x: cx,        y: cy + th    },
  ], true);

  // Outline on top face
  gfx.lineStyle(1, 0xffffff, 0.25);
  gfx.strokePoints([
    { x: cx,        y: ty        },
    { x: cx + tw/2, y: ty + th/2 },
    { x: cx,        y: ty + th   },
    { x: cx - tw/2, y: ty + th/2 },
  ], true);
}
