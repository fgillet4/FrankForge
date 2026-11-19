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
    <kbd>W A S D</kbd><span>Walk (belts carry you along)</span>
    <kbd>Hold right-click</kbd><span>Mine: chop trees, break rocks, dig ore, pick buildings back up</span>
    <kbd>Hold Space</kbd><span>Shoot the alien nearest the cursor</span>
    <kbd>E</kbd><span>Inventory, gear and hand crafting. In the crafting list, click to make one, Shift-click for as many as you can. In a machine's window, click a stack in your pockets to put it all in, or right-click to put in 1, 5, 10 or half</span>
    <kbd>Right-click item</kbd><span>In your pockets or gear slots: what you can do with it, such as wield, wear, place, split in half or drop. Shift-click a stack in your pockets to drop it straight away. Dropped stacks lie on the ground: click one in reach, or hold F beside it, to take it back</span>
    <kbd>T</kbd><span>Research</span>
    <kbd>P</kbd><span>Production graphs</span>
    <kbd>M</kbd><span>Enlarge the minimap; click it to look somewhere</span>
    <kbd>V</kbd><span>Flow view: colours every pipe by how fast it's flowing against the limit for that kind of line (red means too fast, which erodes and wastes pumping), with chevrons running the way it flows. Press again to colour by pressure instead, and again to turn it off</span>
    <kbd>H / Shift-H</kbd><span>Work a height up or down: ground, low pipe rack, high pipe rack. The gauge at the top left shows where you are; click a height on it to go there, or Esc to drop back to the ground. Pipe goes on the rack you're at, and risers join the heights</span>
    <kbd>Click</kbd><span>Place the building in hand. Take one from your pockets in the E menu (in sandbox, straight from its crafting list)</span>
    <kbd>Drag</kbd><span>While placing, lay a line of pipe or belt, or a row of buildings (poles space themselves)</span>
    <kbd>R</kbd><span>Rotate what you're placing, or the belt or inserter under the cursor</span>
    <kbd>Q</kbd><span>Pick up the kind of building under the cursor to place more</span>
    <kbd>Click</kbd><span>Open a machine, or inspect a process building</span>
    <kbd>Ctrl/⌘-click</kbd><span>Quick transfer: take a machine's output (or a chest's contents), fill it with ore and 5 fuel at a time, so your wood stretches round several machines</span>
    <kbd>Hold F</kbd><span>Pick items up off the belts you're standing by</span>
    <kbd>Alt</kbd><span>Alt mode: what each machine makes and which way every inserter works</span>
    <kbd>Shift-click</kbd><span>Repair a damaged building with a repair pack</span>
    <kbd>Mouse wheel</kbd><span>Zoom toward the cursor; drag to look around</span>
    <kbd>Tab / Shift-Tab</kbd><span>Speed the simulation up or down; past the fastest it pauses</span>
    <kbd>Esc</kbd><span>Close a window, cancel placing, or open this menu</span>
  </div>
  <h3>Getting started</h3>
  <ul>
    <li>The goal under the minimap always shows a next step.</li>
    <li>Chop trees for wood and break rocks for stone. Five stone make a furnace; fuel it with wood and drop in ore.</li>
    <li>A burner drill on an ore deposit mines by itself. Point its output at a furnace or a belt.</li>
    <li>Coal (the black deposits) burns longer than wood: a lump of coal gives about 1⅔ times the heat of a log, and charcoal twice. A charcoal kiln (a kolmila) smoulders four logs down to one lump of charcoal, losing half the heat but packing the rest densely.</li>
    <li>Rivers flow: a water wheel standing mostly in one makes up to 100 kW, more where the current runs fast (hover the water to see). Enough for an air blower before you have a boiler.</li>
    <li>Lakes and the shallows along rivers take a water well for boiler feed; deep water you can't wade into or build on.</li>
    <li>Shipping (research it after steel): build docks on the shore, put a cargo ship in the water and click it to give it a schedule — which dock to call at, whether to load or unload there, and when to sail on. Ships burn coal or other fuel under way and refuel from fuel left on a dock; inserters fill and empty docks like chests.</li>
    <li>Craft red science packs and a lab, choose a research (T), and the lab will unlock new buildings.</li>
    <li>Electric buildings need a power pole whose blue area covers them; poles wire to each other within reach.</li>
    <li>Wells, drills and other extraction buildings must stand mostly on their deposit; it lights up green while you place one.</li>
    <li>A first power plant: gas from a well fires a boiler, the boiler's steam spins a turbine, and the
    turbine exhausts into a condenser. Connect them with pipes from port to port.</li>
    <li>Watch the pressure bar in the inspector. A vessel bursts at 1.5× its rated pressure, and whatever
    it held comes out.</li>
    <li>Pollution — vented gas and smoke — drifts out from where it's made and the ground soaks it up, forests best. A nest it reaches breathes it in and sends attackers once it has taken in enough. Open the map (M) and turn on Pollution to see the cloud and which nests it has stirred. Coal smokes most, charcoal least. Turrets keep them off.</li>
    <li>Oil extraction (after fluid handling): a pumpjack on an oil field lifts crude — a little dissolved gas, then naphtha, kerosene, diesel and heavy oil. The light ends flash off in a tank, so give it somewhere to vent.</li>
    <li>Oil refining: the crude distillation column boils crude in its fired reboiler (pipe it fuel gas and air) and the cuts sort themselves up the trays by boiling point — gas and naphtha at the top, kerosene and diesel from the side, heavy oil from the sump. Throttle the feed and the draws with valves: draw too much off the top and there's no reflux, so the cuts smear; fire too hard and the sump boils dry. Its inspector shows every tray, top to bottom.</li>
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
