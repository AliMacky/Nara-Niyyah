/**
 * Seeded pseudo-random number generator (mulberry32).
 * Produces deterministic sequences so mock data is stable across reloads.
 */
export function createRng(seed: number) {
  let s = seed | 0;
  return {
    /** Returns a float in [0, 1). */
    next(): number {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Returns an integer in [min, max] inclusive. */
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    /** Returns a float in [min, max). */
    float(min: number, max: number): number {
      return this.next() * (max - min) + min;
    },
    /** Picks a random element from an array. */
    pick<T>(arr: readonly T[]): T {
      return arr[this.int(0, arr.length - 1)];
    },
    /** Shuffles an array (Fisher-Yates), returns new array. */
    shuffle<T>(arr: readonly T[]): T[] {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = this.int(0, i);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

export type Rng = ReturnType<typeof createRng>;

/** Simulate network latency (150–400ms). */
export function delay(rng: Rng): Promise<void> {
  const ms = rng.int(150, 400);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
