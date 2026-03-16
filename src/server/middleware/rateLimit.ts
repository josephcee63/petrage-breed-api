import rateLimit from "express-rate-limit";

import { rateLimitConfig, type RateLimitPolicyConfig } from "../../config/rateLimit.js";

import type { Request, Response } from "express";

const RATE_LIMIT_RESPONSE = {
  error: "Too many requests",
  message: "Please wait a moment and try again.",
} as const;

export const compareRateLimiter = createRateLimiter("compareRateLimiter", rateLimitConfig.compare);
export const breedContentRateLimiter = createRateLimiter(
  "breedContentRateLimiter",
  rateLimitConfig.breedContent,
);
export const breedListRateLimiter = createRateLimiter(
  "breedListRateLimiter",
  rateLimitConfig.breeds,
);
export const apiSafetyLimiter = createRateLimiter("apiSafetyLimiter", rateLimitConfig.apiSafety);

function createRateLimiter(limiterName: string, policy: RateLimitPolicyConfig) {
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
