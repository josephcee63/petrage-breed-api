interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SimpleCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly pendingLoads = new Map<string, Promise<T>>();

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + Math.max(0, ttlMs);
    this.entries.set(key, {
      value,
      expiresAt,
    });
  }

  async getOrSet(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const cachedValue = this.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const pendingLoad = this.pendingLoads.get(key);
    if (pendingLoad) {
      return pendingLoad;
    }

    const loadPromise = loader()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        this.pendingLoads.delete(key);
      });

    this.pendingLoads.set(key, loadPromise);
    return loadPromise;
  }

  delete(key: string): void {
    this.entries.delete(key);
    this.pendingLoads.delete(key);
  }

  clearExpired(): void {
    const now = Date.now();

    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  clear(): void {
    this.entries.clear();
    this.pendingLoads.clear();
  }
}
