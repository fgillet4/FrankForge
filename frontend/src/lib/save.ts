/**
 * The saved game and player settings, in localStorage. A world is fully described by its
 * generator settings, so a save is those plus the plant layout and where the engineer stands.
 */

import { mapGenerator } from './mapGenerator';
import { PlanetType, type PlanetMap } from './types';
import type { Placed } from './process/engine';

export interface WorldSettings { seed: number; planet: PlanetType; size: number; richness: number }
export interface SaveGame {
  world: WorldSettings;
  player: { x: number; y: number } | null;
  layout: Placed[];
  savedAt: number;
  /** Survival (build from what you make) or sandbox (everything free); old saves are sandbox. */
  mode?: 'survival' | 'sandbox';
  peaceful?: boolean;
  engineer?: unknown;
  factory?: unknown;
  combat?: unknown;
  /** Trees and rocks mined, by tile key. */
  nature?: number[];
  /** Health of damaged process buildings. */
  hp?: [number, number][];
}
export interface Settings { volume: number; ambient: number }

const SAVE_KEY = 'frankforge.save.v2';
const LEGACY_LAYOUT_KEY = 'frankforge.layout.v1';
const SETTINGS_KEY = 'frankforge.settings.v1';

export const DEFAULT_WORLD: WorldSettings = { seed: 42, planet: PlanetType.EARTH_LIKE, size: 120, richness: 0.7 };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
}

export function loadSave(): SaveGame | null {
  const save = read<SaveGame>(SAVE_KEY);
  if (save?.world) return save;
  // Plants built before worlds were saved: keep them on the default world.
  const layout = read<Placed[]>(LEGACY_LAYOUT_KEY);
  if (Array.isArray(layout) && layout.length) return { world: DEFAULT_WORLD, player: null, layout, savedAt: 0 };
  return null;
}

export function writeSave(save: SaveGame) {
  write(SAVE_KEY, save);
  try { localStorage.removeItem(LEGACY_LAYOUT_KEY); } catch { /* storage unavailable */ }
}

export function loadSettings(): Settings {
  return { volume: 0.8, ambient: 0.5, ...read<Partial<Settings>>(SETTINGS_KEY) };
}

export function writeSettings(s: Settings) {
  write(SETTINGS_KEY, s);
}

export function generateWorld(w: WorldSettings): PlanetMap {
  return mapGenerator.generateMap({
    planetType: w.planet,
    width: w.size,
    height: w.size,
    seed: w.seed,
    resourceRichness: w.richness,
    specialFeatureCount: 15,
    smoothness: 0.55,
    alienness: w.planet === PlanetType.ALIEN ? 0.8 : 0.3,
  });
}
