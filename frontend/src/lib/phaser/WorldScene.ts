/**
 * WorldScene — the playable world: the engineer, the aliens and the process plant.
 *
 * Camera model
 * ────────────
 * The view is an offset (where the map origin lands on screen) and a zoom. The offset follows
 * the engineer; dragging adds a pan on top that stays put while the engineer stands still and
 * eases away once they walk. The textured ground is drawn by GroundScene underneath, which is
 * handed the same view every frame.
 */

import Phaser from 'phaser';
import type { PlanetMap } from '../types';
import { ResourceType, TerrainType } from '../types';

import { TILE_H, TILE_W, isoToScreen, screenToIso, camCenterOn } from './isoMath';
import { drawHover } from './terrainRenderer';
import { drawPlayer, drawEnemy, type Enemy } from './characterRenderer';
import { ATTACK_RADIUS, createEnemyState, updateEnemies, type EnemyState } from './enemySystem';
import type { GroundScene } from './GroundScene';

import * as engine from '../process/engine';
import { CharacterSprite, ProcessLayer } from '../process/render';
import { ProcessUI, entityTooltip, segmentTooltip } from '../process/ui';
import { generateWorld, loadSettings, writeSave, type SaveGame, type Settings, type WorldSettings } from '../save';
import { PauseMenu } from '../../ui/menu';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;
const WALK_SPEED = 5;     // tiles per second
const MAX_HEALTH = 100;

export class WorldScene extends Phaser.Scene {
  private map!: PlanetMap;
  private world!: WorldSettings;
  private player = { x: 0, y: 0, health: MAX_HEALTH };
  private spawn = { x: 0, y: 0 };

  private playerGfx!: Phaser.GameObjects.Graphics;
  private enemyGfx!: Phaser.GameObjects.Graphics;
  private hoverGfx!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private ground!: GroundScene;
  private ambient: Phaser.Sound.BaseSound | null = null;

  // View: `cam` follows the engineer, `pan` is the player's drag on top of it.
  zoom = 1.2;
  private cam = { x: 0, y: 0 };
  private pan = { x: 0, y: 0 };
  private drag: { x: number; y: number; panX: number; panY: number } | null = null;

  private hoverTX = -1;
  private hoverTY = -1;

  private enemyState: EnemyState = createEnemyState();
  private engineer: CharacterSprite | null = null;
  private buildUntil = 0;
  private aliens = new Map<Enemy, { sprite: CharacterSprite; x: number; y: number }>();

  private placementType: string | null = null;
  private placementRot = 0;
  private layingPipe = false;
  private lastPipeTile: { x: number; y: number } | null = null;

  private processLayer: ProcessLayer | null = null;
  private processUI: ProcessUI | null = null;
  private snapshot: engine.Snapshot | null = null;
  private snapshotTimer = 0;
  private saveTimer = 5000;
  private simPaused = false;
  private simSpeed = 1;
  private menu!: PauseMenu;

  private keys!: Record<'w' | 'a' | 's' | 'd' | 'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;

