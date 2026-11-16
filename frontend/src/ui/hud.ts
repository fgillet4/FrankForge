/**
 * The survival HUD: health, gear and research at a glance, and the windows — inventory and
 * hand crafting (E), a machine's contents (click it), research (T), production graphs (P) and
 * the minimap (M to enlarge).
 */

import './hud.css';
import { el } from './menu';
import { ITEMS, RECIPES, TECH, TECHS, iconUrl, type Recipe } from '../lib/game/items';
import { Inventory } from '../lib/game/inventory';
import { MAX_HEALTH, type Engineer, type Series } from '../lib/game/game';
import { isBurner, type FEntity, type Factory } from '../lib/game/factory';
import { ROUNDS_PER_MAGAZINE } from '../lib/game/combat';
import { PROTO } from '../lib/process/engine';
import { TERRAIN_COLORS, RESOURCE_COLORS } from '../lib/phaser/terrainRenderer';
import { ResourceType, type PlanetMap } from '../lib/types';

const name = (id: string) => ITEMS[id]?.name ?? RECIPES[id]?.out ?? id;

function slot(item: string | null, count?: number, attrs = '', cls = ''): string {
  if (!item) return `<button class="slot ${cls}" ${attrs}></button>`;
  const n = count === undefined || count === 1 && ITEMS[item]?.stack === 1 ? '' : `<i>${count >= 10000 ? `${Math.floor(count / 1000)}k` : count}</i>`;
  return `<button class="slot ${cls}" ${attrs} title="${name(item)}"><img src="${iconUrl(item)}" alt="">${n}</button>`;
}

const GROUPS: [string, (r: Recipe) => boolean][] = [
  ['Intermediates', r => !ITEMS[r.out]?.places && !ITEMS[r.out]?.gear && !['repair_pack'].includes(r.out) || r.out === 'pipe'],
  ['Logistics', r => ['Belts'].includes(PROTO[r.out]?.category ?? '')],
  ['Production', r => ['Production', 'Science'].includes(PROTO[r.out]?.category ?? '')],
  ['Power', r => PROTO[r.out]?.category === 'Power'],
  ['Fluids', r => ['Logistics', 'Extraction', 'Storage', 'Processing', 'Utilities'].includes(PROTO[r.out]?.category ?? '') && r.out !== 'pipe'],
  ['Reactors', r => PROTO[r.out]?.category === 'Reactors'],
  ['Combat', r => !!ITEMS[r.out]?.gear || r.out === 'repair_pack' || PROTO[r.out]?.category === 'Defense'],
];

const CHART_COLOURS = ['#f0a63a', '#4aa3ff', '#6fd36f', '#ff6a8a', '#b48cff', '#5fe3ff', '#ffd54a', '#ff8f4a', '#9ad0a0', '#d0d0d0'];

export interface HudHost {
  map: PlanetMap;
  /** Picks a building out of the pockets to place. */
  pick(item: string): void;
  /** Panning the view to a tile from the minimap. */
  panTo(x: number, y: number): void;
  /** What the minimap shows. */
  minimap(): {
    player: { x: number; y: number };
    view: { x: number; y: number }[];
    buildings: { x: number; y: number; size: number; kind: string }[];
    nests: { x: number; y: number }[];
    aliens: { x: number; y: number }[];
  };
  /** Feed composition of a chemical plant, for its panel. */
  plantFeed(id: number): string;
  alert(msg: string): void;
  onResearch(): void;
}

export class Hud {
  private root = el('div', 'hud');
  private status = el('div', 'hud-status');
  private win: HTMLElement | null = null;
  private winKind: 'inventory' | 'machine' | 'tech' | 'stats' | null = null;
  private machineId: number | null = null;
  private craftTab = 'Intermediates';
  private statsTab: 'produced' | 'consumed' | 'power' = 'produced';
  private statsRange = 60;
  private mini = el('div', 'hud-minimap');
  private miniCanvas = el('canvas');
  private terrainImage: ImageData | null = null;
  private lastStatus = '';
  private lastWin = '';

