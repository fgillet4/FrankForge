<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import PhaserGame from '../components/world/PhaserGame.svelte';
  import { gameState } from '../stores/gameState';
  import { mapGenerator } from '../lib/mapGenerator';
  import { PlanetType } from '../lib/types';
  import { initWasm } from '../wasm';

  let phaserGameComponent: PhaserGame;

  const params = new URLSearchParams(window.location.search);
  let planetType = (params.get('planet') as PlanetType) || PlanetType.EARTH_LIKE;

  let resources = { energy: 0, iron: 0, copper: 0, methane: 0, water: 0, oxygen: 0 };
  let playerHealth = 100;
  let playerMaxHealth = 100;

  const unsubscribe = gameState.subscribe(state => {
    resources = {
      energy:  Math.floor(state.resources?.energy  ?? 0),
      iron:    Math.floor(state.resources?.iron    ?? 0),
      copper:  Math.floor(state.resources?.copper  ?? 0),
      methane: Math.floor(state.resources?.methane ?? 0),
      water:   Math.floor(state.resources?.water   ?? 0),
      oxygen:  Math.floor(state.resources?.oxygen  ?? 0),
    };
    playerHealth    = state.player?.stats?.health    ?? 100;
    playerMaxHealth = state.player?.stats?.maxHealth ?? 100;
  });

  function ensureMapExists() {
    const state = $gameState;
    if (!state.map) {
      const W = 150, H = 150;
      const generatedMap = mapGenerator.generateMap({
        planetType,
        width: W,
        height: H,
        resourceRichness: 0.85,   // dense resources
        specialFeatureCount: 20,
        smoothness: 0.55,
        alienness: 0.35,
      });
      const cx = Math.floor(W / 2);
      const cy = Math.floor(H / 2);
      gameState.update(s => ({
        ...s,
        map: generatedMap,
        planetType,
        tick: 0,
        buildings: [],
        lastUpdated: Date.now(),
        player: { ...s.player, position: { x: cx, y: cy } },
      }));
    }
  }

  onMount(async () => {
    try { await initWasm(); } catch (_) {}
    ensureMapExists();
  });

  onDestroy(() => unsubscribe());
</script>

<!-- Fullscreen game canvas -->
<div class="root">
  <PhaserGame bind:this={phaserGameComponent} />

  <!-- Minimal HUD overlay -->
  <div class="hud">
    <!-- Health bar -->
    <div class="health-bar">
      <div class="health-fill" style="width:{(playerHealth/playerMaxHealth)*100}%"></div>
    </div>

    <!-- Resource chips -->
    <div class="res-row">
      {#if resources.energy  > 0}<span class="res energy" >⚡{resources.energy}</span>{/if}
      {#if resources.iron    > 0}<span class="res iron"   >🔩{resources.iron}</span>{/if}
      {#if resources.copper  > 0}<span class="res copper" >🟠{resources.copper}</span>{/if}
      {#if resources.methane > 0}<span class="res methane">🟣{resources.methane}</span>{/if}
      {#if resources.water   > 0}<span class="res water"  >💧{resources.water}</span>{/if}
      {#if resources.oxygen  > 0}<span class="res oxygen" >🌬{resources.oxygen}</span>{/if}
    </div>

    <!-- Controls hint (bottom) -->
    <div class="hint">WASD move · Tab: cam/player · Scroll: zoom · Space: pause · +/−: speed</div>
  </div>
</div>

<style>
  .root {
    position: fixed;
    inset: 0;
    background: #0f0f1e;
  }

  .hud {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px 14px;
  }

  .health-bar {
    width: 160px;
    height: 8px;
    background: rgba(255,255,255,0.15);
    border-radius: 4px;
    overflow: hidden;
  }
  .health-fill {
    height: 100%;
    background: #2ecc71;
    border-radius: 4px;
    transition: width 0.3s;
  }

  .res-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 6px;
  }
  .res {
    font-size: 0.75rem;
    padding: 2px 7px;
    border-radius: 10px;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(4px);
    color: #fff;
    font-variant-numeric: tabular-nums;
  }

  .hint {
    align-self: center;
    font-size: 0.65rem;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.5px;
  }
</style>
