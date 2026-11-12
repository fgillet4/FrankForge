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
import { ResourceType, PlanetType, TerrainType } from '../types';
import type { PlanetMap } from '../types';
import { mapGenerator } from '../mapGenerator';

import { TILE_W, TILE_H, isoToScreen, screenToIso, camCenterOn } from './isoMath';
import { drawTile, drawResource, drawHover, RESOURCE_NAMES } from './terrainRenderer';
import { drawPlayer, drawEnemy, type Enemy }                 from './characterRenderer';
import { drawBuilding }                                      from './buildingRenderer';
import { ATTACK_RADIUS, createEnemyState, updateEnemies }    from './enemySystem';
import type { EnemyState } from './enemySystem';

// Process plant: the Rust/WASM engine, its renderer and its HTML overlay
import * as engine from '../process/engine';
import { CharacterSprite, ProcessLayer, preloadProcessAssets } from '../process/render';
import { ProcessUI, entityTooltip, segmentTooltip } from '../process/ui';

const LAYOUT_KEY = 'frankforge.layout.v1';

/** Ground texture for each terrain type (atlas frames are `<name>_<0..3>`). */
const TERRAIN_TEXTURES: Record<number, string> = {
  [TerrainType.DEEP_WATER]: 'deep_water', [TerrainType.SHALLOW_WATER]: 'shallow_water', [TerrainType.SAND]: 'sand',
  [TerrainType.GRASS]: 'grass', [TerrainType.FOREST]: 'forest', [TerrainType.HILLS]: 'hills',
  [TerrainType.MOUNTAINS]: 'mountains', [TerrainType.SNOW]: 'snow', [TerrainType.VOLCANIC]: 'volcanic',
  [TerrainType.LAVA]: 'lava', [TerrainType.CAVE]: 'cave', [TerrainType.ALIEN_GRASS]: 'alien_grass',
  [TerrainType.ALIEN_FOREST]: 'alien_forest', [TerrainType.ALIEN_CRYSTAL]: 'alien_crystal',
  [TerrainType.METHANE_LAKE]: 'methane_lake', [TerrainType.ICE]: 'ice',
};

// ── Module-level shared state (reset on destroy) ─────────────────────────────
let currentMap:       PlanetMap | null = null;
let currentBuildings: any[]            = [];
let gsUnsub:          (() => void) | null = null;

export let simPaused = false;
export let simSpeed  = 1;
export function toggleSimPause()        { simPaused = !simPaused; return simPaused; }
export function setSimSpeed(s: number)  { simSpeed = s; }

