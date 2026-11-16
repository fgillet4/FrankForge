/**
 * Trees, rocks and other natural objects, scattered from the world seed to suit each terrain
 * and planet. The engineer mines them by hand for wood and stone.
 */

import seedrandom from 'seedrandom';
import { PlanetType, ResourceType, TerrainType, type PlanetMap } from '../types';

export interface NatureKind {
  name: string;
  /** Seconds of hand mining. */
  mine: number;
  yields: Record<string, number>;
}

export const NATURE: Record<string, NatureKind> = {
  tree_broadleaf: { name: 'Tree', mine: 1, yields: { wood: 4 } },
  tree_pine: { name: 'Pine tree', mine: 1, yields: { wood: 4 } },
  tree_snow_pine: { name: 'Snowy pine', mine: 1, yields: { wood: 4 } },
  tree_dead: { name: 'Dead tree', mine: 0.6, yields: { wood: 2 } },
  tree_charred: { name: 'Charred tree', mine: 0.6, yields: { wood: 2 } },
  tree_palm: { name: 'Palm tree', mine: 1, yields: { wood: 3 } },
  tree_alien: { name: 'Glowbulb tree', mine: 1.2, yields: { wood: 5 } },
  alien_fungus: { name: 'Giant fungus', mine: 0.6, yields: { wood: 2 } },
  cactus: { name: 'Cactus', mine: 0.5, yields: { wood: 1 } },
  bush: { name: 'Shrub', mine: 0.4, yields: { wood: 1 } },
  rock_boulder: { name: 'Boulder', mine: 2, yields: { stone: 24 } },
  rock_small: { name: 'Rocks', mine: 1, yields: { stone: 8 } },
  rock_sandstone: { name: 'Sandstone', mine: 2, yields: { stone: 20 } },
  rock_red: { name: 'Iron-rich rock', mine: 2, yields: { stone: 14, iron_ore: 6 } },
  rock_basalt: { name: 'Basalt', mine: 2.5, yields: { stone: 22, sulfur: 2 } },
  ice_boulder: { name: 'Ice boulder', mine: 1.5, yields: { stone: 6 } },
  crystal_cluster: { name: 'Crystal cluster', mine: 2, yields: { silicon_ore: 12, stone: 4 } },
};

export interface NatureObject {
  kind: string;
  x: number;
  y: number;
  /** Offset within the tile, so rows of trees don't line up. */
  ox: number;
  oy: number;
  flip: boolean;
}

type Table = [string, number][];

/** What grows on each terrain, as (kind, chance per tile). */
function table(terrain: TerrainType, planet: PlanetType): Table {
  const mars = planet === PlanetType.MARS_LIKE;
  const desert = planet === PlanetType.DESERT;
  const ocean = planet === PlanetType.OCEAN;
  const rock: [string, number] = [mars ? 'rock_red' : 'rock_boulder', 0];
  const r = (c: number): [string, number] => [rock[0], c];
  switch (terrain) {
    case TerrainType.GRASS: return mars ? [r(0.03), ['rock_small', 0.02]]
      : [['tree_broadleaf', 0.05], ['bush', 0.04], ['rock_small', 0.012], r(0.006)];
    case TerrainType.FOREST: return mars ? [r(0.05), ['tree_dead', 0.05]]
      : [['tree_broadleaf', 0.3], ['tree_pine', 0.22], ['bush', 0.05]];
    case TerrainType.HILLS: return [r(0.06), ['rock_small', 0.06], [mars ? 'rock_small' : 'tree_pine', 0.05]];
    case TerrainType.MOUNTAINS: return [r(0.12), ['rock_small', 0.08]];
    case TerrainType.SAND: return desert ? [['cactus', 0.035], ['rock_sandstone', 0.025], ['tree_dead', 0.01]]
      : ocean ? [['tree_palm', 0.05], ['rock_small', 0.01]]
      : mars ? [r(0.02), ['rock_small', 0.02]]
      : [['rock_sandstone', 0.015], ['tree_palm', 0.01], ['bush', 0.01]];
    case TerrainType.SNOW: return [['tree_snow_pine', 0.09], ['rock_boulder', 0.02]];
    case TerrainType.ICE: return [['ice_boulder', 0.03]];
    case TerrainType.VOLCANIC: return [['rock_basalt', 0.06], ['tree_charred', 0.03]];
    case TerrainType.CAVE: return [r(0.06)];
    case TerrainType.ALIEN_GRASS: return [['tree_alien', 0.05], ['alien_fungus', 0.04]];
    case TerrainType.ALIEN_FOREST: return [['tree_alien', 0.3], ['alien_fungus', 0.1]];
    case TerrainType.ALIEN_CRYSTAL: return [['crystal_cluster', 0.15]];
    default: return [];
  }
}

export const tileKey = (x: number, y: number) => y * 100000 + x;

/** Objects for a whole map, keyed by tile, minus the ones already mined. */
export function scatterNature(map: PlanetMap, seed: number, planet: PlanetType, removed: Iterable<number>): Map<number, NatureObject> {
  const rng = seedrandom(`${seed}:nature`);
  const out = new Map<number, NatureObject>();
  const gone = new Set(removed);
  const cx = map.width / 2;
  const cy = map.height / 2;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y][x];
      // Draw every roll, even unused, so one tile's objects don't depend on its neighbours'.
      const roll = rng();
      const ox = rng() * 0.5 - 0.25;
      const oy = rng() * 0.5 - 0.25;
      const flip = rng() < 0.5;
      if (!tile.traversable || gone.has(tileKey(x, y))) continue;
      // Keep the landing site clear, and deposits mostly so.
      if (Math.hypot(x - cx, y - cy) < 4) continue;
      const scale = tile.resource !== ResourceType.NONE ? 0.35 : 1;
      let acc = 0;
      for (const [kind, chance] of table(tile.terrain, planet)) {
        acc += chance * scale;
        if (roll < acc) {
          out.set(tileKey(x, y), { kind, x, y, ox, oy, flip });
          break;
        }
      }
    }
  }
  return out;
}
