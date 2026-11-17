/**
 * A centrifugal pump's curve, opened from its inspector: head and efficiency against flow at the
 * current impeller trim and speed, the rated curve behind it, and where the pump is actually
 * running. The impeller can be trimmed and, with variable-frequency drives researched, the speed
 * changed; the curve moves by the affinity laws, the same way the engine computes it.
 *
 * Over it, as in Hydraulic Studio: the system curve, the head the plant asks for at each flow
 * (the pressure difference between the suction and discharge runs, plus friction growing with
 * the square of flow through today's operating point), where the pump curve crosses it is where
 * it runs; and NPSH available against required, below which it cavitates.
 */

import { setPump, layout, type EntityView, type PipeView, type VesselView } from './engine';
import { npshAvailable, npshRequired } from './hydraulics';

const G = 9.80665;
/** Nameplate of the full-size pump, for the read-outs. */
const RATED_RPM = 2950;
const RATED_IMPELLER_MM = 250;

type PumpKind = PipeView['kind'];

/** The engine's pump curve (physics/fluid.rs, pump_curve and PumpCurve::at). */
function curve(k: PumpKind, trim: number, n: number) {
  const s = n * trim;
  const dp0 = (k.dp_max ?? 0) * s * s;
  const qRun = (k.q_max ?? 0) * s;
  const effBep = (k.eff ?? 0.75) * (1 - 0.4 * (1 - trim));
  const qBep = 0.5 * qRun;
  const pBep = qBep * dp0 * 0.75 / effBep;
  return {
    qRun, qBep,
    at(q: number) {
      if (qRun <= 0) return { dp: 0, eff: 0, shaft: 0 };
      const dp = dp0 * Math.max(0, 1 - (q / qRun) ** 2);
      const shaft = pBep * (2 + q / qBep) / 3;
      return { dp, eff: q * dp / shaft, shaft };
    },
  };
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

export class PumpCurvePanel {
  readonly root = el('div', 'pp-curve');
  private canvas = el('canvas');
  private readout = el('div', 'pp-curve-read');
  private note = el('div', 'pp-curve-note');
  private trimInput: HTMLInputElement;
  private speedInput: HTMLInputElement;
  private speedLabel = el('b');
  private trimLabel = el('b');
  private last: EntityView | null = null;
  /** The pump shown, or null when closed. */
  id: number | null = null;

  constructor(private vfd: () => boolean) {
    const head = el('div', 'pp-curve-head', '<b>Pump curve</b><small></small>');
    const close = el('button', undefined, '✕');
    close.addEventListener('click', () => this.close());
    head.append(close);
    this.trimInput = Object.assign(el('input'), { type: 'range', min: '175', max: '250', step: '1' });
    this.speedInput = Object.assign(el('input'), { type: 'range', min: '0', max: '100', step: '1' });
    const trimRow = el('label', 'pp-control', 'Impeller');
    trimRow.append(this.trimInput, this.trimLabel);
    const speedRow = el('label', 'pp-control', 'VFD speed');
    speedRow.append(this.speedInput, this.speedLabel);
    this.root.append(head, this.canvas, this.readout, trimRow, speedRow, this.note);
    for (const input of [this.trimInput, this.speedInput]) input.addEventListener('input', () => this.apply());
  }

  open(id: number) {
    this.id = id;
    const p = layout().find(x => x.id === id);
    this.trimInput.value = String(Math.round((p?.trim ?? 1) * RATED_IMPELLER_MM));
    this.speedInput.value = String(Math.round((p?.speed ?? 1) * 100));
    this.root.classList.add('open');
    this.last = null;
  }

  close() {
    this.id = null;
    this.root.classList.remove('open');
  }

  private apply() {
    if (this.id === null) return;
    const trim = Number(this.trimInput.value) / RATED_IMPELLER_MM;
    const speed = this.vfd() ? Number(this.speedInput.value) / 100 : 1;
    setPump(this.id, trim, speed);
    if (this.last) this.update(this.last);
  }

  update(e: EntityView, sides: { suction: VesselView | null; discharge: VesselView | null } = { suction: null, discharge: null }) {
    const pipe = e.pipes.find(p => p.kind.kind === 'Pump');
    if (!pipe) { this.close(); return; }
    this.last = e;
    const k = pipe.kind;
    const p = layout().find(x => x.id === e.id);
    const trim = p?.trim ?? k.trim ?? 1;
    const speed = p?.speed ?? k.speed ?? 1;
    const n = k.n ?? 0;
    const rho = k.rho && k.rho > 1 ? k.rho : 1000;
    const vfd = this.vfd();
    this.speedInput.disabled = !vfd;
    this.trimLabel.textContent = `${Math.round(trim * RATED_IMPELLER_MM)} mm`;
    this.speedLabel.textContent = vfd ? `${Math.round(speed * RATED_RPM)} rpm` : 'fixed';
    (this.root.querySelector('.pp-curve-head small') as HTMLElement).textContent = `#${e.id}`;

    const now = curve(k, trim, n);
    const q = k.q ?? 0;
    const head = (k.dp ?? 0) / (rho * G);
    const op = now.at(q);
    const ratio = now.qBep > 0 ? q / now.qBep : 0;
    // The system: static head between the two runs, and friction through the operating point.
    const hStatic = sides.suction && sides.discharge ? (sides.discharge.p - sides.suction.p) / (rho * G) : null;
    const sys = hStatic === null ? null : { h0: hStatic, k: q > 1e-5 ? Math.max(0, head - hStatic) / (q * q) : 0 };
    const liquid = !!sides.suction && sides.suction.beta < 0.5;
    const npsha = sides.suction && liquid ? npshAvailable(sides.suction, q, rho) : null;
    const npshr = npshRequired(q, now.qBep, n);
    const npsh = npsha === null ? null : { a: npsha, suction: sides.suction!, r: npshr };
    this.readout.innerHTML = [
      ['Flow', `${(q * 3600).toFixed(1)} m³/h`],
      ['Head', `${head.toFixed(1)} m`],
      ['Efficiency', `${(op.eff * 100).toFixed(0)} %`],
      ['Shaft', `${(op.shaft / 1000).toFixed(1)} kW`],
      ['Speed', `${Math.round(n * RATED_RPM)} rpm`],
      ['Of BEP flow', `${(ratio * 100).toFixed(0)} %`],
      ['Static head', hStatic === null ? '—' : `${hStatic.toFixed(1)} m`],
      ['NPSH avail. / req.', npsha === null ? '—' : `${npsha.toFixed(1)} / ${npshr.toFixed(1)} m`],
    ].map(([a, b]) => `<span>${a}<b>${b}</b></span>`).join('');
    const starved = speed > 0 && n < speed * 0.98;
    this.note.className = 'pp-curve-note';
    let msg = '';
    if (speed === 0) msg = 'Stopped.';
    else if (starved) { msg = 'Not getting enough power: the motor has slowed down.'; this.note.classList.add('bad'); }
    else if (npsha !== null && q > 1e-5 && npsha < npshr) { msg = `Cavitating: ${npsha.toFixed(1)} m of NPSH available, ${npshr.toFixed(1)} m needed. Raise the suction pressure, or slow the pump.`; this.note.classList.add('bad'); }
    else if (q < 1e-5) { msg = 'Dead-headed: no flow. The liquid in the casing just heats up.'; this.note.classList.add('bad'); }
    else if (ratio < 0.7) { msg = 'Running left of the best-efficiency point: recirculation and wasted power. Trim the impeller or slow it down.'; this.note.classList.add('warn'); }
    else if (ratio > 1.2) { msg = 'Running right of the best-efficiency point: high power and a risk of cavitation.'; this.note.classList.add('warn'); }
    else msg = 'In the preferred operating region, near best efficiency.';
    if (!vfd) msg += ' Research Variable-frequency drives to change its speed.';
    this.note.textContent = msg;
    this.draw(k, trim, speed, n, rho, q, head, sys, npsh);
  }

  private draw(k: PumpKind, trim: number, speed: number, n: number, rho: number, q: number, head: number,
    sys: { h0: number; k: number } | null, npsh: { suction: VesselView; r: number } | null) {
    const W = 440, H = 250, dpr = window.devicePixelRatio || 1;
    if (this.canvas.width !== W * dpr) { this.canvas.width = W * dpr; this.canvas.height = H * dpr; this.canvas.style.width = `${W}px`; }
    const g = this.canvas.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const L = 42, R = 38, T = 12, B = 30;
    const rated = curve(k, 1, 1);
    const qMax = rated.qRun * 1.05;
    const hMax = (k.dp_max ?? 1) / (rho * G) * 1.12;
    const X = (qq: number) => L + qq / qMax * (W - L - R);
    const Y = (h: number) => H - B - h / hMax * (H - T - B);
    const YE = (e: number) => H - B - e * (H - T - B);

    // Axes and grid.
    g.font = '10px system-ui, sans-serif';
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.fillStyle = '#93a0b0'; g.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = T + (H - T - B) * i / 5;
      g.beginPath(); g.moveTo(L, y); g.lineTo(W - R, y); g.stroke();
      g.textAlign = 'right'; g.fillText((hMax * (1 - i / 5)).toFixed(0), L - 5, y + 3);
      g.textAlign = 'left'; g.fillText(`${Math.round(100 * (1 - i / 5))}%`, W - R + 5, y + 3);
    }
    for (let i = 0; i <= 5; i++) {
      const x = L + (W - L - R) * i / 5;
      g.beginPath(); g.moveTo(x, T); g.lineTo(x, H - B); g.stroke();
      g.textAlign = 'center'; g.fillText((qMax * 3600 * i / 5).toFixed(0), x, H - B + 13);
    }
    g.textAlign = 'center'; g.fillText('Flow [m³/h]', (L + W - R) / 2, H - 3);
    g.save(); g.translate(11, (T + H - B) / 2); g.rotate(-Math.PI / 2); g.fillText('Head [m]', 0, 0); g.restore();
    g.save(); g.translate(W - 6, (T + H - B) / 2); g.rotate(Math.PI / 2); g.fillStyle = '#6fd36f'; g.fillText('Efficiency', 0, 0); g.restore();

    const line = (c: ReturnType<typeof curve>, f: (pt: { dp: number; eff: number }) => number, colour: string, width: number, dash: number[] = []) => {
      if (c.qRun <= 0) return;
      g.strokeStyle = colour; g.lineWidth = width; g.setLineDash(dash);
      g.beginPath();
      for (let i = 0; i <= 60; i++) {
        const qq = c.qRun * i / 60;
        const y = f(c.at(qq));
        if (i) g.lineTo(X(qq), y); else g.moveTo(X(qq), y);
      }
      g.stroke(); g.setLineDash([]);
    };
    const now = curve(k, trim, n);
    // The preferred operating region, 70–120 % of best-efficiency flow.
    if (now.qBep > 0) {
      g.fillStyle = 'rgba(111,211,111,0.08)';
      g.fillRect(X(now.qBep * 0.7), T, X(now.qBep * 1.2) - X(now.qBep * 0.7), H - T - B);
    }
    line(rated, pt => Y(pt.dp / (rho * G)), '#5b6676', 1.5, [5, 4]);
    if (Math.abs(n - speed) > 0.02 && speed > 0) line(curve(k, trim, speed), pt => Y(pt.dp / (rho * G)), 'rgba(240,166,58,0.45)', 1.5, [3, 3]);
    line(now, pt => YE(pt.eff), '#6fd36f', 1.5);
    line(now, pt => Y(pt.dp / (rho * G)), '#f0a63a', 2.5);

    // The system curve, and NPSH: available (falls only with the suction pressure; the velocity
    // head adds a little) against required (rises with flow).
    const across = (f: (qq: number) => number, colour: string, width: number, dash: number[]) => {
      g.strokeStyle = colour; g.lineWidth = width; g.setLineDash(dash);
      g.beginPath();
      let started = false;
      for (let i = 0; i <= 60; i++) {
        const qq = qMax * i / 60, h = f(qq);
        if (!Number.isFinite(h) || h < 0 || h > hMax) { started = false; continue; }
        if (started) g.lineTo(X(qq), Y(h)); else { g.moveTo(X(qq), Y(h)); started = true; }
      }
      g.stroke(); g.setLineDash([]);
    };
    if (sys) across(qq => sys.h0 + sys.k * qq * qq, '#e8ecf1', 1.8, []);
    if (npsh) {
      across(qq => npshAvailable(npsh.suction, qq, rho), '#5fd3e8', 1.5, [6, 3]);
      across(qq => npshRequired(qq, now.qBep, n), '#c58cff', 1.5, [2, 3]);
    }

    // Best-efficiency point.
    if (now.qBep > 0) {
      const b = now.at(now.qBep);
      const bx = X(now.qBep), by = Y(b.dp / (rho * G));
      g.fillStyle = '#6fd36f';
      g.beginPath(); g.moveTo(bx, by - 5); g.lineTo(bx + 5, by); g.lineTo(bx, by + 5); g.lineTo(bx - 5, by); g.closePath(); g.fill();
      g.textAlign = 'left'; g.fillText('BEP', bx + 7, by - 5);
    }
    // Where it's running.
    const ox = X(q), oy = Y(head);
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.setLineDash([2, 3]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(ox, H - B); g.lineTo(ox, oy); g.lineTo(L, oy); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#ffffff'; g.strokeStyle = '#10141a'; g.lineWidth = 2;
    g.beginPath(); g.arc(ox, oy, 5.5, 0, Math.PI * 2); g.fill(); g.stroke();

    // Legend.
    g.textAlign = 'left'; g.font = '10px system-ui, sans-serif';
    const items: [string, string][] = [['#f0a63a', 'Pump'], ['#5b6676', 'Rated'], ['#6fd36f', 'Efficiency']];
    if (sys) items.push(['#e8ecf1', 'System']);
    if (npsh) items.push(['#5fd3e8', 'NPSHa'], ['#c58cff', 'NPSHr']);
    items.forEach(([c, t], i) => {
      const x = L + 8 + (i % 4) * 82, y = T + 4 + Math.floor(i / 4) * 12;
      g.fillStyle = c; g.fillRect(x, y, 12, 3); g.fillStyle = '#c8d0da'; g.fillText(t, x + 16, y + 4);
    });
  }
}
