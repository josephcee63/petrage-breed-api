import { Router } from "express";

import { getBreedContent } from "../../api/getBreedContent.js";
import { breedContentRateLimiter } from "../middleware/rateLimit.js";
import { asyncHandler, badRequest, notFound } from "../errors.js";

import type { LoadedBreedData } from "../../lib/types.js";

export interface ContentRouteDependencies {
  breedData?: LoadedBreedData;
  fetchImplementation?: typeof fetch;
  wordPressBaseUrl: string;
}

export function createContentRouter(dependencies: ContentRouteDependencies): Router {
  const router = Router();

  router.get(
    "/breed/:input/content",
    breedContentRateLimiter,
    asyncHandler(async (request, response) => {
      const input = getSingleParam(request.params.input, "Breed input is required");
      const result = await getBreedContent(input, {
        baseUrl: dependencies.wordPressBaseUrl,
        ...(dependencies.breedData ? { breedData: dependencies.breedData } : {}),
        ...(dependencies.fetchImplementation
          ? { fetchImplementation: dependencies.fetchImplementation }
          : {}),
      });

      if (!result) {
        throw notFound("Breed not found");
      }

      response.json(result);
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
