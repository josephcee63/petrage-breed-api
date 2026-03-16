import { Router } from "express";

import { getBreedList } from "../../api/getBreedList.js";
import { setBreedsCacheHeaders } from "../http/cacheHeaders.js";
import { breedListRateLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../errors.js";

import type { LoadedBreedData } from "../../lib/types.js";

export interface BreedsRouteDependencies {
  breedData?: LoadedBreedData;
}

export function createBreedsRouter(dependencies?: BreedsRouteDependencies): Router {
  const router = Router();

  router.get(
    "/breeds",
    breedListRateLimiter,
    asyncHandler(async (_request, response) => {
      const breeds = await getBreedList(
        dependencies?.breedData ? { breedData: dependencies.breedData } : {},
      );

      setBreedsCacheHeaders(response);
      response.json(breeds);
    }),
  );

  return router;
}
