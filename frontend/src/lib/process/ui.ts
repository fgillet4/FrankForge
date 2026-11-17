/**
 * The HTML overlay for the process plant: the build bar, the inspector for a selected building,
 * the grid panel, hover read-outs and alerts. Plain DOM over the Phaser canvas.
 */

import './process.css';
import { iconUrl } from '../game/items';
import { PumpCurvePanel } from './pumpCurve';
import {
  PROTO, PROTOS, SPECIES, blackStart, setEnabled, setOpening, setReaction, layout,
  type EntityView, type Snapshot, type VesselView,
} from './engine';

const VESSEL_NAMES: Record<string, string[]> = {
  fired_boiler: ['Firebox', 'Steam drum'],
  smr_reformer: ['Catalyst tubes', 'Firebox'],
  cracker_furnace: ['Cracking coils', 'Firebox'],
  heat_exchanger: ['Shell side', 'Tube side'],
  electrolyser: ['Cathode — H₂', 'Anode — O₂'],
};

const CATEGORY_ORDER = ['Logistics', 'Belts', 'Extraction', 'Production', 'Storage', 'Processing', 'Reactors', 'Power', 'Science', 'Defense', 'Utilities'];

/** Reactions a CSTR can run. */
const CSTR_REACTIONS: [string, string][] = [
  ['methanol', 'Methanol synthesis'], ['wgs', 'Water–gas shift'], ['haber', 'Ammonia synthesis'],
  ['smr', 'Steam methane reforming'], ['cracking', 'Ethane cracking'], ['none', 'Nothing (a heated or cooled tank)'],
];

export const fmt = {
  t: (k: number) => `${(k - 273.15).toFixed(k > 1000 ? 0 : 1)} °C`,
  p: (pa: number) => (pa >= 1e6 ? `${(pa / 1e5).toFixed(1)} bar` : pa >= 1e4 ? `${(pa / 1e5).toFixed(2)} bar` : `${(pa / 100).toFixed(1)} mbar`),
  w: (w: number) => {
    const a = Math.abs(w);
    return a >= 1e6 ? `${(w / 1e6).toFixed(2)} MW` : a >= 1e3 ? `${(w / 1e3).toFixed(0)} kW` : `${w.toFixed(0)} W`;
  },
  kg: (kg: number) => (kg >= 1000 ? `${(kg / 1000).toFixed(2)} t` : `${kg.toFixed(kg < 10 ? 2 : 0)} kg`),
  flow: (kgs: number) => `${Math.abs(kgs) < 0.01 ? Math.abs(kgs * 1000).toFixed(1) + ' g/s' : Math.abs(kgs).toFixed(2) + ' kg/s'}`,
  pct: (f: number) => `${(f * 100).toFixed(0)}%`,
};

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

const formula = (id: string) => SPECIES[id]?.formula ?? id;

function compositionBar(z: Record<string, number>, colours: (id: string) => string): string {
  const parts = Object.entries(z).filter(([, f]) => f > 0.002).sort((a, b) => b[1] - a[1]);
  const bar = parts.map(([id, f]) => `<span style="width:${f * 100}%;background:${colours(id)}" title="${formula(id)} ${(f * 100).toFixed(1)}%"></span>`).join('');
  const legend = parts.slice(0, 5).map(([id, f]) =>
    `<span class="pp-chip"><img src="assets/process/icons/${id}.png" alt="">${formula(id)} ${(f * 100).toFixed(f < 0.1 ? 1 : 0)}%</span>`).join('');
  return `<div class="pp-comp">${bar}</div><div class="pp-legend">${legend}</div>`;
}

export function cssColour(id: string): string {
  const c: Record<string, string> = {
    h2: '#5fe3ff', o2: '#8fb8ff', n2: '#b7a8d9', ch4: '#ff9d3c', co: '#6b6b78', co2: '#d8d8d8', h2o: '#2f7fff',
    nh3: '#c6e85a', c2h4: '#ff8fd0', c2h6: '#ffbf8f', ch3oh: '#b48cff',
  };
  return c[id] ?? '#999';
}

