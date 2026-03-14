import { getNormalizedBreedById, loadBreedData } from "../lib/loadBreedData.js";
import { resolveBreed } from "../lib/resolveBreed.js";

import type { BreedDetails, LoadedBreedData } from "../lib/types.js";

export interface GetBreedOptions {
  breedData?: LoadedBreedData;
}

export async function getBreed(
  input: string,
  options?: GetBreedOptions,
): Promise<BreedDetails | null> {
  const breedData = options?.breedData ?? (await loadBreedData());
  const resolvedBreed = resolveBreed(input, breedData.breedIndex);

  if (!resolvedBreed) {
    return null;
  }

  const normalizedBreed = getNormalizedBreedById(breedData.normalizedBreeds, resolvedBreed.id);
  if (!normalizedBreed) {
    throw new Error(`Resolved breed ${resolvedBreed.id} is missing from normalized breed data.`);
  }

  return {
    id: normalizedBreed.id,
    display_name: normalizedBreed.display_name,
    aka_names: resolvedBreed.aka_names,
    aliases: resolvedBreed.aliases,
    tag_slugs: resolvedBreed.tag_slugs,
    preferred_tag_slug: resolvedBreed.preferred_tag_slug,
    shared_content_key: resolvedBreed.shared_content_key,
    traits: normalizedBreed.traits,
    stats: normalizedBreed.stats,
    media: normalizedBreed.media,
    description_text: normalizedBreed.description_text,
  };
}
