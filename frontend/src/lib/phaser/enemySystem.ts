/**
 * Enemy AI system: A* pathfinding + spawn/update logic.
 */

import type { PlanetMap } from '../types';
import { TerrainType } from '../types';
import type { Enemy } from './characterRenderer';

// ── A* ───────────────────────────────────────────────────────────────────────

interface ANode {
  x: number; y: number;
  g: number; h: number; f: number;
  parent: ANode | null;
}

function heuristic(ax: number, ay: number, bx: number, by: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function walkable(x: number, y: number, map: PlanetMap): boolean {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
  const t = map.tiles[y]?.[x];
  return t ? t.traversable : false;
}

export function aStar(
  sx: number, sy: number,
  gx: number, gy: number,
  map: PlanetMap,
): { x: number; y: number }[] {
  const open: ANode[] = [];
  const closed = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;

  const start: ANode = { x: sx, y: sy, g: 0, h: heuristic(sx, sy, gx, gy), f: 0, parent: null };
  start.f = start.g + start.h;
  open.push(start);

  while (open.length > 0) {
    let li = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[li].f) li = i;
    const cur = open.splice(li, 1)[0];

    if (cur.x === gx && cur.y === gy) {
      const path: { x: number; y: number }[] = [];
      let n: ANode | null = cur;
      while (n) { path.unshift({ x: n.x, y: n.y }); n = n.parent; }
      return path;
    }

    closed.add(key(cur.x, cur.y));

    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!walkable(nx, ny, map) || closed.has(key(nx, ny))) continue;
      const g = cur.g + 1;
      const existing = open.find(n => n.x === nx && n.y === ny);
      if (existing) {
        if (g < existing.g) { existing.g = g; existing.f = g + existing.h; existing.parent = cur; }
      } else {
        const h = heuristic(nx, ny, gx, gy);
        open.push({ x: nx, y: ny, g, h, f: g + h, parent: cur });
      }
    }
  }
  return [];
}

// ── Spawn / update ────────────────────────────────────────────────────────────

const SPAWN_INTERVAL = 10;   // seconds between spawns
const MAX_ENEMIES    = 15;
const ATTACK_RADIUS  = 1.2;  // tiles
const ATTACK_DPS     = 6;    // damage per second

let idCounter = 0;

export function createEnemyState() {
  return {
    enemies:     [] as Enemy[],
    spawnTimer:  SPAWN_INTERVAL,
  };
}

export type EnemyState = ReturnType<typeof createEnemyState>;

/** Mutates enemyState in-place. Returns damage dealt to player this tick. */
export function updateEnemies(
  state:      EnemyState,
  dt:         number,
  playerX:    number,
  playerY:    number,
  map:        PlanetMap,
): number {
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.enemies.length < MAX_ENEMIES) {
    state.spawnTimer = SPAWN_INTERVAL;
    spawnEnemy(state, map);
  }

  const px = Math.floor(playerX);
  const py = Math.floor(playerY);
  let dmg = 0;

  for (const e of state.enemies) {
    // Recompute path every 2 s
    e.recomputeTimer -= dt;
    if (e.recomputeTimer <= 0 || e.path.length === 0) {
      e.recomputeTimer = 2;
      e.path = aStar(Math.floor(e.isoX), Math.floor(e.isoY), px, py, map);
      e.pathIndex = 1;
    }

    // Move along path
    if (e.pathIndex < e.path.length) {
      const tgt = e.path[e.pathIndex];
      const dx = tgt.x - e.isoX, dy = tgt.y - e.isoY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const step = e.speed * dt;
      if (dist <= step) { e.isoX = tgt.x; e.isoY = tgt.y; e.pathIndex++; }
      else { e.isoX += dx/dist * step; e.isoY += dy/dist * step; }
    }

    // Attack
    const d = Math.abs(e.isoX - playerX) + Math.abs(e.isoY - playerY);
    if (d < ATTACK_RADIUS) dmg += ATTACK_DPS * dt;
  }

  state.enemies = state.enemies.filter(e => e.health > 0);
  return dmg;
}

function spawnEnemy(state: EnemyState, map: PlanetMap) {
  const w = map.width, h = map.height;
  const edge = Math.floor(Math.random() * 4);
  let sx: number, sy: number;
  switch (edge) {
    case 0: sx = Math.floor(Math.random()*w); sy = 0;     break;
    case 1: sx = Math.floor(Math.random()*w); sy = h-1;   break;
    case 2: sx = 0;   sy = Math.floor(Math.random()*h);   break;
    default: sx = w-1; sy = Math.floor(Math.random()*h);  break;
  }
  if (!walkable(sx, sy, map)) return;
  state.enemies.push({
    id: idCounter++,
    isoX: sx, isoY: sy,
    health: 100, maxHealth: 100,
    speed: 1.5 + Math.random() * 0.8,
    path: [], pathIndex: 0,
    recomputeTimer: 0,
  });
}
