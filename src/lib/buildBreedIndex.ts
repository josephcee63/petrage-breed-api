import { normalizeLookupKey } from "./normalizeLookupKey.js";

import type {
  BreedIndex,
  BreedIndexBreed,
  ManualBreedMapping,
  ManualBreedMappings,
  NormalizedBreed,
} from "./types.js";

export interface BreedIndexStats {
  breedsProcessed: number;
  totalAliases: number;
  totalTagSlugs: number;
  totalLookupKeys: number;
}

export function buildBreedIndex(
  normalizedBreeds: NormalizedBreed[],
  manualMappings: ManualBreedMappings,
): BreedIndex {
  assertManualMappingsReferenceKnownBreeds(normalizedBreeds, manualMappings);

  return {
    breeds: normalizedBreeds.map((breed) => buildBreedIndexEntry(breed, manualMappings[breed.id])),
  };
}

export function summarizeBreedIndex(index: BreedIndex): BreedIndexStats {
  return {
    breedsProcessed: index.breeds.length,
    totalAliases: index.breeds.reduce((sum, breed) => sum + breed.aliases.length, 0),
    totalTagSlugs: index.breeds.reduce((sum, breed) => sum + breed.tag_slugs.length, 0),
    totalLookupKeys: index.breeds.reduce((sum, breed) => sum + breed.lookup_keys.length, 0),
  };
}

export function extractTagSlugFromUrl(tagUrl: string | null | undefined): string | null {
  if (!tagUrl) {
    return null;
  }

  try {
    const pathname = new URL(tagUrl).pathname;
    const slug = pathname.split("/").filter(Boolean).at(-1);
    return normalizeTagSlug(slug);
  } catch {
    const match = tagUrl.match(/\/tag\/([^/?#]+)/i);
    return normalizeTagSlug(match?.[1] ?? null);
  }
}

function buildBreedIndexEntry(
  breed: NormalizedBreed,
  manualMapping: ManualBreedMapping | undefined,
): BreedIndexBreed {
  const akaNames = dedupeStrings(breed.aka_names);
  const aliases = dedupeStrings(manualMapping?.aliases ?? []);

  const sourceTagSlug = extractTagSlugFromUrl(breed.media.tag_url);
  const preferredTagSlug = normalizeTagSlug(manualMapping?.preferred_tag_slug ?? null);
  const tagSlugs = dedupeTagSlugs([
    ...(manualMapping?.tag_slugs ?? []),
    preferredTagSlug,
    sourceTagSlug,
  ]);

  const sharedContentKey = normalizeTagSlug(manualMapping?.shared_content_key ?? null);
  const lookupKeys = dedupeLookupKeys([
    breed.id,
    breed.display_name,
    ...akaNames,
    ...aliases,
    ...tagSlugs,
  ]);

  return {
    id: breed.id,
    display_name: breed.display_name,
    aka_names: akaNames,
    aliases,
    tag_slugs: tagSlugs,
    preferred_tag_slug: preferredTagSlug ?? tagSlugs[0] ?? null,
    shared_content_key: sharedContentKey,
    lookup_keys: lookupKeys,
  };
}

function assertManualMappingsReferenceKnownBreeds(
  normalizedBreeds: NormalizedBreed[],
  manualMappings: ManualBreedMappings,
): void {
  const knownIds = new Set(normalizedBreeds.map((breed) => breed.id));

  for (const breedId of Object.keys(manualMappings)) {
    if (!knownIds.has(breedId)) {
      throw new Error(`Manual mapping references unknown breed id: ${breedId}`);
    }
  }
}

function dedupeStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const lookupKey = normalizeLookupKey(trimmed);
    if (!trimmed || !lookupKey || seen.has(lookupKey)) {
      continue;
    }

    seen.add(lookupKey);
    unique.push(trimmed);
  }

  return unique;
}

function dedupeTagSlugs(values: ReadonlyArray<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const slug = normalizeTagSlug(value);
    if (!slug || seen.has(slug)) {
      continue;
    }

    seen.add(slug);
    unique.push(slug);
  }

  return unique;
}

function dedupeLookupKeys(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const lookupKey = normalizeLookupKey(value);
    if (!lookupKey || seen.has(lookupKey)) {
      continue;
    }

    seen.add(lookupKey);
    unique.push(lookupKey);
  }

  return unique;
}

function normalizeTagSlug(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  return normalized || null;
}
