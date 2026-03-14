import { getBreed } from "./getBreed.js";
import { getBreedContent } from "./getBreedContent.js";
import { buildBreedCard } from "../lib/buildBreedCard.js";
import { loadBreedData } from "../lib/loadBreedData.js";
import { SimpleCache } from "../lib/simpleCache.js";

import type { BreedCardResult, LoadedBreedData } from "../lib/types.js";

const DEFAULT_BASE_URL = "https://petrage.net";
const BREED_CARD_CACHE_TTL_MS = 2 * 60 * 1000;

export const breedCardCache = new SimpleCache<BreedCardResult>();

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
  const breedDetail = await getBreed(input, { breedData });

  if (!breedDetail) {
    return null;
  }

  const baseUrl = normalizeBaseUrl(options?.baseUrl);
  const categorySlugs = normalizeCategorySlugs(options?.categorySlugs);
  const cacheKey = buildBreedCardCacheKey(baseUrl, breedDetail.id, options?.perPage, categorySlugs);

  return breedCardCache.getOrSet(cacheKey, BREED_CARD_CACHE_TTL_MS, async () => {
    const breedContent = await getBreedContent(input, {
      breedData,
      baseUrl,
      ...(options?.fetchImplementation ? { fetchImplementation: options.fetchImplementation } : {}),
      ...(options?.perPage ? { perPage: options.perPage } : {}),
      ...(options?.categorySlugs ? { categorySlugs: options.categorySlugs } : {}),
    });

    if (!breedContent) {
      throw new Error(`Breed content could not be loaded for resolved breed ${breedDetail.id}.`);
    }

    return buildBreedCard(breedDetail, breedContent);
  });
}

function normalizeBaseUrl(baseUrl: string | undefined): string {
  const trimmed = (baseUrl ?? DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_BASE_URL;
}

function normalizeCategorySlugs(categorySlugs: string[] | undefined): string[] {
  if (!categorySlugs) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const categorySlug of categorySlugs) {
    const value = categorySlug.trim().toLowerCase();
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

function buildBreedCardCacheKey(
  baseUrl: string,
  breedId: string,
  perPage: number | undefined,
  categorySlugs: string[],
): string {
  return `breed-card:${baseUrl}:${breedId}:per_page=${perPage ?? 20}:categories=${categorySlugs.join(",")}`;
}
