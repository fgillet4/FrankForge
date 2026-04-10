<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import {
    initPhaserGame,
    destroyPhaserGame,
    movePhaserCamera,
    resetPhaserView,
    setPhaserPlacementMode,
    phaserApp,
  } from '../../lib/phaserManager';
  import { gameState } from '../../stores/gameState';
  import { get } from 'svelte/store';

  export let width  = '100%';
  export let height = '100%';

  const dispatch = createEventDispatcher();

  let gameContainer: HTMLDivElement;
  let selectedBuildingType: string | null = null;
  let isPlacementMode = false;

  // Keyboard state
  let keysPressed: Record<string, boolean> = {};
  let moveInterval: number | null = null;
  let cameraMode = false; // true = move camera, false = move player

  // ---------- Keyboard handlers ----------

  function onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    keysPressed[key] = true;

    if (key === 'tab') {
      cameraMode = !cameraMode;
      e.preventDefault();
      return;
    }

    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
      if (!moveInterval) startMoving();
      e.preventDefault();
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    keysPressed[key] = false;
    const anyMovement = ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']
      .some(k => keysPressed[k]);
    if (!anyMovement && moveInterval) stopMoving();
  }

  function startMoving() {
    moveInterval = window.setInterval(tick, 16);
  }

  function stopMoving() {
    if (moveInterval) { clearInterval(moveInterval); moveInterval = null; }
  }

  function tick() {
    let dx = 0, dy = 0;
    if (keysPressed['w'] || keysPressed['arrowup'])    dy -= 1;
    if (keysPressed['s'] || keysPressed['arrowdown'])  dy += 1;
    if (keysPressed['a'] || keysPressed['arrowleft'])  dx -= 1;
    if (keysPressed['d'] || keysPressed['arrowright']) dx += 1;
    if (!dx && !dy) return;

    if (cameraMode) {
      // Move the isometric camera
      movePhaserCamera(-dx * 10, -dy * 10);
    } else {
      // Move the player in tile-space
      const speed = 0.08;
      if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
      gameState.update(s => {
        if (!s.player) return s;
        const nx = Math.max(0, Math.min((s.map?.width  ?? 200) - 1, s.player.position.x + dx * speed));
        const ny = Math.max(0, Math.min((s.map?.height ?? 200) - 1, s.player.position.y + dy * speed));
        s.player.position.x = nx;
        s.player.position.y = ny;
        return s;
      });
    }
  }

  // ---------- Mount / destroy ----------

  onMount(() => {
    if (!gameContainer) return;

    const game = initPhaserGame(gameContainer);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);

    dispatch('ready', { game });

    return cleanup;
  });

  onDestroy(cleanup);

  function cleanup() {
    stopMoving();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup',   onKeyUp);
    destroyPhaserGame();
  }

  // ---------- Public API (called from parent) ----------

  export function selectBuildingType(type: string) {
    selectedBuildingType = type;
    isPlacementMode = true;
    setPhaserPlacementMode(true, type);
  }

  export function togglePlacementMode(enabled: boolean) {
    isPlacementMode = enabled;
    if (!enabled) selectedBuildingType = null;
    setPhaserPlacementMode(enabled, selectedBuildingType);
  }

  export function resetView() {
    resetPhaserView();
  }
</script>

<div
  class="phaser-container"
  bind:this={gameContainer}
  style:width={typeof width === 'number' ? `${width}px` : width}
  style:height={typeof height === 'number' ? `${height}px` : height}
></div>

<style>
  .phaser-container {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    overflow: hidden;
    background-color: #0f0f1e;
  }
</style>
