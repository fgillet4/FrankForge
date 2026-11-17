/**
 * WorldScene — the playable world: the engineer, the aliens, the process plant and the
 * factory around it.
 *
 * Camera model
 * ────────────
 * The view is an offset (where the map origin lands on screen) and a zoom. The offset follows
 * the engineer; dragging adds a pan on top that stays put while the engineer stands still and
 * eases away once they walk. The textured ground is drawn by GroundScene underneath, which is
 * handed the same view every frame.
 *
 * Survival
 * ────────
 * Buildings come out of the engineer's pockets and go back in when mined. Wood and stone come
 * from trees and rocks, ore from deposits by hand or by drill; furnaces smelt it and the rest is
 * crafted. Labs research new buildings. Pollution draws the aliens. Sandbox worlds skip all of
 * that: everything is researched and free.
 */

import Phaser from 'phaser';
import type { PlanetMap } from '../types';
import { ResourceType, TerrainType } from '../types';

import { TILE_H, TILE_W, isoToScreen, screenToIso, camCenterOn } from './isoMath';
import { drawHover, RESOURCE_NAMES } from './terrainRenderer';
import { drawPlayer } from './characterRenderer';
import type { GroundScene } from './GroundScene';

import * as engine from '../process/engine';
import { CharacterSprite, ProcessLayer } from '../process/render';
import { ProcessUI, entityTooltip, fmt, segmentTooltip } from '../process/ui';
import { generateWorld, loadSettings, writeSave, type SaveGame, type Settings, type WorldSettings } from '../save';
import { PauseMenu } from '../../ui/menu';
import { Hud } from '../../ui/hud';

import { ITEMS, RECIPES, TECH } from '../game/items';
import { Engineer, MAX_HEALTH } from '../game/game';
import { DIRS, FACTORY_KINDS, Factory, MINED_ITEM, isElectricMachine, type FactoryContext } from '../game/factory';
import { AMMO_DAMAGE, Combat, WEAPONS, type Arena } from '../game/combat';
import { NATURE, scatterNature, tileKey, type NatureObject } from '../game/nature';
import { WorldRenderer, type View } from '../game/draw';
import { GOALS, type GoalWorld } from '../game/goals';
import { Juice, pop } from '../game/juice';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;
const WALK_SPEED = 4.5;   // tiles per second
const HAND_MINING = 1;    // seconds per ore by hand
const SPEEDS = [0, 0.5, 1, 2, 4, 8, 16];

/** Things the engineer walks over rather than around. */
const WALKABLE = new Set(['pipe', 'transport_belt', 'splitter', 'power_pole']);

interface MiningTarget { key: string; label: string; time: number; x: number; y: number; done: () => void }

export class WorldScene extends Phaser.Scene {
  private map!: PlanetMap;
  private world!: WorldSettings;
  private seed = 0;
  private player = { x: 0, y: 0 };
  private spawn = { x: 0, y: 0 };
  sandbox = false;
  private peaceful = false;

  eng!: Engineer;
  factory!: Factory;
  combat!: Combat;
  private objects = new Map<number, NatureObject>();
  private natureRemoved = new Set<number>();
  /** Health of process buildings (the factory keeps its own). */
  private processHp = new Map<number, number>();

  private playerGfx!: Phaser.GameObjects.Graphics;
  private hoverGfx!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private night!: Phaser.GameObjects.Rectangle;
  private ground!: GroundScene;
  private worldDraw!: WorldRenderer;
  private ambient: Phaser.Sound.BaseSound | null = null;

  zoom = 1.2;
  private cam = { x: 0, y: 0 };
  private pan = { x: 0, y: 0 };
  private drag: { x: number; y: number; panX: number; panY: number } | null = null;
  private hoverTX = -1;
  private hoverTY = -1;
  /** The tile of what's drawn under the pointer: a tall sprite wins over the ground behind it. */
  private aimTX = -1;
  /** The gun stays raised until then [ms]. */
  private shootUntil = 0;
  private goalTimer = 0;
  private tipTimer = 0;
  private aimTY = -1;
  private pointer = { x: 0, y: 0 };

  private engineer: CharacterSprite | null = null;
  private buildUntil = 0;
  private aliens = new Map<number, CharacterSprite>();

  private placementType: string | null = null;
  private placementRot = 0;
  private laying: { last: { x: number; y: number } | null } | null = null;
  /** Dragging out a row of buildings: where the last one went. */
  private stamping: { last: { x: number; y: number } } | null = null;
  private mining: MiningTarget | null = null;
  private miningProgress = 0;

  private processLayer: ProcessLayer | null = null;
  private processUI: ProcessUI | null = null;
  private hud: Hud | null = null;
  private snapshot: engine.Snapshot | null = null;
  private served = new Map<number, number>();
  private lastEmitted = 0;
  private snapshotTimer = 0;
  private hudTimer = 0;
  private saveTimer = 5000;
  private speedIndex = 2;
  private menu!: PauseMenu;

  private keys!: Record<'w' | 'a' | 's' | 'd' | 'up' | 'down' | 'left' | 'right' | 'space' | 'shift' | 'f', Phaser.Input.Keyboard.Key>;
  private juice!: Juice;
  /** Where mined things come from, so what's gained flies out of it. */
  private flyFrom: { x: number; y: number } | null = null;
  private stepTimer = 0;
  private chipTimer = 0;
  private pickTimer = 0;


  constructor() { super({ key: 'WorldScene' }); }

