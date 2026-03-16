import { Router } from "express";

import { compareBreeds } from "../../api/compareBreeds.js";
import { compareRateLimiter } from "../middleware/rateLimit.js";
import { asyncHandler, badRequest, notFound } from "../errors.js";

import type { Response } from "express";
import type { LoadedBreedData } from "../../lib/types.js";

export interface CompareRouteDependencies {
  breedData?: LoadedBreedData;
}

const COMPARE_CACHE_CONTROL = "public, max-age=300, s-maxage=3600";

export function createCompareRouter(dependencies?: CompareRouteDependencies): Router {
  const router = Router();

  router.get(
    "/compare",
    compareRateLimiter,
    asyncHandler(async () => {
      throw badRequest("Both breeds are required");
    }),
  );

  router.get(
    "/compare/:left",
    compareRateLimiter,
    asyncHandler(async () => {
      throw badRequest("Both breeds are required");
    }),
  );

  router.get(
    "/compare/:left/:right",
    compareRateLimiter,
    asyncHandler(async (request, response) => {
      const left = getSingleParam(request.params.left, "Both breeds are required");
      const right = getSingleParam(request.params.right, "Both breeds are required");
      const comparison = await compareBreeds(
        left,
        right,
        dependencies?.breedData ? { breedData: dependencies.breedData } : {},
      );

      if (!comparison) {
        throw notFound("One or both breeds not found");
      }

      attachFinalCacheControlDebugHeader(response);
      response.setHeader("Cache-Control", COMPARE_CACHE_CONTROL);
      response.setHeader("X-Debug-Cache-Policy", "compare-success");
      response.setHeader("X-Debug-Build", "cache-pr-debug-1");
      response.setHeader("X-Debug-Cache-Control-Target", COMPARE_CACHE_CONTROL);
      response.setHeader(
        "X-Debug-PreSend-Cache-Control",
        getHeaderStringValue(response.getHeader("Cache-Control")),
      );
      response.json(comparison);
    }),
  );

  return router;
}

function getSingleParam(value: string | string[] | undefined, errorMessage: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw badRequest(errorMessage);
  }

  return value;
}

function attachFinalCacheControlDebugHeader(response: Response): void {
  const originalWriteHead = response.writeHead;

  response.writeHead = function writeHead(this: Response, ...args: Parameters<Response["writeHead"]>) {
    this.setHeader(
      "X-Debug-Final-Cache-Control",
      getHeaderStringValue(this.getHeader("Cache-Control")),
    );

    return originalWriteHead.apply(this, args);
  } as Response["writeHead"];
}

function getHeaderStringValue(value: number | string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === undefined) {
    return "";
  }

  return String(value);
}