  constructor(private eng: Engineer, private factory: Factory, private host: HudHost) {
    this.mini.append(this.miniCanvas, el('small', undefined, 'M: big map'));
    this.root.append(this.status, this.mini);
    document.body.append(this.root);
    this.root.addEventListener('click', e => this.onClick(e as MouseEvent));
    this.root.addEventListener('contextmenu', e => { e.preventDefault(); this.onClick(e as MouseEvent, true); });
    this.miniCanvas.addEventListener('click', e => {
      const r = this.miniCanvas.getBoundingClientRect();
      this.host.panTo((e.clientX - r.left) / r.width * host.map.width, (e.clientY - r.top) / r.height * host.map.height);
    });
    this.buildTerrainImage();
  }

  get open() { return this.win !== null; }
  get openMachine() { return this.winKind === 'machine' ? this.machineId : null; }

  destroy() { this.root.remove(); }

  // ── Windows ──────────────────────────────────────────────────────────────

  private show(kind: Hud['winKind']) {
    this.win?.remove();
    this.win = el('div', 'hud-win');
    this.winKind = kind;
    this.lastWin = '';
    this.root.append(this.win);
    this.render();
  }

  close() {
    this.win?.remove();
    this.win = null;
    this.winKind = null;
    this.machineId = null;
  }

  toggle(kind: 'inventory' | 'tech' | 'stats') {
    if (this.winKind === kind) this.close(); else this.show(kind);
  }

  showMachine(id: number) {
    this.machineId = id;
    this.show('machine');
  }

  toggleBigMap() {
    this.mini.classList.toggle('big');
  }

  // ── Rendering (called a few times a second) ──────────────────────────────

  update() {
    this.renderStatus();
    this.render();
    this.drawMinimap();
  }

  private renderStatus() {
    const e = this.eng;
    const hp = Math.max(0, e.health) / MAX_HEALTH;
    const tech = e.research.current ? TECH[e.research.current] : null;
    const queue = e.queue.slice(0, 8).map((j, i) => {
      const r = RECIPES[j.recipe];
      return slot(r.out, r.count, `data-action="cancel" data-i="${i}" title="${name(r.out)} — click to cancel"`)
        .replace('</button>', i === 0 ? `<span class="prog" style="width:${Math.round(j.progress * 100)}%"></span></button>` : '</button>');
    }).join('');
    const ammo = e.ammo ? e.ammo.count : 0;
    const html = `
      <div class="hud-bar"><span style="width:${hp * 100}%;background:${hp > 0.4 ? '' : 'var(--h-bad)'}"></span><em>Health ${Math.ceil(Math.max(0, e.health))} / ${MAX_HEALTH}</em></div>
      <div class="hud-gear">
        ${e.weapon ? slot(e.weapon, 1, 'data-action="unequip" data-slot="weapon" title="Weapon (Space to fire)"') : '<button class="slot gear-empty">gun</button>'}
        ${e.ammo ? slot(e.ammo.item, ammo, 'data-action="unequip" data-slot="ammo"') : '<button class="slot gear-empty">ammo</button>'}
        ${e.armor ? slot(e.armor, 1, 'data-action="unequip" data-slot="armor"') : '<button class="slot gear-empty">armor</button>'}
        <small>${e.weapon ? `${e.rounds}/${ROUNDS_PER_MAGAZINE} in mag` : 'No weapon'}</small>
      </div>
      ${tech ? `<div class="hud-bar res" data-action="tech"><span style="width:${(e.research.units / tech.units) * 100}%"></span><em>${tech.name} ${e.research.units}/${tech.units}</em></div>`
        : e.sandbox ? '' : '<div class="hud-note">No research — press T</div>'}
      ${queue ? `<div class="hud-queue">${queue}</div>` : ''}`;
    if (html !== this.lastStatus) {
      this.status.innerHTML = html;
      this.lastStatus = html;
    }
  }

  private render() {
    if (!this.win) return;
    let html = '';
    if (this.winKind === 'inventory') html = this.inventoryHtml();
    if (this.winKind === 'machine') html = this.machineHtml();
    if (this.winKind === 'tech') html = this.techHtml();
    if (this.winKind === 'stats') { this.renderStats(); return; }
    if (html !== this.lastWin) {
      this.win.innerHTML = html;
      this.lastWin = html;
    }
  }

  private pocketsHtml(action: string) {
    return `<div class="hud-grid">${this.eng.inv.slots.map((s, i) =>
      slot(s?.item ?? null, s?.count, s ? `data-action="${action}" data-i="${i}"` : '')).join('')}</div>`;
  }

