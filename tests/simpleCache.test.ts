import { describe, expect, it, vi, afterEach } from "vitest";

import { SimpleCache } from "../src/lib/simpleCache.js";

describe("SimpleCache", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a value before expiry", () => {
    vi.useFakeTimers();
    const cache = new SimpleCache<string>();

    cache.set("greeting", "hello", 1_000);

    expect(cache.get("greeting")).toBe("hello");
  });

  it("does not return expired values", () => {
    vi.useFakeTimers();
    const cache = new SimpleCache<string>();

    cache.set("greeting", "hello", 1_000);
    vi.advanceTimersByTime(1_001);

    expect(cache.get("greeting")).toBeUndefined();
  });

  it("getOrSet caches the loaded value", async () => {
    vi.useFakeTimers();
    const cache = new SimpleCache<string>();
    const loader = vi.fn(async () => "loaded");

    await expect(cache.getOrSet("key", 1_000, loader)).resolves.toBe("loaded");
    await expect(cache.getOrSet("key", 1_000, loader)).resolves.toBe("loaded");

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("reruns the loader after expiry", async () => {
    vi.useFakeTimers();
    const cache = new SimpleCache<string>();
    let callCount = 0;
    const loader = vi.fn(async () => {
      callCount += 1;
      return `value-${callCount}`;
    });

    await expect(cache.getOrSet("key", 1_000, loader)).resolves.toBe("value-1");
    vi.advanceTimersByTime(1_001);
    await expect(cache.getOrSet("key", 1_000, loader)).resolves.toBe("value-2");

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("reuses one pending loader for simultaneous calls", async () => {
    const cache = new SimpleCache<string>();
    const loader = vi.fn(async () => {
      await Promise.resolve();
      return "shared";
    });

    const [first, second] = await Promise.all([
      cache.getOrSet("key", 1_000, loader),
      cache.getOrSet("key", 1_000, loader),
    ]);

    expect(first).toBe("shared");
    expect(second).toBe("shared");
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
