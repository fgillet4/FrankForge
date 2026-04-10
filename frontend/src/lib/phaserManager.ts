/**
 * phaserManager — public API between Svelte components and the Phaser game.
 *
 * All heavy logic lives in ./phaser/WorldScene.ts and its sub-modules.
 * This file just owns the Phaser.Game instance lifecycle.
 */

import Phaser        from 'phaser';
import { writable }  from 'svelte/store';
import { WorldScene, toggleSimPause, setSimSpeed } from './phaser/WorldScene';

export { isoToScreen, screenToIso } from './phaser/isoMath';
export { toggleSimPause, setSimSpeed };

export const phaserApp = writable<Phaser.Game | null>(null);

let game: Phaser.Game | null = null;

// ── Lifecycle ──────────────────────────────────────────────────────────────

export function initPhaserGame(parent: HTMLElement): Phaser.Game {
  if (game) { game.destroy(true); game = null; }

  game = new Phaser.Game({
    type:            Phaser.AUTO,
    parent,
    width:           parent.clientWidth  || 800,
    height:          parent.clientHeight || 600,
    backgroundColor: '#0a0a14',
    scene:           WorldScene,
    banner:          false,
    scale: {
      mode:       Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });

  phaserApp.set(game);
  return game;
}

export function destroyPhaserGame() {
  if (game) { game.destroy(true); game = null; phaserApp.set(null); }
}

// ── Camera controls ────────────────────────────────────────────────────────

function scene(): WorldScene | undefined {
  return game?.scene.getScene('WorldScene') as WorldScene | undefined;
}

export function movePhaserCamera(dx: number, dy: number) {
  scene()?.panCamera(dx, dy);
}

export function resetPhaserView() {
  scene()?.resetView();
}

// ── Placement mode ─────────────────────────────────────────────────────────

export function setPhaserPlacementMode(enabled: boolean, type?: string | null) {
  scene()?.setPlacementMode(enabled, type);
}