function vesselHtml(v: VesselView, name: string): string {
  const phase = v.beta >= 0.9999 ? 'Vapour' : v.beta <= 0.0001 ? 'Liquid' : `Two-phase · ${fmt.pct(v.beta)} vapour (mol)`;
  const load = v.p / v.design_p;
  const reactions = v.reactions.map(r => {
    const state = Math.abs(r.ln_q_over_k) < 0.05 ? 'at equilibrium'
      : r.ln_q_over_k < 0 ? `driving forward (ln Q/K ${r.ln_q_over_k.toFixed(1)})` : `running in reverse (ln Q/K +${r.ln_q_over_k.toFixed(1)})`;
    return `<div class="pp-rx"><b>${r.name}</b><span>${r.rate.toFixed(r.rate < 1 ? 3 : 1)} mol/s · ${state}</span></div>`;
  }).join('');
  return `<div class="pp-vessel${v.ruptured ? ' ruptured' : ''}">
    <div class="pp-vessel-head"><b>${name}</b>${v.ruptured ? '<span class="pp-bad">RUPTURED</span>' : ''}</div>
    <div class="pp-grid">
      <span>Temperature</span><b>${fmt.t(v.t)}</b>
      <span>Pressure</span><b class="${load > 0.9 ? 'pp-bad' : load > 0.7 ? 'pp-warn' : ''}">${fmt.p(v.p)} <small>/ ${fmt.p(v.design_p)} rated</small></b>
      <span>Phase</span><b>${phase}</b>
      <span>Contents</span><b>${fmt.kg(v.mass)}</b>
      ${v.q_net ? `<span>Heat in</span><b>${fmt.w(v.q_net)}</b>` : ''}
    </div>
    ${v.level > 0.001 ? `<div class="pp-level"><span style="width:${Math.min(100, v.level * 100)}%"></span><em>Liquid level ${fmt.pct(v.level)}</em></div>` : ''}
    <div class="pp-meter"><span class="${load > 0.9 ? 'bad' : load > 0.7 ? 'warn' : ''}" style="width:${Math.min(100, load / 1.5 * 100)}%"></span><em>Pressure vs. burst (1.5× rating)</em></div>
    ${compositionBar(v.z, cssColour)}
    ${reactions}
  </div>`;
}

export class ProcessUI {
  private root = el('div', 'pp-root');
  private bar = el('div', 'pp-bar');
  private tabs = el('div', 'pp-tabs');
  private buttons = el('div', 'pp-buttons');
  private inspector = el('div', 'pp-inspector');
  private gridPanel = el('div', 'pp-gridpanel');
  private tooltip = el('div', 'pp-tooltip');
  private alerts = el('div', 'pp-alerts');
  private category = 'Logistics';
  private inspectorFor: number | null = null;
  private lastInspectorHtml = '';
  selectedProto: string | null = null;
  /** Whether a building shows in the bar (researched), and how many the engineer carries (null: free). */
  barState: (id: string) => { visible: boolean; count: number | null } = () => ({ visible: true, count: null });
  private lastBar = '';
  onSelectProto: (id: string | null) => void = () => {};
  onCloseInspector: () => void = () => {};
  /** Whether pumps' speed can be changed (variable-frequency drives researched). */
  vfdUnlocked: () => boolean = () => true;
  private curve = new PumpCurvePanel(() => this.vfdUnlocked());

  constructor() {
    this.bar.append(this.tabs, this.buttons);
    this.root.append(this.bar, this.inspector, this.gridPanel, this.tooltip, this.alerts, this.curve.root);
    document.body.append(this.root);
    // The world's tooltip goes as soon as the pointer moves onto a panel or off the window.
    const hide = () => { this.tooltip.style.display = 'none'; };
    document.addEventListener('pointermove', e => { if (!(e.target instanceof HTMLCanvasElement)) hide(); });
    document.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    this.renderBar();
    this.inspector.addEventListener('input', e => this.onInspectorInput(e));
    this.inspector.addEventListener('click', e => this.onInspectorClick(e));
    this.gridPanel.addEventListener('click', e => {
      if ((e.target as HTMLElement).dataset.action === 'blackstart') blackStart();
    });
  }

