import { Router } from "express";

import { getBreedList } from "../../api/getBreedList.js";
import { breedListRateLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../errors.js";

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

      response.setHeader("Cache-Control", BREEDS_CACHE_CONTROL);
      response.json(breeds);
    }),
  );

  return router;
}
