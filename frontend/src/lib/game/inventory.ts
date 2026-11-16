/**
 * Slot inventories: the engineer's pockets, chests, and machine buffers.
 */

import { ITEMS } from './items';

export interface Stack { item: string; count: number }

export class Inventory {
  slots: (Stack | null)[];

  constructor(size: number, slots?: (Stack | null)[]) {
    this.slots = Array.from({ length: size }, (_, i) => slots?.[i] ?? null);
  }

  resize(size: number) {
    while (this.slots.length < size) this.slots.push(null);
  }

  count(item: string): number {
    let n = 0;
    for (const s of this.slots) if (s?.item === item) n += s.count;
    return n;
  }

  /** Every item and how many, for display. */
  totals(): Map<string, number> {
    const m = new Map<string, number>();
    for (const s of this.slots) if (s) m.set(s.item, (m.get(s.item) ?? 0) + s.count);
    return m;
  }

  /** How many of an item would still fit. */
  room(item: string): number {
    const stack = ITEMS[item]?.stack ?? 100;
    let n = 0;
    for (const s of this.slots) {
      if (!s) n += stack;
      else if (s.item === item) n += stack - s.count;
    }
    return n;
  }

  /** Adds up to `count`; returns how many didn't fit. */
  add(item: string, count: number): number {
    const stack = ITEMS[item]?.stack ?? 100;
    for (const s of this.slots) {
      if (count <= 0) break;
      if (s?.item === item && s.count < stack) {
        const k = Math.min(count, stack - s.count);
        s.count += k;
        count -= k;
      }
    }
    for (let i = 0; i < this.slots.length && count > 0; i++) {
      if (this.slots[i]) continue;
      const k = Math.min(count, stack);
      this.slots[i] = { item, count: k };
      count -= k;
    }
    return count;
  }

  /** Removes up to `count`; returns how many it removed. */
  remove(item: string, count: number): number {
    let got = 0;
    for (let i = this.slots.length - 1; i >= 0 && got < count; i--) {
      const s = this.slots[i];
      if (s?.item !== item) continue;
      const k = Math.min(count - got, s.count);
      s.count -= k;
      got += k;
      if (s.count === 0) this.slots[i] = null;
    }
    return got;
  }

  has(needs: Record<string, number>, times = 1): boolean {
    return Object.entries(needs).every(([id, n]) => this.count(id) >= n * times);
  }

  /** The first item in it, for inserters taking whatever there is. */
  first(filter?: (item: string) => boolean): string | null {
    for (const s of this.slots) if (s && (!filter || filter(s.item))) return s.item;
    return null;
  }

  isEmpty(): boolean {
    return this.slots.every(s => !s);
  }

  /** Puts items into neat stacks, sorted by name. */
  sort() {
    const totals = [...this.totals()].sort((a, b) => (ITEMS[a[0]]?.name ?? a[0]).localeCompare(ITEMS[b[0]]?.name ?? b[0]));
    this.slots = this.slots.map(() => null);
    for (const [id, n] of totals) this.add(id, n);
  }

  toJSON() {
    return this.slots;
  }
}
