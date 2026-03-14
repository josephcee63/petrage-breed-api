import { normalizeLookupKey } from "./normalizeLookupKey.js";

import type { BreedIndex, BreedIndexBreed } from "./types.js";

export function resolveBreed(input: string, breedIndex: BreedIndex): BreedIndexBreed | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const exactId = trimmed.toLowerCase();
  const exactMatch = breedIndex.breeds.find((breed) => breed.id === exactId);
  if (exactMatch) {
    return exactMatch;
  }

  const lookupKey = normalizeLookupKey(trimmed);
  if (!lookupKey) {
    return null;
  }

  return (
    findFirstMatchingBreed(breedIndex.breeds, (breed) => normalizeLookupKey(breed.display_name) === lookupKey) ??
    findFirstMatchingBreed(breedIndex.breeds, (breed) =>
      breed.aka_names.some((akaName) => normalizeLookupKey(akaName) === lookupKey),
    ) ??
    findFirstMatchingBreed(breedIndex.breeds, (breed) =>
      breed.aliases.some((alias) => normalizeLookupKey(alias) === lookupKey),
    ) ??
    findFirstMatchingBreed(breedIndex.breeds, (breed) =>
      breed.tag_slugs.some((tagSlug) => normalizeLookupKey(tagSlug) === lookupKey),
    ) ??
    null
  );
}

function findFirstMatchingBreed(
  breeds: BreedIndexBreed[],
  predicate: (breed: BreedIndexBreed) => boolean,
): BreedIndexBreed | null {
  return breeds.find(predicate) ?? null;
}