  private inventoryHtml() {
    const e = this.eng;
    const unlocked = e.unlocked;
    const recipes = Object.values(RECIPES).filter(r => r.station === 'hand' && unlocked.has(r.id));
    const group = GROUPS.find(g => g[0] === this.craftTab)!;
    const shown = recipes.filter(group[1]);
    const crafts = shown.map(r => {
      const n = e.sandbox ? 99 : e.craftable(r.id);
      const needs = Object.entries(r.in).map(([id, k]) => `${k} × ${name(id)} (${e.inv.count(id)})`).join('\n');
      return slot(r.out, n || undefined, `data-action="craft" data-r="${r.id}" title="${name(r.out)}${r.count > 1 ? ` ×${r.count}` : ''} — ${r.time}s\n${needs}\nClick: 1 · Right-click: 5 · Shift: all"`, n ? '' : 'off');
    }).join('');
    return `<header><h2>Inventory</h2><small>Click a building to place it, gear to wear it</small><button class="hud-btn" data-action="sort">Sort</button><button class="x" data-action="close">✕</button></header>
      <div class="hud-cols">
        <div>${this.pocketsHtml('use')}</div>
        <div>
          <h3 style="margin-top:0">Crafting</h3>
          <div class="hud-tabs">${GROUPS.filter(g => recipes.some(g[1])).map(g => `<button data-action="tab" data-t="${g[0]}" class="${g[0] === this.craftTab ? 'on' : ''}">${g[0]}</button>`).join('')}</div>
          <div class="hud-recipes">${crafts || '<span class="hud-note">Nothing here yet.</span>'}</div>
          <p class="hud-note">Smelting needs a furnace. Missing parts are crafted first.</p>
        </div>
      </div>`;
  }

  private machineHtml() {
    const m = this.machineId !== null ? this.factory.entities.get(this.machineId) : undefined;
    if (!m) { queueMicrotask(() => this.close()); return ''; }
    const title = PROTO[m.kind]?.name ?? m.kind;
    const parts: string[] = [];
    const invRow = (label: string, inv: FEntity['inv'], which: string) => inv
      ? `<h3>${label}</h3><div class="hud-row">${inv.slots.map((s, i) => slot(s?.item ?? null, s?.count, s ? `data-action="take" data-w="${which}" data-i="${i}"` : '')).join('')}</div>` : '';
    if (isBurner(m.kind)) parts.push(invRow('Fuel', m.fuel, 'fuel'));
    if (m.kind === 'assembler' || m.kind === 'chemical_plant') {
      const unlocked = this.eng.unlocked;
      const options = Object.values(RECIPES).filter(r => (m.kind === 'chemical_plant' ? r.station === 'chem' : r.station === 'hand') && unlocked.has(r.id));
      parts.push(`<h3>Recipe</h3><div class="hud-recipes">${options.map(r =>
        slot(r.out, r.count > 1 ? r.count : undefined, `data-action="recipe" data-r="${r.id}" title="${name(r.out)}"`, m.recipe === r.id ? 'on' : '')).join('')}</div>`);
      const r = m.recipe ? RECIPES[m.recipe] : null;
      if (r) {
        const needs = Object.entries(r.in).map(([id, n]) => `${n}× ${name(id)}`).join(', ');
        const fluids = Object.entries(r.fluids ?? {}).map(([sp, n]) => `${n} mol ${sp.toUpperCase()}`).join(', ');
        parts.push(`<p class="hud-note">${[needs, fluids].filter(Boolean).join(' + ')} → ${r.count}× ${name(r.out)} in ${+(r.time / (m.kind === 'assembler' ? 0.75 : 1)).toFixed(2)} s</p>`);
      }
      if (m.kind === 'chemical_plant') parts.push(`<p class="hud-note">Feed vessel: ${this.host.plantFeed(m.id)}</p>`);
    }
    if (m.input) parts.push(invRow('Input', m.input, 'input'));
    if (m.output) parts.push(invRow('Output', m.output, 'output'));
    if (m.progress !== undefined && m.kind !== 'lab') parts.push(`<div class="hud-bar"><span style="width:${Math.min(1, m.progress) * 100}%;background:var(--h-accent)"></span><em>${m.status ?? 'Working'}</em></div>`);
    if (m.inv) parts.push(invRow(m.kind.endsWith('_chest') ? 'Contents' : m.kind === 'lab' ? 'Science packs' : 'Magazines', m.inv, 'inv'));
    if (m.kind === 'lab') parts.push(`<p class="hud-note">${m.status ?? 'Researching'}</p>`);
    if (m.kind.endsWith('_drill')) {
      const ore = this.factory.oreTiles(m, { map: this.host.map }).length;
      parts.push(`<p class="hud-note">${m.status ?? 'Mining'} · ${ore} ore tiles under it</p>`);
    }
    if (m.kind === 'gun_turret') parts.push(`<p class="hud-note">${m.status ?? (m.firing ? 'Firing' : 'Watching')} · ${m.rounds ?? 0} rounds loaded</p>`);
    if (m.kind === 'laser_turret') parts.push(`<p class="hud-note">${m.status ?? (m.firing ? 'Firing' : 'Watching')}</p>`);
    return `<header><img src="${iconUrl(m.kind)}" width="32" height="32" alt=""><h2>${title}</h2><small>${Math.ceil(m.hp)}/${m.maxHp} HP</small><button class="x" data-action="close">✕</button></header>
      <div class="hud-cols"><div class="hud-machine">${parts.join('')}</div>
      <div><h3 style="margin-top:0">Your inventory <small>— click to put in</small></h3>${this.pocketsHtml('put')}</div></div>`;
  }

