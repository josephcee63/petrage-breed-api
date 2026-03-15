import { getCanonicalContentTagSlug } from "./getCanonicalContentTagSlug.js";

import type { BreedIndexBreed } from "./types.js";

export function getContentQueryTags(breed: BreedIndexBreed): string[] {
  const canonicalTagSlug = getCanonicalContentTagSlug(breed);
  const orderedValues = [canonicalTagSlug, breed.preferred_tag_slug, ...breed.tag_slugs];
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

  return unique;
}

function normalizeTagSlug(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}
