import rateLimit from "express-rate-limit";

import type { Request, Response } from "express";

export interface RateLimitPolicy {
  windowMs: number;
  max: number;
}

export const RATE_LIMIT_POLICIES = {
  compare: {
    windowMs: 60 * 1000,
    max: 20,
  },
  breedContent: {
    windowMs: 60 * 1000,
    max: 40,
  },
  breedList: {
    windowMs: 60 * 1000,
    max: 60,
  },
  apiSafety: {
    windowMs: 60 * 1000,
    max: 120,
  },
} satisfies Record<string, RateLimitPolicy>;

const RATE_LIMIT_RESPONSE = {
  error: "Too many requests",
  message: "Please wait a moment and try again.",
} as const;

export const compareRateLimiter = createRateLimiter("compareRateLimiter", RATE_LIMIT_POLICIES.compare);
export const breedContentRateLimiter = createRateLimiter(
  "breedContentRateLimiter",
  RATE_LIMIT_POLICIES.breedContent,
);
export const breedListRateLimiter = createRateLimiter(
  "breedListRateLimiter",
  RATE_LIMIT_POLICIES.breedList,
);
export const apiSafetyLimiter = createRateLimiter("apiSafetyLimiter", RATE_LIMIT_POLICIES.apiSafety);

function createRateLimiter(limiterName: string, policy: RateLimitPolicy) {
  return rateLimit({
    windowMs: policy.windowMs,
    max: policy.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(request: Request, response: Response) {
      console.warn("[rate-limit] exceeded", {
        route: request.originalUrl,
        ip: request.ip,
        limiterName,
      });
      response.status(429).json(RATE_LIMIT_RESPONSE);
    },
  });
}