  constructor() { super({ key: 'WorldScene' }); }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  create(data: SaveGame) {
    this.world = data.world;
    this.map = generateWorld(this.world);
    this.spawn = this.findSpawn();
    this.player = { ...(data.player ?? this.spawn), health: MAX_HEALTH };
    this.zoom = 1.2;
    this.pan = { x: 0, y: 0 };
    this.cam = this.followTarget();
    this.enemyState = createEnemyState();
    this.simPaused = false;
    this.simSpeed = 1;

    this.scene.launch('GroundScene');
    this.ground = this.scene.get('GroundScene') as GroundScene;
    this.ground.events.once('create', () => this.ground.show(this.map));
    this.scene.moveBelow('WorldScene', 'GroundScene');

    this.enemyGfx = this.add.graphics().setDepth(40);
    this.playerGfx = this.add.graphics().setDepth(41);
    this.hoverGfx = this.add.graphics().setDepth(42);
    this.statusText = this.add.text(12, 12, '', {
      fontFamily: 'Chakra Petch, system-ui, sans-serif', fontSize: '15px', color: '#ffcf70',
      backgroundColor: '#0c0f14cc', padding: { x: 8, y: 4 },
    }).setDepth(200);

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      w: kb.addKey(K.W), a: kb.addKey(K.A), s: kb.addKey(K.S), d: kb.addKey(K.D),
      up: kb.addKey(K.UP), down: kb.addKey(K.DOWN), left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT),
    };
    kb.on('keydown-SPACE', () => { if (!this.menu.open) this.simPaused = !this.simPaused; });
    kb.on('keydown-R', () => { this.placementRot = (this.placementRot + 1) % 4; });
    kb.on('keydown-ESC', () => this.onEscape());
    kb.on('keydown', (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') this.simSpeed = Math.min(16, this.simSpeed * 2);
      if (e.key === '-' || e.key === '_') this.simSpeed = Math.max(0.25, this.simSpeed / 2);
    });
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('wheel', this.onWheel, this);

    this.menu = new PauseMenu({
      resume: () => this.menu.hide(),
      quit: () => this.quitToMenu(),
      applySettings: s => this.applySettings(s),
    });
    if (this.cache.audio.exists('pp_ambient')) {
      this.ambient = this.sound.add('pp_ambient', { loop: true });
      this.ambient.play();
    }
    this.applySettings(loadSettings());

    engine.startEngine().then(() => {
      if (!this.sys.isActive()) return;
      engine.reset();
      engine.restore(data.layout ?? []);
      this.processLayer = new ProcessLayer(this);
      this.processUI = new ProcessUI();
      this.processUI.onSelectProto = id => { this.placementType = id; };
      this.processUI.onCloseInspector = () => this.select(null);
      this.snapshot = engine.snapshot();
    }).catch(err => console.error('Process engine failed to load', err));

    const onUnload = () => this.save();
    window.addEventListener('beforeunload', onUnload);
    this.events.once('shutdown', () => {
      window.removeEventListener('beforeunload', onUnload);
      this.teardown();
    });
  }

  update(_time: number, delta: number) {
    const running = !this.simPaused && !this.menu.open;
    const dt = (delta / 1000) * this.simSpeed;

    if (!this.menu.open) this.movePlayer(Math.min(delta / 1000, 0.1));
    this.followPlayer();

    if (running) {
      const dmg = updateEnemies(this.enemyState, dt, this.player.x, this.player.y, this.map);
      if (dmg > 0) this.hurt(dmg);
      engine.advance(dt);
      this.player.health = Math.min(MAX_HEALTH, this.player.health + 2 * dt);
    }

    this.snapshotTimer -= delta;
    if (this.snapshotTimer <= 0 && engine.engineReady()) {
      this.snapshotTimer = 100;
      const wasBlackout = this.snapshot?.grid.blackout ?? false;
      this.snapshot = engine.snapshot();
      if (this.snapshot) {
        if (this.snapshot.events.some(e => e.includes('ruptured'))) this.playSound('rupture', 0.8);
        if (this.snapshot.grid.blackout && !wasBlackout) this.playSound('alarm', 0.5);
        this.processUI?.update(this.snapshot);
      }
    }
    this.saveTimer -= delta;
    if (this.saveTimer <= 0) {
      this.saveTimer = 5000;
      this.save();
    }

    const view = this.view();
    this.ground.setView(view.x, view.y, this.zoom);
    this.drawProcess();
    this.redrawEnemies();
    this.redrawPlayer();
    this.drawHoverTile();
    this.statusText.setText(this.simPaused ? 'Paused' : this.simSpeed !== 1 ? `Speed ${this.simSpeed}×` : '');
    this.statusText.setVisible(this.simPaused || this.simSpeed !== 1);
  }

  private teardown() {
    this.processLayer?.destroy(); this.processLayer = null;
    this.processUI?.destroy(); this.processUI = null;
    this.engineer?.destroy(); this.engineer = null;
    this.aliens.forEach(a => a.sprite.destroy()); this.aliens.clear();
    this.menu.hide();
    this.snapshot = null;
    this.placementType = null;
  }

  private save() {
    if (!engine.engineReady() || !this.processLayer) return;
    writeSave({ world: this.world, player: { x: this.player.x, y: this.player.y }, layout: engine.layout(), savedAt: Date.now() });
  }

  private quitToMenu() {
    this.save();
    this.ambient?.stop();
    this.scene.stop('GroundScene');
    this.scene.start('MenuScene');
  }

  private applySettings(s: Settings) {
    this.sound.volume = s.volume;
    if (this.ambient) (this.ambient as Phaser.Sound.WebAudioSound).setVolume?.(0.36 * s.ambient);
  }

  private playSound(name: string, volume = 0.5) {
    if (this.cache.audio.exists(`pp_${name}`)) this.sound.play(`pp_${name}`, { volume });
  }

  private onEscape() {
    if (this.menu.open) {
      if (!this.menu.back()) this.menu.hide();
    } else if (this.placementType) {
      this.processUI?.selectProto(null);
    } else if (this.processLayer?.selected != null) {
      this.select(null);
    } else {
      this.menu.show();
    }
  }

  // ── The engineer ───────────────────────────────────────────────────────────

  /** The walkable tile nearest the middle of the map. */
  private findSpawn() {
    const cx = Math.floor(this.map.width / 2);
    const cy = Math.floor(this.map.height / 2);
    for (let r = 0; r < Math.max(this.map.width, this.map.height); r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (this.walkable(cx + dx, cy + dy)) return { x: cx + dx + 0.5, y: cy + dy + 0.5 };
        }
      }
    }
    return { x: cx + 0.5, y: cy + 0.5 };
  }

  private walkable(tx: number, ty: number) {
    const tile = this.map.tiles[ty]?.[tx];
    return !!tile && tile.traversable !== false;
  }

  /** WASD moves the engineer along the screen's axes, not the grid's. */
  private movePlayer(dt: number) {
    const k = this.keys;
    const sx = (k.d.isDown || k.right.isDown ? 1 : 0) - (k.a.isDown || k.left.isDown ? 1 : 0);
    const sy = (k.s.isDown || k.down.isDown ? 1 : 0) - (k.w.isDown || k.up.isDown ? 1 : 0);
    const moving = sx !== 0 || sy !== 0;
    if (this.engineer) this.engineer.moving = moving;
    if (!moving) return;

    // A screen direction in grid steps: right is (+x, −y), down is (+x, +y) at half the pixels.
    let dx = sx / TILE_W + sy / TILE_H;
    let dy = -sx / TILE_W + sy / TILE_H;
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    this.engineer?.face(dx, dy);

    const step = WALK_SPEED * dt;
    const nx = Phaser.Math.Clamp(this.player.x + dx * step, 0, this.map.width - 0.01);
    const ny = Phaser.Math.Clamp(this.player.y + dy * step, 0, this.map.height - 0.01);
    // Slide along water and cliffs instead of stopping dead.
    if (this.walkable(Math.floor(nx), Math.floor(ny))) { this.player.x = nx; this.player.y = ny; }
    else if (this.walkable(Math.floor(nx), Math.floor(this.player.y))) this.player.x = nx;
    else if (this.walkable(Math.floor(this.player.x), Math.floor(ny))) this.player.y = ny;

    // Walking off brings the view back to the engineer.
    this.pan.x *= 0.92;
    this.pan.y *= 0.92;
  }

  private hurt(dmg: number) {
    this.player.health -= dmg;
    if (this.player.health > 0) return;
    this.player = { ...this.spawn, health: MAX_HEALTH };
    this.enemyState = createEnemyState();
    this.pan = { x: 0, y: 0 };
    this.processUI?.alert('The aliens overwhelmed you. You wake up back at the landing site.');
  }

  private redrawPlayer() {
    this.playerGfx.clear();
    const view = this.view();
    this.engineer ??= new CharacterSprite(this);
    if (this.engineer.moving || this.time.now > this.buildUntil) this.engineer.action = null;
    if (!this.engineer.draw(this.player.x, this.player.y, view.x, view.y, this.zoom)) {
      drawPlayer(this.playerGfx, this.player.x, this.player.y, this.player.health, MAX_HEALTH, view.x, view.y, this.zoom);
      return;
    }
    // Health bar over the engineer's head while hurt.
    if (this.player.health < MAX_HEALTH) {
      const p = isoToScreen(this.player.x, this.player.y, view.x, view.y, this.zoom);
      const w = 40 * this.zoom;
      const y = p.y - 70 * this.zoom;
      this.playerGfx.fillStyle(0x000000, 0.7).fillRect(p.x - w / 2 - 1, y - 1, w + 2, 6);
      this.playerGfx.fillStyle(this.player.health > 40 ? 0x6fd36f : 0xff5a4f, 1).fillRect(p.x - w / 2, y, w * this.player.health / MAX_HEALTH, 4);
    }
  }

  private redrawEnemies() {
    this.enemyGfx.clear();
    const view = this.view();
    const alive = new Set(this.enemyState.enemies);
    for (const [e, a] of this.aliens) {
      if (!alive.has(e)) { a.sprite.destroy(); this.aliens.delete(e); }
    }
    for (const e of this.enemyState.enemies) {
      let a = this.aliens.get(e);
      if (!a) this.aliens.set(e, a = { sprite: new CharacterSprite(this, 'alien'), x: e.isoX, y: e.isoY });
      a.sprite.moving = true;
      if (Math.abs(e.isoX - a.x) + Math.abs(e.isoY - a.y) > 1e-3) a.sprite.face(e.isoX - a.x, e.isoY - a.y);
      const near = Math.abs(e.isoX - this.player.x) + Math.abs(e.isoY - this.player.y) < ATTACK_RADIUS;
      a.sprite.action = near ? 'attack' : null;
      if (near) a.sprite.face(this.player.x - e.isoX, this.player.y - e.isoY);
      a.x = e.isoX; a.y = e.isoY;
      if (!a.sprite.draw(e.isoX, e.isoY, view.x, view.y, this.zoom)) drawEnemy(this.enemyGfx, e, view.x, view.y, this.zoom);
    }
  }

  // ── View ───────────────────────────────────────────────────────────────────

  private followTarget() {
    return camCenterOn(this.player.x, this.player.y, this.scale.width, this.scale.height, this.zoom);
  }

  private followPlayer() {
    const t = this.followTarget();
    this.cam.x += (t.x - this.cam.x) * 0.15;
    this.cam.y += (t.y - this.cam.y) * 0.15;
  }

  /** Where the map origin is on screen. */
  private view() {
    return { x: this.cam.x + this.pan.x, y: this.cam.y + this.pan.y };
  }

  private onWheel(p: Phaser.Input.Pointer, _o: unknown[], _dx: number, dy: number) {
    if (this.menu.open) return;
    // Trackpads send many small deltas, mouse wheels a few large ones.
    const zoom = Phaser.Math.Clamp(this.zoom * Math.exp(-Phaser.Math.Clamp(dy, -100, 100) * 0.002), MIN_ZOOM, MAX_ZOOM);
    if (zoom === this.zoom) return;
    // Keep the point under the cursor where it is: the view scales about the cursor.
    const v = this.view();
    const nx = p.x - (p.x - v.x) * zoom / this.zoom;
    const ny = p.y - (p.y - v.y) * zoom / this.zoom;
    // The follow offset jumps to the new zoom; the pan absorbs the rest.
    this.zoom = zoom;
    this.cam = this.followTarget();
    this.pan = { x: nx - this.cam.x, y: ny - this.cam.y };
  }

  // ── Pointer input ──────────────────────────────────────────────────────────

  private tileAt(sx: number, sy: number) {
    const v = this.view();
    const iso = screenToIso(sx, sy, v.x, v.y, this.zoom);
    return { x: Math.floor(iso.x), y: Math.floor(iso.y) };
  }

  private onDown(p: Phaser.Input.Pointer) {
    if (this.menu.open) return;
    const tile = this.tileAt(p.x, p.y);
    if (p.rightButtonDown()) {
      const id = engine.entityAt(tile.x, tile.y);
      if (id >= 0) {
        engine.remove(id);
        this.playSound('remove', 0.35);
        if (this.processLayer?.selected === id) this.select(null);
      }
      return;
    }
    if (this.placementType === 'pipe') {
      this.layingPipe = true;
      this.lastPipeTile = null;
      this.layPipeTo(tile.x, tile.y);
      return;
    }
    this.drag = { x: p.x, y: p.y, panX: this.pan.x, panY: this.pan.y };
  }

  private onMove(p: Phaser.Input.Pointer) {
    const tile = this.tileAt(p.x, p.y);
    this.hoverTX = tile.x; this.hoverTY = tile.y;
    if (this.layingPipe) this.layPipeTo(tile.x, tile.y);
    this.updateHover(p, tile.x, tile.y);
    if (this.drag && p.isDown) {
      this.pan.x = this.drag.panX + (p.x - this.drag.x);
      this.pan.y = this.drag.panY + (p.y - this.drag.y);
    }
  }

  private onUp(p: Phaser.Input.Pointer) {
    if (this.layingPipe) {
      this.layingPipe = false;
      return;
    }
    if (!this.drag) return;
    const wasDrag = Math.abs(p.x - this.drag.x) > 5 || Math.abs(p.y - this.drag.y) > 5;
    this.drag = null;
    if (wasDrag || this.menu.open) return;
    const tile = this.tileAt(p.x, p.y);
    if (this.placementType) {
      this.placeProcess(this.placementType, tile.x, tile.y);
    } else {
      const id = engine.entityAt(tile.x, tile.y);
      this.select(id >= 0 && this.snapshot?.entities.some(e => e.id === id) ? id : null);
    }
  }

  private drawHoverTile() {
    this.hoverGfx.clear();
    const { hoverTX: tx, hoverTY: ty } = this;
    if (this.menu.open || tx < 0 || ty < 0 || tx >= this.map.width || ty >= this.map.height) return;
    const v = this.view();
    drawHover(this.hoverGfx, tx, ty, v.x, v.y, this.zoom);
  }

  // ── Building placement ─────────────────────────────────────────────────────

  /** Top-left tile for a building centred under the cursor. */
  private originFor(proto: string, tx: number, ty: number) {
    const off = Math.floor(((engine.PROTO[proto]?.size ?? 1) - 1) / 2);
    return { x: tx - off, y: ty - off };
  }

  /** Whether a building may go here: on the map, and over its resource if it needs one. */
  private placementOk(proto: string, x: number, y: number): boolean {
    const p = engine.PROTO[proto];
    if (!p) return false;
    let resource = !p.needs;
    for (let dy = 0; dy < p.size; dy++) {
      for (let dx = 0; dx < p.size; dx++) {
        const tile = this.map.tiles[y + dy]?.[x + dx];
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
      if (need) this.processUI?.alert(`${engine.PROTO[proto].name} must stand on ${need === 'water' ? 'water' : 'a methane deposit'}.`);
      return;
    }
    const err = engine.place(proto, o.x, o.y, this.placementRot);
    if (err) {
      this.processUI?.alert(err);
      return;
    }
    this.playSound('place', 0.35);
    this.processLayer?.built(proto, o.x, o.y);
    // The engineer turns to the new building and works on it for a moment.
    const n = engine.PROTO[proto]?.size ?? 1;
    if (this.engineer) {
      this.engineer.face(o.x + n / 2 - this.player.x, o.y + n / 2 - this.player.y);
      this.engineer.action = 'build';
      this.buildUntil = this.time.now + 1500;
    }
  }

  /** Lays pipe from the last tile to this one, one axis-aligned step at a time. */
  private layPipeTo(tx: number, ty: number) {
    let from = this.lastPipeTile ?? { x: tx, y: ty };
    const steps = [from];
    while (from.x !== tx || from.y !== ty) {
      from = from.x !== tx ? { x: from.x + Math.sign(tx - from.x), y: from.y } : { x: from.x, y: from.y + Math.sign(ty - from.y) };
      steps.push(from);
    }
    for (const t of steps) {
      if (this.placementOk('pipe', t.x, t.y)) engine.place('pipe', t.x, t.y, 0);
    }
    this.lastPipeTile = { x: tx, y: ty };
  }

  private select(id: number | null) {
    if (this.processLayer) this.processLayer.selected = id;
    this.processUI?.showInspector(id);
  }

  private updateHover(p: Phaser.Input.Pointer, tx: number, ty: number) {
    if (!this.processUI || !this.snapshot || this.menu.open) return;
    const id = engine.entityAt(tx, ty);
    const e = id >= 0 ? this.snapshot.entities.find(x => x.id === id) : undefined;
    const si = this.processLayer?.segmentAt(tx, ty);
    const text = e ? entityTooltip(e) : si !== undefined ? segmentTooltip(this.snapshot.segments[si].vessel) : null;
    const ev = p.event instanceof MouseEvent ? p.event : null;
    this.processUI.hover(text, ev ? ev.clientX : p.x, ev ? ev.clientY : p.y);
  }

  private drawProcess() {
    if (!this.processLayer) return;
    let ghost = null;
    if (this.placementType && this.hoverTX >= 0 && !this.menu.open) {
      const o = this.originFor(this.placementType, this.hoverTX, this.hoverTY);
      ghost = { proto: this.placementType, x: o.x, y: o.y, rot: this.placementRot, ok: this.placementOk(this.placementType, o.x, o.y) };
    }
    const v = this.view();
    this.processLayer.draw(this.snapshot, v.x, v.y, this.zoom, ghost, this.time.now);
  }
}