let processLayer: ProcessLayer | null = null;
let processUI:    ProcessUI | null    = null;
let lastSnapshot: engine.Snapshot | null = null;

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

  // Textured ground: one bob per tile, moved and scaled with the camera.
  private terrainBlit:  Phaser.GameObjects.Blitter | null = null;
  private depositBlit:  Phaser.GameObjects.Blitter | null = null;
  private depositBobs = new Map<string, Phaser.GameObjects.Bob>();
  private blitMap: PlanetMap | null = null;

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
  private placementRot  = 0;
  private layingPipe    = false;
  private lastPipeTile: { x: number; y: number } | null = null;
  private snapshotTimer = 0;
  private engineer: CharacterSprite | null = null;
  private buildUntil = 0;
  private aliens = new Map<Enemy, { sprite: CharacterSprite; x: number; y: number }>();
  private saveTimer     = 0;

  // WASD movement keys
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys & {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  constructor() { super({ key: 'WorldScene' }); }

  preload() {
    preloadProcessAssets(this);
    this.load.atlas('terrain', 'assets/process/terrain.png', 'assets/process/terrain.json');
    this.load.atlas('deposits', 'assets/process/deposits.png', 'assets/process/deposits.json');
    for (const name of ['rupture', 'alarm', 'ambient', 'place', 'remove']) {
      this.load.audio(`pp_${name}`, `assets/process/audio/${name}.mp3`);
    }
  }

  private playSound(name: string, volume = 0.5) {
    if (this.cache.audio.exists(`pp_${name}`)) this.sound.play(`pp_${name}`, { volume });
  }

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
    this.enemyGfx.setDepth(40);
    this.playerGfx.setDepth(41);
    this.hoverGfx.setDepth(42);

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
    kb.on('keydown-R',     () => { this.placementRot = (this.placementRot + 1) % 4; });
    kb.on('keydown-ESC',   () => {
      if (this.placementMode) processUI?.selectProto(null);
      else this.select(null);
    });
    this.input.mouse?.disableContextMenu();
    // "+" and "−" on either the main keyboard or the numpad.
    kb.on('keydown', (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') simSpeed = Math.min(16, simSpeed * 2);
      if (e.key === '-' || e.key === '_') simSpeed = Math.max(0.25, simSpeed / 2);
    });

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

    // The plant's background hum (starts once the browser allows audio).
    if (this.cache.audio.exists('pp_ambient')) this.sound.add('pp_ambient', { loop: true, volume: 0.18 }).play();

    // The process engine loads asynchronously; the world runs without it until then.
    engine.startEngine().then(() => {
      if (!this.sys.isActive()) return;
      processLayer = new ProcessLayer(this);
      processUI = new ProcessUI();
      processUI.onSelectProto = id => this.setPlacementMode(id !== null, id);
      processUI.onCloseInspector = () => this.select(null);
      try {
        const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? '[]');
        if (Array.isArray(saved)) engine.restore(saved);
      } catch { /* no saved layout */ }
      lastSnapshot = engine.snapshot();
    }).catch(err => console.error('Process engine failed to load', err));

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
      engine.advance(dt);
      this.pickupResources();
    }

    this.snapshotTimer -= delta;
    if (this.snapshotTimer <= 0 && engine.engineReady()) {
      this.snapshotTimer = 100;
      const wasBlackout = lastSnapshot?.grid.blackout ?? false;
      lastSnapshot = engine.snapshot();
      if (lastSnapshot) {
        if (lastSnapshot.events.some(e => e.includes('ruptured'))) this.playSound('rupture', 0.8);
        if (lastSnapshot.grid.blackout && !wasBlackout) this.playSound('alarm', 0.5);
        processUI?.update(lastSnapshot);
      }
    }
    this.saveTimer -= delta;
    if (this.saveTimer <= 0 && engine.engineReady()) {
      this.saveTimer = 5000;
      this.saveLayout();
    }
    this.drawProcess();

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

    if (this.engineer) this.engineer.moving = dx !== 0 || dy !== 0;
    if (dx === 0 && dy === 0) return;
    this.engineer?.face(dx, dy);
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
    this.terrainBlit?.destroy(); this.depositBlit?.destroy();
    this.terrainBlit = this.depositBlit = null; this.blitMap = null; this.depositBobs.clear();
    processLayer?.destroy(); processLayer = null;
    this.engineer?.destroy(); this.engineer = null;
    this.aliens.forEach(a => a.sprite.destroy()); this.aliens.clear();
    processUI?.destroy();    processUI = null;
    lastSnapshot = null;
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
    if (this.textures.exists('terrain')) {
      this.placeTerrainBlitters();
      return;
    }

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

  /** Builds the textured ground for the current map once, then just follows the camera. */
  private placeTerrainBlitters() {
    if (!currentMap) return;
    if (this.blitMap !== currentMap) {
      this.terrainBlit?.destroy();
      this.depositBlit?.destroy();
      this.depositBobs.clear();
      this.terrainBlit = this.add.blitter(0, 0, 'terrain').setDepth(-2);
      const hasDeposits = this.textures.exists('deposits');
      this.depositBlit = hasDeposits ? this.add.blitter(0, 0, 'deposits').setDepth(-1) : null;
      const tFrames = this.textures.get('terrain').getFrameNames();
      const dFrames = new Set(hasDeposits ? this.textures.get('deposits').getFrameNames() : []);
      for (let iy = 0; iy < currentMap.height; iy++) {
        for (let ix = 0; ix < currentMap.width; ix++) {
          const tile = currentMap.tiles[iy][ix];
          // Texture space is 128 px per tile: the tile's top corner sits at ((ix−iy)·64, (ix+iy)·32).
          const lx = (ix - iy) * 64;
          const ly = (ix + iy) * 32;
          const variant = (ix * 73856093 ^ iy * 19349663) >>> 0;
          const name = TERRAIN_TEXTURES[tile.terrain] ?? 'grass';
          const frame = `${name}_${variant % 4}`;
          this.terrainBlit.create(lx - 65, ly - 1, tFrames.includes(frame) ? frame : tFrames[0]);
          const deposit = tile.resource !== ResourceType.NONE ? RESOURCE_NAMES[tile.resource] : undefined;
          // Decals on rich tiles and a scattering of the rest, so deposits read as patches.
          const shown = (tile.resourceDensity ?? 0.5) > 0.75 || variant % 3 === 0;
          if (deposit && shown && this.depositBlit && dFrames.has(deposit)) {
            const f = this.textures.getFrame('deposits', deposit);
            // Decals stand on the tile's bottom corner, a little smaller than the tile.
            const bob = this.depositBlit.create(lx - f.width / 2, ly + 64 - f.height, deposit);
            this.depositBobs.set(`${ix},${iy}`, bob);
          }
        }
      }
      this.blitMap = currentMap;
    }
    const camX = this.camX + this.dragOffset.x;
    const camY = this.camY + this.dragOffset.y;
    for (const b of [this.terrainBlit, this.depositBlit]) {
      b?.setPosition(camX, camY).setScale(this.zoom / 2);
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
    this.engineer ??= new CharacterSprite(this);
    if (this.engineer.moving || this.time.now > this.buildUntil) this.engineer.action = null;
    if (this.engineer.draw(state.player.position.x, state.player.position.y, camX, camY, this.zoom)) return;
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
    const alive = new Set(this.enemyState.enemies);
    for (const [e, a] of this.aliens) {
      if (!alive.has(e)) { a.sprite.destroy(); this.aliens.delete(e); }
    }
    for (const e of this.enemyState.enemies) {
      let a = this.aliens.get(e);
      if (!a) this.aliens.set(e, a = { sprite: new CharacterSprite(this, 'alien'), x: e.isoX, y: e.isoY });
      a.sprite.moving = true;
      if (Math.abs(e.isoX - a.x) + Math.abs(e.isoY - a.y) > 1e-3) a.sprite.face(e.isoX - a.x, e.isoY - a.y);
      const player = get(gameState).player;
      const near = player && Math.abs(e.isoX - player.position.x) + Math.abs(e.isoY - player.position.y) < ATTACK_RADIUS;
      a.sprite.action = near ? 'attack' : null;
      if (near) a.sprite.face(player.position.x - e.isoX, player.position.y - e.isoY);
      a.x = e.isoX; a.y = e.isoY;
      if (!a.sprite.draw(e.isoX, e.isoY, camX, camY, this.zoom)) drawEnemy(this.enemyGfx, e, camX, camY, this.zoom);
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
    this.depositBobs.get(`${tx},${ty}`)?.setVisible(false);
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
    const tile = this.tileAt(p.x, p.y);
    if (p.rightButtonDown()) {
      // Right-click removes what is under the cursor.
      const id = engine.entityAt(tile.x, tile.y);
      if (id >= 0) {
        engine.remove(id);
        this.playSound('remove', 0.35);
        if (processLayer?.selected === id) this.select(null);
        this.saveLayout();
      }
      return;
    }
    if (this.placementMode && this.placementType === 'pipe') {
      // Pipes are laid by dragging.
      this.layingPipe = true;
      this.lastPipeTile = null;
      this.layPipeTo(tile.x, tile.y);
      return;
    }
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
    if (this.layingPipe) this.layPipeTo(tx, ty);
    this.updateHover(p, tx, ty);
    if (this.dragActive) {
      this.dragOffset.x = this.dragCamX + (p.x - this.dragStartX);
      this.dragOffset.y = this.dragCamY + (p.y - this.dragStartY);
      this.dirtyTerrain = true;
    }
  }

  private onUp(p: Phaser.Input.Pointer) {
    if (this.layingPipe) {
      this.layingPipe = false;
      this.saveLayout();
      return;
    }
    if (!this.dragActive) return;
    const wasDrag = Math.abs(p.x - this.dragStartX) > 5 || Math.abs(p.y - this.dragStartY) > 5;
    this.dragActive = false;
    if (wasDrag) return;
    const tile = this.tileAt(p.x, p.y);
    if (this.placementMode && this.placementType) {
      this.placeProcess(this.placementType, tile.x, tile.y);
    } else {
      const id = engine.entityAt(tile.x, tile.y);
      this.select(id >= 0 && this.isInspectable(id) ? id : null);
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

  private tileAt(sx: number, sy: number) {
    const iso = screenToIso(sx, sy, this.camX + this.dragOffset.x, this.camY + this.dragOffset.y, this.zoom);
    return { x: Math.floor(iso.x), y: Math.floor(iso.y) };
  }

  /** Top-left tile for a building centred under the cursor. */
  private originFor(proto: string, tx: number, ty: number) {
    const size = engine.PROTO[proto]?.size ?? 1;
    const off = Math.floor((size - 1) / 2);
    return { x: tx - off, y: ty - off };
  }

  /** Whether a building may go here: on the map, and over its resource if it needs one. */
  private placementOk(proto: string, x: number, y: number): boolean {
    const p = engine.PROTO[proto];
    if (!p || !currentMap) return false;
    let resource = !p.needs;
    for (let dy = 0; dy < p.size; dy++) {
      for (let dx = 0; dx < p.size; dx++) {
        const tile = currentMap.tiles[y + dy]?.[x + dx];
        if (!tile) return false;
        if (engine.entityAt(x + dx, y + dy) >= 0) return false;
        if (p.needs === 'water' && (tile.resource === ResourceType.WATER || tile.terrain === TerrainType.SHALLOW_WATER || tile.terrain === TerrainType.ICE)) resource = true;
        if (p.needs === 'methane' && (tile.resource === ResourceType.METHANE || tile.terrain === TerrainType.METHANE_LAKE)) resource = true;
      }
    }
    return resource;
  }

  private placeProcess(proto: string, tx: number, ty: number) {
    const o = this.originFor(proto, tx, ty);
    if (!this.placementOk(proto, o.x, o.y)) {
      const need = engine.PROTO[proto]?.needs;
      if (need) processUI?.alert(`${engine.PROTO[proto].name} must stand on ${need === 'water' ? 'water' : 'a methane deposit'}.`);
      return;
    }
    const err = engine.place(proto, o.x, o.y, this.placementRot);
    if (err) processUI?.alert(err);
    else {
      this.playSound('place', 0.35);
      processLayer?.built(proto, o.x, o.y);
      // The engineer turns to the new building and works on it for a moment.
      const player = get(gameState).player;
      const n = engine.PROTO[proto]?.size ?? 1;
      if (this.engineer && player) {
        this.engineer.face(o.x + n / 2 - player.position.x, o.y + n / 2 - player.position.y);
        this.engineer.action = 'build';
        this.buildUntil = this.time.now + 1500;
      }
      this.saveLayout();
    }
  }

  /** Lays pipe from the last tile to this one, one axis-aligned step at a time. */
  private layPipeTo(tx: number, ty: number) {
    let from = this.lastPipeTile ?? { x: tx, y: ty };
    const steps: { x: number; y: number }[] = [from];
    while (from.x !== tx || from.y !== ty) {
      from = from.x !== tx ? { x: from.x + Math.sign(tx - from.x), y: from.y } : { x: from.x, y: from.y + Math.sign(ty - from.y) };
      steps.push(from);
    }
    for (const t of steps) {
      if (this.placementOk('pipe', t.x, t.y)) engine.place('pipe', t.x, t.y, 0);
    }
    this.lastPipeTile = { x: tx, y: ty };
  }

  private isInspectable(id: number) {
    return lastSnapshot?.entities.some(e => e.id === id) ?? false;
  }

  private select(id: number | null) {
    if (processLayer) processLayer.selected = id;
    processUI?.showInspector(id);
  }

  private updateHover(p: Phaser.Input.Pointer, tx: number, ty: number) {
    if (!processUI || !lastSnapshot) return;
    const id = engine.entityAt(tx, ty);
    const e = id >= 0 ? lastSnapshot.entities.find(x => x.id === id) : undefined;
    const si = processLayer?.segmentAt(tx, ty);
    const text = e ? entityTooltip(e) : si !== undefined ? segmentTooltip(lastSnapshot.segments[si].vessel) : null;
    processUI.hover(text, p.event instanceof MouseEvent ? p.event.clientX : p.x, p.event instanceof MouseEvent ? p.event.clientY : p.y);
  }

  private drawProcess() {
    if (!processLayer) return;
    let ghost = null;
    if (this.placementMode && this.placementType && this.hoverTX >= 0) {
      const o = this.originFor(this.placementType, this.hoverTX, this.hoverTY);
      ghost = { proto: this.placementType, x: o.x, y: o.y, rot: this.placementRot, ok: this.placementOk(this.placementType, o.x, o.y) };
    }
    processLayer.draw(lastSnapshot, this.camX + this.dragOffset.x, this.camY + this.dragOffset.y, this.zoom, ghost, this.time.now);
  }

  private saveLayout() {
    if (!engine.engineReady()) return;
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(engine.layout()));
    } catch { /* storage unavailable */ }
  }

  setPlacementMode(enabled: boolean, type?: string | null) {
    this.placementMode = enabled;
    this.placementType = type ?? null;
  }
}
