/**
 * The HTML overlay for the process plant: the build bar, the inspector for a selected building,
 * the grid panel, hover read-outs and alerts. Plain DOM over the Phaser canvas.
 */

import './process.css';
import { iconUrl } from '../game/items';
import { PumpCurvePanel } from './pumpCurve';
import { wind } from './render';
import { BORES, LIMITS, hydraulics, nodeKey, problems, pumpSides, stats, type FlowStats, type RunFlows } from './hydraulics';
import {
  PROTO, PROTOS, SPECIES, blackStart, setEnabled, setOpening, setRelief, setPipeDiameter, setReaction, layout, placedById,
  type EntityView, type Placed, type Snapshot, type VesselView,
} from './engine';

/** What's in a vessel, in words: "Water", "Steam", "Mostly methane, with ethane". */
export function fluidName(v: VesselView): string {
  if (v.moles < 1e-6) return 'Empty';
  const top = Object.entries(v.z).sort((a, b) => b[1] - a[1]);
  // A few bubbles of dissolved gas don't make a liquid line two-phase.
  const gas = v.beta >= 0.98, liquid = v.beta <= 0.02;
  const name = (id: string) => {
    if (id === 'h2o') return gas ? 'steam' : liquid ? 'water' : 'water and steam';
    return (SPECIES[id]?.name ?? id).toLowerCase();
  };
  const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
  const [first, f1] = top[0];
  const phase = first === 'h2o' ? '' : gas ? ' (gas)' : liquid ? ' (liquid)' : ' (boiling)';
  if (f1 > 0.9 || top.length === 1) return cap(name(first)) + phase;
  return `Mostly ${name(first)}, with ${name(top[1][0])}${phase}`;
}

const VESSEL_NAMES: Record<string, string[]> = {
  fired_boiler: ['Firebox', 'Steam drum'],
  smr_reformer: ['Catalyst tubes', 'Firebox'],
  cracker_furnace: ['Cracking coils', 'Firebox'],
  heat_exchanger: ['Shell side', 'Tube side'],
  electrolyser: ['Cathode — H₂', 'Anode — O₂'],
  crude_column: ['Fired reboiler'],
};

/** A crude column's stages, bottom to top, and the cut drawn from each. */
const COLUMN_STAGES = ['Sump · heavy oil', 'Flash zone · crude in', 'Diesel tray', 'Tray', 'Kerosene tray', 'Tray', 'Overhead · naphtha and gas'];



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
    c6h14: '#f2e6a0', c10h22: '#e0b860', c16h34: '#c08a30', c20h42: '#5a3a22',
  };
  return c[id] ?? '#999';
}

/**
 * A column at a glance: each stage from the top down with its temperature, pressure and the
 * liquid on it, so you can see the cuts sort themselves by boiling point.
 */
