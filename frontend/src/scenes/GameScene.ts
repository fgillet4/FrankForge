/**
 * GameScene — isometric world, player movement, resource pickup, enemies.
 *
 * Everything is self-contained: map generation, rendering, HUD.
 * Camera immediately centers on player via camCenterOn() — no race conditions.
 */

import Phaser from 'phaser';
import { mapGenerator } from '../lib/mapGenerator';
import { PlanetType, TerrainType, ResourceType } from '../lib/types';
import type { PlanetMap, MapTile } from '../lib/types';

import { TILE_W, TILE_H, isoToScreen, screenToIso, camCenterOn } from '../lib/phaser/isoMath';
import { drawTile, drawResource, drawHover, RESOURCE_NAMES, TERRAIN_COLORS, RESOURCE_COLORS } from '../lib/phaser/terrainRenderer';
import { drawPlayer, drawEnemy }                                    from '../lib/phaser/characterRenderer';
import { drawBuilding }                                             from '../lib/phaser/buildingRenderer';
import { createEnemyState, updateEnemies }                         from '../lib/phaser/enemySystem';
import type { EnemyState }                                          from '../lib/phaser/enemySystem';

// ── Types ────────────────────────────────────────────────────────────────────

interface PlayerState {
  x: number; y: number;
  health: number; maxHealth: number;
  speed: number;   // tiles / second
}

interface Resources { [key: string]: number }

