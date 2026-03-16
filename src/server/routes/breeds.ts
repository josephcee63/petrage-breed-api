import { Router } from "express";

import { getBreedList } from "../../api/getBreedList.js";
import { breedListRateLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../errors.js";

import type { Response } from "express";
import type { LoadedBreedData } from "../../lib/types.js";

export interface BreedsRouteDependencies {
  breedData?: LoadedBreedData;
}

const BREEDS_CACHE_CONTROL = "public, max-age=300, s-maxage=86400";

export function createBreedsRouter(dependencies?: BreedsRouteDependencies): Router {
  const router = Router();

  router.get(
    "/breeds",
    breedListRateLimiter,
    asyncHandler(async (_request, response) => {
      const breeds = await getBreedList(
        dependencies?.breedData ? { breedData: dependencies.breedData } : {},
      );

      attachFinalCacheControlDebugHeader(response);
      response.setHeader("Cache-Control", BREEDS_CACHE_CONTROL);
      response.setHeader("X-Debug-Cache-Policy", "breeds-success");
      response.setHeader("X-Debug-Build", "cache-pr-debug-1");
      response.setHeader("X-Debug-Cache-Control-Target", BREEDS_CACHE_CONTROL);
      response.setHeader(
        "X-Debug-PreSend-Cache-Control",
        getHeaderStringValue(response.getHeader("Cache-Control")),
      );
      response.json(breeds);
    }),
  );

  return router;
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