  get simSpeed() { return SPEEDS[this.speedIndex]; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  create(data: SaveGame) {
    this.world = data.world;
    this.seed = data.world.seed;
    this.map = generateWorld(this.world);
    this.spawn = this.findSpawn();
    this.player = { ...(data.player ?? this.spawn) };
    // Saves from before survival existed were built for free: keep them that way.
    this.sandbox = data.mode ? data.mode === 'sandbox' : (data.layout?.length ?? 0) > 0;
    this.peaceful = data.peaceful ?? false;
    this.zoom = 1.2;
    this.pan = { x: 0, y: 0 };
    this.cam = this.followTarget();
    this.speedIndex = 2;
    this.placementType = null;

    this.eng = new Engineer(this.sandbox);
    if (data.engineer) this.eng.load(data.engineer as never);
    else if (!this.sandbox) this.eng.startingKit();
    this.factory = new Factory();
    this.factory.load(data.factory as never);
    this.combat = new Combat();
    if (data.combat) this.combat.load(data.combat as never);
    else if (!this.peaceful) this.combat.placeNests(this.map, this.seed, this.spawn);
    this.natureRemoved = new Set(data.nature ?? []);
    this.objects = scatterNature(this.map, this.seed, this.world.planet, this.natureRemoved);
    for (const n of this.combat.nests) for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) this.objects.delete(tileKey(n.x + dx, n.y + dy));
    this.processHp = new Map(data.hp ?? []);

    this.scene.launch('GroundScene');
    this.ground = this.scene.get('GroundScene') as GroundScene;
    this.ground.events.once('create', () => {
      this.ground.show(this.map);
      for (let y = 0; y < this.map.height; y++) for (let x = 0; x < this.map.width; x++) {
        if (MINED_ITEM[this.map.tiles[y][x].resource] && this.factory.oreLeft(this.map, x, y) <= 0) this.ground.hideDeposit(x, y);
      }
    });
    this.scene.moveBelow('WorldScene', 'GroundScene');

    this.worldDraw = new WorldRenderer(this);
    this.juice = new Juice(this);
    this.playerGfx = this.add.graphics().setDepth(41);
    this.hoverGfx = this.add.graphics().setDepth(42);
    this.night = this.add.rectangle(0, 0, 10, 10, 0x0a1430, 0).setOrigin(0, 0).setDepth(980);
    this.statusText = this.add.text(12, 12, '', {
      fontFamily: 'Chakra Petch, system-ui, sans-serif', fontSize: '15px', color: '#ffcf70',
      backgroundColor: '#0c0f14cc', padding: { x: 8, y: 4 },
    }).setDepth(1000).setScrollFactor(0);

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      w: kb.addKey(K.W), a: kb.addKey(K.A), s: kb.addKey(K.S), d: kb.addKey(K.D),
      up: kb.addKey(K.UP), down: kb.addKey(K.DOWN), left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT),
      space: kb.addKey(K.SPACE), shift: kb.addKey(K.SHIFT), f: kb.addKey(K.F),
    };
    kb.addCapture([K.TAB, K.SPACE]);
    kb.on('keydown-TAB', (e: KeyboardEvent) => {
      this.speedIndex = Phaser.Math.Clamp(this.speedIndex + (e.shiftKey ? -1 : 1), 0, SPEEDS.length - 1);
    });
    kb.on('keydown-R', () => this.rotate());
    kb.on('keydown-Q', () => this.pipette());
    kb.on('keydown-E', () => { if (!this.menu.open) this.hud?.toggle('inventory'); this.processUI?.hover(null, 0, 0); });
    kb.on('keydown-T', () => { if (!this.menu.open && !this.sandbox) this.hud?.toggle('tech'); this.processUI?.hover(null, 0, 0); });
    kb.on('keydown-P', () => { if (!this.menu.open) this.hud?.toggle('stats'); this.processUI?.hover(null, 0, 0); });
    kb.on('keydown-M', () => this.hud?.toggleBigMap());
    kb.on('keydown-ALT', (e: KeyboardEvent) => { e.preventDefault(); this.worldDraw.altMode = !this.worldDraw.altMode; });
    kb.on('keydown-ESC', () => this.onEscape());
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
      // Factory buildings from a save without their item state start empty.
      for (const p of engine.layout()) {
        if (FACTORY_KINDS.has(p.proto) && !this.factory.entities.has(p.id)) this.factory.add(p.id, p.proto, p.x, p.y, p.rot, engine.PROTO[p.proto].size);
      }
      this.processLayer = new ProcessLayer(this);
      this.processUI = new ProcessUI();
      this.processUI.barState = id => this.barState(id);
      this.processUI.onSelectProto = id => this.choose(id);
      this.processUI.onCloseInspector = () => this.select(null);
      this.hud = new Hud(this.eng, this.factory, {
        map: this.map,
        pick: item => this.choose(ITEMS[item]?.places ?? null),
        panTo: (x, y) => this.panTo(x, y),
        minimap: () => this.minimapData(),
        plantFeed: id => this.plantFeed(id),
        alert: msg => this.processUI?.alert(msg),
        onResearch: () => {},
      });
      this.snapshot = engine.snapshot();
    }).catch(err => console.error('Process engine failed to load', err));

    const onUnload = () => this.save();
    window.addEventListener('beforeunload', onUnload);
    this.events.once('shutdown', () => {
      window.removeEventListener('beforeunload', onUnload);
      this.teardown();
    });
  }

  update(time: number, delta: number) {
    const real = Math.min(delta / 1000, 0.1);
    const running = this.simSpeed > 0 && !this.menu.open;
    const dt = running ? real * this.simSpeed : 0;

    if (!this.menu.open) {
      this.movePlayer(real);
      if (this.simSpeed > 0) {
        this.tickMining(real);
        this.tickShooting(real, time);
        this.tickPickup(real);
      }
      // Dust kicked up underfoot.
      this.stepTimer -= real;
      if (this.engineer?.moving && this.stepTimer <= 0) {
        this.stepTimer = 0.22;
        this.juice.dust(this.player.x + (Math.random() - 0.5) * 0.2, this.player.y + (Math.random() - 0.5) * 0.2, 0x9a8a70, 2);
      }
    }
    this.juice.update(real, this.player);
    this.followPlayer();

    if (running && engine.engineReady() && this.processLayer) {
      this.eng.tickCrafting(dt);
      this.factory.tick(dt, this.factoryCtx());
      for (const e of this.factory.entities.values()) if (isElectricMachine(e.kind)) engine.setDemand(e.id, this.factory.demand(e));
      this.combat.update(dt, this.arena(), time);
      for (const s of this.combat.sounds.splice(0)) {
        const [vol, gap] = { gunshot: [0.25, 70], laser: [0.3, 90], alien_hit: [0.3, 90], alien_die: [0.45, 120] }[s.kind];
        this.playAt(s.kind, s.x, s.y, vol, gap);
        // Turret muzzles flash and drop casings; lasers scorch.
        if (s.kind === 'gunshot' && this.distanceTo(s.x, s.y) > 0.6) {
          this.juice.burst(s.x, s.y, 3, { colour: [0xfff2a0, 0xffc040], size: 2.4, speed: 0.6, up: 10, z: 40, life: 0.08, heavy: false });
          if (Math.random() < 0.5) this.juice.burst(s.x, s.y, 1, { colour: 0xd8a83a, size: 1.4, speed: 0.6, up: 110, z: 34, life: 1.4 });
        }
        if (s.kind === 'laser') this.juice.burst(s.x, s.y, 2, { colour: [0xff6050, 0xffd0c0], size: 2, speed: 0.4, up: 20, z: 40, life: 0.12, heavy: false });
        // Goo from hits, a burst when one dies.
        if (s.kind === 'alien_hit') this.juice.burst(s.x, s.y, 4, { colour: [0x7ad04a, 0x4a2a5a], size: 2, speed: 1.2, up: 90, z: 14, life: 0.5 });
        if (s.kind === 'alien_die') {
          this.juice.burst(s.x, s.y, 16, { colour: [0x7ad04a, 0x9ae05a, 0x4a2a5a], size: 3, speed: 2, up: 160, z: 10, life: 0.8 });
          if (this.distanceTo(s.x, s.y) < 10) this.juice.kick(2);
        }
      }
      this.combat.turrets([...this.factory.entities.values()].filter(e => e.kind.endsWith('_turret')), dt, time,
        id => this.served.get(id) ?? 0, this.eng.damageBonus, (item, n) => this.eng.stats.consume(item, n));
      engine.advance(dt);
      const g = this.snapshot?.grids ?? [];
      this.eng.stats.tick(dt, g.reduce((a, x) => a + x.generation_w, 0), g.reduce((a, x) => a + x.load_w, 0));
      // Slowly heal when nothing has hurt you for a while.
      this.eng.health = Math.min(MAX_HEALTH, this.eng.health + 3 * dt);
    }

    this.snapshotTimer -= delta;
    if (this.snapshotTimer <= 0 && engine.engineReady() && this.processLayer) {
      this.snapshotTimer = 100;
      const wasBlackout = this.snapshot?.grid.blackout ?? false;
      this.snapshot = engine.snapshot();
      if (this.snapshot) {
        this.served = new Map(this.snapshot.entities.map(e => [e.id, e.network === null ? 0 : e.served]));
        const emitted = Object.values(this.snapshot.emitted_kg).reduce((a, b) => a + b, 0);
        this.eng.stats.emissions.add(Math.max(0, emitted - this.lastEmitted));
        this.lastEmitted = emitted;
        if (this.snapshot.events.some(e => e.includes('ruptured'))) { this.playSound('rupture', 0.8); this.juice.kick(14); }
        if (this.snapshot.grid.blackout && !wasBlackout) this.playSound('alarm', 0.5);
        this.processUI?.update(this.snapshot);
      }
    }
    this.hudTimer -= delta;
    if (this.hudTimer <= 0 && this.hud) {
      this.hudTimer = 150;
      this.hud.update();
      this.processUI?.refreshBar();
    }
    // Tooltips keep up with what they describe (an alien losing health, a furnace filling).
    this.tipTimer -= delta;
    if (this.tipTimer <= 0) {
      this.tipTimer = 250;
      const ap = this.input.activePointer;
      if ((ap.event?.target as Element | undefined) instanceof HTMLCanvasElement) this.updateHover(ap, this.aimTX, this.aimTY);
    }
    this.goalTimer -= delta;
    if (this.goalTimer <= 0) { this.goalTimer = 500; this.tickGoals(); }
    this.saveTimer -= delta;
    if (this.saveTimer <= 0) {
      this.saveTimer = 5000;
      this.save();
    }

    const view = this.viewInfo();
    this.updateAim();
    this.ground.setView(view.x, view.y, this.zoom);
    this.drawProcess(time);
    this.worldDraw.processDamage = [...this.processHp].flatMap(([id, h]) => {
      const p = engine.layout().find(x => x.id === id);
      const n = p ? engine.PROTO[p.proto]?.size ?? 1 : 1;
      return p ? [[p.x, p.y, n, h / this.maxHp(n)] as [number, number, number, number]] : [];
    });
    // Inserters show where they take from and put to: the one pointed at, or all while placing one.
    const aimedKind = this.factory.entities.get(engine.entityAt(this.aimTX, this.aimTY))?.kind;
    this.worldDraw.flowFor = this.placementType === 'inserter' || this.placementType === 'burner_inserter' ? 'all'
      : aimedKind === 'inserter' || aimedKind === 'burner_inserter' ? engine.entityAt(this.aimTX, this.aimTY)
      : this.worldDraw.altMode ? 'all' : null;
    this.worldDraw.draw(view, time, this.factory, this.objects, this.combat);
    this.juice.draw(view);
    const powerTool = this.placementType ? !!(engine.PROTO[this.placementType]?.power_w || engine.PROTO[this.placementType]?.wire) : false;
    this.worldDraw.drawPower(view, this.snapshot, time, powerTool || this.hoveredPole());
    this.drawAliens(view);
    this.redrawPlayer(view);
    this.drawHoverTile(view);
    // Dusk and night, from the engine's sun.
    const daylight = this.snapshot?.daylight ?? 1;
    this.night.setSize(this.scale.width, this.scale.height).setFillStyle(0x0a1430, 0.38 * (1 - Math.min(1, daylight * 4)));
    const speed = this.simSpeed;
    this.statusText.setText(speed === 0 ? 'Paused  (Tab to resume)' : speed !== 1 ? `Speed ${speed}×` : '');
    this.statusText.setVisible(speed !== 1);
    this.statusText.setPosition(this.scale.width / 2 - this.statusText.width / 2, 12);
  }

  private teardown() {
    this.processLayer?.destroy(); this.processLayer = null;
    this.processUI?.destroy(); this.processUI = null;
    this.hud?.destroy(); this.hud = null;
    this.worldDraw?.destroy();
    this.juice?.destroy();
    this.engineer?.destroy(); this.engineer = null;
    this.aliens.forEach(a => a.destroy()); this.aliens.clear();
    this.menu.hide();
    this.snapshot = null;
    this.placementType = null;
  }

  private save() {
    if (!engine.engineReady() || !this.processLayer) return;
    writeSave({
      world: this.world, player: { x: this.player.x, y: this.player.y }, layout: engine.layout(), savedAt: Date.now(),
      mode: this.sandbox ? 'sandbox' : 'survival', peaceful: this.peaceful,
      engineer: this.eng.save(), factory: this.factory.save(), combat: this.combat.save(),
      nature: [...this.natureRemoved], hp: [...this.processHp],
    });
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
    if (this.cache.audio.exists(`pp_${name}`)) this.sound.play(`pp_${name}`, { volume, rate: 0.94 + Math.random() * 0.12 });
  }

  private lastSound = new Map<string, number>();

  /** A sound from somewhere in the world: quieter with distance, and not too often. */
  private playAt(name: string, x: number, y: number, volume: number, minGap: number) {
    const now = this.time.now;
    if (now - (this.lastSound.get(name) ?? -1e9) < minGap) return;
    const d = Math.hypot(x - this.player.x, y - this.player.y);
    const v = volume * Math.max(0, 1 - d / 40);
    if (v < 0.02) return;
    this.lastSound.set(name, now);
    this.playSound(name, v);
  }

  private onEscape() {
    if (this.menu.open) {
      if (!this.menu.back()) this.menu.hide();
    } else if (this.hud?.open) {
      this.hud.close();
    } else if (this.placementType) {
      this.choose(null);
    } else if (this.processLayer?.selected != null) {
      this.select(null);
    } else {
      this.menu.show();
    }
  }

  // ── Contexts for the game systems ────────────────────────────────────────

  private factoryCtx(): FactoryContext {
    const eng = this.eng;
    return {
      map: this.map,
      served: id => this.served.get(id) ?? 0,
      generation: id => this.snapshot?.entities.find(x => x.id === id)?.generation_w ?? 0,
      entityAt: (x, y) => engine.entityAt(x, y),
      unlocked: r => eng.unlocked.has(r),
      research: eng.research,
      researchUnit: () => {
        const done = eng.researchUnit();
        if (done) {
          this.processUI?.notice(`Researched ${TECH[done].name}`);
          this.playSound('research', 0.6);
        }
      },
      takeFluid: (id, sp, mol) => engine.take(id, sp, mol),
      produced: (item, n) => eng.stats.produce(item, n),
      depleted: (x, y) => this.ground.hideDeposit(x, y),
      consumed: (item, n) => eng.stats.consume(item, n),
    };
  }

  private arena(): Arena {
    const emitted = this.snapshot ? Object.values(this.snapshot.emitted_kg).reduce((a, b) => a + b, 0) : 0;
    const burnt = (this.eng.stats.consumed.get('wood')?.data.reduce((a, b) => a + b, 0) ?? 0) * 5;
    return {
      map: this.map,
      player: this.player,
      buildings: () => engine.layout().filter(p => p.proto !== 'pipe').map(p => ({ id: p.id, x: p.x, y: p.y, size: engine.PROTO[p.proto]?.size ?? 1 })),
      entityAt: (x, y) => {
        const id = engine.entityAt(x, y);
        if (id < 0) return -1;
        const kind = engine.layout().find(p => p.id === id)?.proto;
        return kind && WALKABLE.has(kind) && kind !== 'power_pole' ? -1 : id;
      },
      damageBuilding: (id, dmg) => this.damageBuilding(id, dmg),
      damagePlayer: dmg => this.hurt(dmg),
      pollution: emitted + burnt,
      peaceful: this.peaceful,
    };
  }

  private maxHp(size: number) { return [0, 150, 300, 500, 700][size] ?? 700; }

  private damageBuilding(id: number, dmg: number) {
    const f = this.factory.entities.get(id);
    let dead = false;
    if (f) { f.hp -= dmg; dead = f.hp <= 0; }
    else {
      const p = engine.layout().find(x => x.id === id);
      if (!p) return;
      const max = this.maxHp(engine.PROTO[p.proto]?.size ?? 1);
      const h = (this.processHp.get(id) ?? max) - dmg;
      this.processHp.set(id, h);
      dead = h <= 0;
    }
    if (!dead) return;
    const p = engine.layout().find(x => x.id === id);
    this.factory.remove(id);
    engine.remove(id);
    this.processHp.delete(id);
    if (p) {
      this.processLayer?.built(p.proto, p.x, p.y);
      this.processUI?.alert(`Aliens destroyed a ${engine.PROTO[p.proto]?.name ?? p.proto}.`);
    }
    this.playSound('rupture', 0.4);
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
          if (this.map.tiles[cy + dy]?.[cx + dx]?.traversable) return { x: cx + dx + 0.5, y: cy + dy + 0.5 };
        }
      }
    }
    return { x: cx + 0.5, y: cy + 0.5 };
  }

  private walkable(tx: number, ty: number) {
    const tile = this.map.tiles[ty]?.[tx];
    if (!tile || tile.traversable === false) return false;
    const id = engine.entityAt(tx, ty);
    if (id < 0) return true;
    const p = engine.layout().find(x => x.id === id);
    return !p || WALKABLE.has(p.proto);
  }

  /** WASD moves the engineer along the screen's axes; belts carry them along. */
  private movePlayer(dt: number) {
    const k = this.keys;
    const typing = document.activeElement instanceof HTMLInputElement;
    const sx = typing ? 0 : (k.d.isDown || k.right.isDown ? 1 : 0) - (k.a.isDown || k.left.isDown ? 1 : 0);
    const sy = typing ? 0 : (k.s.isDown || k.down.isDown ? 1 : 0) - (k.w.isDown || k.up.isDown ? 1 : 0);
    let mx = 0, my = 0;
    if (sx || sy) {
      // A screen direction in grid steps: right is (+x, −y), down is (+x, +y) at half the pixels.
      const dx = sx / TILE_W + sy / TILE_H;
      const dy = -sx / TILE_W + sy / TILE_H;
      const len = Math.hypot(dx, dy);
      mx = dx / len * WALK_SPEED;
      my = dy / len * WALK_SPEED;
      if (this.time.now >= this.shootUntil) this.engineer?.face(mx, my);
    }
    const belt = this.factory.entities.get(engine.entityAt(Math.floor(this.player.x), Math.floor(this.player.y)));
    if (belt && (belt.kind === 'transport_belt' || belt.kind === 'splitter') && this.simSpeed > 0) {
      mx += DIRS[belt.rot][0] * 1.875;
      my += DIRS[belt.rot][1] * 1.875;
    }
    const moving = sx !== 0 || sy !== 0;
    if (this.engineer) { this.engineer.moving = moving; this.engineer.speed = moving ? WALK_SPEED : 0; }
    if (!mx && !my) return;

    const nx = Phaser.Math.Clamp(this.player.x + mx * dt, 0, this.map.width - 0.01);
    const ny = Phaser.Math.Clamp(this.player.y + my * dt, 0, this.map.height - 0.01);
    // Slide along water, cliffs and buildings instead of stopping dead.
    if (this.walkable(Math.floor(nx), Math.floor(ny))) { this.player.x = nx; this.player.y = ny; }
    else if (this.walkable(Math.floor(nx), Math.floor(this.player.y))) this.player.x = nx;
    else if (this.walkable(Math.floor(this.player.x), Math.floor(ny))) this.player.y = ny;

    if (moving) {
      // Walking off brings the view back to the engineer.
      this.pan.x *= 0.92;
      this.pan.y *= 0.92;
    }
  }

  private hurt(dmg: number) {
    this.eng.health -= dmg * this.eng.armorFactor;
    this.juice.kick(3 + Math.min(6, dmg * 0.3));
    this.hud?.hurt();
    this.engineer && (this.engineer.flashUntil = this.time.now + 90);
    this.playAt('hurt', this.player.x, this.player.y, 0.4, 900);
    if (this.eng.health > 0) return;
    this.eng.health = MAX_HEALTH;
    this.player = { ...this.spawn };
    this.combat.aliens = this.combat.aliens.filter(a => Math.hypot(a.x - this.spawn.x, a.y - this.spawn.y) > 20);
    this.pan = { x: 0, y: 0 };
    this.processUI?.alert('The aliens overwhelmed you. You wake up back at the landing site.');
  }

  private redrawPlayer(view: View) {
    this.playerGfx.clear();
    this.engineer ??= new CharacterSprite(this);
    // Shooting raises the gun, even on the move; it stays up briefly between shots.
    if (this.time.now < this.shootUntil) this.engineer.action = 'shoot';
    else if (this.engineer.moving || (this.time.now > this.buildUntil && !this.mining)) this.engineer.action = null;
    if (!this.engineer.draw(this.player.x, this.player.y, view.x, view.y, this.zoom)) {
      drawPlayer(this.playerGfx, this.player.x, this.player.y, this.eng.health, MAX_HEALTH, view.x, view.y, this.zoom);
      return;
    }
    const p = isoToScreen(this.player.x, this.player.y, view.x, view.y, this.zoom);
    if (this.eng.health < MAX_HEALTH) {
      const w = 40 * this.zoom;
      const y = p.y - 70 * this.zoom;
      const frac = this.eng.health / MAX_HEALTH;
      this.playerGfx.fillStyle(0x000000, 0.7).fillRect(p.x - w / 2 - 1, y - 1, w + 2, 6);
      this.playerGfx.fillStyle(frac > 0.4 ? 0x6fd36f : 0xff5a4f, 1).fillRect(p.x - w / 2, y, w * frac, 4);
    }
    if (this.mining) {
      const t = isoToScreen(this.mining.x, this.mining.y, view.x, view.y, this.zoom);
      const w = 44 * this.zoom;
      this.playerGfx.fillStyle(0x000000, 0.75).fillRect(t.x - w / 2 - 1, t.y - 31 * this.zoom, w + 2, 7);
      this.playerGfx.fillStyle(0xf0a63a, 1).fillRect(t.x - w / 2, t.y - 30 * this.zoom, w * Math.min(1, this.miningProgress / this.mining.time), 5);
    }
  }

  private drawAliens(view: View) {
    const alive = new Set(this.combat.aliens.map(a => a.id));
    for (const [id, s] of this.aliens) if (!alive.has(id)) { s.destroy(); this.aliens.delete(id); }
    for (const a of this.combat.aliens) {
      let s = this.aliens.get(a.id);
      if (!s) this.aliens.set(a.id, s = new CharacterSprite(this, 'alien'));
      const v = Math.hypot(a.vx, a.vy);
      s.moving = v > 1e-4 || a.attacking;
      s.speed = a.speed;
      if (v > 1e-4) s.face(a.vx, a.vy);
      s.action = a.attacking ? 'attack' : null;
      s.flashUntil = (a.hitAt ?? -1e9) + 80;
      s.draw(a.x, a.y, view.x, view.y, this.zoom);
      if (a.hp < a.maxHp) {
        const p = isoToScreen(a.x, a.y, view.x, view.y, this.zoom);
        const w = 26 * this.zoom;
        this.playerGfx.fillStyle(0x000000, 0.7).fillRect(p.x - w / 2, p.y - 42 * this.zoom, w, 4);
        this.playerGfx.fillStyle(0xff5a4f, 1).fillRect(p.x - w / 2, p.y - 42 * this.zoom, w * a.hp / a.maxHp, 3);
      }
    }
  }

  // ── Mining and shooting ────────────────────────────────────────────────────

  private distanceTo(x: number, y: number) {
    return Math.hypot(x - this.player.x, y - this.player.y);
  }

  /** What holding the right button over a tile would mine. */
  private mineTarget(tx: number, ty: number): MiningTarget | null {
    const id = engine.entityAt(tx, ty);
    if (id >= 0) {
      const p = engine.layout().find(x => x.id === id);
      if (!p) return null;
      const n = engine.PROTO[p.proto]?.size ?? 1;
      return {
        key: `b${id}`, label: engine.PROTO[p.proto]?.name ?? p.proto, time: this.sandbox ? 0.15 : 0.3 + n * 0.15,
        x: p.x + n / 2, y: p.y + n / 2, done: () => this.deconstruct(id),
      };
    }
    const o = this.objects.get(tileKey(tx, ty));
    if (o) {
      const k = NATURE[o.kind];
      return {
        key: `n${tx},${ty}`, label: k.name, time: k.mine, x: tx + 0.5, y: ty + 0.5, done: () => {
          this.objects.delete(tileKey(tx, ty));
          this.natureRemoved.add(tileKey(tx, ty));
          for (const [item, n] of Object.entries(k.yields)) this.gain(item, n);
        },
      };
    }
    const tile = this.map.tiles[ty]?.[tx];
    const ore = tile ? MINED_ITEM[tile.resource] : undefined;
    if (ore && this.factory.oreLeft(this.map, tx, ty) > 0) {
      return {
        key: `o${tx},${ty}`, label: ITEMS[ore].name, time: HAND_MINING, x: tx + 0.5, y: ty + 0.5, done: () => {
          const key = ty * 100000 + tx;
          this.factory.mined.set(key, (this.factory.mined.get(key) ?? 0) + 1);
          if (this.factory.oreLeft(this.map, tx, ty) <= 0) this.ground.hideDeposit(tx, ty);
          this.gain(ore, 1);
        },
      };
    }
    return null;
  }

  /** What flies off whatever's being mined: wood and leaves, stone, ore, or bits of building. */
  private chipColours(key: string): number[] {
    if (key.startsWith('b')) return [0x8a9098, 0x5a6068, 0xffd070];
    if (key.startsWith('n')) {
      const kind = this.objects.get(tileKey(...(key.slice(1).split(',').map(Number) as [number, number])))?.kind ?? '';
      if (/tree|fungus|cactus|bush/.test(kind)) return [0x7a5230, 0xa07040, 0x4f7a2a, 0x6a9a3a];
      return [0x8a8680, 0x6a6660, 0xa8a49c];
    }
    const [tx, ty] = key.slice(1).split(',').map(Number);
    const ore = MINED_ITEM[this.map.tiles[ty]?.[tx]?.resource];
    return ore === 'copper_ore' ? [0xc8703a, 0x8a5a3a] : ore === 'stone' ? [0x8a8680, 0xa8a49c] : [0x6a7a88, 0x8a6a5a, 0x4a4f57];
  }

  /** Holding F picks items off belts within reach of the engineer's feet. */
  private tickPickup(dt: number) {
    this.pickTimer -= dt;
    if (!this.keys.f.isDown || this.pickTimer > 0 || this.hud?.open || document.activeElement instanceof HTMLInputElement) return;
    this.pickTimer = 0.08;
    for (const e of this.factory.entities.values()) {
      if (!e.items?.length || Math.hypot(e.x + 0.5 - this.player.x, e.y + 0.5 - this.player.y) > 1.6) continue;
      if (this.eng.inv.room(e.items[0].item) <= 0) continue;
      const it = e.items.shift()!;
      this.flyFrom = { x: e.x + 0.5, y: e.y + 0.5 };
      this.gain(it.item, 1);
      this.flyFrom = null;
      this.playSound('pickup', 0.12);
      return;
    }
  }

  private gain(item: string, n: number) {
    const left = this.eng.inv.add(item, n);
    this.eng.stats.produce(item, n - left);
    if (this.flyFrom && n - left > 0) for (let k = 0; k < Math.min(3, n - left); k++) this.juice.fly(item, this.flyFrom.x + (Math.random() - 0.5) * 0.4, this.flyFrom.y + (Math.random() - 0.5) * 0.4, 20 + k * 8);
    if (left) this.processUI?.alert('Your inventory is full.');
  }

  private tickMining(dt: number) {
    const p = this.input.activePointer;
    if (!p.rightButtonDown() || this.hud?.open) { this.mining = null; this.miningProgress = 0; this.worldDraw.wobble = null; return; }
    const target = this.mineTarget(this.aimTX, this.aimTY);
    if (!target || this.distanceTo(target.x, target.y) > this.eng.reach) { this.mining = null; this.miningProgress = 0; this.worldDraw.wobble = null; return; }
    if (this.mining?.key !== target.key) {
      this.mining = target;
      this.miningProgress = 0;
      // Axe on wood, pick on rock and ore.
      const tree = target.key.startsWith('n') && /tree|fungus|cactus|bush/.test(this.objects.get(tileKey(Math.floor(target.x), Math.floor(target.y)))?.kind ?? '');
      if (!target.key.startsWith('b')) this.playSound(tree ? 'chop' : 'rock', 0.35);
    }
    this.engineer?.face(target.x - this.player.x, target.y - this.player.y);
    if (this.engineer) this.engineer.action = 'build';
    this.miningProgress += dt;
    const colours = this.chipColours(target.key);
    this.worldDraw.wobble = target.key.startsWith('n') ? target.key.slice(1) : null;
    this.chipTimer -= dt;
    if (this.chipTimer <= 0) {
      this.chipTimer = 0.16;
      this.juice.burst(target.x, target.y, 4, { colour: colours, size: 3.2, speed: 1.3, up: 150, z: 18, life: 0.7 });
    }
    if (this.miningProgress >= target.time) {
      this.juice.burst(target.x, target.y, 16, { colour: colours, size: 3.6, speed: 1.8, up: 180, z: 14, life: 0.9 });
      this.juice.dust(target.x, target.y, 0x9a8a70, 5);
      this.worldDraw.wobble = null;
      this.flyFrom = { x: target.x, y: target.y };
      target.done();
      this.flyFrom = null;
      this.playSound(target.key.startsWith('b') ? 'remove' : 'pickup', 0.3);
      this.mining = null;
      this.miningProgress = 0;
    }
  }

  /** Picks a building up: it and what it held go into the pockets. */
  private deconstruct(id: number) {
    const p = engine.layout().find(x => x.id === id);
    if (!p) return;
    const partner = this.factory.entities.get(id)?.kind === 'splitter' ? this.factory.entities.get(id)?.pair : undefined;
    for (const s of this.factory.remove(id)) this.gain(s.item, s.count);
    engine.remove(id);
    this.processHp.delete(id);
    if (partner !== undefined) { this.factory.remove(partner); engine.remove(partner); }
    if (this.processLayer?.selected === id) this.select(null);
    if (!this.sandbox) this.gain(p.proto, 1);
  }

  /** Moves on past met goals and shows the current one. */
  private tickGoals() {
    if (!this.hud) return;
    if (this.sandbox) { this.hud.setGoal(null, 0, 0, 0); return; }
    const built = new Map<string, number>();
    for (const p of engine.layout()) built.set(p.proto, (built.get(p.proto) ?? 0) + 1);
    const w: GoalWorld = {
      has: item => this.eng.inv.count(item), built: kind => built.get(kind) ?? 0,
      researched: tech => this.eng.research.done.has(tech), kills: this.combat.kills,
    };
    while (this.eng.goal < GOALS.length && GOALS[this.eng.goal].progress(w) >= 1) this.eng.goal++;
    const g = GOALS[this.eng.goal];
    this.hud.setGoal(g ?? null, this.eng.goal, GOALS.length, g ? g.progress(w) : 1);
  }

  private tickShooting(dt: number, time: number) {
    this.eng.cooldown = Math.max(0, this.eng.cooldown - dt);
    if (!this.keys.space.isDown || !this.eng.weapon || this.hud?.open || document.activeElement instanceof HTMLInputElement) return;
    const w = WEAPONS[this.eng.weapon];
    if (!w || this.eng.cooldown > 0) return;
    const v = this.viewInfo();
    const aim = screenToIso(this.pointer.x, this.pointer.y, v.x, v.y, this.zoom);
    const target = this.combat.targetNear(this.player.x, this.player.y, w.range, aim.x, aim.y);
    if (!target) return;
    const round = this.eng.takeRound();
    if (!round) { this.processUI?.alert('Out of ammo. Craft magazines from iron plates.'); this.eng.cooldown = 1; return; }
    this.eng.cooldown = 1 / w.rate;
    const tx = 'spawnTimer' in target ? target.x + 1.5 : target.x;
    const ty = 'spawnTimer' in target ? target.y + 1.5 : target.y;
    this.engineer?.face(tx - this.player.x, ty - this.player.y);
    this.shootUntil = this.time.now + Math.max(400, 1000 / w.rate + 150);
    // Muzzle flash toward the target, a casing flicked out sideways, a nudge of recoil.
    const d = Math.hypot(tx - this.player.x, ty - this.player.y) || 1;
    const ux = (tx - this.player.x) / d, uy = (ty - this.player.y) / d;
    this.juice.burst(this.player.x + ux * 0.45, this.player.y + uy * 0.45, 4, { colour: [0xfff2a0, 0xffc040], size: 2.2, speed: 0.8, up: 10, z: 34, life: 0.09, heavy: false, dir: [ux * 2, uy * 2] });
    this.juice.burst(this.player.x, this.player.y, 1, { colour: 0xd8a83a, size: 1.4, speed: 0.4, up: 120, z: 30, life: 1.4, dir: [-uy * 1.2, ux * 1.2] });
    this.juice.kick(0.8);
    this.combat.hit(target, (AMMO_DAMAGE[round] ?? 5) * (1 + this.eng.damageBonus), this.player.x, this.player.y, time);
  }

  // ── View ───────────────────────────────────────────────────────────────────

  private followTarget() {
    return camCenterOn(this.player.x, this.player.y, this.scale.width, this.scale.height, this.zoom);
  }

  private followPlayer() {
    const t = this.followTarget();
    // Eases the same at any frame rate: 15 % a frame at 60 fps.
    const k = 1 - Math.pow(0.85, Math.min(100, this.game.loop.delta) / (1000 / 60));
    this.cam.x += (t.x - this.cam.x) * k;
    this.cam.y += (t.y - this.cam.y) * k;
  }

  private viewInfo(): View {
    const j = this.juice?.shake ?? { x: 0, y: 0 };
    return { x: this.cam.x + this.pan.x + j.x, y: this.cam.y + this.pan.y + j.y, zoom: this.zoom, w: this.scale.width, h: this.scale.height };
  }

  /** Centres the view on a tile, leaving the engineer where they are. */
  panTo(x: number, y: number) {
    const target = camCenterOn(x, y, this.scale.width, this.scale.height, this.zoom);
    this.pan = { x: target.x - this.cam.x, y: target.y - this.cam.y };
  }

  private onWheel(p: Phaser.Input.Pointer, _o: unknown[], _dx: number, dy: number) {
    if (this.menu.open || this.hud?.open) return;
    // Trackpads send many small deltas, mouse wheels a few large ones.
    const zoom = Phaser.Math.Clamp(this.zoom * Math.exp(-Phaser.Math.Clamp(dy, -100, 100) * 0.002), MIN_ZOOM, MAX_ZOOM);
    if (zoom === this.zoom) return;
    // The view scales about the cursor; the follow offset jumps to the new zoom, the pan takes the rest.
    const v = this.viewInfo();
    const nx = p.x - (p.x - v.x) * zoom / this.zoom;
    const ny = p.y - (p.y - v.y) * zoom / this.zoom;
    this.zoom = zoom;
    this.cam = this.followTarget();
    this.pan = { x: nx - this.cam.x, y: ny - this.cam.y };
  }

  private minimapData() {
    const v = this.viewInfo();
    const corners = [[0, 0], [v.w, 0], [v.w, v.h], [0, v.h]].map(([x, y]) => screenToIso(x, y, v.x, v.y, this.zoom));
    return {
      player: this.player,
      view: corners,
      buildings: engine.layout().map(p => ({ x: p.x, y: p.y, size: engine.PROTO[p.proto]?.size ?? 1, kind: p.proto })),
      nests: this.combat.nests,
      aliens: this.combat.aliens,
    };
  }

  // ── Pointer input ──────────────────────────────────────────────────────────

  private tileAt(sx: number, sy: number) {
    const v = this.viewInfo();
    const iso = screenToIso(sx, sy, v.x, v.y, this.zoom);
    return { x: Math.floor(iso.x), y: Math.floor(iso.y) };
  }

  private onDown(p: Phaser.Input.Pointer) {
    if (this.menu.open || p.rightButtonDown()) return;
    const tile = this.tileAt(p.x, p.y);
    if (this.placementType === 'pipe' || this.placementType === 'transport_belt') {
      this.laying = { last: null };
      this.layTo(tile.x, tile.y);
      return;
    }
    if (this.placementType) { this.stampAt(tile.x, tile.y); return; }
    this.drag = { x: p.x, y: p.y, panX: this.pan.x, panY: this.pan.y };
  }

  private onMove(p: Phaser.Input.Pointer) {
    this.pointer = { x: p.x, y: p.y };
    const tile = this.tileAt(p.x, p.y);
    this.hoverTX = tile.x; this.hoverTY = tile.y;
    this.updateAim();
    if (this.laying && p.isDown) this.layTo(tile.x, tile.y);
    if (this.stamping && p.isDown && this.placementType) this.stampAt(tile.x, tile.y);
    this.updateHover(p, this.aimTX, this.aimTY);
    if (this.drag && p.isDown && !p.rightButtonDown()) {
      this.pan.x = this.drag.panX + (p.x - this.drag.x);
      this.pan.y = this.drag.panY + (p.y - this.drag.y);
    }
  }

  private onUp(p: Phaser.Input.Pointer) {
    if (this.laying) { this.laying = null; return; }
    if (this.stamping) { this.stamping = null; return; }
    if (!this.drag) return;
    const wasDrag = Math.abs(p.x - this.drag.x) > 5 || Math.abs(p.y - this.drag.y) > 5;
    this.drag = null;
    if (wasDrag || this.menu.open || p.button !== 0) return;
    const tile = this.tileAt(p.x, p.y);
    if (this.placementType) { this.placeAt(this.placementType, tile.x, tile.y); return; }
    this.updateAim();
    const id = engine.entityAt(this.aimTX, this.aimTY);
    if (id < 0) { this.select(null); return; }
    const me = p.event as MouseEvent;
    if ((me.ctrlKey || me.metaKey) && this.quickTransfer(id)) return;
    if (me.shiftKey && this.repair(id)) return;
    const f = this.factory.entities.get(id);
    if (f && !['transport_belt', 'underground_belt', 'splitter', 'inserter'].includes(f.kind)) {
      this.select(null);
      this.hud?.showMachine(id);
      return;
    }
    this.select(this.snapshot?.entities.some(e => e.id === id) ? id : null);
  }

  /**
   * Ctrl/Cmd-click, as in Factorio: empty a machine's output (or a whole chest) into the pockets,
   * then top it up with fuel and whatever it works on.
   */
  private quickTransfer(id: number): boolean {
    const m = this.factory.entities.get(id);
    if (!m || !(m.inv || m.fuel || m.input || m.output) || this.sandbox && !m.kind.endsWith('_chest')) return false;
    const take = (inv?: typeof m.inv) => {
      for (const s of [...(inv?.slots ?? [])]) {
        if (!s) continue;
        const left = this.eng.inv.add(s.item, s.count);
        inv!.remove(s.item, s.count - left);
      }
    };
    if (m.kind.endsWith('_chest')) { take(m.inv); this.playSound('pickup', 0.4); return true; }
    take(m.output);
    const unlocked = this.eng.unlocked;
    const smeltable = (item: string) => Object.values(RECIPES).some(r => r.station === 'smelt' && item in r.in && unlocked.has(r.id));
    for (const [item, n] of [...this.eng.inv.totals()].sort((a, b) => b[1] - a[1])) {
      const target = this.factory.slotFor(m, item, smeltable);
      if (!target) continue;
      // A furnace gets more of what it's smelting, or ore when it's empty; plates only on purpose.
      if (target === m.input && m.kind.endsWith('_furnace') && (m.input.isEmpty() ? !item.endsWith('_ore') : !m.input.count(item))) continue;
      const k = Math.min(n, target.room(item));
      if (k > 0) this.eng.inv.remove(item, k - target.add(item, k));
    }
    this.playSound('pickup', 0.4);
    return true;
  }

  private repair(id: number): boolean {
    if (!this.eng.inv.count('repair_pack')) return false;
    const f = this.factory.entities.get(id);
    if (f && f.hp < f.maxHp) { f.hp = Math.min(f.maxHp, f.hp + 300); this.eng.inv.remove('repair_pack', 1); return true; }
    if (this.processHp.has(id)) {
      const p = engine.layout().find(x => x.id === id)!;
      const h = this.processHp.get(id)! + 300;
      if (h >= this.maxHp(engine.PROTO[p.proto]?.size ?? 1)) this.processHp.delete(id); else this.processHp.set(id, h);
      this.eng.inv.remove('repair_pack', 1);
      return true;
    }
    return false;
  }

  /** Finds what's drawn under the pointer, front to back, falling back to the tile under it. */
  private updateAim() {
    this.aimTX = this.hoverTX; this.aimTY = this.hoverTY;
    if (this.placementType || !this.processLayer) return;
    const { hoverTX: tx, hoverTY: ty } = this;
    let depth = -Infinity;
    const p = engine.placedById(engine.entityAt(tx, ty));
    if (p) depth = 10 + (p.x + p.y + 2 * (engine.PROTO[p.proto]?.size ?? 1)) * 0.01;
    else if (this.objects.has(tileKey(tx, ty))) depth = 10 + (tx + ty + 1.2) * 0.01;
    for (const hit of [this.processLayer.pick(this.pointer.x, this.pointer.y), this.worldDraw.pick(this.pointer.x, this.pointer.y, this.factory)]) {
      if (hit && hit.depth > depth) { depth = hit.depth; this.aimTX = hit.tx; this.aimTY = hit.ty; }
    }
  }

  private drawHoverTile(view: View) {
    this.hoverGfx.clear();
    const { hoverTX: tx, hoverTY: ty } = this;
    if (this.menu.open || tx < 0 || ty < 0 || tx >= this.map.width || ty >= this.map.height) return;
    // Outside placement, outline the whole building being pointed at.
    const aimed = this.placementType ? undefined : engine.placedById(engine.entityAt(this.aimTX, this.aimTY));
    if (aimed) {
      const n = engine.PROTO[aimed.proto]?.size ?? 1;
      const pts = [isoToScreen(aimed.x, aimed.y, view.x, view.y, this.zoom), isoToScreen(aimed.x + n, aimed.y, view.x, view.y, this.zoom),
        isoToScreen(aimed.x + n, aimed.y + n, view.x, view.y, this.zoom), isoToScreen(aimed.x, aimed.y + n, view.x, view.y, this.zoom)];
      this.hoverGfx.lineStyle(2, 0xffffff, 0.8).strokePoints(pts, true);
      return;
    }
    if (!this.placementType && (this.aimTX !== tx || this.aimTY !== ty)) {
      drawHover(this.hoverGfx, this.aimTX, this.aimTY, view.x, view.y, this.zoom);
      return;
    }
    // Where an extraction building can go: its resource's tiles light up.
    const need = this.placementType ? this.needOf(this.placementType) : null;
    if (need) {
      const r = 14;
      for (let y = Math.max(0, ty - r); y < Math.min(this.map.height, ty + r); y++) {
        for (let x = Math.max(0, tx - r); x < Math.min(this.map.width, tx + r); x++) {
          if (!this.tileHas(need, x, y)) continue;
          const pts = [isoToScreen(x, y, view.x, view.y, this.zoom), isoToScreen(x + 1, y, view.x, view.y, this.zoom),
            isoToScreen(x + 1, y + 1, view.x, view.y, this.zoom), isoToScreen(x, y + 1, view.x, view.y, this.zoom)];
          this.hoverGfx.fillStyle(0x44ff88, 0.16).fillPoints(pts, true);
        }
      }
    }
    drawHover(this.hoverGfx, tx, ty, view.x, view.y, this.zoom);
  }

  // ── Building ───────────────────────────────────────────────────────────────

  private barState(id: string) {
    if (id === 'wreck') return { visible: false, count: null };
    const visible = this.eng.unlocked.has(id) || id === 'pipe';
    return { visible, count: this.sandbox ? null : this.eng.inv.count(id) };
  }

  /** Selects a building to place; with none in the pockets, crafts one if possible. */
  private choose(id: string | null) {
    if (id && !this.sandbox && !this.eng.inv.count(id)) {
      if (!this.eng.queue.some(j => RECIPES[j.recipe]?.out === id) && !this.eng.craft(id, 1)) {
        const r = RECIPES[id];
        const needs = r ? Object.entries(r.in).map(([k, n]) => `${n} ${ITEMS[k]?.name ?? k}`).join(', ') : 'nothing craftable';
        this.processUI?.alert(`You have no ${engine.PROTO[id]?.name ?? id}. It takes ${needs}.`);
      }
    }
    this.placementType = id;
    if (this.processUI && this.processUI.selectedProto !== id) {
      this.processUI.selectedProto = id;
      this.processUI.refreshBar();
    }
  }

  private rotate() {
    if (this.placementType) { this.placementRot = (this.placementRot + 1) % 4; return; }
    // Turn the belt, inserter or drill under the cursor.
    const f = this.factory.entities.get(engine.entityAt(this.aimTX, this.aimTY));
    if (f && f.kind !== 'splitter' && f.kind !== 'underground_belt') f.rot = (f.rot + 1) % 4;
  }

  /** Q: pick the kind of building under the cursor to place more. */
  private pipette() {
    const id = engine.entityAt(this.aimTX, this.aimTY);
    const p = engine.placedById(id);
    if (!p) { this.choose(null); return; }
    this.placementRot = this.factory.entities.get(id)?.rot ?? p.rot;
    this.choose(p.proto);
  }

  /** Top-left tile for a building centred under the cursor. */
  private originFor(proto: string, tx: number, ty: number) {
    const off = Math.floor(((engine.PROTO[proto]?.size ?? 1) - 1) / 2);
    return { x: tx - off, y: ty - off };
  }

  /** What resource a building must stand on. */
  private needOf(proto: string): string | null {
    if (proto.endsWith('_drill')) return 'ore';
    return engine.PROTO[proto]?.needs ?? null;
  }

  private tileHas(need: string, x: number, y: number) {
    const t = this.map.tiles[y]?.[x];
    if (!t) return false;
    if (need === 'water') return t.resource === ResourceType.WATER || t.terrain === TerrainType.SHALLOW_WATER || t.terrain === TerrainType.ICE;
    if (need === 'methane') return t.resource === ResourceType.METHANE || t.terrain === TerrainType.METHANE_LAKE;
    if (need === 'ore') return !!MINED_ITEM[t.resource] && this.factory.oreLeft(this.map, x, y) > 0;
    return false;
  }

  /** The tiles a building would take: splitters are two wide. */
  private footprint(proto: string, x: number, y: number, rot: number): [number, number][] {
    if (proto === 'splitter') {
      const [px, py] = DIRS[(rot + 1) % 4];
      return [[x, y], [x + px, y + py]];
    }
    const n = engine.PROTO[proto]?.size ?? 1;
    const out: [number, number][] = [];
    for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) out.push([x + dx, y + dy]);
    return out;
  }

  /** Why a building can't go here, or null if it can. */
  private placementError(proto: string, x: number, y: number, rot: number): string | null {
    const p = engine.PROTO[proto];
    if (!p) return 'Unknown building.';
    const tiles = this.footprint(proto, x, y, rot);
    for (const [tx, ty] of tiles) {
      const t = this.map.tiles[ty]?.[tx];
      if (!t) return 'Off the map.';
      if (engine.entityAt(tx, ty) >= 0) return 'Something is in the way.';
      if (this.combat.nestAt(tx, ty)) return 'An alien nest is in the way.';
      const water = t.terrain === TerrainType.DEEP_WATER || (t.terrain === TerrainType.SHALLOW_WATER && p.needs !== 'water');
      if (water || t.terrain === TerrainType.LAVA || t.terrain === TerrainType.MOUNTAINS) return "You can't build there.";
    }
    const need = this.needOf(proto);
    if (need) {
      const on = tiles.filter(([tx, ty]) => this.tileHas(need, tx, ty)).length;
      if (on < Math.ceil(tiles.length / 2)) {
        const what = need === 'ore' ? 'an ore deposit' : need === 'water' ? 'water' : 'a methane deposit';
        return `${p.name} must stand mostly on ${what} (${on} of ${tiles.length} tiles are).`;
      }
    }
    if (!this.sandbox) {
      const cx = x + p.size / 2, cy = y + p.size / 2;
      if (this.distanceTo(cx, cy) > this.eng.reach + p.size / 2) return 'Too far away. Walk closer.';
      if (!this.eng.inv.count(proto)) return `You have no ${p.name}.`;
    }
    return null;
  }

  private placeAt(proto: string, tx: number, ty: number) {
    const o = proto === 'splitter' ? { x: tx, y: ty } : this.originFor(proto, tx, ty);
    const err = this.placementError(proto, o.x, o.y, this.placementRot);
    if (err) { this.processUI?.alert(err); return; }
    this.build(proto, o.x, o.y, this.placementRot);
  }

  /**
   * Click to place; keep the button down and sweep to place a row. Buildings in a row sit side
   * by side, power poles as far apart as their wires reach. Only the first one complains.
   */
  private stampAt(tx: number, ty: number) {
    const proto = this.placementType!;
    let o = proto === 'splitter' ? { x: tx, y: ty } : this.originFor(proto, tx, ty);
    const last = this.stamping?.last;
    if (last) {
      const n = engine.PROTO[proto]?.size ?? 1;
      const wire = engine.PROTO[proto]?.wire ?? 0;
      // A quick sweep can jump past a pole's reach: put it back where the wire still reaches.
      const d = Math.hypot(o.x - last.x, o.y - last.y);
      if (wire > 0 && d > wire) {
        const k = Math.floor(wire) / d;
        o = { x: last.x + Math.round((o.x - last.x) * k), y: last.y + Math.round((o.y - last.y) * k) };
      }
      const apart = wire > 0 ? Math.hypot(o.x - last.x, o.y - last.y) >= Math.floor(wire) : Math.abs(o.x - last.x) >= n || Math.abs(o.y - last.y) >= n;
      if (!apart || this.placementError(proto, o.x, o.y, this.placementRot)) return;
      if (this.build(proto, o.x, o.y, this.placementRot)) this.stamping = { last: o };
      return;
    }
    this.stamping = { last: o };
    this.placeAt(proto, tx, ty);
  }

  /** Places a building: clears trees under it, takes it out of the pockets. */
  private build(proto: string, x: number, y: number, rot: number): boolean {
    const tiles = this.footprint(proto, x, y, rot);
    const ids: number[] = [];
    for (const [k, [tx, ty]] of tiles.entries()) {
      if (k > 0 && proto !== 'splitter') break;
      const err = engine.place(proto, tx, ty, rot);
      if (err) { ids.forEach(id => engine.remove(id)); this.processUI?.alert(err); return false; }
      ids.push(Math.max(...engine.layout().map(p => p.id)));
    }
    const n = engine.PROTO[proto]?.size ?? 1;
    for (const [tx, ty] of tiles) {
      const key = tileKey(tx, ty);
      const obj = this.objects.get(key);
      if (obj) {
        this.objects.delete(key);
        this.natureRemoved.add(key);
        if (!this.sandbox) for (const [item, k] of Object.entries(NATURE[obj.kind].yields)) this.gain(item, k);
      }
    }
    if (FACTORY_KINDS.has(proto)) {
      const made = ids.map(id => this.factory.add(id, proto, ...this.posOf(id), rot, proto === 'splitter' ? 1 : n));
      if (proto === 'splitter' && made.length === 2) this.factory.pairSplitter(made[0], made[1]);
    }
    if (!this.sandbox) this.eng.inv.remove(proto, 1);
    this.playSound('place', 0.35);
    for (const id of ids) pop(id, this.time.now);
    for (let k = 0; k < n * 2; k++) this.juice.dust(x + Math.random() * n, y + Math.random() * n, 0x8a7a64, 2);
    this.juice.kick(n >= 3 ? 1.5 : 0);
    this.processLayer?.built(proto, x, y);
    if (this.engineer) {
      this.engineer.face(x + n / 2 - this.player.x, y + n / 2 - this.player.y);
      this.engineer.action = 'build';
      this.buildUntil = this.time.now + 800;
    }
    return true;
  }

  private posOf(id: number): [number, number] {
    const p = engine.layout().find(x => x.id === id)!;
    return [p.x, p.y];
  }

  /** Lays pipe or belt along a drag, one axis-aligned step at a time; belts face the way you drag. */
  private layTo(tx: number, ty: number) {
    if (!this.laying || !this.placementType) return;
    const proto = this.placementType;
    let from = this.laying.last ?? { x: tx, y: ty };
    const steps: { x: number; y: number; rot: number }[] = this.laying.last ? [] : [{ ...from, rot: this.placementRot }];
    while (from.x !== tx || from.y !== ty) {
      const step = from.x !== tx ? { x: Math.sign(tx - from.x), y: 0 } : { x: 0, y: Math.sign(ty - from.y) };
      const rot = DIRS.findIndex(([dx, dy]) => dx === step.x && dy === step.y);
      // The previous belt turns to follow the drag.
      const prev = this.factory.entities.get(engine.entityAt(from.x, from.y));
      if (proto === 'transport_belt' && prev?.kind === 'transport_belt') prev.rot = rot;
      from = { x: from.x + step.x, y: from.y + step.y };
      steps.push({ ...from, rot });
      this.placementRot = rot;
    }
    for (const t of steps) {
      if (engine.entityAt(t.x, t.y) >= 0) continue;
      if (this.placementError(proto, t.x, t.y, t.rot)) continue;
      this.build(proto, t.x, t.y, proto === 'pipe' ? 0 : t.rot);
    }
    this.laying.last = { x: tx, y: ty };
  }

  private select(id: number | null) {
    if (this.processLayer) this.processLayer.selected = id;
    this.processUI?.showInspector(id);
  }

  private hoveredPole(): boolean {
    const p = engine.placedById(engine.entityAt(this.aimTX, this.aimTY));
    return !!p && (engine.PROTO[p.proto]?.wire ?? 0) > 0;
  }

  // ── Hover read-outs ──────────────────────────────────────────────────────

  private updateHover(p: Phaser.Input.Pointer, tx: number, ty: number) {
    if (!this.processUI) return;
    if (this.menu.open || this.hud?.open) { this.processUI.hover(null, 0, 0); return; }
    const ev = p.event instanceof MouseEvent ? p.event : null;
    this.processUI.hover(this.describe(tx, ty), ev ? ev.clientX : p.x, ev ? ev.clientY : p.y);
  }

  /** What's at a tile, in a sentence or two. */
  private describe(tx: number, ty: number): string | null {
    const v = this.viewInfo();
    const iso = screenToIso(this.pointer.x, this.pointer.y, v.x, v.y, this.zoom);
    const alien = this.combat.aliens.find(a => Math.hypot(a.x - iso.x, a.y - iso.y) < 0.7);
    if (alien) return `<b>Alien crawler</b> · ${Math.ceil(alien.hp)}/${alien.maxHp} HP<br><small>Hold Space to shoot</small>`;
    const nest = this.combat.nestAt(tx, ty);
    if (nest) return `<b>Alien nest</b> · ${Math.ceil(nest.hp)}/${nest.maxHp} HP<br><small>Sends attackers when pollution reaches it. Hold Space nearby to shoot.</small>`;
    const port = this.portAt(tx, ty);
    const id = engine.entityAt(tx, ty);
    const f = id >= 0 ? this.factory.entities.get(id) : undefined;
    const snapE = id >= 0 ? this.snapshot?.entities.find(x => x.id === id) : undefined;
    let main: string | null = null;
    if (f) main = this.factoryTooltip(f);
    else if (snapE) main = entityTooltip(snapE) + (engine.PROTO[snapE.proto]?.power_w && snapE.network === null ? '<br><small class="pp-bad">Not powered: put it inside a power pole\'s area</small>' : '');
    else {
      const si = this.processLayer?.segmentAt(tx, ty);
      if (si !== undefined && this.snapshot) main = segmentTooltip(this.snapshot.segments[si].vessel);
    }
    if (!main) {
      const o = this.objects.get(tileKey(tx, ty));
      if (o) {
        const k = NATURE[o.kind];
        main = `<b>${k.name}</b><br><small>Hold right-click to mine: ${Object.entries(k.yields).map(([i, n]) => `${n} ${ITEMS[i]?.name ?? i}`).join(', ')}</small>`;
      }
    }
    if (!main) {
      const t = this.map.tiles[ty]?.[tx];
      if (t && t.resource !== ResourceType.NONE) {
        const ore = MINED_ITEM[t.resource];
        const name = RESOURCE_NAMES[t.resource] ?? 'deposit';
        main = ore
          ? `<b>${ITEMS[ore].name}</b> · ${this.factory.oreLeft(this.map, tx, ty)} left<br><small>Mine by hand (hold right-click) or with a drill</small>`
          : t.resource === ResourceType.WATER ? '<b>Groundwater</b><br><small>A water well goes here</small>'
          : t.resource === ResourceType.METHANE ? '<b>Natural gas</b><br><small>A gas well goes here</small>'
          : `<b>${name[0].toUpperCase()}${name.slice(1).replace(/_/g, ' ')}</b>`;
      }
    }
    return [main, port].filter(Boolean).join('<br>') || null;
  }

  private factoryTooltip(f: ReturnType<Factory['entities']['get']> & object): string {
    const name = engine.PROTO[f.kind]?.name ?? f.kind;
    const bits: string[] = [];
    if (f.items?.length) bits.push(f.items.map(i => ITEMS[i.item]?.name ?? i.item).join(', '));
    if (f.hand) bits.push(`holding ${ITEMS[f.hand]?.name}`);
    if (f.recipe) bits.push(`making ${ITEMS[RECIPES[f.recipe]?.out]?.name ?? f.recipe}`);
    if (f.inv && !f.inv.isEmpty()) bits.push([...f.inv.totals()].map(([i, n]) => `${n} ${ITEMS[i]?.name ?? i}`).join(', '));
    if (f.kind === 'underground_belt') bits.push(f.mode === 'in' ? (f.pair !== undefined ? 'entrance' : 'entrance — place an exit up to 4 tiles ahead') : 'exit');
    const status = f.status ? `<br><small class="pp-warn">${f.status}</small>` : '';
    const hp = f.hp < f.maxHp ? ` · ${Math.ceil(f.hp)}/${f.maxHp} HP` : '';
    return `<b>${name}</b>${hp}${bits.length ? `<br><small>${bits.join(' · ')}</small>` : ''}${status}`;
  }

  /** A pipe port on this tile: whose, which, and where it attaches. */
  private portAt(tx: number, ty: number): string | null {
    for (const e of this.snapshot?.entities ?? []) {
      const p = engine.PROTO[e.proto];
      if (!p?.ports.length || Math.abs(e.x - tx) > 6 || Math.abs(e.y - ty) > 6) continue;
      for (const pt of engine.portTiles(p, e.x, e.y, e.rot)) {
        if (pt.outside[0] !== tx || pt.outside[1] !== ty) continue;
        const where = pt.port.at === 'Top' ? 'top' : pt.port.at === 'Bottom' ? 'bottom' : 'middle';
        const piped = this.processLayer?.segmentAt(tx, ty) !== undefined;
        return `<b>${p.name} — ${pt.port.label}</b> port (${where} of the vessel)<br><small>${piped ? 'Connected' : 'Lay a pipe on this tile to connect'}</small>`;
      }
    }
    return null;
  }

  private plantFeed(id: number): string {
    const e = this.snapshot?.entities.find(x => x.id === id);
    const v = e?.vessels[0];
    if (!v || v.moles < 1e-3) return 'empty — pipe in the feed gas';
    const top = Object.entries(v.z).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s, z]) => `${s.toUpperCase()} ${(z * 100).toFixed(0)}%`).join(', ');
    return `${fmt.p(v.p)}, ${top}`;
  }

  private drawProcess(time: number) {
    if (!this.processLayer) return;
    let ghost = null;
    if (this.placementType && this.hoverTX >= 0 && !this.menu.open) {
      const o = this.placementType === 'splitter' ? { x: this.hoverTX, y: this.hoverTY } : this.originFor(this.placementType, this.hoverTX, this.hoverTY);
      ghost = { proto: this.placementType, x: o.x, y: o.y, rot: this.placementRot, ok: !this.placementError(this.placementType, o.x, o.y, this.placementRot) };
    }
    const v = this.viewInfo();
    const hoveredId = engine.entityAt(this.aimTX, this.aimTY);
    this.processLayer.draw(this.snapshot, v.x, v.y, this.zoom, ghost, time, {
      all: this.placementType === 'pipe' || !!(this.placementType && engine.PROTO[this.placementType]?.ports.length),
      hovered: hoveredId >= 0 ? hoveredId : null,
    }, id => this.factory.entities.get(id)?.active);
  }
}
