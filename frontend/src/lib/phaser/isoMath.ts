/**
 * Isometric coordinate math — 2:1 diamond tiles.
 *
 * Following the standard formula (Clint Bellanger / Tiled convention):
 *   TILE_W = full tile pixel width  (64 px)
 *   TILE_H = full tile pixel height (32 px)
 *
 * Screen ← iso:
 *   sx = (ix - iy) * TILE_W/2      →  ±32 px per iso step
 *   sy = (ix + iy) * TILE_H/2      →  ±16 px per iso step  (2:1 diamond)
 *
 * Iso ← screen (float inverse):
 *   ix =  sx/TILE_W + sy/TILE_H
 *   iy = -sx/TILE_W + sy/TILE_H
 */

export const TILE_W = 64;
export const TILE_H = 32;

export interface ScreenPt { x: number; y: number }

/** Iso grid coords → screen pixel coords (with camera offset + zoom). */
export function isoToScreen(
  isoX: number, isoY: number,
  camX: number, camY: number,
  zoom: number,
): ScreenPt {
  return {
    x: (isoX - isoY) * (TILE_W / 2) * zoom + camX,
    y: (isoX + isoY) * (TILE_H / 2) * zoom + camY,
  };
}

/** Screen pixel coords → iso grid coords (floating point, inverse of isoToScreen). */
export function screenToIso(
  screenX: number, screenY: number,
  camX: number, camY: number,
  zoom: number,
): ScreenPt {
  const sx = (screenX - camX) / zoom;
  const sy = (screenY - camY) / zoom;
  return {
    x:  sx / TILE_W + sy / TILE_H,
    y: -sx / TILE_W + sy / TILE_H,
  };
}

/**
 * Compute camera offset so that iso position (isoX, isoY) appears at
 * screen position (screenW/2, screenH/2).
 */
export function camCenterOn(
  isoX: number, isoY: number,
  screenW: number, screenH: number,
  zoom: number,
): ScreenPt {
  return {
    x: screenW / 2 - (isoX - isoY) * (TILE_W / 2) * zoom,
    y: screenH / 2 - (isoX + isoY) * (TILE_H / 2) * zoom,
  };
}

/** Darken an 0xRRGGBB colour by factor (0–1). */
export function darken(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor);
  const g = Math.floor(((color >>  8) & 0xff) * factor);
  const b = Math.floor(( color        & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}
