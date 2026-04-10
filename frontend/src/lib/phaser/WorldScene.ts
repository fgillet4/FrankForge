/**
 * WorldScene — Phaser 3 scene that orchestrates all rendering subsystems.
 *
 * Camera model
 * ────────────
 * We manage our own 2-D camera offset (camX, camY) and zoom.
 * Every frame the camera LERPS toward centering on the player —
 * this is the Factorio-style "character-follow" camera.
 *
 * Manual drag pans a temporary offset that decays back to follow.
 */

import Phaser   from 'phaser';
import { get }  from 'svelte/store';
import { gameState } from '../../stores/gameState';
import { ResourceType, PlanetType } from '../types';
import type { PlanetMap } from '../types';
import { mapGenerator } from '../mapGenerator';

import { TILE_W, TILE_H, isoToScreen, screenToIso, camCenterOn } from './isoMath';
import { drawTile, drawResource, drawHover, RESOURCE_NAMES } from './terrainRenderer';
import { drawPlayer, drawEnemy }                             from './characterRenderer';
import { drawBuilding }                                      from './buildingRenderer';
import { createEnemyState, updateEnemies }                   from './enemySystem';
import type { EnemyState } from './enemySystem';

// Simulation imports
import { stepSimulation, createBuildingState, makeFlowVector } from '../simulationEngine';
import type { BuildingSimState, PipeConnection }               from '../simulationEngine';

// ── Module-level shared state (reset on destroy) ─────────────────────────────
let currentMap:       PlanetMap | null = null;
let currentBuildings: any[]            = [];
let gsUnsub:          (() => void) | null = null;

export let simPaused = false;
export let simSpeed  = 1;
export function toggleSimPause()        { simPaused = !simPaused; return simPaused; }
export function setSimSpeed(s: number)  { simSpeed = s; }

let simStates:      Map<string, BuildingSimState> = new Map();
let simConnections: PipeConnection[]              = [];

// ── Scene ────────────────────────────────────────────────────────────────────

export class WorldScene extends Phaser.Scene {
  // Rendering layers (painter's order)
  private terrainGfx!:  Phaser.GameObjects.Graphics;
  private buildingGfx!: Phaser.GameObjects.Graphics;
  private enemyGfx!:    Phaser.GameObjects.Graphics;
  private playerGfx!:   Phaser.GameObjects.Graphics;
  private hoverGfx!:    Phaser.GameObjects.Graphics;

  // HUD text
  private simText!:   Phaser.GameObjects.Text;
  private coordText!: Phaser.GameObjects.Text;

  // Camera state
  public camX  = 0;
  public camY  = 0;
  public zoom  = 1.2;

  private dragActive = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCamX   = 0;
  private dragCamY   = 0;
  private dragOffset = { x: 0, y: 0 };   // temporary pan offset (decays)

  // Hover tile
  private hoverTX = -1;
  private hoverTY = -1;

  // Dirty flag — terrain redraws only when needed
  private dirtyTerrain = true;

  // Enemy subsystem
  private enemyState: EnemyState = createEnemyState();

  // Float-up pickup labels
  private floatLabels: { text: Phaser.GameObjects.Text; life: number }[] = [];

  // Placement mode
  private placementMode = false;
  private placementType: string | null = null;

