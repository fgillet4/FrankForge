/**
 * MenuScene — loads the game's assets and shows the main menu over a small animated plant.
 *
 * The menu itself is DOM (src/ui/menu.ts); this scene draws the diorama behind it in texture
 * space (128 px per tile) and lets its camera do the scaling.
 */

import Phaser from 'phaser';
import { PlanetType, ResourceType } from '../lib/types';
import type { PlanetMap } from '../lib/types';
import { TERRAIN_COLORS, RESOURCE_COLORS } from '../lib/phaser/terrainRenderer';
import { ANIMS, createAnims, preloadProcessAssets } from '../lib/process/render';
import { DEFAULT_WORLD, generateWorld, loadSave, loadSettings, type SaveGame, type WorldSettings } from '../lib/save';
import { el, HOW_TO_PLAY, panel, settingsBody } from '../ui/menu';

const PLANETS: { type: PlanetType; label: string; colour: string; blurb: string }[] = [
  { type: PlanetType.EARTH_LIKE, label: 'Earth-like', colour: '#3fbf6a', blurb: 'Temperate and wet. Water and gas are easy to find.' },
  { type: PlanetType.MARS_LIKE, label: 'Mars-like', colour: '#c4502e', blurb: 'Cold, thin air and red dust.' },
  { type: PlanetType.DESERT, label: 'Desert', colour: '#e3923a', blurb: 'Hot and dry. Water is scarce.' },
  { type: PlanetType.ICE, label: 'Ice', colour: '#6fb6ec', blurb: 'Frozen seas; wells can draw from the ice.' },
  { type: PlanetType.VOLCANIC, label: 'Volcanic', colour: '#e8452a', blurb: 'Lava fields and broken ground.' },
  { type: PlanetType.ALIEN, label: 'Alien', colour: '#a160d6', blurb: 'Crystal forests and strange terrain.' },
  { type: PlanetType.OCEAN, label: 'Ocean', colour: '#2f86c4', blurb: 'Islands scattered across a world sea.' },
];

const SIZES = [{ label: 'Small', dim: 80 }, { label: 'Medium', dim: 120 }, { label: 'Large', dim: 160 }];

/** The diorama: a little power plant on a patch of ground. Footprints in tiles. */
const PATCH = 16;
const DIORAMA: { name: string; x: number; y: number; n: number; still?: boolean }[] = [
  { name: 'gas_well', x: 1, y: 4, n: 2 },
  { name: 'flare_stack', x: 2, y: 1, n: 1 },
  { name: 'fired_boiler', x: 4, y: 3, n: 3 },
  { name: 'steam_turbine', x: 8, y: 3, n: 3 },
  { name: 'condenser', x: 8, y: 7, n: 3 },
  { name: 'gas_sphere', x: 11, y: 0, n: 3, still: true },
  { name: 'power_pole', x: 7, y: 1, n: 1 },
  { name: 'power_pole', x: 12, y: 5, n: 1 },
  { name: 'cracker_furnace', x: 12, y: 7, n: 3 },
  { name: 'storage_tank', x: 2, y: 8, n: 3 },
  { name: 'pump', x: 5, y: 9, n: 1 },
  { name: 'solar_array', x: 4, y: 12, n: 2 },
  { name: 'solar_array', x: 6, y: 12, n: 2 },
  { name: 'battery_bank', x: 9, y: 12, n: 2 },
  { name: 'vent', x: 13, y: 11, n: 1 },
];

function timeAgo(ms: number): string {
  const s = (Date.now() - ms) / 1000;
  if (s < 90) return 'just now';
  if (s < 5400) return `${Math.round(s / 60)} min ago`;
  if (s < 129600) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
}

export class MenuScene extends Phaser.Scene {
  private root: HTMLElement | null = null;
  private side!: HTMLElement;
  private open: { name: string; el: HTMLElement } | null = null;
  private loaded = false;
  private save: SaveGame | null = null;
  private world: WorldSettings = { ...DEFAULT_WORLD };
  private walker: { sprite: Phaser.GameObjects.Sprite; t: number } | null = null;
  private regenTimer: ReturnType<typeof setTimeout> | null = null;
  private startNew: (() => void) | null = null;