  private techHtml() {
    const e = this.eng;
    const card = (id: string) => {
      const t = TECH[id];
      const done = e.research.done.has(id);
      const avail = e.available(id);
      const cur = e.research.current === id;
      const cls = done ? 'done' : cur ? 'current avail' : avail ? 'avail' : 'locked';
      const prog = cur ? ` · ${e.research.units}/${t.units}` : '';
      return `<button class="tech ${cls}" ${avail ? `data-action="research" data-t="${id}"` : ''}>
        <b>${t.name}${done ? ' ✓' : ''}</b><p>${t.description}</p>
        <div class="packs">${t.packs.map(p => `<img src="${iconUrl(p)}" alt="">`).join('')} × ${t.units}${prog}</div>
        ${t.unlocks.length ? `<div class="unl">${t.unlocks.map(u => `<img src="${iconUrl(RECIPES[u]?.out ?? u)}" title="${name(RECIPES[u]?.out ?? u)}" alt="">`).join('')}</div>` : ''}
        ${!avail && !done ? `<p>Needs ${t.prereqs.filter(p => !e.research.done.has(p)).map(p => TECH[p].name).join(', ')}</p>` : ''}
      </button>`;
    };
    const order = [...TECHS].sort((a, b) => {
      const rank = (id: string) => e.research.done.has(id) ? 2 : e.available(id) ? 0 : 1;
      return rank(a.id) - rank(b.id);
    });
    return `<header><h2>Research</h2><small>Labs use science packs to research the selected technology</small><button class="x" data-action="close">✕</button></header>
      <div class="hud-techs">${order.map(t => card(t.id)).join('')}</div>`;
  }

