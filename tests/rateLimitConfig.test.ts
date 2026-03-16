import { describe, expect, it } from "vitest";

import { readRateLimitConfig } from "../src/config/rateLimit.js";

describe("rate limit config", () => {
  it("uses defaults when env vars are missing", () => {
    const config = readRateLimitConfig({});

    expect(config).toEqual({
      compare: {
        windowMs: 60_000,
        max: 20,
      },
      breedContent: {
        windowMs: 60_000,
        max: 40,
      },
      breeds: {
        windowMs: 60_000,
        max: 60,
      },
      apiSafety: {
        windowMs: 60_000,
        max: 120,
      },
    });
  });

  it("uses valid integer env vars", () => {
    const config = readRateLimitConfig({
      COMPARE_RATE_LIMIT_WINDOW_MS: "15000",
      COMPARE_RATE_LIMIT_MAX: "5",
      BREED_CONTENT_RATE_LIMIT_WINDOW_MS: "30000",
      BREED_CONTENT_RATE_LIMIT_MAX: "25",
      BREEDS_RATE_LIMIT_WINDOW_MS: "45000",
      BREEDS_RATE_LIMIT_MAX: "55",
      API_SAFETY_RATE_LIMIT_WINDOW_MS: "90000",
      API_SAFETY_RATE_LIMIT_MAX: "250",
    });

    expect(config).toEqual({
      compare: {
        windowMs: 15_000,
        max: 5,
      },
      breedContent: {
        windowMs: 30_000,
        max: 25,
      },
      breeds: {
        windowMs: 45_000,
        max: 55,
      },
      apiSafety: {
        windowMs: 90_000,
        max: 250,
      },
    });
  });

  it("falls back to defaults for invalid strings and empty values", () => {
    const config = readRateLimitConfig({
      COMPARE_RATE_LIMIT_WINDOW_MS: "",
      COMPARE_RATE_LIMIT_MAX: "not-a-number",
      BREED_CONTENT_RATE_LIMIT_WINDOW_MS: "NaN",
      BREED_CONTENT_RATE_LIMIT_MAX: " ",
    });

    expect(config.compare).toEqual({
      windowMs: 60_000,
      max: 20,
    });
    expect(config.breedContent).toEqual({
      windowMs: 60_000,
      max: 40,
    });
  });

  it("falls back to defaults for negative values", () => {
    const config = readRateLimitConfig({
      BREEDS_RATE_LIMIT_WINDOW_MS: "-1000",
      BREEDS_RATE_LIMIT_MAX: "-1",
      API_SAFETY_RATE_LIMIT_WINDOW_MS: "-60000",
      API_SAFETY_RATE_LIMIT_MAX: "-50",
    });

    expect(config.breeds).toEqual({
      windowMs: 60_000,
      max: 60,
    });
    expect(config.apiSafety).toEqual({
      windowMs: 60_000,
      max: 120,
    });
  });

  it("falls back to defaults for zero values", () => {
    const config = readRateLimitConfig({
      COMPARE_RATE_LIMIT_WINDOW_MS: "0",
      COMPARE_RATE_LIMIT_MAX: "0",
    });

    expect(config.compare).toEqual({
      windowMs: 60_000,
      max: 20,
    });
  });
});
