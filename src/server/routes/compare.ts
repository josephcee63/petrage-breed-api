import { Router } from "express";

import { compareBreeds } from "../../api/compareBreeds.js";
import {
  enforceCompareCacheHeadersOnSuccess,
  setCompareCacheHeaders,
} from "../http/cacheHeaders.js";
import { compareRateLimiter } from "../middleware/rateLimit.js";
import { asyncHandler, badRequest, notFound } from "../errors.js";

import type { LoadedBreedData } from "../../lib/types.js";

export interface CompareRouteDependencies {
  breedData?: LoadedBreedData;
}

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
    enforceCompareCacheHeadersOnSuccess,
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

      setCompareCacheHeaders(response);
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