  private renderStats() {
    if (!this.win) return;
    if (!this.win.querySelector('canvas')) {
      this.win.innerHTML = `<header><h2>Production</h2><button class="x" data-action="close">✕</button></header>
        <div class="hud-tabs" data-role="tabs"></div>
        <div class="hud-chart"><canvas width="1120" height="560"></canvas><div class="hud-legend"></div></div>`;
    }
    const tabs = this.win.querySelector<HTMLElement>('[data-role=tabs]')!;
    tabs.innerHTML = (['produced', 'consumed', 'power'] as const).map(t => `<button data-action="stats" data-t="${t}" class="${this.statsTab === t ? 'on' : ''}">${t === 'power' ? 'Power' : t[0].toUpperCase() + t.slice(1)}</button>`).join('')
      + [60, 600].map(r => `<button data-action="range" data-r="${r}" class="${this.statsRange === r ? 'on' : ''}">${r === 60 ? '1 min' : '10 min'}</button>`).join('');
    const canvas = this.win.querySelector('canvas')!;
    const legend = this.win.querySelector<HTMLElement>('.hud-legend')!;
    const st = this.eng.stats;
    let lines: { label: string; icon?: string; data: number[]; unit: string }[];
    if (this.statsTab === 'power') {
      lines = [
        { label: 'Generation', data: st.generation.last(this.statsRange), unit: 'W' },
        { label: 'Load', data: st.load.last(this.statsRange), unit: 'W' },
      ];
    } else {
      const m = this.statsTab === 'produced' ? st.produced : st.consumed;
      lines = [...m].map(([id, s]: [string, Series]) => ({ label: name(id), icon: iconUrl(id), data: s.last(this.statsRange).map(v => v * 60), unit: '/min' }))
        .filter(l => l.data.some(v => v > 0))
        .sort((a, b) => b.data.reduce((x, y) => x + y) - a.data.reduce((x, y) => x + y))
        .slice(0, 10);
    }
    drawChart(canvas, lines);
    const fmtV = (v: number, unit: string) => unit === 'W'
      ? (v >= 1e6 ? `${(v / 1e6).toFixed(2)} MW` : `${(v / 1e3).toFixed(0)} kW`)
      : `${v.toFixed(v < 10 ? 1 : 0)}${unit}`;
    legend.innerHTML = lines.length ? lines.map((l, i) => {
      const recent = l.data.slice(-10);
      const avg = recent.reduce((a, b) => a + b, 0) / Math.max(1, recent.length);
      return `<div><i style="background:${CHART_COLOURS[i % CHART_COLOURS.length]}"></i>${l.icon ? `<img src="${l.icon}" alt="">` : ''}${l.label}<b>${fmtV(avg, l.unit)}</b></div>`;
    }).join('') : '<span class="hud-note">Nothing yet.</span>';
  }

  // ── Clicks ───────────────────────────────────────────────────────────────