function columnHtml(stages: VesselView[]): string {
  const rows = stages.map((v, i) => ({ v, name: COLUMN_STAGES[i] ?? `Stage ${i + 1}` })).reverse().map(({ v, name }) => {
    const liquid = v.beta < 0.9999;
    const z = liquid ? v.x : v.y;
    return `<div class="pp-stage${v.ruptured ? ' ruptured' : ''}"><div class="pp-stage-head"><b>${name}</b><span>${fmt.t(v.t)} · ${fmt.p(v.p)}${liquid ? '' : ' · <i>dry</i>'}</span></div>${compositionBar(z, cssColour).replace(/<div class="pp-legend">.*<\/div>$/s, '')}</div>`;
  }).join('');
  return `<div class="pp-section">Column, top to bottom</div><div class="pp-column">${rows}</div>`;
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

/** A power pole's network: how it's holding up, and what it's feeding. */
function gridHtml(snap: Snapshot, network: number | null): string {
  const g = network === null ? null : snap.grids[network];
  if (!g) return '<div class="pp-section">Power network</div><div class="pp-control pp-dim">Not wired to anything that makes power.</div>';
  const df = g.frequency - g.nominal;
  const cls = g.blackout ? 'bad' : Math.abs(df) < 0.2 ? 'ok' : Math.abs(df) < 1 ? 'warn' : 'bad';
  const unwired = snap.entities.filter(e => PROTO[e.proto]?.power_w && e.network === null).length;
  return `<div class="pp-section">Power network${snap.grids.length > 1 ? ` · ${network! + 1} of ${snap.grids.length}` : ''}</div>
    <div class="pp-freq ${cls}">${g.blackout ? 'BLACKOUT' : g.capacity_w <= 0 ? '<span class="pp-dim">No power</span>' : `${g.frequency.toFixed(2)} Hz`}</div>
    <div class="pp-grid">
      <span>Generation</span><b>${fmt.w(g.generation_w)}</b>
      <span>Load</span><b>${fmt.w(g.load_w)}</b>
      <span>Capacity</span><b>${fmt.w(g.capacity_w)}</b>
      ${g.shed_fraction > 0 && g.capacity_w > 0 ? `<span>Load shed</span><b class="pp-bad">${fmt.pct(g.shed_fraction)}</b>` : ''}
      ${unwired ? `<span>Unwired machines</span><b class="pp-warn">${unwired}</b>` : ''}
    </div>
    ${g.blackout ? '<button data-action="blackstart" class="pp-blackout">Black start</button>' : ''}`;
}

export class ProcessUI {
  private root = el('div', 'pp-root');
  private inspector = el('div', 'pp-inspector');
  private gridPanel = el('div', 'pp-gridpanel');
  private tooltip = el('div', 'pp-tooltip');
  private alerts = el('div', 'pp-alerts');
  private inspectorFor: number | null = null;
  private lastInspectorHtml = '';
  onCloseInspector: () => void = () => {};
  onRotate: (id: number) => void = () => {};
  onLevel: (level: number) => void = () => {};
  onPipeSnap: (on: boolean) => void = () => {};
  /** Whether pumps' speed can be changed (variable-frequency drives researched). */
  vfdUnlocked: () => boolean = () => true;
  private curve = new PumpCurvePanel(() => this.vfdUnlocked());

  constructor() {
    this.root.append(this.inspector, this.gridPanel, this.tooltip, this.alerts, this.curve.root, this.altimeter, this.snap);
    this.snap.innerHTML = '<label><input type="checkbox" checked> Snap pipes</label>';
    this.snap.querySelector('input')!.addEventListener('change', e => this.onPipeSnap((e.target as HTMLInputElement).checked));
    this.setLevel(0);
    document.body.append(this.root);
    // The world's tooltip goes as soon as the pointer moves onto a panel or off the window.
    const hide = () => { this.tooltip.style.display = 'none'; };
    document.addEventListener('pointermove', e => { if (!(e.target instanceof HTMLCanvasElement)) hide(); });
    document.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    this.inspector.addEventListener('input', e => this.onInspectorInput(e));
    this.inspector.addEventListener('click', e => this.onInspectorClick(e));
    this.gridPanel.addEventListener('click', e => {
      if ((e.target as HTMLElement).dataset.action === 'blackstart') blackStart();
    });
  }

  private altimeter = el('div', 'pp-altimeter');
  private snap = el('div', 'pp-snap');

  /** The snap box, shown while holding pipe: whether new pipe joins everything beside it. */
  showPipeSnap(visible: boolean, on: boolean) {
    this.snap.style.display = visible ? 'block' : 'none';
    const box = this.snap.querySelector('input')!;
    if (box.checked !== on) box.checked = on;
  }

  /** The working-height gauge: a lift car on a three-stop shaft. */
  setLevel(level: number) {
    if (!this.altimeter.childElementCount) {
      this.altimeter.innerHTML = `<div class="pp-shaft">${['High rack', 'Low rack', 'Ground'].map((n, i) =>
        `<span data-stop="${2 - i}">${n}</span>`).join('')}<i class="pp-car"></i></div>`;
      this.altimeter.addEventListener('click', e => {
        const stop = (e.target as HTMLElement).closest<HTMLElement>('[data-stop]');
        if (stop) this.onLevel(Number(stop.dataset.stop));
      });
    }
    this.altimeter.dataset.level = String(level);
    this.altimeter.querySelectorAll<HTMLElement>('[data-stop]').forEach(s => s.classList.toggle('on', s.dataset.stop === String(level)));
    this.altimeter.classList.remove('bump');
    void this.altimeter.offsetWidth;
    this.altimeter.classList.add('bump');
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
    if (t.dataset.action === 'relief' && this.inspectorFor !== null) {
      setRelief(this.inspectorFor, Number(t.value));
      const label = this.inspector.querySelector('[data-label=relief]');
      if (label) label.textContent = `${Number(t.value).toFixed(1)} bar`;
    }
  }

  private onInspectorClick(e: Event) {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!t) return;
    if (t.dataset.action === 'blackstart') { blackStart(); return; }
    if (t.dataset.action === 'bore' && this.inspectorFor !== null) {
      setPipeDiameter(this.inspectorFor, Number(t.dataset.value));
      this.lastInspectorHtml = '';
      return;
    }
    if (t.dataset.action === 'close') {
      this.showInspector(null);
      this.curve.close();
      this.onCloseInspector();
    } else if (t.dataset.action === 'curve' && this.inspectorFor !== null) {
      if (this.curve.id === this.inspectorFor) this.curve.close(); else this.curve.open(this.inspectorFor);
    } else if (t.dataset.action === 'reaction' && this.inspectorFor !== null) {
      setReaction(this.inspectorFor, t.dataset.value!);
      this.lastInspectorHtml = '';
    } else if (t.dataset.action === 'rotate' && this.inspectorFor !== null) {
      this.onRotate(this.inspectorFor);
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
      if (pump) this.curve.update(pump, pumpSides(snap, pump)); else this.curve.close();
    }
    if (this.inspectorFor === null) return;
    const e = snap.entities.find(x => x.id === this.inspectorFor);
    if (!e) {
      const pipe = placedById(this.inspectorFor);
      if (PROTO[pipe?.proto ?? '']?.levels?.length) this.renderPipe(pipe!, snap); else this.showInspector(null);
      return;
    }
    this.renderInspector(e, snap);
  }

  /** A pipe run: what's in it, how it flows, and its bore, which can be changed. */
  private renderPipe(pipe: Placed, snap: Snapshot) {
    const h = hydraulics(snap);
    const levels = PROTO[pipe.proto]?.levels ?? [0];
    const level = levels.length === 1 ? levels[0] : 0;
    const key = nodeKey(level, pipe.x, pipe.y);
    const si = h.runAt.get(key);
    if (si === undefined) { this.showInspector(null); return; }
    const run = h.runs[si], v = snap.segments[si].vessel;
    const st = stats(run.tile.get(key) ?? 0, run.fluid, run.d);
    const issues = problems(st, run.service, run.fluid);
    const lim = LIMITS[run.service];
    const html = `<div class="pp-head"><img src="${iconUrl('pipe')}" alt=""><div><b>Pipe run · ${fluidName(v)}</b><small>${snap.segments[si].tiles.length + (snap.segments[si].racks?.length ?? 0)} lengths${snap.segments[si].racks?.length ? ', some on racks' : ''} · ${lim.label}</small></div><button data-action="close">✕</button></div>
      <div class="pp-section">Bore</div>
      <div class="pp-choices">${BORES.map(([d, label]) =>
        `<button data-action="bore" data-value="${d}" class="${Math.abs(d - run.d) < 1e-6 ? 'on' : ''}">${label}</button>`).join('')}</div>
      <p class="pp-desc">A wider line carries more for the same push, with less friction, and holds more. Laying pipe on to a run gives it the run's bore.</p>
      <div class="pp-section">Flow here</div>
      ${st.v < 0.005 ? '<div class="pp-control pp-dim">Not flowing</div>' : `<div class="pp-grid">
        <span>Flow</span><b>${(st.q * 3600).toFixed(st.q * 3600 < 10 ? 2 : 1)} m³/h</b>
        <span>Velocity</span><b class="${st.v > lim.vMax ? 'pp-bad' : ''}">${st.v.toFixed(2)} m/s <small>of ${lim.vMax}</small></b>
        <span>Reynolds</span><b>${st.re >= 1e4 ? st.re.toExponential(1) : st.re.toFixed(0)} <small>${st.regime}</small></b>
        <span>Friction</span><b class="${st.dp100 > lim.dpMax ? 'pp-bad' : ''}">${st.dp100.toFixed(st.dp100 < 10 ? 2 : 0)} kPa/100 m</b>
      </div>${issues.map(p => `<div class="pp-control pp-bad">${p}</div>`).join('')}`}
      ${vesselHtml(v, 'Contents')}`;
    if (html !== this.lastInspectorHtml) {
      this.inspector.innerHTML = html;
      this.lastInspectorHtml = html;
    }
  }

  private renderInspector(e: EntityView, snap: Snapshot) {
    const p = PROTO[e.proto];
    const names = VESSEL_NAMES[e.proto] ?? [];
    const kind = e.pipes[0]?.kind?.kind;
    const hasOpening = kind === 'Valve' || kind === 'Turbine';
    // Keep the slider alive while it is being dragged: only its read-out changes then.
    const slider = this.inspector.querySelector('input[data-action=opening], input[data-action=relief]') as HTMLInputElement | null;
    const dragging = slider && document.activeElement === slider;
    const relief = kind === 'Relief' ? e.pipes[0].kind : null;
    const controls = [
      relief ? `<label class="pp-control">Set pressure
        <input type="range" min="1.2" max="60" step="0.1" value="${((relief.set_p ?? 5e5) / 1e5).toFixed(1)}" data-action="relief">
        <b data-label="relief">${((relief.set_p ?? 5e5) / 1e5).toFixed(1)} bar</b></label>
        <div class="pp-grid"><span>Disc</span><b class="${(relief.lift ?? 0) > 0 ? 'pp-warn' : ''}">${(relief.lift ?? 0) > 0 ? `lifted ${Math.round((relief.lift ?? 0) * 100)}% · venting` : 'seated'}</b>
        <span>Reseats at</span><b>${((relief.set_p ?? 5e5) * 0.93 / 1e5).toFixed(2)} bar</b></div>` : '',
      hasOpening ? `<label class="pp-control">${kind === 'Turbine' ? 'Admission limit' : 'Opening'}
        <input type="range" min="0" max="100" step="1" value="${Math.round(e.opening * 100)}" data-action="opening">
        <b data-label="opening">${Math.round(e.opening * 100)}%</b></label>` : '',
      kind === 'Pump' ? (() => {
        const k = e.pipes[0].kind;
        const head = (k.dp ?? 0) / ((k.rho && k.rho > 1 ? k.rho : 1000) * 9.80665);
        const wear = k.wear ?? 0;
        const health = (k.cavitation ?? 0) > 0.01 ? '<div class="pp-control pp-bad">Cavitating: the impeller is being eaten away</div>' : '';
        const worn = wear > 0.01 ? `<div class="pp-control${wear >= 1 ? ' pp-bad' : ''}">Impeller ${wear >= 1 ? 'worn through: pick the pump up and put it back to fit a new one' : `wear <b>${fmt.pct(wear)}</b>`}</div>` : '';
        const onGas = (k.rho ?? 1000) < 200 && Math.abs(k.q ?? 0) > 1e-5;
        const running = onGas ? '<span class="pp-warn">Moving gas: its lines hold air or vapour, not liquid</span>'
          : `Running at <b>${((k.q ?? 0) * 3600).toFixed(1)} m³/h, ${head.toFixed(1)} m</b>`;
        return health + worn + `<div class="pp-control">${running}
          <button data-action="curve">${this.curve.id === e.id ? 'Hide curve' : 'Pump curve'}</button></div>`;
      })() : '',
      p.power_w ? `<div class="pp-control">Power ${fmt.w(e.power_w)} of ${fmt.w(p.power_w)}
        <button class="pp-switch ${e.enabled ? 'on' : ''}" data-action="toggle" data-on="${e.enabled}" title="${e.enabled ? 'Switch off' : 'Switch on'}"><i></i><span>${e.enabled ? 'ON' : 'OFF'}</span></button></div>` : '',
      e.generation_w || p.generator_w ? `<div class="pp-control">Generating <b>${fmt.w(e.generation_w)}</b>${p.generator_w ? ` of ${fmt.w(p.generator_w)}` : ''}</div>` : '',
      p.selectable ? `<div class="pp-section">Reaction</div><div class="pp-choices">${CSTR_REACTIONS.map(([id, name]) => {
        const current = layout().find(x => x.id === e.id)?.reaction ?? 'methanol';
        return `<button data-action="reaction" data-value="${id}" class="${current === id ? 'on' : ''}">${name}</button>`;
      }).join('')}</div>` : '',
      p.power_w && e.network === null ? '<div class="pp-control pp-bad">Not wired to a power pole</div>' : '',
      e.battery ? `<div class="pp-meter"><span style="width:${(e.battery[0] / e.battery[1]) * 100}%"></span><em>Charge ${fmt.pct(e.battery[0] / e.battery[1])} of ${(e.battery[1] / 3.6e9).toFixed(0)} MWh</em></div>` : '',
    ].join('');
    // A column's own risers and downcomers aren't connections to show.
    const flows = (e.proto === 'crude_column' ? e.pipes.filter(pp => pp.ports.some(k => k !== null)) : e.pipes).map(pp => {
      const extra = pp.kind.power_used ? ` · ${fmt.w(pp.kind.power_used)}` : pp.kind.power_out ? ` · ${fmt.w(pp.kind.power_out)} shaft` : '';
      return `<div class="pp-flow"><span>${pp.vapour ? 'gas' : 'liquid'}${pp.choked ? ' <b class="pp-warn">choked</b>' : ''}</span><b>${fmt.flow(pp.mdot)}</b><small>${Math.abs(pp.velocity).toFixed(1)} m/s${extra}</small></div>`;
    }).join('');
    const html = `<div class="pp-head"><img src="assets/process/icons/b_${e.proto}.png" alt=""><div><b>${p.name}</b><small>${p.size}×${p.size} · #${e.id}</small></div>${p.ports.length ? '<button data-action="rotate" class="pp-rotate" title="Rotate a quarter turn (R over it)">⟳ Rotate</button>' : ''}<button data-action="close">✕</button></div>
      <p class="pp-desc">${p.description}</p>
      ${controls}
      ${e.proto === 'power_pole' || e.proto === 'substation' ? gridHtml(snap, e.network) : ''}
      ${e.proto === 'crude_column' ? vesselHtml(e.vessels[0], names[0]) + columnHtml(e.vessels.slice(1))
        : e.vessels.map((v, i) => vesselHtml(v, names[i] ?? (e.vessels.length > 1 ? `Vessel ${i + 1}` : 'Contents'))).join('')}
      ${flows ? `<div class="pp-section">Connections</div>${flows}` : p.ports.length ? '<div class="pp-section pp-dim">No pipes connected — ports are the coloured dots.</div>' : ''}`;
    if (dragging) return;
    if (html !== this.lastInspectorHtml) {
      this.inspector.innerHTML = html;
      this.lastInspectorHtml = html;
    }
  }

  /** The world around the plant, in one quiet line; a blackout shouts. */
  private updateGrid(snap: Snapshot) {
    const hours = ((snap.time / 600) * 24) % 24;
    const clock = `${String(Math.floor(hours)).padStart(2, '0')}:${String(Math.floor((hours % 1) * 60)).padStart(2, '0')}`;
    const w = wind(snap.time);
    // The arrow points the way it blows, as it looks on screen.
    const deg = Math.atan2((w.x + w.y) / 2, w.x - w.y) * 180 / Math.PI;
    const vented = Object.entries(snap.emitted_kg).filter(([, kg]) => kg > 0.01)
      .map(([id, kg]) => `${formula(id)} ${fmt.kg(kg)}`).join(', ');
    const blackout = snap.grids.some(g => g.blackout);
    const html = `<span title="Time of day">${clock} ${snap.daylight > 0 ? '☀' : '☾'}</span>
      <span title="Air temperature">${fmt.t(snap.ambient)}</span>
      <span title="Wind ${w.speed.toFixed(1)} m/s"><i class="pp-wind" style="transform:rotate(${deg.toFixed(0)}deg)">➤</i> ${w.speed.toFixed(1)} m/s</span>
      <span title="Air: N₂ 78.1%, O₂ 21.0%, H₂O 0.9%, CO₂ 400 ppm${vented ? `\nVented so far: ${vented}` : ''}">N₂ 78 · O₂ 21 · CO₂ 400 ppm</span>
      ${blackout ? '<button data-action="blackstart" class="pp-blackout">Blackout · Black start</button>' : ''}`;
    if (html !== this.gridPanel.innerHTML) this.gridPanel.innerHTML = html;
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

export function segmentTooltip(v: VesselView, flow?: { run: RunFlows; stats: FlowStats; problems: string[] } | null): string {
  const phase = v.beta >= 0.9999 ? 'gas' : v.beta <= 0.0001 ? 'liquid' : `${fmt.pct(1 - v.beta)} liquid (mol)`;
  const top = Object.entries(v.z).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([id, f]) => `${formula(id)} ${(f * 100).toFixed(f < 0.1 ? 1 : 0)}%`).join(' · ');
  let hyd = '';
  if (flow) {
    const s = flow.stats, lim = LIMITS[flow.run.service];
    const ratio = s.v / lim.vMax;
    hyd = s.v < 0.005 ? '<div class="pp-hyd"><span>No flow</span></div>' : `<div class="pp-hyd">
      <span>Flow <b>${(s.q * 3600).toFixed(s.q * 3600 < 10 ? 2 : 1)} m³/h</b></span>
      <span>Velocity <b class="${ratio > 1 ? 'pp-bad' : ''}">${s.v.toFixed(2)} m/s</b> <small>of ${lim.vMax} for a ${lim.label}</small></span>
      <span>Re <b>${s.re >= 1e4 ? s.re.toExponential(1) : s.re.toFixed(0)}</b> <small>${s.regime}</small> · f <b>${s.f.toFixed(4)}</b></span>
      <span>Friction <b class="${s.dp100 > lim.dpMax ? 'pp-bad' : ''}">${s.dp100.toFixed(s.dp100 < 10 ? 2 : 0)} kPa/100 m</b></span>
      ${flow.problems.map(p => `<small class="pp-bad">${p}</small>`).join('')}
    </div>`;
  }
  const bore = flow ? ` · ${BORES.find(b => Math.abs(b[0] - flow.run.d) < 1e-6)?.[1].split(' · ')[0] ?? `${(flow.run.d * 1000).toFixed(0)} mm`}` : '';
  return `<b>Pipe · ${fluidName(v)}</b><br>${fmt.p(v.p)} · ${fmt.t(v.t)} · ${phase}${bore}<br><small>${top}</small>${hyd}`;
}

export function entityTooltip(e: EntityView): string {
  const p = PROTO[e.proto];
  const v = e.vessels[0];
  const state = v ? ` · ${fmt.p(v.p)} · ${fmt.t(v.t)}` : e.pipes[0] ? ` · ${fmt.flow(e.pipes[0].mdot)}` : '';
  const k = e.pipes.find(x => x.kind.kind === 'Pump')?.kind;
  const pump = !k ? '' : (k.cavitation ?? 0) > 0.01
    ? `<br><small class="pp-bad">Cavitating: NPSH ${(k.npsha ?? 0).toFixed(1)} m available, ${(k.npshr ?? 0).toFixed(1)} m needed</small>`
    : '';
  const wear = k && (k.wear ?? 0) > 0.01 ? `<br><small class="${(k.wear ?? 0) >= 1 ? 'pp-bad' : ''}">Impeller ${(k.wear ?? 0) >= 1 ? 'worn through' : `wear ${fmt.pct(k.wear ?? 0)}`}</small>` : '';
  return `<b>${p?.name ?? e.proto}</b>${state}${pump}${wear}`;
}
