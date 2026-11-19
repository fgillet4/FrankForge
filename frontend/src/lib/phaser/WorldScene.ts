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
import { ANIMS, CharacterSprite, ProcessLayer, rackLift } from '../process/render';
import { ProcessUI, entityTooltip, fmt, segmentTooltip } from '../process/ui';
import { generateWorld, loadSettings, writeSave, type GroundPile, type SaveGame, type Settings, type WorldSettings } from '../save';
import { PauseMenu } from '../../ui/menu';
import { Hud } from '../../ui/hud';

import { ITEMS, RECIPES, TECH } from '../game/items';
import { Engineer, MAX_HEALTH } from '../game/game';
import { DIRS, FACTORY_KINDS, Factory, MINED_ITEM, isElectricMachine, type FactoryContext } from '../game/factory';
import { ALIEN_COST, AMMO_DAMAGE, Combat, WEAPONS, type Arena } from '../game/combat';
import { NATURE, scatterNature, tileKey, type NatureObject } from '../game/nature';
import { WorldRenderer, type View } from '../game/draw';
import { GOALS, type GoalWorld } from '../game/goals';
import { Juice, pop } from '../game/juice';
import { navigable, newShip, voyageText } from '../game/ships';
import { Pollution } from '../game/pollution';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;
const WALK_SPEED = 4.5;   // tiles per second
/** Pipe for each working height: ground, low rack, high rack. */
const LEVEL_PIPES = ['pipe', 'pipe_rack', 'pipe_rack_high'];
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
  /** Pollution over the map, and what each vent had let out when last looked at [kg]. */
  private smog!: Pollution;
  private vented = new Map<number, number>();

  private playerGfx!: Phaser.GameObjects.Graphics;
  private hoverGfx!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private night!: Phaser.GameObjects.Rectangle;
  private ground!: GroundScene;
  private worldDraw!: WorldRenderer;
  private ambient: Phaser.Sound.BaseSound | null = null;
  /** The rattle of the loudest cavitating pump near the engineer. */
  private cavitationLoop: Phaser.Sound.WebAudioSound | null = null;
  private cavitationVolume = 0;

  zoom = 1.2;
  private cam = { x: 0, y: 0 };
  private pan = { x: 0, y: 0 };
  private drag: { x: number; y: number; panX: number; panY: number } | null = null;
  private hoverTX = -1;
  private hoverTY = -1;
  /** The tile of what's drawn under the pointer: a tall sprite wins over the ground behind it. */
  private aimTX = -1;
  /** Stacks dropped on the ground. */
  private piles: GroundPile[] = [];
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
  private laying: { last: { x: number; y: number } | null; prev?: { x: number; y: number; id: number } | null } | null = null;
  /** Whether pipe being laid joins every pipe beside it, or only the run it's laid in. */
  private pipeSnap = (() => { try { return localStorage.getItem('ff_pipeSnap') !== '0'; } catch { return true; } })();
  /** The height the engineer works at: 0 ground, 1 low rack, 2 high rack (H to change). */
  private level = 0;
  private levelKey: KeyboardEvent | null = null;
  /** How far the view has risen with it [px], easing toward the level's height. */
  private levelCam = 0;
  private levelVel = 0;
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
    this.smog = new Pollution(this.map);
    this.smog.load(data.pollution);
    this.combat = new Combat();
    if (data.combat) this.combat.load(data.combat as never);
    else if (!this.peaceful) this.combat.placeNests(this.map, this.seed, this.spawn);
    this.natureRemoved = new Set(data.nature ?? []);
    this.objects = scatterNature(this.map, this.seed, this.world.planet, this.natureRemoved);
    for (const n of this.combat.nests) for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) this.objects.delete(tileKey(n.x + dx, n.y + dy));
    this.processHp = new Map(data.hp ?? []);
    this.piles = data.ground ?? [];

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
    this.worldDraw.map = this.map;
    this.juice = new Juice(this);
    this.worldDraw.fx = {
      chips: (x, y) => this.juice.burst(x + (Math.random() - 0.5) * 0.3, y + (Math.random() - 0.5) * 0.3, 2,
        { colour: this.chipColours(`o${Math.floor(x)},${Math.floor(y)}`), size: 2.4, speed: 0.9, up: 110, z: 4, life: 0.6 }),
      smoke: (x, y, z) => this.juice.burst(x, y, 1, { colour: [0x3a3632, 0x4a4540], size: 5, speed: 0.15, up: 40, z, life: 1.8, heavy: false }),
      sparks: (x, y, z, colour) => this.juice.burst(x, y, 3, { colour, size: 1.2, speed: 0.8, up: 90, z, life: 0.45 }),
    };
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
      // Round and round: past the fastest comes pause.
      this.speedIndex = (this.speedIndex + (e.shiftKey ? -1 : 1) + SPEEDS.length) % SPEEDS.length;
    });
    kb.on('keydown-R', () => this.rotate());
    kb.on('keydown-Q', () => this.pipette());
    kb.on('keydown-E', () => { if (!this.menu.open) this.hud?.toggle('inventory'); this.processUI?.hover(null, 0, 0); });
    kb.on('keydown-T', () => { if (!this.menu.open && !this.sandbox) this.hud?.toggle('tech'); this.processUI?.hover(null, 0, 0); });
    kb.on('keydown-P', () => { if (!this.menu.open) this.hud?.toggle('stats'); this.processUI?.hover(null, 0, 0); });
    kb.on('keydown-M', () => this.hud?.toggleBigMap());
    kb.on('keydown-H', (e: KeyboardEvent) => {
      // Phaser can hand the same Shift+H press over more than once; one press, one floor.
      if (this.menu.open || e === this.levelKey) return;
      this.levelKey = e;
      this.changeLevel(this.level + (e.shiftKey ? -1 : 1));
    });
    kb.on('keydown-V', () => {
      if (!this.processLayer) return;
      const views = ['off', 'velocity', 'pressure'] as const;
      this.processLayer.flowView = views[(views.indexOf(this.processLayer.flowView) + 1) % views.length];
      try { localStorage.setItem('ff_flowView', this.processLayer.flowView); } catch { /* not remembered */ }
    });
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
      try {
        const view = localStorage.getItem('ff_flowView');
        if (view === 'velocity' || view === 'pressure') this.processLayer.flowView = view;
      } catch { /* starts off */ }
      // The engine, for poking at from the console while developing.
      if (import.meta.env.DEV) (window as unknown as { engine: typeof engine }).engine = engine;
      this.processUI = new ProcessUI();
      this.processUI.vfdUnlocked = () => this.sandbox || this.eng.research.done.has('vfd');
      this.processUI.onCloseInspector = () => this.select(null);
      this.processUI.onRotate = id => this.rotateBuilding(id);
      this.processUI.onLevel = l => this.changeLevel(l);
      this.processUI.onPipeSnap = on => {
        this.pipeSnap = on;
        try { localStorage.setItem('ff_pipeSnap', on ? '1' : '0'); } catch { /* not remembered */ }
      };
      this.hud = new Hud(this.eng, this.factory, {
        map: this.map,
        pick: item => this.choose(ITEMS[item]?.places ?? null),
        panTo: (x, y) => this.panTo(x, y),
        minimap: () => this.minimapData(),
        plantFeed: id => this.plantFeed(id),
        alert: msg => this.processUI?.alert(msg),
        drop: (item, count) => this.drop(item, count),
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
      for (const p of engine.layout()) if (p.proto === 'water_wheel') engine.setDemand(p.id, this.current(p.x, p.y, 2));
      // Gas the plant lets into the sky hangs over the vent or stack it came out of.
      for (const e of this.snapshot?.entities ?? []) {
        const was = this.vented.get(e.id) ?? e.emitted_kg;
        if (e.emitted_kg > was) this.smog.emit(e.x + 0.5, e.y + 0.5, e.emitted_kg - was);
        this.vented.set(e.id, e.emitted_kg);
      }
      this.smog.step(dt);
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

    this.updateCavitationSound(delta);
    this.snapshotTimer -= delta;
    if (this.snapshotTimer <= 0 && engine.engineReady() && this.processLayer) {
      this.snapshotTimer = 100;
      const wasBlackout = this.snapshot?.grid.blackout ?? false;
      this.snapshot = engine.snapshot();
      if (this.snapshot) {
        // Switched off, a machine gets nothing, whatever its grid could serve.
        this.served = new Map(this.snapshot.entities.map(e => [e.id, e.network === null || !e.enabled ? 0 : e.served]));
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
    // Drills show where their ore comes out: the one pointed at, all of them while laying what
    // they feed, and the one being placed.
    const feeds = ['transport_belt', 'underground_belt', 'splitter', 'inserter', 'burner_inserter', 'stone_furnace', 'wooden_chest', 'iron_chest'];
    this.worldDraw.drillsFor = feeds.includes(this.placementType ?? '') || this.worldDraw.altMode ? 'all'
      : aimedKind === 'burner_drill' || aimedKind === 'electric_drill' ? engine.entityAt(this.aimTX, this.aimTY) : null;
    const drill = this.placementType === 'burner_drill' || this.placementType === 'electric_drill' ? this.placementType : null;
    if (drill) {
      const o = this.originFor(drill, this.hoverTX, this.hoverTY);
      this.worldDraw.drillGhost = { x: o.x, y: o.y, size: engine.PROTO[drill].size, rot: this.placementRot };
    } else this.worldDraw.drillGhost = null;
    this.worldDraw.piles = this.piles;
    this.processUI?.showPipeSnap(LEVEL_PIPES.includes(this.placementType ?? ''), this.pipeSnap);
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
      nature: [...this.natureRemoved], hp: [...this.processHp], ground: this.piles, pollution: this.smog.save(),
    });
  }

  private quitToMenu() {
    this.save();
    this.ambient?.stop();
    this.cavitationLoop?.destroy(); this.cavitationLoop = null;
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

  /** Carrying ear defenders, the world comes through muffled. */
  private get earMuffle() { return this.eng.inv.count('ear_defenders') > 0 ? 0.3 : 1; }

  /**
   * Cavitating pumps rattle like gravel through the casing: one loop, as loud as the worst of
   * them where the engineer stands.
   */
  private updateCavitationSound(delta: number) {
    let target = 0;
    for (const e of this.snapshot?.entities ?? []) {
      const c = e.pipes.find(p => p.kind.kind === 'Pump')?.kind.cavitation ?? 0;
      if (c < 0.01) continue;
      const n = engine.PROTO[e.proto]?.size ?? 1;
      const d = Math.hypot(e.x + n / 2 - this.player.x, e.y + n / 2 - this.player.y);
      target = Math.max(target, (0.35 + 0.65 * Math.min(1, c * 2)) * Math.max(0, 1 - d / 28) ** 2);
    }
    target *= 0.7 * this.earMuffle * (this.simSpeed > 0 ? 1 : 0);
    this.cavitationVolume += (target - this.cavitationVolume) * Math.min(1, delta / 250);
    if (!this.cavitationLoop && this.cavitationVolume > 0.01 && this.cache.audio.exists('pp_cavitation')) {
      this.cavitationLoop = this.sound.add('pp_cavitation', { loop: true, volume: 0 }) as Phaser.Sound.WebAudioSound;
      this.cavitationLoop.play();
    }
    if (this.cavitationLoop) {
      this.cavitationLoop.setVolume(this.cavitationVolume);
      if (this.cavitationVolume < 0.005 && target === 0) { this.cavitationLoop.destroy(); this.cavitationLoop = null; }
    }
  }

  /** A sound from somewhere in the world: quieter with distance, and not too often. */
  private playAt(name: string, x: number, y: number, volume: number, minGap: number) {
    const now = this.time.now;
    if (now - (this.lastSound.get(name) ?? -1e9) < minGap) return;
    const d = Math.hypot(x - this.player.x, y - this.player.y);
    const v = volume * Math.max(0, 1 - d / 40) * this.earMuffle;
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
    } else if (this.level) {
      this.changeLevel(0);
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
      polluted: (x, y, kg) => this.smog.emit(x, y, kg),
    };
  }

  private arena(): Arena {
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
      smog: this.smog,
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

  /** A building put down on the engineer shoves them to the nearest free ground. */
  private stepOut() {
    const { x, y } = this.player;
    const tx = Math.floor(x), ty = Math.floor(y);
    if (this.walkable(tx, ty)) return;
    let best: { x: number; y: number } | null = null, bd = Infinity;
    for (let r = 1; r <= 8 && !best; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !this.walkable(tx + dx, ty + dy)) continue;
        // Just inside the free tile, on the side nearest where they stood.
        const px = Phaser.Math.Clamp(x, tx + dx + 0.1, tx + dx + 0.9), py = Phaser.Math.Clamp(y, ty + dy + 0.1, ty + dy + 0.9);
        const d = Math.hypot(px - x, py - y);
        if (d < bd) { bd = d; best = { x: px, y: py }; }
      }
    }
    if (best) this.player = best;
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
    // Slide along water, cliffs and buildings instead of stopping dead. Somehow inside one, walk out.
    if (!this.walkable(Math.floor(this.player.x), Math.floor(this.player.y))) { this.player.x = nx; this.player.y = ny; }
    else if (this.walkable(Math.floor(nx), Math.floor(ny))) { this.player.x = nx; this.player.y = ny; }
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
    const ship = this.shipOnTile(tx, ty);
    if (ship) {
      return {
        key: `s${ship.id}`, label: 'Cargo ship', time: this.sandbox ? 0.15 : 1, x: ship.x, y: ship.y, done: () => {
          for (const s of this.factory.remove(ship.id)) this.gain(s.item, s.count);
          if (!this.sandbox) this.gain('cargo_ship', 1);
          if (this.hud?.openMachine === ship.id) this.hud.close();
        },
      };
    }
    const id = this.idAt(tx, ty);
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
    return ore === 'copper_ore' ? [0xc8703a, 0x8a5a3a] : ore === 'coal' ? [0x1c1c20, 0x3a3a40, 0x2a2622] : ore === 'stone' ? [0x8a8680, 0xa8a49c] : [0x6a7a88, 0x8a6a5a, 0x4a4f57];
  }

  /** Holding F picks items off belts within reach of the engineer's feet. */
  private tickPickup(dt: number) {
    this.pickTimer -= dt;
    if (!this.keys.f.isDown || this.pickTimer > 0 || this.hud?.open || document.activeElement instanceof HTMLInputElement) return;
    this.pickTimer = 0.08;
    const pile = this.piles.find(g => Math.hypot(g.x - this.player.x, g.y - this.player.y) < 1.6);
    if (pile) { this.take(pile); return; }
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

  /** Drops a stack at the engineer's feet, scattered a little so piles don't hide each other. */
  private drop(item: string, count: number) {
    const a = Math.random() * Math.PI * 2, r = 0.25 + Math.random() * 0.3;
    const x = this.player.x + Math.cos(a) * r, y = this.player.y + Math.sin(a) * r;
    this.piles.push({ item, count, x, y });
    this.juice.dust(x, y, 0x9a8a70, 3);
    this.playSound('place', 0.15);
  }

  /** Picks a pile up off the ground; what doesn't fit stays there. */
  private take(pile: GroundPile) {
    const room = Math.min(pile.count, this.eng.inv.room(pile.item));
    if (room <= 0) { this.processUI?.alert('Your inventory is full.'); return; }
    this.flyFrom = { x: pile.x, y: pile.y };
    this.gain(pile.item, room);
    this.flyFrom = null;
    pile.count -= room;
    if (pile.count <= 0) this.piles.splice(this.piles.indexOf(pile), 1);
    this.playSound('pickup', 0.3);
  }

  /** The pile under a screen point, if any. */
  /** The ship under a point on screen, if any. */
  private shipAt(sx: number, sy: number) {
    const v = this.viewInfo();
    const iso = screenToIso(sx, sy, v.x, v.y, this.zoom);
    let best: ReturnType<Factory['entities']['get']>, d = 0.9;
    for (const e of this.factory.entities.values()) {
      if (e.kind !== 'cargo_ship') continue;
      // The hull stands up off the water: aim a little above where it floats.
      const k = Math.hypot(e.x - 0.3 - iso.x, e.y - 0.3 - iso.y);
      if (k < d) { d = k; best = e; }
    }
    return best;
  }

  private shipOnTile(tx: number, ty: number) {
    for (const e of this.factory.entities.values()) if (e.kind === 'cargo_ship' && Math.floor(e.x) === tx && Math.floor(e.y) === ty) return e;
    return undefined;
  }

  /** Why a ship can't be put in the water here, or null if it can. */
  private launchError(tx: number, ty: number): string | null {
    if (!navigable(this.map, tx, ty)) return 'Ships go in water: a river, a lake or the sea.';
    if (this.shipOnTile(tx, ty)) return 'There is a ship there already.';
    if (!this.sandbox) {
      if (this.distanceTo(tx + 0.5, ty + 0.5) > this.eng.reach + 1) return 'Too far away. Walk closer.';
      if (!this.eng.inv.count('cargo_ship')) return 'You have no Cargo ship.';
    }
    return null;
  }

  private launch(tx: number, ty: number) {
    const err = this.launchError(tx, ty);
    if (err) { this.processUI?.alert(err); return; }
    const id = Math.min(-1, ...[...this.factory.entities.keys()].map(k => k - 1));
    this.factory.entities.set(id, newShip(id, tx + 0.5, ty + 0.5));
    if (!this.sandbox) this.eng.inv.remove('cargo_ship', 1);
    pop(id, this.time.now);
    this.playSound('place', 0.35);
    for (let k = 0; k < 6; k++) this.juice.dust(tx + Math.random(), ty + Math.random(), 0xd8ecff, 2);
    if (this.sandbox || !this.eng.inv.count('cargo_ship')) this.choose(null);
  }

  private pileAt(sx: number, sy: number): GroundPile | undefined {
    const v = this.viewInfo();
    const iso = screenToIso(sx, sy, v.x, v.y, this.zoom);
    let best: GroundPile | undefined, d = 0.5;
    for (const g of this.piles) {
      const k = Math.hypot(g.x - iso.x, g.y - iso.y);
      if (k < d) { d = k; best = g; }
    }
    return best;
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
    // An axe for trees, a pickaxe for rocks and ore, the wrench for taking buildings apart.
    const felling = target.key.startsWith('n') && /tree|fungus|cactus/.test(this.objects.get(tileKey(Math.floor(target.x), Math.floor(target.y)))?.kind ?? '');
    if (this.engineer) this.engineer.action = target.key.startsWith('b') || !ANIMS.char_mine_se ? 'build' : felling && ANIMS.char_chop_se ? 'chop' : 'mine';
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
    // Changing height, the view rises (or sinks) with a little overshoot.
    const delta = Math.min(100, this.game.loop.delta);
    const lift = rackLift(this.level, this.zoom) * 0.55;
    this.levelVel = (this.levelVel + (lift - this.levelCam) * 0.02 * (delta / 16.67)) * Math.pow(0.82, delta / 16.67);
    this.levelCam += this.levelVel * (delta / 16.67);
  }

  private viewInfo(): View {
    const j = this.juice?.shake ?? { x: 0, y: 0 };
    return { x: this.cam.x + this.pan.x + j.x, y: this.cam.y + this.pan.y + j.y + this.levelCam, zoom: this.zoom, w: this.scale.width, h: this.scale.height };
  }

  /**
   * Up or down a height, with a clunk of the lift: the view rises with it, what's above fades,
   * and the pipe in hand goes to the new height.
   */
  private changeLevel(to: number, quiet = false) {
    to = (to + 3) % 3;
    if (to === this.level) return;
    this.level = to;
    if (this.processLayer) this.processLayer.viewLevel = to;
    this.processUI?.setLevel(to);
    if (!quiet) { this.playSound('lift', 0.45); this.juice.kick(2.5); }
    if (this.placementType && LEVEL_PIPES.includes(this.placementType) && this.placementType !== LEVEL_PIPES[to]) this.choose(LEVEL_PIPES[to]);
  }

  /** What's under the cursor at the working height. */
  private idAt(tx: number, ty: number): number {
    return this.level ? engine.rackAt(tx, ty, this.level) : engine.entityAt(tx, ty);
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
      nests: this.combat.nests.map(n => ({ x: n.x, y: n.y, stirred: this.smog.at(n.x + 1.5, n.y + 1.5) > 0.01 || (n.absorbed ?? 0) > 0.01, anger: (n.absorbed ?? 0) / (this.combat.groupSize() * ALIEN_COST) })),
      aliens: this.combat.aliens,
      smog: this.smog,
    };
  }

  // ── Pointer input ──────────────────────────────────────────────────────────

  private tileAt(sx: number, sy: number) {
    const v = this.viewInfo();
    // Up on a rack, the cursor points at that height.
    const iso = screenToIso(sx, sy + rackLift(this.level, this.zoom), v.x, v.y, this.zoom);
    return { x: Math.floor(iso.x), y: Math.floor(iso.y) };
  }

  private onDown(p: Phaser.Input.Pointer) {
    if (this.menu.open || p.rightButtonDown()) return;
    const tile = this.tileAt(p.x, p.y);
    if (this.placementType === 'transport_belt' || LEVEL_PIPES.includes(this.placementType ?? '')) {
      this.laying = { last: null };
      this.layTo(tile.x, tile.y);
      return;
    }
    if (this.placementType === 'cargo_ship') { this.launch(tile.x, tile.y); return; }
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
    // Clicking a pile in reach takes it.
    const ship = this.level ? undefined : this.shipAt(p.x, p.y);
    if (ship) { this.select(null); this.hud?.showMachine(ship.id); return; }
    const pile = this.level ? undefined : this.pileAt(p.x, p.y);
    if (pile && Math.hypot(pile.x - this.player.x, pile.y - this.player.y) <= this.eng.reach) { this.take(pile); return; }
    const id = this.idAt(this.aimTX, this.aimTY);
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
    // Buildings in the plant, and pipes, open the inspector.
    this.select(this.snapshot?.entities.some(e => e.id === id) || engine.PROTO[engine.placedById(id)?.proto ?? '']?.levels?.length ? id : null);
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
      // Fuel goes in a few at a time, so what's carried stretches round several machines.
      const k = Math.min(n, target.room(item), target === m.fuel ? 5 : Infinity);
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
    if (this.placementType || !this.processLayer || this.level) return;
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
    // Outlines sit at the working height.
    view = { ...view, y: view.y - rackLift(this.level, this.zoom) };
    const { hoverTX: tx, hoverTY: ty } = this;
    if (this.menu.open || tx < 0 || ty < 0 || tx >= this.map.width || ty >= this.map.height) return;
    // Outside placement, outline the whole building being pointed at.
    const aimed = this.placementType ? undefined : engine.placedById(this.idAt(this.aimTX, this.aimTY));
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

  /** Selects a building to place; with none in the pockets, crafts one if possible. */
  private choose(id: string | null) {
    // Picking pipe for a height takes the engineer up to it.
    if (id && LEVEL_PIPES.includes(id) && LEVEL_PIPES.indexOf(id) !== this.level) {
      this.level = LEVEL_PIPES.indexOf(id);
      if (this.processLayer) this.processLayer.viewLevel = this.level;
      this.processUI?.setLevel(this.level);
      this.playSound('lift', 0.45);
    }
    if (id && !this.sandbox && !this.eng.inv.count(id)) {
      if (!this.eng.queue.some(j => RECIPES[j.recipe]?.out === id) && !this.eng.craft(id, 1)) {
        const r = RECIPES[id];
        const needs = r ? Object.entries(r.in).map(([k, n]) => `${n} ${ITEMS[k]?.name ?? k}`).join(', ') : 'nothing craftable';
        this.processUI?.alert(`You have no ${engine.PROTO[id]?.name ?? id}. It takes ${needs}.`);
      }
    }
    this.placementType = id;
  }

  private rotate() {
    if (this.placementType) { this.placementRot = (this.placementRot + 1) % 4; return; }
    this.rotateBuilding(this.idAt(this.aimTX, this.aimTY));
  }

  /** Turns a placed building a quarter turn, with a little bounce; paired belts stay put. */
  private rotateBuilding(id: number) {
    const p = engine.placedById(id);
    if (!p || p.proto === 'splitter' || p.proto === 'underground_belt' || engine.PROTO[p.proto]?.levels?.length) return;
    const f = this.factory.entities.get(id);
    if (f) f.rot = (f.rot + 1) % 4;
    engine.rotate(id);
    pop(id, this.time.now);
    this.playSound('place', 0.2);
  }

  /** Q: pick the kind of building under the cursor to place more. */
  private pipette() {
    const id = this.idAt(this.aimTX, this.aimTY);
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

  /** How hard a river drives a wheel standing on it: its mean current over the full 2.2 m/s. */
  private current(x: number, y: number, size: number) {
    let sum = 0;
    for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) {
      const f = this.map.tiles[y + dy]?.[x + dx]?.flow;
      if (f) sum += Math.hypot(f[0], f[1]);
    }
    return Math.min(1, sum / (size * size) / 2.2);
  }

  /** What resource a building must stand on. */
  private needOf(proto: string): string | null {
    if (proto.endsWith('_drill')) return 'ore';
    return engine.PROTO[proto]?.needs ?? null;
  }

  private tileHas(need: string, x: number, y: number) {
    const t = this.map.tiles[y]?.[x];
    if (!t) return false;
    if (need === 'river') return !!t.flow;
    if (need === 'shore') return !navigable(this.map, x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => navigable(this.map, x + dx, y + dy));
    if (need === 'water') return t.resource === ResourceType.WATER || t.terrain === TerrainType.SHALLOW_WATER || t.terrain === TerrainType.ICE;
    if (need === 'oil') return t.resource === ResourceType.OIL;
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
      const levels = p.levels ?? [];
      const onGround = !levels.length || levels.includes(0);
      if (onGround && engine.entityAt(tx, ty) >= 0) return 'Something is in the way.';
      for (const l of levels) if (l > 0 && engine.rackAt(tx, ty, l) >= 0) return l === 1 ? 'The low rack is taken here.' : 'The high rack is taken here.';
      if (this.combat.nestAt(tx, ty)) return 'An alien nest is in the way.';
      const water = t.terrain === TerrainType.DEEP_WATER || (t.terrain === TerrainType.SHALLOW_WATER && p.needs !== 'water' && p.needs !== 'river');
      if (water || t.terrain === TerrainType.LAVA || t.terrain === TerrainType.MOUNTAINS) return "You can't build there.";
    }
    const need = this.needOf(proto);
    if (need) {
      const on = tiles.filter(([tx, ty]) => this.tileHas(need, tx, ty)).length;
      if (need === 'shore' ? !on : on < Math.ceil(tiles.length / 2)) {
        if (need === 'shore') return `${p.name} must stand on the shore, beside water a ship can reach.`;
        const what = need === 'ore' ? 'an ore deposit' : need === 'water' ? 'water' : need === 'river' ? 'a river' : need === 'oil' ? 'an oil field' : 'a methane deposit';
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
    if (engine.PROTO[proto]?.slope) this.joinSlope(proto, x, y, rot);
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
    this.stepOut();
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
    const piping = LEVEL_PIPES.includes(proto);
    for (const t of steps) {
      const there = this.idAt(t.x, t.y);
      if (there >= 0) {
        // Laying on from the end of a pipe carries its run on; crossing one mid-drag doesn't join it.
        if (piping) this.laying.prev = !this.laying.last && engine.PROTO[engine.placedById(there)?.proto ?? '']?.levels?.length ? { ...t, id: there } : null;
        continue;
      }
      if (this.placementError(proto, t.x, t.y, t.rot)) continue;
      if (!this.build(proto, t.x, t.y, piping ? 0 : t.rot)) continue;
      if (piping) this.joinPipe(t.x, t.y);
    }
    this.laying.last = { x: tx, y: ty };
  }

  /** An inclined pipe just laid joins the pipe at each end: behind it low, ahead of it high. */
  private joinSlope(proto: string, x: number, y: number, rot: number) {
    const [dx, dy] = engine.SLOPE_DIR[rot % 4], [lo, hi] = engine.PROTO[proto].levels;
    for (const [l, sx, sy] of [[lo, -dx, -dy], [hi, dx, dy]]) {
      const nb = l ? engine.rackAt(x + sx, y + sy, l) : engine.entityAt(x + sx, y + sy);
      if (nb >= 0 && engine.PROTO[engine.placedById(nb)?.proto ?? '']?.levels?.includes(l)) {
        engine.setPipeJoins(nb, engine.pipeJoins(nb) | engine.JOIN_BIT[`${-sx},${-sy}`]);
      }
    }
  }

  /**
   * Joins pipe just laid: snapped, to every pipe beside it; otherwise only to the one laid before
   * it in the same drag, so runs can lie side by side apart.
   */
  private joinPipe(x: number, y: number) {
    const id = this.idAt(x, y);
    if (id < 0 || !this.laying) return;
    const bit = (dx: number, dy: number) => engine.JOIN_BIT[`${dx},${dy}`];
    if (this.pipeSnap) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nb = this.idAt(x + dx, y + dy);
        if (nb >= 0 && engine.PROTO[engine.placedById(nb)?.proto ?? '']?.levels?.length) engine.setPipeJoins(nb, engine.pipeJoins(nb) | bit(-dx, -dy));
      }
    } else {
      const p = this.laying.prev;
      const dx = p ? p.x - x : 0, dy = p ? p.y - y : 0;
      if (p && Math.abs(dx) + Math.abs(dy) === 1) {
        engine.setPipeJoins(id, bit(dx, dy));
        engine.setPipeJoins(p.id, engine.pipeJoins(p.id) | bit(-dx, -dy));
      } else engine.setPipeJoins(id, 0);
    }
    this.laying.prev = { x, y, id };
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
    const pile = this.pileAt(this.pointer.x, this.pointer.y);
    if (pile) return `<b>${ITEMS[pile.item]?.name ?? pile.item}</b>${pile.count > 1 ? ` × ${pile.count}` : ''}`;
    if (alien) return `<b>Alien crawler</b> · ${Math.ceil(alien.hp)}/${alien.maxHp} HP<br><small>Hold Space to shoot</small>`;
    const nest = this.combat.nestAt(tx, ty);
    if (nest) return `<b>Alien nest</b> · ${Math.ceil(nest.hp)}/${nest.maxHp} HP<br><small>Sends attackers when pollution reaches it. Hold Space nearby to shoot.</small>`;
    const port = this.portAt(tx, ty);
    if (this.level && this.snapshot) {
      const si = this.processLayer?.segmentAt(tx, ty, this.level);
      return si === undefined ? null : segmentTooltip(this.snapshot.segments[si].vessel, this.processLayer?.flowAt(this.snapshot, tx, ty, this.level));
    }
    const ship = this.shipOnTile(tx, ty);
    if (ship) return `<b>Cargo ship</b>${ship.status ? ` · ${ship.status}` : ''}<br><small>${voyageText(this.factory, ship)}</small>`;
    const id = engine.entityAt(tx, ty);
    const f = id >= 0 ? this.factory.entities.get(id) : undefined;
    const snapE = id >= 0 ? this.snapshot?.entities.find(x => x.id === id) : undefined;
    let main: string | null = null;
    if (f) main = this.factoryTooltip(f);
    else if (snapE) main = entityTooltip(snapE) + (engine.PROTO[snapE.proto]?.power_w && snapE.network === null ? '<br><small class="pp-bad">Not powered: put it inside a power pole\'s area</small>' : '');
    else {
      const si = this.processLayer?.segmentAt(tx, ty);
      if (si !== undefined && this.snapshot) main = segmentTooltip(this.snapshot.segments[si].vessel, this.processLayer?.flowAt(this.snapshot, tx, ty));
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
      if (t?.flow) main = `<b>River</b> · ${Math.hypot(...t.flow).toFixed(1)} m/s<br><small>A water wheel or a water well goes here</small>`;
      else if (t?.terrain === TerrainType.SHALLOW_WATER) main = '<b>Shallows</b><br><small>A water well goes here</small>';
      else if (t?.terrain === TerrainType.DEEP_WATER) main = '<b>Deep water</b>';
      else if (t && t.resource !== ResourceType.NONE) {
        const ore = MINED_ITEM[t.resource];
        const name = RESOURCE_NAMES[t.resource] ?? 'deposit';
        main = ore
          ? `<b>${ITEMS[ore].name}</b> · ${this.factory.oreLeft(this.map, tx, ty)} left<br><small>Mine by hand (hold right-click) or with a drill</small>`
          : t.resource === ResourceType.WATER ? '<b>Groundwater</b><br><small>A water well goes here</small>'
          : t.resource === ResourceType.METHANE ? '<b>Natural gas</b><br><small>A gas well goes here</small>'
          : t.resource === ResourceType.OIL ? '<b>Crude oil</b><br><small>A pumpjack goes here</small>'
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
        const rack = pt.port.level === 2 ? 'high rack' : 'low rack';
        const onRack = !!pt.port.level && this.processLayer?.segmentAt(tx, ty, pt.port.level) !== undefined;
        const piped = onRack || this.processLayer?.segmentAt(tx, ty) !== undefined;
        const how = pt.port.level ? `Lay a pipe on the ${rack} or the ground here to connect` : 'Lay a pipe on this tile to connect';
        return `<b>${p.name} — ${pt.port.label}</b> port (${where} of the vessel${pt.port.level ? `, opens onto the ${rack}` : ''})<br><small>${piped ? `Connected${onRack ? ` on the ${rack}` : ''}` : how}</small>`;
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
    this.worldDraw.shipGhost = this.placementType === 'cargo_ship' && this.hoverTX >= 0 && !this.menu.open
      ? { x: this.hoverTX + 0.5, y: this.hoverTY + 0.5, ok: !this.launchError(this.hoverTX, this.hoverTY) } : null;
    if (this.placementType && this.placementType !== 'cargo_ship' && this.hoverTX >= 0 && !this.menu.open) {
      const o = this.placementType === 'splitter' ? { x: this.hoverTX, y: this.hoverTY } : this.originFor(this.placementType, this.hoverTX, this.hoverTY);
      ghost = { proto: this.placementType, x: o.x, y: o.y, rot: this.placementRot, ok: !this.placementError(this.placementType, o.x, o.y, this.placementRot) };
    }
    const v = this.viewInfo();
    const hoveredId = engine.entityAt(this.aimTX, this.aimTY);
    this.processLayer.draw(this.snapshot, v.x, v.y, this.zoom, ghost, time, {
      all: LEVEL_PIPES.includes(this.placementType ?? '') || ['pipe_riser', 'pipe_incline', 'pipe_incline_high'].includes(this.placementType ?? '') || !!(this.placementType && engine.PROTO[this.placementType]?.ports.length),
      hovered: hoveredId >= 0 ? hoveredId : null,
    }, id => this.factory.entities.get(id)?.active);
  }
}
