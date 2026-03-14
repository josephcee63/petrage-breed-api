import { getBreed } from "./getBreed.js";

import type { BreedComparisonResult, LoadedBreedData } from "../lib/types.js";

export interface CompareBreedsOptions {
  breedData?: LoadedBreedData;
}

export async function compareBreeds(
  leftInput: string,
  rightInput: string,
  options?: CompareBreedsOptions,
): Promise<BreedComparisonResult | null> {
  const sharedOptions = options?.breedData ? { breedData: options.breedData } : {};
  const [leftBreed, rightBreed] = await Promise.all([
    getBreed(leftInput, sharedOptions),
    getBreed(rightInput, sharedOptions),
  ]);

  if (!leftBreed || !rightBreed) {
    return null;
  }

  return {
    left: leftBreed,
    right: rightBreed,
  };
}
