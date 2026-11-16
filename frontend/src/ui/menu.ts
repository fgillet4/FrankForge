/**
 * The menus, as plain DOM over the canvas: the main menu's panels, the pause menu, and the
 * help and settings panels both share.
 */

import './menu.css';
import { loadSettings, writeSettings, type Settings } from '../lib/save';

export const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

/** A panel with a title and a close button; `onClose` runs when it is dismissed. */
export function panel(title: string, onClose: () => void): { root: HTMLElement; body: HTMLElement } {
  const root = el('section', 'mm-panel');
  const close = el('button', 'mm-close', '×');
  close.title = 'Close';
  close.onclick = onClose;
  root.append(close, el('h2', undefined, title));
  const body = el('div');
  root.append(body);
  return { root, body };
}

export const HOW_TO_PLAY = `
  <p>Everything in FrankForge is simulated: fluids flow because of pressure differences, reactions run
  until they reach chemical equilibrium, and the power grid's frequency drifts whenever supply and demand
  don't match.</p>
  <h3>Controls</h3>
  <div class="mm-keys">
    <kbd>W A S D</kbd><span>Walk</span>
    <kbd>Mouse wheel</kbd><span>Zoom toward the cursor</span>
    <kbd>Drag</kbd><span>Look around; the view recentres once you walk</span>
    <kbd>Click</kbd><span>Pick a building in the bar, then click the map to place it</span>
    <kbd>Drag</kbd><span>With the pipe selected, lay pipe</span>
    <kbd>R</kbd><span>Rotate the building you're placing</span>
    <kbd>Right-click</kbd><span>Remove a building or pipe</span>
    <kbd>Click</kbd><span>Inspect a building: pressures, temperatures, what's inside</span>
    <kbd>Space</kbd><span>Pause or resume the simulation</span>
    <kbd>+ / −</kbd><span>Speed the simulation up or slow it down</span>
    <kbd>Esc</kbd><span>Cancel placing, close the inspector, or open this menu</span>
  </div>
  <h3>Getting started</h3>
  <ul>
    <li>Wells must stand on their deposit: a gas well on methane, a water well on water or ice.</li>
    <li>A first power plant: gas from a well fires a boiler, the boiler's steam spins a turbine, and the
    turbine exhausts into a condenser. Connect them with pipes from port to port.</li>
    <li>Watch the pressure bar in the inspector. A vessel bursts at 1.5× its rated pressure, and whatever
    it held comes out.</li>
    <li>Keep the grid near its nominal frequency. Too little generation and it blacks out; use
    <em>Black start</em> in the grid panel to bring it back.</li>
  </ul>`;

/** The settings form; changes save and apply straight away. */
export function settingsBody(apply: (s: Settings) => void): HTMLElement {
  const s = loadSettings();
  const body = el('div');
  const slider = (label: string, key: keyof Settings) => {
    body.append(el('h3', undefined, label));
    const row = el('div', 'mm-slider');
    const input = el('input');
    input.type = 'range'; input.min = '0'; input.max = '1'; input.step = '0.05'; input.value = String(s[key]);
    const out = el('output', undefined, `${Math.round(s[key] * 100)}%`);
    input.oninput = () => {
      s[key] = parseFloat(input.value);
      out.textContent = `${Math.round(s[key] * 100)}%`;
      writeSettings(s);
      apply(s);
    };
    row.append(input, out);
    body.append(row);
  };
  slider('Master volume', 'volume');
  slider('Plant ambience', 'ambient');
  return body;
}

/** The in-game pause menu. */
export class PauseMenu {
  private root: HTMLElement | null = null;

  constructor(private actions: { resume: () => void; quit: () => void; applySettings: (s: Settings) => void }) {}

  get open() { return this.root !== null; }

  show() {
    if (this.root) return;
    this.root = el('div', 'mm');
    const dim = el('div', 'mm-dim');
    dim.onclick = () => this.actions.resume();
    const card = el('div', 'mm-pause');
    card.append(el('h2', undefined, 'Paused'));
    const nav = el('nav', 'mm-nav');
    let sub: HTMLElement | null = null;
    const openSub = (title: string, body: HTMLElement | string) => {
      sub?.remove();
      const p = panel(title, () => { sub?.remove(); sub = null; });
      p.root.classList.add('center');
      if (typeof body === 'string') p.body.innerHTML = body; else p.body.append(body);
      sub = p.root;
      this.root?.append(sub);
    };
    const item = (label: string, fn: () => void, primary = false) => {
      const b = el('button', primary ? 'primary' : undefined, label);
      b.onclick = fn;
      nav.append(b);
    };
    item('Resume', () => this.actions.resume(), true);
    item('How to play', () => openSub('How to play', HOW_TO_PLAY));
    item('Settings', () => openSub('Settings', settingsBody(this.actions.applySettings)));
    item('Save & quit to menu', () => this.actions.quit());
    card.append(nav);
    this.root.append(dim, card);
    document.body.append(this.root);
  }

  /** Closes the open sub-panel first, then the menu; true if it closed anything. */
  back(): boolean {
    const sub = this.root?.querySelector('.mm-panel');
    if (sub) { sub.remove(); return true; }
    return false;
  }

  hide() {
    this.root?.remove();
    this.root = null;
  }
}
