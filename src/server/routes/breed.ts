import { Router } from "express";

import { getBreed } from "../../api/getBreed.js";
import { asyncHandler, badRequest, notFound } from "../errors.js";

import type { LoadedBreedData } from "../../lib/types.js";

export interface BreedRouteDependencies {
  breedData?: LoadedBreedData;
}

export function createBreedRouter(dependencies?: BreedRouteDependencies): Router {
  const router = Router();

  router.get(
    "/breed/:input",
    asyncHandler(async (request, response) => {
      const input = getSingleParam(request.params.input, "Breed input is required");
      const breed = await getBreed(input, dependencies?.breedData ? { breedData: dependencies.breedData } : {});

      if (!breed) {
        throw notFound("Breed not found");
      }

      response.json(breed);
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
