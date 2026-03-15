import { SimpleCache } from "./simpleCache.js";
import { stripHtml } from "./stripHtml.js";

import type { WordPressCategory, WordPressPostSummary, WordPressTag } from "./types.js";

export interface FetchWordPressPostsByCategoriesOptions {
  fetchImplementation?: typeof fetch;
  perPage?: number;
  matchedTags?: WordPressTag[];
}

interface WordPressPostPayload {
  id?: number;
  date?: string;
  slug?: string;
  link?: string;
  title?: {
    rendered?: string;
  };
  excerpt?: {
    rendered?: string;
  };
  categories?: number[];
  tags?: number[];
}

const CATEGORY_POSTS_TTL_MS = 5 * 60 * 1000;

export const wordPressPostsByCategoriesCache = new SimpleCache<WordPressPostSummary[]>();

export async function fetchWordPressPostsByCategories(
  baseUrl: string,
  categories: WordPressCategory[],
  options?: FetchWordPressPostsByCategoriesOptions,
): Promise<WordPressPostSummary[]> {
  if (categories.length === 0) {
    return [];
  }

  const fetchImplementation = options?.fetchImplementation ?? globalThis.fetch;
  const perPage = options?.perPage ?? 20;
  const matchedTags = options?.matchedTags ?? [];
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const cacheKey = buildPostsByCategoriesCacheKey(normalizedBaseUrl, categories, matchedTags, perPage);

  return wordPressPostsByCategoriesCache.getOrSet(cacheKey, CATEGORY_POSTS_TTL_MS, async () => {
    const categorySlugById = new Map(categories.map((category) => [category.id, category.slug]));
    const tagSlugById = new Map(matchedTags.map((tag) => [tag.id, tag.slug]));
    const responses = await Promise.all(
      categories.map(async (category) => {
        const requestUrl = new URL("/wp-json/wp/v2/posts", normalizedBaseUrl);
        requestUrl.searchParams.set("categories", String(category.id));
        requestUrl.searchParams.set("per_page", String(perPage));
        requestUrl.searchParams.set("_fields", "id,date,slug,link,title,excerpt,categories,tags");

        const response = await fetchImplementation(requestUrl, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch WordPress posts for category ${category.slug}: ${response.status} ${response.statusText}`,
          );
        }

        const payload = (await response.json()) as WordPressPostPayload[];
        return payload.flatMap((post) =>
          mapWordPressPost(post, category.slug, categorySlugById, tagSlugById),
        );
      }),
    );

    return responses.flat();
  });
}

function mapWordPressPost(
  post: WordPressPostPayload,
  matchedCategory: string,
  categorySlugById: Map<number, string>,
  tagSlugById: Map<number, string>,
): WordPressPostSummary[] {
  if (
    typeof post.id !== "number" ||
    typeof post.date !== "string" ||
    typeof post.slug !== "string" ||
    typeof post.link !== "string"
  ) {
    return [];
  }

  return [
    {
      id: post.id,
      date: post.date,
      slug: post.slug,
      link: post.link,
      title: stripHtml(post.title?.rendered),
      excerpt: stripHtml(post.excerpt?.rendered),
      matched_tags: resolveMatchedSlugs(post.tags, tagSlugById),
      matched_categories: resolveMatchedSlugs(post.categories, categorySlugById, matchedCategory),
    },
  ];
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed || "https://petrage.net";
}

function buildPostsByCategoriesCacheKey(
  baseUrl: string,
  categories: WordPressCategory[],
  matchedTags: WordPressTag[],
  perPage: number,
): string {
  return `wp:posts:categories:${baseUrl}:categories=${categories
    .map((category) => category.id)
    .join(",")}:tags=${matchedTags.map((tag) => tag.id).join(",")}:per_page=${perPage}`;
}

function resolveMatchedSlugs(
  ids: number[] | undefined,
  slugById: Map<number, string>,
  fallbackSlug?: string,
): string[] {
  const matches = (ids ?? []).flatMap((id) => {
    const slug = slugById.get(id);
    return slug ? [slug] : [];
  });

  if (matches.length > 0) {
    return matches;
  }

  return fallbackSlug ? [fallbackSlug] : [];
}