  /** Redraws the build bar when what's researched or carried has changed. */
  refreshBar() {
    const key = PROTOS.map(p => { const st = this.barState(p.id); return `${st.visible ? 1 : 0}${st.count}`; }).join() + this.category + this.selectedProto;
    if (key !== this.lastBar) this.renderBar();
  }

  private renderBar() {
    const shown = PROTOS.filter(p => this.barState(p.id).visible);
    const cats = CATEGORY_ORDER.filter(c => shown.some(p => p.category === c));
    // Open on a tab with something in it to build.
    if (!this.lastBar) {
      const owned = cats.find(c => shown.some(p => p.category === c && (this.barState(p.id).count ?? 1) > 0));
      if (owned) this.category = owned;
    }
    if (!cats.includes(this.category) && cats.length) this.category = cats[0];
    this.lastBar = PROTOS.map(p => { const st = this.barState(p.id); return `${st.visible ? 1 : 0}${st.count}`; }).join() + this.category + this.selectedProto;
    this.tabs.innerHTML = cats.map(c => `<button data-cat="${c}" class="${c === this.category ? 'on' : ''}">${c}</button>`).join('');
    this.tabs.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      this.category = (b as HTMLElement).dataset.cat!;
      this.renderBar();
    }));
    const items = shown.filter(p => p.category === this.category);
    this.buttons.innerHTML = items.map(p => {
      const count = this.barState(p.id).count;
      const icon = p.id === 'pipe'
        ? '<span class="pp-pipe-icon"></span>'
        : `<img src="${iconUrl(p.id)}" alt="">`;
      const power = p.power_w ? ` · uses ${fmt.w(p.power_w)}` : p.generator_w ? ` · ${fmt.w(p.generator_w)}` : '';
      const badge = count === null ? '' : `<i class="pp-count${count ? '' : ' none'}">${count}</i>`;
      return `<button data-id="${p.id}" class="${p.id === this.selectedProto ? 'on' : ''}${count === 0 ? ' empty' : ''}" title="${p.name} (${p.size}×${p.size})${power}\n${p.description}">${icon}<span>${p.name}</span>${badge}</button>`;
    }).join('');
    this.buttons.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const id = (b as HTMLElement).dataset.id!;
      this.selectProto(this.selectedProto === id ? null : id);
    }));
  }

  selectProto(id: string | null) {
    this.selectedProto = id;
    if (id) this.category = PROTO[id]?.category ?? this.category;
    this.renderBar();
    this.onSelectProto(id);
  }

  showInspector(id: number | null) {
    this.inspectorFor = id;
    this.lastInspectorHtml = '';
    this.inspector.classList.toggle('open', id !== null);
  }

  private onInspectorInput(e: Event) {
    const t = e.target as HTMLInputElement;
    if (t.dataset.action === 'opening' && this.inspectorFor !== null) {
      setOpening(this.inspectorFor, Number(t.value) / 100);
      const label = this.inspector.querySelector('[data-label=opening]');
      if (label) label.textContent = `${t.value}%`;
    }
  }

  private onInspectorClick(e: Event) {
    const t = e.target as HTMLElement;
    if (t.dataset.action === 'close') {
      this.showInspector(null);
      this.curve.close();
      this.onCloseInspector();
    } else if (t.dataset.action === 'curve' && this.inspectorFor !== null) {
      if (this.curve.id === this.inspectorFor) this.curve.close(); else this.curve.open(this.inspectorFor);
    } else if (t.dataset.action === 'reaction' && this.inspectorFor !== null) {
      setReaction(this.inspectorFor, t.dataset.value!);
      this.lastInspectorHtml = '';
    } else if (t.dataset.action === 'toggle' && this.inspectorFor !== null) {
      setEnabled(this.inspectorFor, t.dataset.on !== 'true');
      this.lastInspectorHtml = '';
    }
  }

  update(snap: Snapshot) {
    this.updateGrid(snap);
    for (const msg of snap.events) this.alert(msg);
    if (this.curve.id !== null) {
      const pump = snap.entities.find(x => x.id === this.curve.id);
      if (pump) this.curve.update(pump); else this.curve.close();
    }
    if (this.inspectorFor === null) return;
    const e = snap.entities.find(x => x.id === this.inspectorFor);
    if (!e) {
      this.showInspector(null);
      return;
    }
    this.renderInspector(e);
  }

  private renderInspector(e: EntityView) {
    const p = PROTO[e.proto];
    const names = VESSEL_NAMES[e.proto] ?? [];
    const kind = e.pipes[0]?.kind?.kind;
    const hasOpening = kind === 'Valve' || kind === 'Turbine';
    // Keep the slider alive while it is being dragged: only its read-out changes then.
    const slider = this.inspector.querySelector('input[data-action=opening]') as HTMLInputElement | null;
    const dragging = slider && document.activeElement === slider;
    const controls = [
      hasOpening ? `<label class="pp-control">${kind === 'Turbine' ? 'Admission limit' : 'Opening'}
        <input type="range" min="0" max="100" step="1" value="${Math.round(e.opening * 100)}" data-action="opening">
        <b data-label="opening">${Math.round(e.opening * 100)}%</b></label>` : '',
      kind === 'Pump' ? (() => {
        const k = e.pipes[0].kind;
        const head = (k.dp ?? 0) / ((k.rho && k.rho > 1 ? k.rho : 1000) * 9.80665);
        return `<div class="pp-control">Running at <b>${((k.q ?? 0) * 3600).toFixed(1)} m³/h, ${head.toFixed(1)} m</b>
          <button data-action="curve">${this.curve.id === e.id ? 'Hide curve' : 'Pump curve'}</button></div>`;
      })() : '',
      p.power_w ? `<div class="pp-control">Power ${fmt.w(e.power_w)} of ${fmt.w(p.power_w)}
        <button data-action="toggle" data-on="${e.enabled}">${e.enabled ? 'Switch off' : 'Switch on'}</button></div>` : '',
      e.generation_w || p.generator_w ? `<div class="pp-control">Generating <b>${fmt.w(e.generation_w)}</b>${p.generator_w ? ` of ${fmt.w(p.generator_w)}` : ''}</div>` : '',
      p.selectable ? `<div class="pp-section">Reaction</div><div class="pp-choices">${CSTR_REACTIONS.map(([id, name]) => {
        const current = layout().find(x => x.id === e.id)?.reaction ?? 'methanol';
        return `<button data-action="reaction" data-value="${id}" class="${current === id ? 'on' : ''}">${name}</button>`;
      }).join('')}</div>` : '',
      p.power_w && e.network === null ? '<div class="pp-control pp-bad">Not wired to a power pole</div>' : '',
      e.battery ? `<div class="pp-meter"><span style="width:${(e.battery[0] / e.battery[1]) * 100}%"></span><em>Charge ${fmt.pct(e.battery[0] / e.battery[1])} of ${(e.battery[1] / 3.6e9).toFixed(0)} MWh</em></div>` : '',
    ].join('');
    const flows = e.pipes.map(pp => {
      const extra = pp.kind.power_used ? ` · ${fmt.w(pp.kind.power_used)}` : pp.kind.power_out ? ` · ${fmt.w(pp.kind.power_out)} shaft` : '';
      return `<div class="pp-flow"><span>${pp.vapour ? 'gas' : 'liquid'}${pp.choked ? ' <b class="pp-warn">choked</b>' : ''}</span><b>${fmt.flow(pp.mdot)}</b><small>${Math.abs(pp.velocity).toFixed(1)} m/s${extra}</small></div>`;
    }).join('');
    const html = `<div class="pp-head"><img src="assets/process/icons/b_${e.proto}.png" alt=""><div><b>${p.name}</b><small>${p.size}×${p.size} · #${e.id}</small></div><button data-action="close">✕</button></div>
      <p class="pp-desc">${p.description}</p>
      ${controls}
      ${e.vessels.map((v, i) => vesselHtml(v, names[i] ?? (e.vessels.length > 1 ? `Vessel ${i + 1}` : 'Contents'))).join('')}
      ${flows ? `<div class="pp-section">Connections</div>${flows}` : '<div class="pp-section pp-dim">No pipes connected — ports are the coloured dots.</div>'}`;
    if (dragging) return;
    if (html !== this.lastInspectorHtml) {
      this.inspector.innerHTML = html;
      this.lastInspectorHtml = html;
    }
  }

  private updateGrid(snap: Snapshot) {
    const g = snap.grid;
    const df = g.frequency - g.nominal;
    const unwired = snap.entities.filter(e => PROTO[e.proto]?.power_w && e.network === null).length;
    const cls = g.blackout ? 'bad' : Math.abs(df) < 0.2 ? 'ok' : Math.abs(df) < 1 ? 'warn' : 'bad';
    const hours = ((snap.time / 600) * 24 + 0) % 24;
    const clock = `${String(Math.floor(hours)).padStart(2, '0')}:${String(Math.floor((hours % 1) * 60)).padStart(2, '0')}`;
    const co2 = snap.emitted_kg.co2 ?? 0;
    const ch4 = snap.emitted_kg.ch4 ?? 0;
    this.gridPanel.innerHTML = `
      <div class="pp-freq ${cls}">${g.blackout ? 'BLACKOUT' : g.capacity_w <= 0 ? '<span class="pp-dim">No power</span>' : `${g.frequency.toFixed(2)} Hz`}</div>
      <div class="pp-grid">
        <span>Generation</span><b>${fmt.w(g.generation_w)}</b>
        <span>Load</span><b>${fmt.w(g.load_w)}</b>
        <span>Capacity</span><b>${fmt.w(g.capacity_w)}</b>
        ${g.shed_fraction > 0 && g.capacity_w > 0 ? `<span>Load shed</span><b class="pp-bad">${fmt.pct(g.shed_fraction)}</b>` : ''}
        ${snap.grids.length > 1 ? `<span>Networks</span><b>${snap.grids.length}</b>` : ''}
        ${unwired ? `<span>Unwired</span><b class="pp-warn">${unwired}</b>` : ''}
        <span>Time</span><b>${clock} ${snap.daylight > 0 ? '☀' : '☾'}</b>
        <span>Ambient</span><b>${fmt.t(snap.ambient)}</b>
        ${co2 > 0.01 ? `<span>CO₂ vented</span><b>${fmt.kg(co2)}</b>` : ''}
        ${ch4 > 0.01 ? `<span>CH₄ vented</span><b class="pp-warn">${fmt.kg(ch4)}</b>` : ''}
      </div>
      ${g.blackout ? '<button data-action="blackstart">Black start</button>' : ''}`;
  }

  /** Read-out for whatever is under the cursor. */
  hover(text: string | null, x: number, y: number) {
    if (!text) {
      this.tooltip.style.display = 'none';
      return;
    }
    this.tooltip.style.display = 'block';
    this.tooltip.innerHTML = text;
    this.tooltip.style.left = `${x + 16}px`;
    this.tooltip.style.top = `${y + 16}px`;
  }

  /** News that isn't a problem, such as research finishing. */
  notice(msg: string) {
    const a = el('div', 'pp-alert pp-notice', msg);
    this.alerts.append(a);
    setTimeout(() => a.classList.add('gone'), 4000);
    setTimeout(() => a.remove(), 5000);
  }

  alert(msg: string) {
    const a = el('div', 'pp-alert', msg);
    this.alerts.append(a);
    setTimeout(() => a.classList.add('gone'), 6000);
    setTimeout(() => a.remove(), 7000);
  }

  destroy() {
    this.root.remove();
  }
}

export function segmentTooltip(v: VesselView): string {
  const phase = v.beta >= 0.9999 ? 'gas' : v.beta <= 0.0001 ? 'liquid' : `${fmt.pct(1 - v.beta)} liquid (mol)`;
  const top = Object.entries(v.z).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([id, f]) => `${formula(id)} ${(f * 100).toFixed(f < 0.1 ? 1 : 0)}%`).join(' · ');
  return `<b>Pipe</b> · ${fmt.p(v.p)} · ${fmt.t(v.t)} · ${phase}<br><small>${top}</small>`;
}

export function entityTooltip(e: EntityView): string {
  const p = PROTO[e.proto];
  const v = e.vessels[0];
  const state = v ? ` · ${fmt.p(v.p)} · ${fmt.t(v.t)}` : e.pipes[0] ? ` · ${fmt.flow(e.pipes[0].mdot)}` : '';
  return `<b>${p?.name ?? e.proto}</b>${state}`;
}
