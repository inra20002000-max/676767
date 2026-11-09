// ============================================================================
// Deterministic Seeded Pseudo-Random Number Generator (Mulberry32 + SplitMix32)
// ============================================================================

export class PRNG {
  private initialSeed: number;
  private state: number;

  constructor(seed?: string | number) {
    this.initialSeed = PRNG.hashSeed(seed);
    this.state = this.initialSeed;
  }

  /**
   * Hashes a string or number into a 32-bit unsigned integer seed.
   */
  public static hashSeed(seed?: string | number): number {
    if (seed === undefined || seed === null || seed === "") {
      return (Math.random() * 0xffffffff) >>> 0;
    }
    if (typeof seed === "number") {
      return (Math.floor(seed) >>> 0) || 1;
    }
    // FNV-1a 32-bit hash
    let h = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /**
   * Returns a uniform pseudorandom float in [0, 1).
   * Uses Mulberry32 algorithm.
   */
  public next(): number {
    let z = (this.state += 0x6d2b79f5);
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Uniform float between min and max (default: [0, 1)).
   */
  public float(min: number = 0, max: number = 1): number {
    return min + (max - min) * this.next();
  }

  /**
   * Uniform integer between min and max inclusive: [min, max].
   */
  public int(min: number, max: number): number {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    if (low >= high) return low;
    return Math.floor(this.float(low, high + 1));
  }

  /**
   * Boolean with probability p of returning true.
   */
  public boolean(p: number = 0.5): boolean {
    return this.next() < p;
  }

  /**
   * Uniform random item from an array.
   */
  public choice<T>(items: readonly T[]): T {
    if (!items || items.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  /**
   * Weighted item choice from an array with matching weight array.
   */
  public weightedChoice<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length !== weights.length || items.length === 0) {
      throw new Error("Items and weights must be non-empty and have matching length");
    }
    let total = 0;
    for (let i = 0; i < weights.length; i++) {
      total += Math.max(0, weights[i]);
    }
    if (total <= 0) return items[0];

    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= Math.max(0, weights[i]);
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /**
   * Weighted pick from a key-weight record dictionary.
   */
  public weightedPick(weights: Record<string, number>): string {
    const keys = Object.keys(weights);
    if (keys.length === 0) return "";
    let total = 0;
    for (const k of keys) {
      total += Math.max(0, weights[k]);
    }
    if (total <= 0) return keys[0];

    let roll = this.next() * total;
    for (const k of keys) {
      roll -= Math.max(0, weights[k]);
      if (roll <= 0) return k;
    }
    return keys[keys.length - 1];
  }

  /**
   * Resets PRNG back to initial seed or new seed.
   */
  public reset(newSeed?: string | number): void {
    if (newSeed !== undefined) {
      this.initialSeed = PRNG.hashSeed(newSeed);
    }
    this.state = this.initialSeed;
  }

  /**
   * Current internal seed state.
   */
  public getState(): number {
    return this.state;
  }

  /**
   * Restore internal state.
   */
  public setState(s: number): void {
    this.state = s >>> 0;
  }
}

// Default global instance for deterministic or convenience usage
export const defaultPRNG = new PRNG(1337);
