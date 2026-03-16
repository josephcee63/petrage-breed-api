import { loadBreedData } from "../lib/loadBreedData.js";
import { SimpleCache } from "../lib/simpleCache.js";

import type { LoadedBreedData, NormalizedBreed } from "../lib/types.js";

const BREED_LIST_CACHE_KEY = "breed-list";
const DEFAULT_BREED_LIST_TTL_MS = 5 * 60 * 1000;

export const breedListCache = new SimpleCache<string[]>();

export interface GetBreedListOptions {
  breedData?: LoadedBreedData;
  cacheTtlMs?: number;
}

export async function getBreedList(options?: GetBreedListOptions): Promise<string[]> {
  if (options?.breedData) {
    return buildBreedList(options.breedData.normalizedBreeds);
  }

  return breedListCache.getOrSet(
    BREED_LIST_CACHE_KEY,
    options?.cacheTtlMs ?? DEFAULT_BREED_LIST_TTL_MS,
    async () => {
      const breedData = await loadBreedData();
      return buildBreedList(breedData.normalizedBreeds);
    },
  );
}

export function buildBreedList(normalizedBreeds: NormalizedBreed[]): string[] {
  const seen = new Set<string>();
  const breedNames: string[] = [];

  for (const breed of normalizedBreeds) {
    const displayName = toCanonicalDisplayName(breed.display_name);
    const normalizedDisplayName = displayName.toLowerCase();

    if (!displayName || seen.has(normalizedDisplayName)) {
      continue;
    }

    seen.add(normalizedDisplayName);
    breedNames.push(displayName);
  }

  return breedNames.sort((left, right) => left.localeCompare(right));
}

function toCanonicalDisplayName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/(^|[\s(/'-])([a-z])/g, (_match, prefix: string, letter: string) => {
      return `${prefix}${letter.toUpperCase()}`;
    });
}
