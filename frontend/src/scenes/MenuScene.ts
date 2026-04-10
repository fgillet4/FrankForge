/**
 * MenuScene — world seed & preview screen.
 *
 * Left panel : controls (seed, planet type, size, richness)
 * Right panel: live flat 2-D preview that updates as you tweak settings.
 *
 * The generated PlanetMap is stored in the Phaser registry so WorldScene
 * can use it directly without re-generating.
 */

import Phaser from 'phaser';
import { mapGenerator }  from '../lib/mapGenerator';
import { PlanetType, ResourceType } from '../lib/types';
import type { PlanetMap } from '../lib/types';
import { TERRAIN_COLORS, RESOURCE_COLORS } from '../lib/phaser/terrainRenderer';

// ── Planet button config ──────────────────────────────────────────────────────

const PLANET_CONFIG = [
  { type: PlanetType.EARTH_LIKE, label: 'EARTH',    color: 0x27ae60 },
  { type: PlanetType.MARS_LIKE,  label: 'MARS',     color: 0xb03020 },
  { type: PlanetType.DESERT,     label: 'DESERT',   color: 0xe67e22 },
  { type: PlanetType.ICE,        label: 'ICE',      color: 0x3498db },
  { type: PlanetType.VOLCANIC,   label: 'VOLCANIC', color: 0xdd2200 },
  { type: PlanetType.ALIEN,      label: 'ALIEN',    color: 0x8e44ad },
  { type: PlanetType.OCEAN,      label: 'OCEAN',    color: 0x1a6a9a },
] as const;

const SIZE_CONFIG = [
  { key: 'small',  label: 'SMALL',  dim: 80  },
  { key: 'medium', label: 'MEDIUM', dim: 120 },
  { key: 'large',  label: 'LARGE',  dim: 160 },
] as const;

// ── Scene ─────────────────────────────────────────────────────────────────────

export class MenuScene extends Phaser.Scene {

  // DOM
  private seedInput!:      HTMLInputElement;
  private richnessInput!:  HTMLInputElement;

  // State
  private seed       = 42;
  private planetType = PlanetType.EARTH_LIKE;
  private mapSizeKey = 'medium';
  private richness   = 0.7;

  // Generated map
  private currentMap: PlanetMap | null = null;

  // Graphics & text
  private previewGfx!:  Phaser.GameObjects.Graphics;
  private infoText!:    Phaser.GameObjects.Text;
  private richPctText!: Phaser.GameObjects.Text;

  private planetBtns = new Map<PlanetType, Phaser.GameObjects.Text>();
  private sizeBtns   = new Map<string,     Phaser.GameObjects.Text>();

  // Preview area (set in create)
  private pvX = 0; private pvY = 0; private pvS = 0;

  // Debounce timer
  private regenTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() { super({ key: 'MenuScene' }); }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background
    this.add.rectangle(0, 0, W, H, 0x080c14).setOrigin(0, 0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x141e2e, 1);
    for (let x = 0; x < W; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.strokePath(); }
    for (let y = 0; y < H; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath(); }

    // ── Layout constants ────────────────────────────────────────────────────
    const leftW  = Math.min(340, W * 0.36);
    const pad    = 20;
    const cx     = leftW / 2;
    const btnH   = 24;

    // Divider
    const dg = this.add.graphics();
    dg.lineStyle(1, 0x1e3044, 1);
    dg.beginPath(); dg.moveTo(leftW + 10, 16); dg.lineTo(leftW + 10, H - 16); dg.strokePath();

