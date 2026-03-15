import { normalizeLookupKey } from "./normalizeLookupKey.js";

import type { BreedIndexBreed } from "./types.js";

export function getContentQueryTags(breed: BreedIndexBreed): string[] {
  const orderedValues = [breed.preferred_tag_slug, ...breed.tag_slugs];
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of orderedValues) {
    const normalized = normalizeTagSlug(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(normalized);
  }

  const canonicalBreedKeys = getCanonicalBreedKeys(breed);

  return unique
    .map((slug, index) => ({
      slug,
      index,
      priority: canonicalBreedKeys.has(slug) ? 1 : 0,
    }))
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.slug);
}

function normalizeTagSlug(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function getCanonicalBreedKeys(breed: BreedIndexBreed): Set<string> {
  return new Set(
    [breed.id, breed.display_name, ...breed.aka_names]
      .map((value) => normalizeLookupKey(value))
      .filter(Boolean),
  );
}