  private onClick(ev: MouseEvent, right = false) {
    const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!t) return;
    const e = this.eng;
    const a = t.dataset.action;
    const i = Number(t.dataset.i);
    if (a === 'close') this.close();
    else if (a === 'tech') this.toggle('tech');
    else if (a === 'tab') this.craftTab = t.dataset.t!;
    else if (a === 'sort') e.inv.sort();
    else if (a === 'cancel') e.cancel(i);
    else if (a === 'unequip') e.unequip(t.dataset.slot as 'armor' | 'weapon' | 'ammo');
    else if (a === 'stats') this.statsTab = t.dataset.t as Hud['statsTab'];
    else if (a === 'range') this.statsRange = Number(t.dataset.r);
    else if (a === 'research') { e.research.current = t.dataset.t!; e.research.units = 0; this.host.onResearch(); }
    else if (a === 'craft') {
      const id = t.dataset.r!;
      if (e.sandbox) { e.inv.add(RECIPES[id].out, RECIPES[id].count * (right ? 5 : 1)); }
      else {
        const n = ev.shiftKey ? e.craftable(id) : right ? Math.min(5, e.craftable(id)) : 1;
        if (!n || !e.craft(id, n)) this.host.alert(`Not enough materials for ${name(RECIPES[id].out)}.`);
      }
    } else if (a === 'use') {
      const s = e.inv.slots[i];
      if (!s) return;
      if (ITEMS[s.item]?.gear) e.equip(s.item);
      else if (ITEMS[s.item]?.places) { this.host.pick(s.item); this.close(); }
    } else if (a === 'put') this.putIntoMachine(i);
    else if (a === 'take') this.takeFromMachine(t.dataset.w as 'inv' | 'fuel' | 'input' | 'output', i);
    else if (a === 'recipe') this.setRecipe(t.dataset.r!);
    this.lastWin = '';
    this.lastStatus = '';
    this.render();
    this.renderStatus();
  }

  private putIntoMachine(i: number) {
    const m = this.machineId !== null ? this.factory.entities.get(this.machineId) : undefined;
    const s = this.eng.inv.slots[i];
    if (!m || !s) return;
    const unlocked = this.eng.unlocked;
    const target = this.factory.slotFor(m, s.item, item => Object.values(RECIPES).some(r => r.station === 'smelt' && item in r.in && unlocked.has(r.id)));
    if (!target) { this.host.alert(`${name(s.item)} doesn't go in there.`); return; }
    const n = Math.min(s.count, target.room(s.item));
    if (n <= 0) { this.host.alert('No room for that.'); return; }
    const left = target.add(s.item, n);
    this.eng.inv.remove(s.item, n - left);
  }

  private takeFromMachine(which: 'inv' | 'fuel' | 'input' | 'output', i: number) {
    const m = this.machineId !== null ? this.factory.entities.get(this.machineId) : undefined;
    const inv = m?.[which];
    const s = inv?.slots[i];
    if (!inv || !s) return;
    const left = this.eng.inv.add(s.item, s.count);
    inv.remove(s.item, s.count - left);
  }

  private setRecipe(id: string) {
    const m = this.machineId !== null ? this.factory.entities.get(this.machineId) : undefined;
    if (!m || m.recipe === id) return;
    // Changing recipe hands back what was loaded for the old one.
    if (m.input) {
      for (const s of m.input.slots) if (s) this.eng.inv.add(s.item, s.count);
      m.input = new Inventory(m.input.slots.length);
    }
    m.recipe = id;
    m.progress = 0;
  }

  // ── Minimap ──────────────────────────────────────────────────────────────

  private buildTerrainImage() {
    const map = this.host.map;
    this.miniCanvas.width = map.width;
    this.miniCanvas.height = map.height;
    const img = new ImageData(map.width, map.height);
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const t = map.tiles[y][x];
        let c = TERRAIN_COLORS[t.terrain] ?? 0x333333;
        if (t.resource !== ResourceType.NONE) {
          const r = RESOURCE_COLORS[t.resource] ?? c;
          const mix = (s: number) => Math.round(((c >> s) & 255) * 0.4 + ((r >> s) & 255) * 0.6) << s;
          c = mix(16) | mix(8) | mix(0);
        }
        const k = (y * map.width + x) * 4;
        img.data[k] = (c >> 16) & 255; img.data[k + 1] = (c >> 8) & 255; img.data[k + 2] = c & 255; img.data[k + 3] = 255;
      }
    }
    this.terrainImage = img;
  }

  private drawMinimap() {
    const ctx = this.miniCanvas.getContext('2d');
    if (!ctx || !this.terrainImage) return;
    ctx.putImageData(this.terrainImage, 0, 0);
    const d = this.host.minimap();
    for (const b of d.buildings) {
      ctx.fillStyle = b.kind === 'pipe' ? '#8fa0b4' : b.kind.includes('belt') || b.kind === 'splitter' ? '#d8b04a' : '#f0f0f0';
      ctx.fillRect(b.x, b.y, b.size, b.size);
    }
    ctx.fillStyle = '#ff3b30';
    for (const n of d.nests) ctx.fillRect(n.x, n.y, 3, 3);
    for (const a of d.aliens) ctx.fillRect(a.x - 0.5, a.y - 0.5, 1.5, 1.5);
    // The view, as the diamond-ish quad of screen corners in tile space.
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = Math.max(0.5, this.host.map.width / 300);
    ctx.beginPath();
    d.view.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#4af0ff';
    ctx.beginPath();
    ctx.arc(d.player.x, d.player.y, Math.max(1.5, this.host.map.width / 80), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A plain line chart: each series scaled to the shared maximum. */
function drawChart(canvas: HTMLCanvasElement, lines: { data: number[]; unit: string }[]) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height, pad = 50;
  ctx.clearRect(0, 0, W, H);
  const max = Math.max(1e-9, ...lines.flatMap(l => l.data));
  ctx.strokeStyle = '#2a323d';
  ctx.fillStyle = '#8f9bab';
  ctx.font = '20px Chakra Petch, sans-serif';
  ctx.lineWidth = 1;
  for (let k = 0; k <= 4; k++) {
    const y = pad / 2 + (H - pad) * (1 - k / 4);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 10, y); ctx.stroke();
    const v = max * k / 4;
    const unit = lines[0]?.unit;
    ctx.fillText(unit === 'W' ? (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}k`) : v.toFixed(v < 10 ? 1 : 0), 4, y + 6);
  }
  lines.forEach((l, i) => {
    ctx.strokeStyle = CHART_COLOURS[i % CHART_COLOURS.length];
    ctx.lineWidth = 3;
    ctx.beginPath();
    l.data.forEach((v, k) => {
      const x = pad + (W - pad - 10) * (k / Math.max(1, l.data.length - 1));
      const y = pad / 2 + (H - pad) * (1 - v / max);
      if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.stroke();
  });
}