    // ── Title ───────────────────────────────────────────────────────────────
    this.add.text(cx, 24, 'FRANKFORGE', {
      fontSize: '38px', fontFamily: 'monospace',
      color: '#ff9900', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5, 0);

    this.add.text(cx, 72, 'BUILD  ·  REACT  ·  SURVIVE', {
      fontSize: '10px', fontFamily: 'monospace', color: '#445566',
    }).setOrigin(0.5, 0);

    // ── Seed row ────────────────────────────────────────────────────────────
    let curY = 100;
    this.add.text(pad, curY, 'WORLD SEED', {
      fontSize: '10px', fontFamily: 'monospace', color: '#446688',
    });
    curY += 16;

    // DOM seed input
    this.seed = Math.floor(Math.random() * 999999) + 1;
    this.seedInput = document.createElement('input');
    this.seedInput.value = String(this.seed);
    Object.assign(this.seedInput.style, {
      position: 'absolute', left: `${pad}px`, top: `${curY}px`,
      width: `${leftW - pad * 2 - 36}px`, height: '28px',
      fontSize: '15px', fontFamily: 'monospace', textAlign: 'center',
      background: '#0d1a2a', border: '1px solid #2a4a6a',
      color: '#ffffff', borderRadius: '3px', outline: 'none',
    });
    document.body.appendChild(this.seedInput);
    this.seedInput.addEventListener('input', () => this.scheduleRegen());

    // Randomise ⟳
    const randBtn = this.add.text(leftW - pad - 8, curY + 5, '⟳', {
      fontSize: '20px', color: '#446688',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    randBtn.on('pointerover',  () => randBtn.setStyle({ color: '#88bbee' }));
    randBtn.on('pointerout',   () => randBtn.setStyle({ color: '#446688' }));
    randBtn.on('pointerdown',  () => {
      this.seed = Math.floor(Math.random() * 999999) + 1;
      this.seedInput.value = String(this.seed);
      this.generateAndPreview();
    });
    curY += 38;

    // ── Planet type ─────────────────────────────────────────────────────────
    this.add.text(pad, curY, 'PLANET TYPE', {
      fontSize: '10px', fontFamily: 'monospace', color: '#446688',
    });
    curY += 16;

    const perRow = 4;
    const pBtnW  = Math.floor((leftW - pad * 2 - (perRow - 1) * 4) / perRow);
    PLANET_CONFIG.forEach(({ type, label }, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const bx  = pad + col * (pBtnW + 4);
      const by  = curY + row * (btnH + 4);
      const btn = this.add.text(bx + pBtnW / 2, by + btnH / 2, label, {
        fontSize: '10px', fontFamily: 'monospace',
        color: '#778899', backgroundColor: '#0d1a2a',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setFixedSize(pBtnW, btnH);
      btn.on('pointerover',  () => { if (this.planetType !== type) btn.setStyle({ color: '#ffffff' }); });
      btn.on('pointerout',   () => { if (this.planetType !== type) btn.setStyle({ color: '#778899', backgroundColor: '#0d1a2a' }); });
      btn.on('pointerdown',  () => { this.planetType = type; this.refreshPlanetButtons(); this.generateAndPreview(); });
      this.planetBtns.set(type, btn);
    });
    const planetRows = Math.ceil(PLANET_CONFIG.length / perRow);
    curY += planetRows * (btnH + 4) + 8;

    // ── Map size ─────────────────────────────────────────────────────────────
    this.add.text(pad, curY, 'MAP SIZE', {
      fontSize: '10px', fontFamily: 'monospace', color: '#446688',
    });
    curY += 16;

    const sBtnW = Math.floor((leftW - pad * 2 - (SIZE_CONFIG.length - 1) * 6) / SIZE_CONFIG.length);
    SIZE_CONFIG.forEach(({ key, label }, i) => {
      const bx  = pad + i * (sBtnW + 6);
      const btn = this.add.text(bx + sBtnW / 2, curY + btnH / 2, label, {
        fontSize: '10px', fontFamily: 'monospace',
        color: '#778899', backgroundColor: '#0d1a2a',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setFixedSize(sBtnW, btnH);
      btn.on('pointerover',  () => { if (this.mapSizeKey !== key) btn.setStyle({ color: '#ffffff' }); });
      btn.on('pointerout',   () => { if (this.mapSizeKey !== key) btn.setStyle({ color: '#778899', backgroundColor: '#0d1a2a' }); });
      btn.on('pointerdown',  () => { this.mapSizeKey = key; this.refreshSizeButtons(); this.generateAndPreview(); });
      this.sizeBtns.set(key, btn);
    });
    curY += btnH + 12;

    // ── Resource richness ────────────────────────────────────────────────────
    this.add.text(pad, curY, 'RESOURCE RICHNESS', {
      fontSize: '10px', fontFamily: 'monospace', color: '#446688',
    });
    this.richPctText = this.add.text(leftW - pad, curY, `${Math.round(this.richness * 100)}%`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#88aacc',
    }).setOrigin(1, 0);
    curY += 16;

    this.richnessInput = document.createElement('input');
    this.richnessInput.type  = 'range';
    this.richnessInput.min   = '0.1';
    this.richnessInput.max   = '1.0';
    this.richnessInput.step  = '0.05';
    this.richnessInput.value = String(this.richness);
    Object.assign(this.richnessInput.style, {
      position: 'absolute', left: `${pad}px`, top: `${curY}px`,
      width: `${leftW - pad * 2}px`, accentColor: '#ff9900',
    });
    document.body.appendChild(this.richnessInput);
    this.richnessInput.addEventListener('input', () => {
      this.richness = parseFloat(this.richnessInput.value);
      this.richPctText.setText(`${Math.round(this.richness * 100)}%`);
      this.scheduleRegen();
    });
    curY += 32;

    // ── Play button ──────────────────────────────────────────────────────────
    const playY = Math.max(curY + 16, H - 60);
    const playBtn = this.add.text(cx, playY, '▶  PLAY THIS WORLD', {
      fontSize: '17px', fontFamily: 'monospace',
      color: '#ffcc00', backgroundColor: '#0d2030',
      padding: { x: 18, y: 9 },
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    playBtn.on('pointerover',  () => playBtn.setStyle({ color: '#ffffff', backgroundColor: '#1a4060' }));
    playBtn.on('pointerout',   () => playBtn.setStyle({ color: '#ffcc00', backgroundColor: '#0d2030' }));
    playBtn.on('pointerdown',  () => this.startGame());
    this.input.keyboard!.on('keydown-ENTER', () => this.startGame());

    // ── Preview panel ────────────────────────────────────────────────────────
    const pvPad  = 20;
    const pvLeft = leftW + 22 + pvPad;
    const pvTop  = pvPad + 16;
    const pvSize = Math.min(W - pvLeft - pvPad, H - pvTop - 50);

    this.pvX = pvLeft; this.pvY = pvTop; this.pvS = pvSize;

    this.add.text(pvLeft + pvSize / 2, pvTop - 4, 'WORLD PREVIEW', {
      fontSize: '10px', fontFamily: 'monospace', color: '#2a3a4a',
    }).setOrigin(0.5, 1);

    this.previewGfx = this.add.graphics();

    this.infoText = this.add.text(pvLeft, pvTop + pvSize + 8, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#4a6a88', lineSpacing: 3,
    });

    // ── Init ─────────────────────────────────────────────────────────────────
    this.refreshPlanetButtons();
    this.refreshSizeButtons();
    this.generateAndPreview();
  }

  // ── Button refresh ────────────────────────────────────────────────────────

  private refreshPlanetButtons() {
    PLANET_CONFIG.forEach(({ type, color }) => {
      const btn = this.planetBtns.get(type);
      if (!btn) return;
      if (type === this.planetType) {
        btn.setStyle({ color: '#' + color.toString(16).padStart(6, '0'), backgroundColor: '#0d2030' });
      } else {
        btn.setStyle({ color: '#778899', backgroundColor: '#0d1a2a' });
      }
    });
  }

  private refreshSizeButtons() {
    SIZE_CONFIG.forEach(({ key }) => {
      const btn = this.sizeBtns.get(key);
      if (!btn) return;
      btn.setStyle(key === this.mapSizeKey
        ? { color: '#ffcc00', backgroundColor: '#0d2030' }
        : { color: '#778899', backgroundColor: '#0d1a2a' });
    });
  }

  // ── Generation & preview ──────────────────────────────────────────────────

  private scheduleRegen() {
    if (this.regenTimer !== null) clearTimeout(this.regenTimer);
    this.regenTimer = setTimeout(() => {
      const raw  = this.seedInput.value.trim();
      this.seed  = parseInt(raw) || Math.floor(Math.random() * 999999) + 1;
      this.generateAndPreview();
    }, 400);
  }

  private generateAndPreview() {
    const dim = SIZE_CONFIG.find(s => s.key === this.mapSizeKey)?.dim ?? 120;
    this.currentMap = mapGenerator.generateMap({
      planetType:          this.planetType,
      width:               dim,
      height:              dim,
      seed:                this.seed,
      resourceRichness:    this.richness,
      specialFeatureCount: 15,
      smoothness:          0.55,
      alienness:           this.planetType === PlanetType.ALIEN ? 0.8 : 0.3,
    });
    this.drawPreview();
    this.updateInfo();
  }

  private drawPreview() {
    this.previewGfx.clear();
    if (!this.currentMap) return;
    const map = this.currentMap;
    const ts   = this.pvS / map.width;
    const tw   = Math.max(1, Math.ceil(ts));

    // Background
    this.previewGfx.fillStyle(0x050810, 1);
    this.previewGfx.fillRect(this.pvX, this.pvY, this.pvS, this.pvS);

    // Group tiles by terrain type to minimise fillStyle changes
    const byTerrain  = new Map<number, { x: number; y: number }[]>();
    const byResource = new Map<number, { x: number; y: number }[]>();

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x];
        if (!byTerrain.has(tile.terrain))  byTerrain.set(tile.terrain, []);
        byTerrain.get(tile.terrain)!.push({ x, y });
        if (tile.resource !== ResourceType.NONE) {
          if (!byResource.has(tile.resource)) byResource.set(tile.resource, []);
          byResource.get(tile.resource)!.push({ x, y });
        }
      }
    }

    for (const [terrain, tiles] of byTerrain) {
      this.previewGfx.fillStyle(TERRAIN_COLORS[terrain] ?? 0x333333, 1);
      for (const { x, y } of tiles) {
        this.previewGfx.fillRect(this.pvX + x * ts, this.pvY + y * ts, tw, tw);
      }
    }

    // Resource dots
    const dot = Math.max(1, tw * 0.65);
    const off = (tw - dot) / 2;
    for (const [resource, tiles] of byResource) {
      this.previewGfx.fillStyle(RESOURCE_COLORS[resource] ?? 0xffffff, 0.6);
      for (const { x, y } of tiles) {
        this.previewGfx.fillRect(this.pvX + x * ts + off, this.pvY + y * ts + off, dot, dot);
      }
    }

    // Spawn marker (white cross at center)
    const mx = this.pvX + (map.width  / 2) * ts;
    const my = this.pvY + (map.height / 2) * ts;
    const r  = Math.max(5, ts * 2.5);
    this.previewGfx.fillStyle(0xffffff, 1);
    this.previewGfx.fillRect(mx - r / 2, my - 1,   r, 2);
    this.previewGfx.fillRect(mx - 1,   my - r / 2, 2, r);

    // Border
    this.previewGfx.lineStyle(1, 0x1e3044, 1);
    this.previewGfx.strokeRect(this.pvX, this.pvY, this.pvS, this.pvS);
  }

  private updateInfo() {
    if (!this.currentMap) return;
    const m     = this.currentMap;
    const atmos = m.atmosphere.replace(/_/g, ' ').toUpperCase();
    const temp  = Math.round(m.baseTemperature - 273);
    const sign  = temp >= 0 ? '+' : '';
    const feats = m.specialFeatures.length;
    this.infoText.setText(
      `${m.name}   ·   ${atmos}   ·   ${sign}${temp}°C   ·   ${m.gravity.toFixed(2)}g   ·   ${feats} features`,
    );
  }

  // ── Start game ────────────────────────────────────────────────────────────

  private startGame() {
    if (!this.currentMap) return;
    this.game.registry.set('map', this.currentMap);
    this.cleanup();
    this.scene.start('WorldScene');
  }

  private cleanup() {
    if (this.regenTimer !== null) clearTimeout(this.regenTimer);
    if (this.seedInput.parentNode)     document.body.removeChild(this.seedInput);
    if (this.richnessInput.parentNode) document.body.removeChild(this.richnessInput);
  }

  shutdown() { this.cleanup(); }
}