  constructor() { super({ key: 'MenuScene' }); }

  init() {
    this.loaded = this.textures.exists('terrain');
    this.save = loadSave();
    this.world = { ...DEFAULT_WORLD, seed: Math.floor(Math.random() * 999999) + 1 };
    this.buildMenu();
  }

  preload() {
    if (this.loaded) return;
    preloadProcessAssets(this);
    this.load.atlas('terrain', 'assets/process/terrain.png', 'assets/process/terrain.json');
    this.load.atlas('deposits', 'assets/process/deposits.png', 'assets/process/deposits.json');
    for (const name of ['rupture', 'alarm', 'ambient', 'place', 'remove', 'gunshot', 'laser', 'alien_hit', 'alien_die', 'chop', 'rock', 'pickup', 'research', 'hurt', 'cavitation', 'lift']) {
      this.load.audio(`pp_${name}`, `assets/process/audio/${name}.mp3`);
    }
    const bar = this.root?.querySelector<HTMLElement>('.mm-load span');
    const label = this.root?.querySelector<HTMLElement>('.mm-foot em');
    this.load.on('progress', (f: number) => {
      if (bar) bar.style.width = `${f * 100}%`;
      if (label) label.textContent = `Loading ${Math.round(f * 100)}%`;
    });
  }

  create() {
    this.loaded = true;
    this.sound.volume = loadSettings().volume;
    createAnims(this);
    this.root?.querySelector('.mm-load')?.remove();
    const label = this.root?.querySelector<HTMLElement>('.mm-foot em');
    if (label) label.textContent = '';
    this.root?.querySelectorAll<HTMLButtonElement>('[data-needs-assets]').forEach(b => { b.disabled = false; });
    this.buildDiorama();

    this.input.keyboard!.on('keydown-ENTER', () => {
      if (this.open?.name === 'new') this.startNew?.();
      else if (this.save) this.play(this.save);
      else this.toggle('new');
    });
    this.input.keyboard!.on('keydown-ESC', () => this.close());
    this.scale.on('resize', this.layoutCamera, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layoutCamera, this);
      if (this.regenTimer) clearTimeout(this.regenTimer);
      this.root?.remove();
      this.root = null;
      this.open = null;
      this.walker = null;
    });
  }

  update(time: number, delta: number) {
    // A slow drift across the plant.
    const cam = this.cameras.main;
    cam.scrollX = this.baseScroll.x + Math.sin(time / 9000) * 90;
    cam.scrollY = this.baseScroll.y + Math.cos(time / 11000) * 40;

    // The engineer paces along the front of the plant.
    if (this.walker) {
      this.walker.t += delta / 1000;
      const period = 7;
      const phase = (this.walker.t % (2 * period)) / period;   // 0..2
      const out = phase < 1;
      const along = out ? phase : 2 - phase;
      const x = 4 + along * 7;
      const y = 14.2;
      const dir = out ? 'se' : 'ne';
      const key = `pa_char_walk_${dir}`;
      const s = this.walker.sprite;
      if (s.anims.currentAnim?.key !== key && this.anims.exists(key)) {
        s.play(key).setOrigin(ANIMS[`char_walk_${dir}`].ox, ANIMS[`char_walk_${dir}`].oy);
      }
      s.setFlipX(!out).setPosition((x - y) * 64, (x + y) * 32 + 32).setDepth(100);
    }
  }

  // ── Diorama ────────────────────────────────────────────────────────────────

  private baseScroll = { x: 0, y: 0 };

  private buildDiorama() {
    this.cameras.main.setBackgroundColor('#0b0e13').setOrigin(0, 0);
    const c = PATCH / 2;
    for (let iy = 0; iy < PATCH; iy++) {
      for (let ix = 0; ix < PATCH; ix++) {
        // A round patch that fades into the dark at its edge.
        const d = Math.hypot(ix + 0.5 - c, iy + 0.5 - c) / c;
        if (d > 1.05) continue;
        const v = (ix * 73856093 ^ iy * 19349663) >>> 0;
        const kind = d > 0.86 && v % 3 === 0 ? 'sand' : 'grass';
        this.add.image((ix - iy) * 64 - 65, (ix + iy) * 32 - 1, 'terrain', `${kind}_${v % 4}`)
          .setOrigin(0, 0).setAlpha(Phaser.Math.Clamp((1.05 - d) * 4, 0, 1)).setDepth(-100);
      }
    }
    for (const b of DIORAMA) {
      const m = ANIMS[b.name];
      const x = (b.x - b.y) * 64;
      const y = (b.x + b.y + 2 * b.n) * 32 + 5;
      const s = this.add.sprite(x, y, `pb_${b.name}`).setOrigin(0.5, 1).setDepth(b.x + b.y + 2 * b.n);
      if (m && !b.still && this.anims.exists(`pa_${b.name}`)) {
        s.play({ key: `pa_${b.name}`, startFrame: (b.x * 7 + b.y) % m.frames }).setOrigin(m.ox, m.oy);
      }
    }
    if (ANIMS.char_walk_se) this.walker = { sprite: this.add.sprite(0, 0, 'pa_char_walk_se').setScale(0.9), t: 0 };
    this.layoutCamera();
  }

  /** Fits the patch into the space right of the menu. */
  private layoutCamera() {
    const W = this.scale.width;
    const H = this.scale.height;
    const narrow = W < 900;
    const zoom = Math.min((narrow ? 0.95 : 0.58) * W / (PATCH * 128), 0.95 * H / (PATCH * 64 + 300));
    const cam = this.cameras.main.setZoom(zoom);
    // Patch centre (texture space) goes to this point on screen.
    const sx = narrow ? W / 2 : W * 0.64;
    const sy = H * 0.6;
    this.baseScroll = { x: 0 - sx / zoom, y: PATCH * 32 - 60 - sy / zoom };
    cam.setScroll(this.baseScroll.x, this.baseScroll.y);
  }

  // ── Menu ───────────────────────────────────────────────────────────────────

  private buildMenu() {
    this.root = el('div', 'mm');
    this.side = el('div', 'mm-side');
    this.side.innerHTML = `
      <h1 class="mm-logo">FRANK<span>FORGE</span></h1>
      <div class="mm-stripe"></div>
      <p class="mm-tag">Build a chemical plant on an alien world, with real thermodynamics, real pressure and real explosions.</p>`;
    const nav = el('nav', 'mm-nav');
    const item = (label: string, sub: string | null, fn: () => void, opts: { primary?: boolean; needsAssets?: boolean; name?: string } = {}) => {
      const b = el('button', opts.primary ? 'primary' : undefined, label + (sub ? `<small>${sub}</small>` : ''));
      b.onclick = fn;
      if (opts.name) b.dataset.panel = opts.name;
      if (opts.needsAssets) { b.dataset.needsAssets = ''; b.disabled = !this.loaded; }
      nav.append(b);
    };
    if (this.save) {
      const s = this.save;
      const planet = PLANETS.find(p => p.type === s.world.planet)?.label ?? 'Unknown world';
      const count = s.layout.filter(p => p.proto !== 'pipe').length;
      const when = s.savedAt ? ` · saved ${timeAgo(s.savedAt)}` : '';
      const kind = s.mode === 'survival' ? 'Survival' : 'Sandbox';
      item('Continue', `${kind} · ${planet} · seed ${s.world.seed} · ${count} building${count === 1 ? '' : 's'}${when}`, () => this.play(s), { primary: true, needsAssets: true });
    }
    item('New world', null, () => this.toggle('new'), { primary: !this.save, name: 'new' });
    item('How to play', null, () => this.toggle('help'), { name: 'help' });
    item('Settings', null, () => this.toggle('settings'), { name: 'settings' });
    const foot = el('div', 'mm-foot', '<em>Loading…</em><div class="mm-load"><span></span></div>');
    this.side.append(nav, foot);
    this.root.append(this.side);
    document.body.append(this.root);
  }

  private toggle(name: string) {
    if (this.open?.name === name) { this.close(); return; }
    this.close();
    const titles: Record<string, string> = { new: 'New world', help: 'How to play', settings: 'Settings' };
    const p = panel(titles[name], () => this.close());
    if (name === 'new') this.newWorldPanel(p.body);
    if (name === 'help') p.body.innerHTML = HOW_TO_PLAY;
    if (name === 'settings') p.body.append(settingsBody(s => { this.sound.volume = s.volume; }));
    this.root?.append(p.root);
    this.open = { name, el: p.root };
    this.side.querySelectorAll<HTMLElement>('[data-panel]').forEach(b => b.classList.toggle('on', b.dataset.panel === name));
  }

  private close() {
    this.open?.el.remove();
    this.open = null;
    this.startNew = null;
    this.side?.querySelectorAll('[data-panel]').forEach(b => b.classList.remove('on'));
  }

  private newWorldPanel(body: HTMLElement) {
    body.innerHTML = `
      <p>Choose where to land. The same seed and settings always make the same world.</p>
      <h3>Game</h3>
      <div class="mm-row">
        <div><div class="mm-seg mm-mode"><button data-v="survival">Survival</button><button data-v="sandbox">Sandbox</button></div>
          <p class="mm-hint"></p></div>
        <div><div class="mm-seg mm-aliens"><button data-v="on">Aliens</button><button data-v="off">Peaceful</button></div></div>
      </div>
      <h3>Planet</h3><div class="mm-planets"></div>
      <div class="mm-row">
        <div><h3>Size</h3><div class="mm-seg mm-size"></div></div>
        <div><h3>Resources</h3><div class="mm-slider"><input type="range" min="0.1" max="1" step="0.05"><output></output></div></div>
      </div>
      <h3>Seed</h3>
      <div class="mm-seed"><input inputmode="numeric" spellcheck="false"><button title="Random seed">⟳</button></div>
      <h3>Preview</h3>
      <div class="mm-preview"><canvas></canvas><div class="mm-facts"></div></div>
      <div class="mm-go"><button class="mm-big" data-needs-assets>Land here</button><span class="mm-warn"></span></div>`;
    const planets = body.querySelector<HTMLElement>('.mm-planets')!;
    const size = body.querySelector<HTMLElement>('.mm-size')!;
    const rich = body.querySelector<HTMLInputElement>('.mm-slider input')!;
    const richOut = body.querySelector<HTMLOutputElement>('.mm-slider output')!;
    const seed = body.querySelector<HTMLInputElement>('.mm-seed input')!;
    const dice = body.querySelector<HTMLButtonElement>('.mm-seed button')!;
    const canvas = body.querySelector<HTMLCanvasElement>('canvas')!;
    const facts = body.querySelector<HTMLElement>('.mm-facts')!;
    const go = body.querySelector<HTMLButtonElement>('.mm-big')!;
    const warn = body.querySelector<HTMLElement>('.mm-warn')!;

    const w = this.world;
    const opts = { mode: 'survival' as 'survival' | 'sandbox', peaceful: false };
    const mode = body.querySelector<HTMLElement>('.mm-mode')!;
    const aliens = body.querySelector<HTMLElement>('.mm-aliens')!;
    const hint = body.querySelector<HTMLElement>('.mm-hint')!;
    const refreshOpts = () => {
      mode.querySelectorAll<HTMLElement>('button').forEach(b => b.classList.toggle('on', b.dataset.v === opts.mode));
      aliens.querySelectorAll<HTMLElement>('button').forEach(b => b.classList.toggle('on', (b.dataset.v === 'off') === opts.peaceful));
      hint.textContent = opts.mode === 'survival'
        ? 'Gather, smelt, craft and research your way up to the chemical plant.'
        : 'Everything researched, building is free.';
    };
    mode.onclick = e => { const v = (e.target as HTMLElement).dataset.v; if (v) { opts.mode = v as typeof opts.mode; refreshOpts(); } };
    aliens.onclick = e => { const v = (e.target as HTMLElement).dataset.v; if (v) { opts.peaceful = v === 'off'; refreshOpts(); } };
    refreshOpts();
    for (const p of PLANETS) {
      const b = el('button', undefined, `<b><i style="background:${p.colour}"></i>${p.label}</b><span>${p.blurb}</span>`);
      b.dataset.planet = p.type;
      b.onclick = () => { w.planet = p.type; refresh(); };
      planets.append(b);
    }
    for (const s of SIZES) {
      const b = el('button', undefined, s.label);
      b.dataset.dim = String(s.dim);
      b.title = `${s.dim} × ${s.dim} tiles`;
      b.onclick = () => { w.size = s.dim; refresh(); };
      size.append(b);
    }
    rich.value = String(w.richness);
    rich.oninput = () => { w.richness = parseFloat(rich.value); refresh(true); };
    seed.value = String(w.seed);
    seed.oninput = () => {
      const n = parseInt(seed.value.replace(/\D/g, ''), 10);
      if (Number.isFinite(n)) { w.seed = n; refresh(true); }
    };
    dice.onclick = () => { w.seed = Math.floor(Math.random() * 999999) + 1; seed.value = String(w.seed); refresh(); };

    const count = this.save?.layout.filter(p => p.proto !== 'pipe').length ?? 0;
    if (count) warn.textContent = `This replaces your current plant (${count} building${count === 1 ? '' : 's'}).`;
    go.disabled = !this.loaded;
    this.startNew = () => { if (this.loaded) this.play({ world: { ...w }, player: null, layout: [], savedAt: 0, mode: opts.mode, peaceful: opts.peaceful }); };
    go.onclick = this.startNew;

    const refresh = (debounce = false) => {
      planets.querySelectorAll<HTMLElement>('button').forEach(b => b.classList.toggle('on', b.dataset.planet === w.planet));
      size.querySelectorAll<HTMLElement>('button').forEach(b => b.classList.toggle('on', Number(b.dataset.dim) === w.size));
      richOut.textContent = `${Math.round(w.richness * 100)}%`;
      if (this.regenTimer) clearTimeout(this.regenTimer);
      const draw = () => this.drawPreview(generateWorld(w), canvas, facts);
      if (debounce) this.regenTimer = setTimeout(draw, 150); else draw();
    };
    refresh();
  }

  private drawPreview(map: PlanetMap, canvas: HTMLCanvasElement, facts: HTMLElement) {
    canvas.width = map.width;
    canvas.height = map.height;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(map.width, map.height);
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const t = map.tiles[y][x];
        let c = TERRAIN_COLORS[t.terrain] ?? 0x333333;
        if (t.resource !== ResourceType.NONE) {
          // Deposits show as a tint of their colour over the ground.
          const r = RESOURCE_COLORS[t.resource] ?? 0xffffff;
          const mix = (a: number, b: number, s: number) => (((a >> s) & 255) * 0.65 + ((b >> s) & 255) * 0.35) << s;
          c = mix(c, r, 16) | mix(c, r, 8) | mix(c, r, 0);
        }
        const i = (y * map.width + x) * 4;
        img.data[i] = (c >> 16) & 255;
        img.data[i + 1] = (c >> 8) & 255;
        img.data[i + 2] = c & 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const temp = Math.round(map.baseTemperature - 273.15);
    const deposits = new Map<number, number>();
    for (const row of map.tiles) for (const t of row) if (t.resource !== ResourceType.NONE) deposits.set(t.resource, (deposits.get(t.resource) ?? 0) + 1);
    const water = deposits.get(ResourceType.WATER) ?? 0;
    const methane = deposits.get(ResourceType.METHANE) ?? 0;
    facts.innerHTML = `
      <div class="name">${map.name}</div>
      <span>Atmosphere</span><b>${map.atmosphere.replace(/_/g, ' ')}</b>
      <span>Temperature</span><b>${temp >= 0 ? '+' : ''}${temp} °C</b>
      <span>Gravity</span><b>${map.gravity.toFixed(2)} g</b>
      <span>Water deposits</span><b>${water}</b>
      <span>Methane deposits</span><b>${methane}</b>`;
  }

  private play(save: SaveGame) {
    if (!this.loaded) return;
    this.scene.start('WorldScene', save);
  }
}
