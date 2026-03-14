import type { BreedIndexBreed, CanonicalBreedSignals, NormalizedBreed } from "./types.js";

export function getCanonicalBreedSignals(
  normalizedBreed: NormalizedBreed,
  breedIndexBreed: BreedIndexBreed,
): CanonicalBreedSignals {
  const aliases = dedupeStrings([
    ...breedIndexBreed.aliases,
    ...breedIndexBreed.aka_names,
  ]);

  return {
    display_name: normalizedBreed.display_name,
    aliases,
    article_url: normalizedBreed.media.article_url,
    preferred_tag_slug: breedIndexBreed.preferred_tag_slug,
    tag_slugs: breedIndexBreed.tag_slugs.map((tagSlug) => tagSlug.trim().toLowerCase()).filter(Boolean),
    shared_content_key: breedIndexBreed.shared_content_key,
  };
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const normalized = trimmed.toLowerCase();
    if (!trimmed || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(trimmed);
  }

  return unique;
}