  // WASD movement keys
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys & {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  constructor() { super({ key: 'WorldScene' }); }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  create() {
    const W = this.scale.width  || 800;
    const H = this.scale.height || 600;

    // Layers
    this.terrainGfx  = this.add.graphics();
    this.buildingGfx = this.add.graphics();
    this.enemyGfx    = this.add.graphics();
    this.playerGfx   = this.add.graphics();
    this.hoverGfx    = this.add.graphics();

    // HUD text
    this.simText = this.add.text(8, H - 28, '', {
      fontSize: '11px', color: '#ffff88',
      backgroundColor: '#00000099',
      padding: { x: 4, y: 2 },
    }).setDepth(200).setScrollFactor(0);

    this.coordText = this.add.text(8, 8, '', {
      fontSize: '11px', color: '#aaccff',
      backgroundColor: '#00000099',
      padding: { x: 4, y: 2 },
    }).setDepth(200).setScrollFactor(0);

    // ── Load map from MenuScene (pre-generated) or fallback ─────────────
    const prebuilt = this.game.registry.get('map') as PlanetMap | null;
    const map: PlanetMap = prebuilt ?? mapGenerator.generateMap({
      planetType:          PlanetType.EARTH_LIKE,
      width:               120,
      height:              120,
      seed:                (this.game.registry.get('seed') as number) || 42,
      resourceRichness:    0.9,
      specialFeatureCount: 18,
      smoothness:          0.55,
      alienness:           0.3,
    });
    // Clear registry entry so restarting the scene doesn't reuse a stale map
    this.game.registry.remove('map');

    gameState.update(s => ({
      ...s,
      map,
      player: {
        ...s.player,
        position: { x: map.width / 2, y: map.height / 2 },
      },
    }));

    // ── Keyboard ────────────────────────────────────────────────────────
    const kb = this.input.keyboard!;
    this.keys = {
      ...kb.createCursorKeys(),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    kb.on('keydown-SPACE', () => { simPaused = !simPaused; });
    kb.on('keydown-PLUS',  () => { simSpeed = Math.min(8,   simSpeed * 2); });
    kb.on('keydown-MINUS', () => { simSpeed = Math.max(0.25, simSpeed / 2); });

    // Pointer input
    this.input.on('pointerdown',  this.onDown,  this);
    this.input.on('pointermove',  this.onMove,  this);
    this.input.on('pointerup',    this.onUp,    this);
    this.input.on('wheel',        this.onWheel, this);

    // Subscribe to game state
    gsUnsub = gameState.subscribe(state => {
      if (state.map && state.map !== currentMap) {
        currentMap = state.map;
        this.dirtyTerrain = true;
        // Centre camera immediately on player when map first loads
        if (state.player) this.snapCameraToPlayer(state.player.position.x, state.player.position.y);
      }
      if (state.buildings !== currentBuildings) {
        currentBuildings = state.buildings ?? [];
        this.dirtyTerrain = true;
      }
    });

    // Grab current state if map already exists
    const snap = get(gameState);
    if (snap.map) {
      currentMap = snap.map;
      this.dirtyTerrain = true;
    }
    if (snap.player) {
      this.snapCameraToPlayer(snap.player.position.x, snap.player.position.y);
    }
  }

  update(_time: number, delta: number) {
    const dt = (delta / 1000) * simSpeed;

    // Move player via WASD
    if (!simPaused) this.movePlayer(delta / 1000);

    // Follow player (lerp)
    this.followPlayer();

    // Apply decaying drag offset
    this.dragOffset.x *= 0.88;
    this.dragOffset.y *= 0.88;

    // Redraw terrain only when dirty
    if (this.dirtyTerrain) {
      this.redrawTerrain();
      this.redrawBuildings();
      this.dirtyTerrain = false;
    }

    if (!simPaused) {
      const state = get(gameState);
      if (currentMap && state.player) {
        const dmg = updateEnemies(
          this.enemyState, dt,
          state.player.position.x,
          state.player.position.y,
          currentMap,
        );
        if (dmg > 0) {
          gameState.update(s => {
            if (s.player) s.player.stats.health = Math.max(0, s.player.stats.health - dmg);
            return s;
          });
        }
      }
      this.runSimulation(dt);
      this.pickupResources();
    }

    this.redrawEnemies();
    this.redrawPlayer();
    this.tickFloatLabels();
    this.updateHUD();
  }

  // ── Player movement (WASD) ─────────────────────────────────────────────────

  private movePlayer(rawDt: number) {
    if (!this.keys) return;
    const dt    = Math.min(rawDt, 0.1);
    const state = get(gameState);
    if (!state.player || !currentMap) return;

    const spd = (state.player.stats?.speed ?? 5) * dt;
    let dx = 0, dy = 0;

    if (this.keys.w.isDown || this.keys.up.isDown)    dy -= 1;
    if (this.keys.s.isDown || this.keys.down.isDown)  dy += 1;
    if (this.keys.a.isDown || this.keys.left.isDown)  dx -= 1;
    if (this.keys.d.isDown || this.keys.right.isDown) dx += 1;

    if (dx === 0 && dy === 0) return;
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const nx = Phaser.Math.Clamp(state.player.position.x + dx * spd, 0, currentMap.width  - 1);
    const ny = Phaser.Math.Clamp(state.player.position.y + dy * spd, 0, currentMap.height - 1);
    const tile = currentMap.tiles[Math.floor(ny)]?.[Math.floor(nx)];
    if (tile?.traversable !== false) {
      gameState.update(s => {
        if (s.player) { s.player.position.x = nx; s.player.position.y = ny; }
        return s;
      });
      this.dirtyTerrain = true;
    }
  }

  shutdown() {
    gsUnsub?.(); gsUnsub = null;
    currentMap = null; currentBuildings = [];
    simStates.clear();
    this.floatLabels.forEach(f => f.text.destroy());
    this.floatLabels = [];
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  private snapCameraToPlayer(px: number, py: number) {
    const W = this.scale.width  || 800;
    const H = this.scale.height || 600;
    const c = camCenterOn(px, py, W, H, this.zoom);
    this.camX = c.x;
    this.camY = c.y;
  }

  private followPlayer() {
    const state = get(gameState);
    if (!state.player) return;
    const W = this.scale.width  || 800;
    const H = this.scale.height || 600;
    const target = camCenterOn(
      state.player.position.x,
      state.player.position.y,
      W, H, this.zoom,
    );
    const LERP = 0.12;
    this.camX += (target.x + this.dragOffset.x - this.camX) * LERP;
    this.camY += (target.y + this.dragOffset.y - this.camY) * LERP;

    // Mark dirty if camera moved significantly
    if (Math.abs(target.x + this.dragOffset.x - this.camX) > 0.5) {
      this.dirtyTerrain = true;
    }
  }

  panCamera(dx: number, dy: number) {
    this.dragOffset.x += dx;
    this.dragOffset.y += dy;
    this.dirtyTerrain = true;
  }

  resetView() {
    this.dragOffset = { x: 0, y: 0 };
    const state = get(gameState);
    if (state.player) this.snapCameraToPlayer(state.player.position.x, state.player.position.y);
    this.zoom = 1.2;
    this.dirtyTerrain = true;
  }

  // ── Terrain rendering ──────────────────────────────────────────────────────

  private redrawTerrain() {
    this.terrainGfx.clear();
    if (!currentMap) return;

    const W = this.scale.width  || 800;
    const H = this.scale.height || 600;
    const camX = this.camX + this.dragOffset.x;
    const camY = this.camY + this.dragOffset.y;

    // Viewport iso bounds (with padding)
    const corners = [
      screenToIso(0, 0, camX, camY, this.zoom),
      screenToIso(W, 0, camX, camY, this.zoom),
      screenToIso(0, H, camX, camY, this.zoom),
      screenToIso(W, H, camX, camY, this.zoom),
    ];
    const pad = 3;
    const minX = Math.max(0, Math.floor(Math.min(...corners.map(c => c.x))) - pad);
    const maxX = Math.min(currentMap.width - 1,  Math.ceil(Math.max(...corners.map(c => c.x))) + pad);
    const minY = Math.max(0, Math.floor(Math.min(...corners.map(c => c.y))) - pad);
    const maxY = Math.min(currentMap.height - 1, Math.ceil(Math.max(...corners.map(c => c.y))) + pad);

    // Painter's algorithm: ascending isoX + isoY
    for (let sum = minX + minY; sum <= maxX + maxY; sum++) {
      for (let ix = Math.max(minX, sum - maxY); ix <= Math.min(maxX, sum - minY); ix++) {
        const iy = sum - ix;
        if (iy < 0 || iy >= currentMap.height) continue;
        const tile = currentMap.tiles[iy]?.[ix];
        if (!tile) continue;

        drawTile(this.terrainGfx, ix, iy, tile.terrain, camX, camY, this.zoom);

        if (tile.resource !== ResourceType.NONE) {
          drawResource(this.terrainGfx, ix, iy, tile.resource, tile.resourceDensity ?? 0.5, camX, camY, this.zoom);
        }
      }
    }
  }

  // ── Buildings ──────────────────────────────────────────────────────────────

  private redrawBuildings() {
    this.buildingGfx.clear();
    if (!currentBuildings.length) return;
    const camX = this.camX + this.dragOffset.x;
    const camY = this.camY + this.dragOffset.y;
    const sorted = [...currentBuildings].sort((a, b) => {
      const ax = (a.position?.x ?? 0) + (a.position?.y ?? 0);
      const bx = (b.position?.x ?? 0) + (b.position?.y ?? 0);
      return ax - bx;
    });
    for (const b of sorted) drawBuilding(this.buildingGfx, b, camX, camY, this.zoom);
  }

  // ── Characters ─────────────────────────────────────────────────────────────

  private redrawPlayer() {
    this.playerGfx.clear();
    const state = get(gameState);
    if (!state.player) return;
    const camX = this.camX + this.dragOffset.x;
    const camY = this.camY + this.dragOffset.y;
    drawPlayer(
      this.playerGfx,
      state.player.position.x, state.player.position.y,
      state.player.stats.health, state.player.stats.maxHealth,
      camX, camY, this.zoom,
    );
  }

  private redrawEnemies() {
    this.enemyGfx.clear();
    const camX = this.camX + this.dragOffset.x;
    const camY = this.camY + this.dragOffset.y;
    for (const e of this.enemyState.enemies) {
      drawEnemy(this.enemyGfx, e, camX, camY, this.zoom);
    }
  }

  // ── Resource pickup ────────────────────────────────────────────────────────

  private pickupCooldown = 0;

  private pickupResources() {
    this.pickupCooldown -= 1;
    if (this.pickupCooldown > 0 || !currentMap) return;

    const state = get(gameState);
    if (!state.player) return;
    const tx = Math.floor(state.player.position.x);
    const ty = Math.floor(state.player.position.y);
    if (tx < 0 || ty < 0 || tx >= currentMap.width || ty >= currentMap.height) return;

    const tile = currentMap.tiles[ty]?.[tx];
    if (!tile || tile.resource === ResourceType.NONE) return;

    const key    = RESOURCE_NAMES[tile.resource];
    if (!key) return;
    const amount = Math.ceil((tile.resourceDensity ?? 0.5) * 8 + 2);

    // Remove resource from tile
    currentMap.tiles[ty][tx].resource = ResourceType.NONE;
    currentMap.tiles[ty][tx].resourceDensity = 0;
    this.dirtyTerrain = true;

    // Credit player
    gameState.update(s => {
      s.resources[key] = (s.resources[key] ?? 0) + amount;
      return s;
    });

    this.pickupCooldown = 10;

    // Floating label
    const camX = this.camX + this.dragOffset.x;
    const camY = this.camY + this.dragOffset.y;
    const sp   = isoToScreen(tx + 0.5, ty, camX, camY, this.zoom);
    const lbl  = this.add.text(sp.x, sp.y - TILE_H * this.zoom * 0.5, `+${amount} ${key}`, {
      fontSize: '12px', color: '#ffff44',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(300);
    this.floatLabels.push({ text: lbl, life: 55 });
  }

  private tickFloatLabels() {
    this.floatLabels = this.floatLabels.filter(f => {
      f.life--;
      f.text.y   -= 0.6;
      f.text.alpha = f.life / 55;
      if (f.life <= 0) { f.text.destroy(); return false; }
      return true;
    });
  }

  // ── Simulation ─────────────────────────────────────────────────────────────

  private runSimulation(dt: number) {
    if (!currentBuildings.length) return;
    for (const b of currentBuildings) {
      const id = b.id ?? `${b.position?.x},${b.position?.y}`;
      if (!simStates.has(id)) simStates.set(id, createBuildingState(id, b.type ?? 'storage'));
    }
    stepSimulation(simStates, simConnections, dt);

    let org1 = 0, org2 = 0, inorg = 0;
    for (const s of simStates.values()) {
      org1  += s.mass[5]; org2 += s.mass[6]; inorg += s.mass[4];
    }
    gameState.update(gs => {
      if (!gs.resources) return gs;
      gs.resources.methane = Math.round(org1  / 100);
      gs.resources.oxygen  = Math.round(org2  / 100);
      gs.resources.energy  = Math.round(inorg / 10);
      return gs;
    });
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  private updateHUD() {
    const speed = simPaused ? 'PAUSED' : `${simSpeed}×`;
    this.simText.setText(`[SPACE] ${speed}  [+/−] speed  enemies: ${this.enemyState.enemies.length}`);
    if (this.hoverTX >= 0 && currentMap) {
      const tile = currentMap.tiles[this.hoverTY]?.[this.hoverTX];
      if (tile) {
        const t = (tile as any).__proto__.constructor.name ?? tile.terrain;
        this.coordText.setText(`(${this.hoverTX}, ${this.hoverTY})`);
      }
    } else {
      this.coordText.setText('');
    }
  }

  // ── Pointer input ──────────────────────────────────────────────────────────

  private onDown(p: Phaser.Input.Pointer) {
    this.dragActive = true;
    this.dragStartX = p.x; this.dragStartY = p.y;
    this.dragCamX   = this.dragOffset.x;
    this.dragCamY   = this.dragOffset.y;
  }

  private onMove(p: Phaser.Input.Pointer) {
    const camX = this.camX + this.dragOffset.x;
    const camY = this.camY + this.dragOffset.y;
    const iso  = screenToIso(p.x, p.y, camX, camY, this.zoom);
    const tx   = Math.floor(iso.x);
    const ty   = Math.floor(iso.y);
    if (tx !== this.hoverTX || ty !== this.hoverTY) {
      this.hoverTX = tx; this.hoverTY = ty;
      this.hoverGfx.clear();
      if (currentMap && tx >= 0 && ty >= 0 && tx < currentMap.width && ty < currentMap.height) {
        drawHover(this.hoverGfx, tx, ty, camX, camY, this.zoom);
      }
    }
    if (this.dragActive) {
      this.dragOffset.x = this.dragCamX + (p.x - this.dragStartX);
      this.dragOffset.y = this.dragCamY + (p.y - this.dragStartY);
      this.dirtyTerrain = true;
    }
  }

  private onUp(p: Phaser.Input.Pointer) {
    const wasDrag = Math.abs(p.x - this.dragStartX) > 5 || Math.abs(p.y - this.dragStartY) > 5;
    this.dragActive = false;
    if (!wasDrag && this.placementMode && this.placementType) {
      this.placeBuilding(p.x, p.y);
    }
  }

  private onWheel(_p: Phaser.Input.Pointer, _o: any[], _dx: number, dy: number) {
    const factor   = dy > 0 ? 0.88 : 1.14;
    const prevZoom = this.zoom;
    this.zoom      = Phaser.Math.Clamp(this.zoom * factor, 0.25, 4);
    // Keep camera centred on player after zoom
    const state = get(gameState);
    if (state.player) this.snapCameraToPlayer(state.player.position.x, state.player.position.y);
    this.dirtyTerrain = true;
  }

  // ── Building placement ─────────────────────────────────────────────────────

  private placeBuilding(sx: number, sy: number) {
    const camX = this.camX + this.dragOffset.x;
    const camY = this.camY + this.dragOffset.y;
    const iso  = screenToIso(sx, sy, camX, camY, this.zoom);
    const tx   = Math.floor(iso.x);
    const ty   = Math.floor(iso.y);
    if (!currentMap || tx < 0 || ty < 0 || tx >= currentMap.width || ty >= currentMap.height) return;
    gameState.update(s => {
      s.buildings.push({
        id:   `${this.placementType}_${tx}_${ty}_${Date.now()}`,
        type: this.placementType!,
        position: { x: tx, y: ty },
        connections: [],
      });
      return s;
    });
    this.dirtyTerrain = true;
  }

  setPlacementMode(enabled: boolean, type?: string | null) {
    this.placementMode = enabled;
    this.placementType = type ?? null;
  }
}
