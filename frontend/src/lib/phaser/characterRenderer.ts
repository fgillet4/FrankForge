/**
 * Character (player + enemy) rendering.
 * Player: yellow-helmed engineer.
 * Enemy:  red alien creature with health bar.
 *
 * Characters stand with feet at the center of the tile top-face diamond.
 * feetY = cy + th/2  (the visual center of the diamond).
 */

import Phaser from 'phaser';
import { TILE_W, TILE_H, isoToScreen } from './isoMath';

// ── Player ───────────────────────────────────────────────────────────────────

export function drawPlayer(
  gfx: Phaser.GameObjects.Graphics,
  isoX: number, isoY: number,
  health: number, maxHealth: number,
  camX: number, camY: number,
  zoom: number,
) {
  const { x: cx, y: cy } = isoToScreen(isoX, isoY, camX, camY, zoom);
  const tw   = TILE_W * zoom;
  const th   = TILE_H * zoom;

  // Feet anchored at diamond center
  const feetY = cy + th / 2;

  // Shadow
  gfx.fillStyle(0x000000, 0.35);
  gfx.fillEllipse(cx, feetY + 2, tw * 0.45, th * 0.2);

  // Legs
  const legH = tw * 0.22;
  const legW = tw * 0.09;
  gfx.fillStyle(0x3a5a8a, 1);
  gfx.fillRect(cx - legW * 1.3, feetY - legH, legW, legH);
  gfx.fillRect(cx + legW * 0.3, feetY - legH, legW, legH);

  // Body / suit
  const bodyH = tw * 0.32;
  const bodyW = tw * 0.22;
  gfx.fillStyle(0x4a7aaa, 1);
  gfx.fillRect(cx - bodyW / 2, feetY - legH - bodyH, bodyW, bodyH);

  // Chest stripe
  gfx.fillStyle(0x88aacc, 1);
  gfx.fillRect(cx - bodyW * 0.3, feetY - legH - bodyH * 0.7, bodyW * 0.6, bodyH * 0.25);

  // Helmet
  const headR = tw * 0.14;
  const headY = feetY - legH - bodyH - headR * 0.5;
  gfx.fillStyle(0xffcc00, 1);
  gfx.fillCircle(cx, headY, headR);

  // Visor
  gfx.fillStyle(0x00ccff, 0.85);
  gfx.fillEllipse(cx + headR * 0.1, headY + headR * 0.1, headR * 1.1, headR * 0.65);

  // Health bar (above head)
  const barW = tw * 0.5;
  const barH = 4;
  const barX = cx - barW / 2;
  const barY = headY - headR - 8;
  gfx.fillStyle(0x330000, 1);
  gfx.fillRect(barX, barY, barW, barH);
  const pct = maxHealth > 0 ? health / maxHealth : 1;
  const barColor = pct > 0.6 ? 0x22cc44 : pct > 0.3 ? 0xffaa00 : 0xff2200;
  gfx.fillStyle(barColor, 1);
  gfx.fillRect(barX, barY, barW * pct, barH);
}

// ── Enemy ────────────────────────────────────────────────────────────────────

export interface Enemy {
  id: number;
  isoX: number;
  isoY: number;
  health: number;
  maxHealth: number;
  speed: number;
  path: { x: number; y: number }[];
  pathIndex: number;
  recomputeTimer: number;
}

export function drawEnemy(
  gfx: Phaser.GameObjects.Graphics,
  e: Enemy,
  camX: number, camY: number,
  zoom: number,
) {
  const { x: cx, y: cy } = isoToScreen(e.isoX, e.isoY, camX, camY, zoom);
  const tw = TILE_W * zoom;
  const th = TILE_H * zoom;

  // Feet anchored at diamond center
  const feetY = cy + th / 2;

  // Shadow
  gfx.fillStyle(0x000000, 0.3);
  gfx.fillEllipse(cx, feetY + 2, tw * 0.4, th * 0.2);

  // Body
  const bh = tw * 0.55;
  const bw = tw * 0.18;
  gfx.fillStyle(0xaa1100, 1);
  gfx.fillRect(cx - bw / 2, feetY - bh, bw, bh * 0.7);

  // Claws (extending sideways at mid-body height)
  const midBodyY = feetY - bh * 0.5;
  gfx.fillStyle(0xdd3300, 1);
  gfx.fillRect(cx - bw * 1.6, midBodyY - bh * 0.15, bw * 0.7, bh * 0.3);
  gfx.fillRect(cx + bw * 0.9, midBodyY - bh * 0.15, bw * 0.7, bh * 0.3);

  // Head
  const hr = tw * 0.12;
  const headTopY = feetY - bh;
  gfx.fillStyle(0xff2200, 1);
  gfx.fillCircle(cx, headTopY + hr, hr);

  // Eyes
  gfx.fillStyle(0xffff00, 1);
  gfx.fillCircle(cx - hr * 0.4, headTopY + hr * 0.8, hr * 0.3);
  gfx.fillCircle(cx + hr * 0.4, headTopY + hr * 0.8, hr * 0.3);

  // Health bar
  const bw2 = tw * 0.45;
  const bh2 = 3;
  const bx2 = cx - bw2 / 2;
  const by2 = headTopY - 6;
  gfx.fillStyle(0x440000, 1);
  gfx.fillRect(bx2, by2, bw2, bh2);
  gfx.fillStyle(0xff2200, 1);
  gfx.fillRect(bx2, by2, bw2 * (e.health / e.maxHealth), bh2);
}
