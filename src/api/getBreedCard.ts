import { getBreed } from "./getBreed.js";
import { getBreedContent } from "./getBreedContent.js";
import { buildBreedCard } from "../lib/buildBreedCard.js";
import { loadBreedData } from "../lib/loadBreedData.js";

import type { BreedCardResult, LoadedBreedData } from "../lib/types.js";

export interface GetBreedCardOptions {
  baseUrl?: string;
  fetchImplementation?: typeof fetch;
  breedData?: LoadedBreedData;
  perPage?: number;
  categorySlugs?: string[];
}

export async function getBreedCard(
  input: string,
  options?: GetBreedCardOptions,
): Promise<BreedCardResult | null> {
  const breedData = options?.breedData ?? (await loadBreedData());
  const [breedDetail, breedContent] = await Promise.all([
    getBreed(input, { breedData }),
    getBreedContent(input, {
      breedData,
      ...(options?.baseUrl ? { baseUrl: options.baseUrl } : {}),
      ...(options?.fetchImplementation ? { fetchImplementation: options.fetchImplementation } : {}),
      ...(options?.perPage ? { perPage: options.perPage } : {}),
      ...(options?.categorySlugs ? { categorySlugs: options.categorySlugs } : {}),
    }),
  ]);

  if (!breedDetail) {
    return null;
  }

  if (!breedContent) {
    throw new Error(`Breed content could not be loaded for resolved breed ${breedDetail.id}.`);
  }

  return buildBreedCard(breedDetail, breedContent);
}
