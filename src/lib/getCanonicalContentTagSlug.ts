import { normalizeLookupKey } from "./normalizeLookupKey.js";

import type { BreedIndexBreed } from "./types.js";

export function getCanonicalContentTagSlug(breed: BreedIndexBreed): string | null {
  const uniqueTagSlugs = dedupeTagSlugs([breed.preferred_tag_slug, ...breed.tag_slugs]);
  if (uniqueTagSlugs.length === 0) {
    return null;
  }

  const canonicalBreedKeys = getCanonicalBreedKeys(breed);
  return uniqueTagSlugs.find((slug) => canonicalBreedKeys.has(slug)) ?? uniqueTagSlugs[0] ?? null;
}

function dedupeTagSlugs(values: ReadonlyArray<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = value?.trim().toLowerCase() ?? "";
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(normalized);
  }

  return unique;
}

function getCanonicalBreedKeys(breed: BreedIndexBreed): Set<string> {
  return new Set(
    [breed.id, breed.display_name, ...breed.aka_names]
      .map((value) => normalizeLookupKey(value))
      .filter(Boolean),
  );
}