// ── Scene ────────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {

  // World data
  private map!:      PlanetMap;
  private player!:   PlayerState;
  private resources: Resources = {};
  private buildings: any[]     = [];

  // Camera
  private camX   = 0;
  private camY   = 0;
  private zoom   = 1.0;
  private dragOn = false;
  private dragSX = 0; private dragSY = 0;
  private dragCX = 0; private dragCY = 0;

  // Rendering layers
  private terrainGfx!:  Phaser.GameObjects.Graphics;
  private buildingGfx!: Phaser.GameObjects.Graphics;
  private enemyGfx!:    Phaser.GameObjects.Graphics;
  private playerGfx!:   Phaser.GameObjects.Graphics;
  private hoverGfx!:    Phaser.GameObjects.Graphics;
  private fogGfx!:      Phaser.GameObjects.Graphics;
  private dirtyTerrain  = true;
  private hoverX = -1; private hoverY = -1;

  // Minimap
  private minimapGfx!:         Phaser.GameObjects.Graphics;
  private minimapDynGfx!:      Phaser.GameObjects.Graphics;
  private mmX = 0;
  private mmY = 0;
  private mmScale = 1.5;
  private minimapTerrainDirty = true;
  private minimapFrameTimer   = 0;

  // HUD text objects
  private hudRes!:    Phaser.GameObjects.Text;
  private hudStatus!: Phaser.GameObjects.Text;
  private hudCoord!:  Phaser.GameObjects.Text;
  private hudPlanet!: Phaser.GameObjects.Text;

  // Simulation
  private simPaused = false;
  private simSpeed  = 1;

  // Enemies
  private enemies: EnemyState = createEnemyState();

  // Floating pickup labels
  private floatLabels: { txt: Phaser.GameObjects.Text; life: number }[] = [];

  // Pickup cooldown (frames)
  private pickCooldown = 0;

  // WASD keys
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys & {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  constructor() { super({ key: 'GameScene' }); }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Generate world ──────────────────────────────────────────────────
    const seed = (this.game.registry.get('seed') as number) || 42;
    console.log('[GameScene] generating map, seed=', seed);

    this.map = mapGenerator.generateMap({
      planetType:          PlanetType.EARTH_LIKE,
      width:               120,
      height:              120,
      seed,
      resourceRichness:    0.9,
      specialFeatureCount: 18,
      smoothness:          0.55,
      alienness:           0.3,
    });

    // ── Player ──────────────────────────────────────────────────────────
    this.player = {
      x: this.map.width  / 2,
      y: this.map.height / 2,
      health: 100, maxHealth: 100,
      speed: 5,
    };

    // ── Resources ────────────────────────────────────────────────────────
    this.resources = { iron: 0, copper: 0, water: 0, oxygen: 0, methane: 0, energy: 0, silicon: 0 };

    // ── Camera — IMMEDIATELY centered on player ──────────────────────────
    const c = camCenterOn(this.player.x, this.player.y, W, H, this.zoom);
    this.camX = c.x;
    this.camY = c.y;
    console.log(`[GameScene] camera at (${this.camX.toFixed(0)}, ${this.camY.toFixed(0)})`);
    console.log(`[GameScene] player at iso (${this.player.x}, ${this.player.y})`);

    // ── Graphics layers ──────────────────────────────────────────────────
    this.terrainGfx  = this.add.graphics();
    this.fogGfx      = this.add.graphics();
    this.buildingGfx = this.add.graphics();
    this.enemyGfx    = this.add.graphics();
    this.playerGfx   = this.add.graphics();
    this.hoverGfx    = this.add.graphics();

    // ── HUD text ─────────────────────────────────────────────────────────
    this.hudRes = this.add.text(12, 12, '', {
      fontSize: '13px', fontFamily: 'monospace',
      color: '#ffffff', backgroundColor: '#00000099',
      padding: { x: 8, y: 6 }, lineSpacing: 4,
    }).setDepth(500).setScrollFactor(0);

    this.hudStatus = this.add.text(12, H - 28, '', {
      fontSize: '11px', fontFamily: 'monospace',
      color: '#ffff88', backgroundColor: '#00000099',
      padding: { x: 6, y: 3 },
    }).setDepth(500).setScrollFactor(0);

    this.hudCoord = this.add.text(W - 12, 12, '', {
      fontSize: '11px', fontFamily: 'monospace',
      color: '#aaccff', backgroundColor: '#00000099',
      padding: { x: 6, y: 3 },
    }).setDepth(500).setScrollFactor(0).setOrigin(1, 0);

    this.hudPlanet = this.add.text(W / 2, 12, this.map.name, {
      fontSize: '14px', fontFamily: 'monospace',
      color: '#cceeff', backgroundColor: '#00000099',
      padding: { x: 8, y: 4 },
    }).setDepth(500).setScrollFactor(0).setOrigin(0.5, 0);

    // ── Input ────────────────────────────────────────────────────────────
    const kb = this.input.keyboard!;
    this.keys = {
      ...kb.createCursorKeys(),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    kb.on('keydown-ESC',   () => this.openPause());
    kb.on('keydown-SPACE', () => { this.simPaused = !this.simPaused; });
    kb.on('keydown-PLUS',  () => { this.simSpeed = Math.min(8,    this.simSpeed * 2); });
    kb.on('keydown-MINUS', () => { this.simSpeed = Math.max(0.25, this.simSpeed / 2); });

    this.input.mouse!.disableContextMenu();
    this.input.on('pointerdown',  this.onDown,  this);
    this.input.on('pointermove',  this.onMove,  this);
    this.input.on('pointerup',    this.onUp,    this);
    this.input.on('pointerupoutside', this.onUp, this);
    this.input.on('wheel',        this.onWheel, this);

    // ── Build minimap ────────────────────────────────────────────────────
    this.buildMinimap();

    // ── Initial render ───────────────────────────────────────────────────
    this.redrawTerrain();
    console.log('[GameScene] initial terrain drawn');
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.1) * this.simSpeed;

    // ── Player movement ───────────────────────────────────────────────────
    if (!this.simPaused) this.movePlayer(delta / 1000);

    // ── Camera follow (smooth lerp) ───────────────────────────────────────
    this.followCamera();

    // ── Discovery expansion ───────────────────────────────────────────────
    this.updateDiscovery();

    // ── Redraw terrain if dirty ───────────────────────────────────────────
    if (this.dirtyTerrain) {
      this.redrawTerrain();
      this.dirtyTerrain = false;
    }

    // ── Enemies & resource pickup ─────────────────────────────────────────
    if (!this.simPaused) {
      const dmg = updateEnemies(this.enemies, dt, this.player.x, this.player.y, this.map);
      this.player.health = Math.max(0, this.player.health - dmg);
      this.pickupResources();
    }

    // ── Redraw dynamic objects every frame ───────────────────────────────
    this.redrawEnemies();
    this.redrawPlayer();
    this.tickFloatLabels();
    this.updateHUD();

    // ── Minimap updates ───────────────────────────────────────────────────
    this.updateMinimapDyn();
    this.minimapFrameTimer++;
    if (this.minimapFrameTimer >= 90) {
      this.minimapFrameTimer = 0;
      if (this.minimapTerrainDirty) {
        this.redrawMinimap();
      }
    }
  }

  shutdown() {
    this.floatLabels.forEach(f => f.txt.destroy());
    this.floatLabels = [];
  }

  // ── Player movement ────────────────────────────────────────────────────────

  private movePlayer(rawDt: number) {
    const dt    = Math.min(rawDt, 0.1);
    const spd   = this.player.speed * dt;
    let dx = 0, dy = 0;

    if (this.keys.w.isDown || this.keys.up.isDown)    dy -= 1;
    if (this.keys.s.isDown || this.keys.down.isDown)  dy += 1;
    if (this.keys.a.isDown || this.keys.left.isDown)  dx -= 1;
    if (this.keys.d.isDown || this.keys.right.isDown) dx += 1;

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    if (dx !== 0 || dy !== 0) {
      const nx = Phaser.Math.Clamp(this.player.x + dx * spd, 0, this.map.width  - 1);
      const ny = Phaser.Math.Clamp(this.player.y + dy * spd, 0, this.map.height - 1);
      const tile = this.map.tiles[Math.floor(ny)]?.[Math.floor(nx)];
      if (tile?.traversable !== false) {
        this.player.x = nx;
        this.player.y = ny;
      }
    }
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  private followCamera() {
    if (this.dragOn) return;
    const W = this.scale.width;
    const H = this.scale.height;
    const target = camCenterOn(this.player.x, this.player.y, W, H, this.zoom);
    const dx = target.x - this.camX;
    const dy = target.y - this.camY;

    // Snap to target when very close — stops the asymptotic drift that causes
    // a terrain redraw every single frame even when the player is standing still.
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      if (dx !== 0 || dy !== 0) { this.camX = target.x; this.camY = target.y; this.dirtyTerrain = true; }
      return;
    }

    const LERP  = 0.12;
    const prevX = this.camX;
    const prevY = this.camY;
    this.camX  += dx * LERP;
    this.camY  += dy * LERP;
    // Only dirty when camera actually moves a visible amount (≥1.5 px).
    if (Math.abs(this.camX - prevX) > 1.5 || Math.abs(this.camY - prevY) > 1.5) {
      this.dirtyTerrain = true;
    }
  }

  // ── Discovery ──────────────────────────────────────────────────────────────

  private updateDiscovery() {
    const radius = 12;
    const px = Math.floor(this.player.x);
    const py = Math.floor(this.player.y);
    let changed = false;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const tx = px + dx;
        const ty = py + dy;
        if (tx < 0 || ty < 0 || tx >= this.map.width || ty >= this.map.height) continue;
        const tile = this.map.tiles[ty][tx];
        if (!tile.discovered) {
          tile.discovered = true;
          changed = true;
        }
      }
    }

    if (changed) {
      this.dirtyTerrain        = true;
      this.minimapTerrainDirty = true;
    }
  }

  // ── Terrain rendering ──────────────────────────────────────────────────────

  private redrawTerrain() {
    this.terrainGfx.clear();
    const W   = this.scale.width;
    const H   = this.scale.height;
    const pad = 1;

    const corners = [
      screenToIso(0, 0, this.camX, this.camY, this.zoom),
      screenToIso(W, 0, this.camX, this.camY, this.zoom),
      screenToIso(0, H, this.camX, this.camY, this.zoom),
      screenToIso(W, H, this.camX, this.camY, this.zoom),
    ];

    const minX = Math.max(0, Math.floor(Math.min(...corners.map(c => c.x))) - pad);
    const maxX = Math.min(this.map.width  - 1, Math.ceil(Math.max(...corners.map(c => c.x))) + pad);
    const minY = Math.max(0, Math.floor(Math.min(...corners.map(c => c.y))) - pad);
    const maxY = Math.min(this.map.height - 1, Math.ceil(Math.max(...corners.map(c => c.y))) + pad);

    // Painter's algorithm: draw back-to-front (ascending sum ix+iy)
    for (let sum = minX + minY; sum <= maxX + maxY; sum++) {
      for (let ix = Math.max(minX, sum - maxY); ix <= Math.min(maxX, sum - minY); ix++) {
        const iy = sum - ix;
        if (iy < minY || iy > maxY) continue;
        const tile = this.map.tiles[iy]?.[ix];
        if (!tile) continue;

        // Skip undiscovered tiles — they appear as black background
        if (!tile.discovered) continue;

        drawTile(this.terrainGfx, ix, iy, tile.terrain, this.camX, this.camY, this.zoom);

        if (tile.resource !== ResourceType.NONE) {
          drawResource(
            this.terrainGfx, ix, iy,
            tile.resource,
            (tile as any).resourceDensity ?? 0.6,
            this.camX, this.camY, this.zoom,
          );
        }
      }
    }
  }

  // ── Character rendering ────────────────────────────────────────────────────

  private redrawPlayer() {
    this.playerGfx.clear();
    drawPlayer(
      this.playerGfx,
      this.player.x, this.player.y,
      this.player.health, this.player.maxHealth,
      this.camX, this.camY, this.zoom,
    );
  }

  private redrawEnemies() {
    this.enemyGfx.clear();
    for (const e of this.enemies.enemies) {
      drawEnemy(this.enemyGfx, e, this.camX, this.camY, this.zoom);
    }
  }

  // ── Resource pickup ────────────────────────────────────────────────────────

  private pickupResources() {
    if (--this.pickCooldown > 0) return;
    const tx = Math.floor(this.player.x);
    const ty = Math.floor(this.player.y);
    const tile = this.map.tiles[ty]?.[tx];
    if (!tile || tile.resource === ResourceType.NONE) return;

    const key    = RESOURCE_NAMES[tile.resource];
    if (!key) return;
    const amount = Math.ceil(((tile as any).resourceDensity ?? 0.5) * 8 + 2);

    tile.resource = ResourceType.NONE;
    (tile as any).resourceDensity = 0;
    this.dirtyTerrain        = true;
    this.minimapTerrainDirty = true;
    this.resources[key] = (this.resources[key] ?? 0) + amount;
    this.pickCooldown   = 12;

    // Floating label
    const sp  = isoToScreen(tx + 0.5, ty, this.camX, this.camY, this.zoom);
    const lbl = this.add.text(sp.x, sp.y - TILE_H * this.zoom * 0.5, `+${amount} ${key}`, {
      fontSize: '13px', fontFamily: 'monospace',
      color: '#ffff44', stroke: '#000', strokeThickness: 3,
    }).setDepth(400);
    this.floatLabels.push({ txt: lbl, life: 55 });
  }

  private tickFloatLabels() {
    this.floatLabels = this.floatLabels.filter(f => {
      f.life--;
      f.txt.y   -= 0.55;
      f.txt.setAlpha(f.life / 55);
      if (f.life <= 0) { f.txt.destroy(); return false; }
      return true;
    });
  }

  // ── Minimap ────────────────────────────────────────────────────────────────

  private buildMinimap() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const mw = this.map.width  * this.mmScale;
    const mh = this.map.height * this.mmScale;

    this.mmX = W - mw - 12;
    this.mmY = H - mh - 12;

    // Dark background border
    const border = this.add.graphics();
    border.fillStyle(0x000000, 0.75);
    border.fillRect(this.mmX - 2, this.mmY - 2, mw + 4, mh + 4);
    border.setDepth(488).setScrollFactor(0);

    this.minimapGfx = this.add.graphics();
    this.minimapGfx.setDepth(489).setScrollFactor(0);

    this.minimapDynGfx = this.add.graphics();
    this.minimapDynGfx.setDepth(490).setScrollFactor(0);

    this.redrawMinimap();
  }

  private redrawMinimap() {
    this.minimapGfx.clear();

    for (let ty = 0; ty < this.map.height; ty++) {
      for (let tx = 0; tx < this.map.width; tx++) {
        const tile = this.map.tiles[ty][tx];
        let color: number;

        if (!tile.discovered) {
          color = 0x050810;
        } else if (tile.resource !== ResourceType.NONE) {
          color = RESOURCE_COLORS[tile.resource] ?? 0xffffff;
        } else {
          color = TERRAIN_COLORS[tile.terrain] ?? 0x333333;
        }

        this.minimapGfx.fillStyle(color, 1);
        this.minimapGfx.fillRect(
          this.mmX + tx * this.mmScale,
          this.mmY + ty * this.mmScale,
          this.mmScale,
          this.mmScale,
        );
      }
    }

    this.minimapTerrainDirty = false;
  }

  private updateMinimapDyn() {
    this.minimapDynGfx.clear();

    const W = this.scale.width;
    const H = this.scale.height;

    // Camera viewport rectangle in iso coords
    const tl = screenToIso(0, 0, this.camX, this.camY, this.zoom);
    const tr = screenToIso(W, 0, this.camX, this.camY, this.zoom);
    const br = screenToIso(W, H, this.camX, this.camY, this.zoom);
    const bl = screenToIso(0, H, this.camX, this.camY, this.zoom);

    this.minimapDynGfx.lineStyle(1, 0xffffff, 0.4);
    this.minimapDynGfx.strokePoints([
      { x: this.mmX + tl.x * this.mmScale, y: this.mmY + tl.y * this.mmScale },
      { x: this.mmX + tr.x * this.mmScale, y: this.mmY + tr.y * this.mmScale },
      { x: this.mmX + br.x * this.mmScale, y: this.mmY + br.y * this.mmScale },
      { x: this.mmX + bl.x * this.mmScale, y: this.mmY + bl.y * this.mmScale },
    ], true);

    // Enemies as 2px red circles
    for (const e of this.enemies.enemies) {
      this.minimapDynGfx.fillStyle(0xff2222, 1);
      this.minimapDynGfx.fillCircle(
        this.mmX + e.isoX * this.mmScale,
        this.mmY + e.isoY * this.mmScale,
        2,
      );
    }

    // Player as 3px cyan circle
    this.minimapDynGfx.fillStyle(0x00ffff, 1);
    this.minimapDynGfx.fillCircle(
      this.mmX + this.player.x * this.mmScale,
      this.mmY + this.player.y * this.mmScale,
      3,
    );
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  private updateHUD() {
    const lines: string[] = [];
    lines.push(`❤  ${this.player.health.toFixed(0)} / ${this.player.maxHealth}`);
    for (const [k, v] of Object.entries(this.resources)) {
      if (v > 0) lines.push(`${k}: ${v}`);
    }
    this.hudRes.setText(lines);

    const spd = this.simPaused ? 'PAUSED' : `${this.simSpeed}×`;
    this.hudStatus.setText(
      `[ESC] pause  [SPACE] ${spd}  [+/−] speed  enemies: ${this.enemies.enemies.length}`,
    );

    if (this.hoverX >= 0) {
      this.hudCoord.setText(`(${this.hoverX}, ${this.hoverY})`);
    }
  }

  // ── Pause ──────────────────────────────────────────────────────────────────

  private openPause() {
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  // ── Pointer input ──────────────────────────────────────────────────────────

  private onDown(p: Phaser.Input.Pointer) {
    if (p.rightButtonDown()) {
      this.dragOn = true;
      this.dragSX = p.x; this.dragSY = p.y;
      this.dragCX = this.camX; this.dragCY = this.camY;
    }
  }

  private onMove(p: Phaser.Input.Pointer) {
    const iso = screenToIso(p.x, p.y, this.camX, this.camY, this.zoom);
    this.hoverX = Math.floor(iso.x);
    this.hoverY = Math.floor(iso.y);
    this.hoverGfx.clear();
    if (this.hoverX >= 0 && this.hoverY >= 0 &&
        this.hoverX < this.map.width && this.hoverY < this.map.height) {
      drawHover(this.hoverGfx, this.hoverX, this.hoverY, this.camX, this.camY, this.zoom);
    }
    if (this.dragOn) {
      this.camX = this.dragCX + (p.x - this.dragSX);
      this.camY = this.dragCY + (p.y - this.dragSY);
      this.dirtyTerrain = true;
    }
  }

  private onUp() { this.dragOn = false; }

  private onWheel(
    pointer: Phaser.Input.Pointer,
    _: any, __: number,
    dy: number,
  ) {
    const factor   = dy > 0 ? 0.88 : 1.14;
    const prevZoom = this.zoom;
    this.zoom      = Phaser.Math.Clamp(this.zoom * factor, 0.3, 4);
    // Zoom toward mouse cursor
    this.camX = pointer.x - (pointer.x - this.camX) * (this.zoom / prevZoom);
    this.camY = pointer.y - (pointer.y - this.camY) * (this.zoom / prevZoom);
    this.dirtyTerrain = true;
  }
}
