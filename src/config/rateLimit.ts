export interface RateLimitPolicyConfig {
  windowMs: number;
  max: number;
}

export interface RateLimitConfig {
  compare: RateLimitPolicyConfig;
  breedContent: RateLimitPolicyConfig;
  breeds: RateLimitPolicyConfig;
  apiSafety: RateLimitPolicyConfig;
}

const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
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
};

export const rateLimitConfig = readRateLimitConfig();

export function readRateLimitConfig(
  env: NodeJS.ProcessEnv = process.env,
): RateLimitConfig {
  return {
    compare: {
      windowMs: parsePositiveIntEnv(
        "COMPARE_RATE_LIMIT_WINDOW_MS",
        DEFAULT_RATE_LIMIT_CONFIG.compare.windowMs,
        env,
      ),
      max: parsePositiveIntEnv(
        "COMPARE_RATE_LIMIT_MAX",
        DEFAULT_RATE_LIMIT_CONFIG.compare.max,
        env,
      ),
    },
    breedContent: {
      windowMs: parsePositiveIntEnv(
        "BREED_CONTENT_RATE_LIMIT_WINDOW_MS",
        DEFAULT_RATE_LIMIT_CONFIG.breedContent.windowMs,
        env,
      ),
      max: parsePositiveIntEnv(
        "BREED_CONTENT_RATE_LIMIT_MAX",
        DEFAULT_RATE_LIMIT_CONFIG.breedContent.max,
        env,
      ),
    },
    breeds: {
      windowMs: parsePositiveIntEnv(
        "BREEDS_RATE_LIMIT_WINDOW_MS",
        DEFAULT_RATE_LIMIT_CONFIG.breeds.windowMs,
        env,
      ),
      max: parsePositiveIntEnv(
        "BREEDS_RATE_LIMIT_MAX",
        DEFAULT_RATE_LIMIT_CONFIG.breeds.max,
        env,
      ),
    },
    apiSafety: {
      windowMs: parsePositiveIntEnv(
        "API_SAFETY_RATE_LIMIT_WINDOW_MS",
        DEFAULT_RATE_LIMIT_CONFIG.apiSafety.windowMs,
        env,
      ),
      max: parsePositiveIntEnv(
        "API_SAFETY_RATE_LIMIT_MAX",
        DEFAULT_RATE_LIMIT_CONFIG.apiSafety.max,
        env,
      ),
    },
  };
}

export function parsePositiveIntEnv(
  name: string,
  fallback: number,
  env: NodeJS.ProcessEnv = process.env,
): number {
  const rawValue = env[name];
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}
