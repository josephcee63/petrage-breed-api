import { SimpleCache } from "./simpleCache.js";
import { stripHtml } from "./stripHtml.js";

import type { WordPressCategory, WordPressPostSummary, WordPressTag } from "./types.js";

export interface FetchWordPressPostsByTagsOptions {
  fetchImplementation?: typeof fetch;
  perPage?: number;
  matchedCategories?: WordPressCategory[];
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

const TAG_POSTS_TTL_MS = 5 * 60 * 1000;

export const wordPressPostsByTagsCache = new SimpleCache<WordPressPostSummary[]>();

export async function fetchWordPressPostsByTags(
  baseUrl: string,
  tags: WordPressTag[],
  options?: FetchWordPressPostsByTagsOptions,
): Promise<WordPressPostSummary[]> {
  if (tags.length === 0) {
    return [];
  }

  const fetchImplementation = options?.fetchImplementation ?? globalThis.fetch;
  const perPage = options?.perPage ?? 20;
  const matchedCategories = options?.matchedCategories ?? [];
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const cacheKey = buildPostsByTagsCacheKey(normalizedBaseUrl, tags, matchedCategories, perPage);

  return wordPressPostsByTagsCache.getOrSet(cacheKey, TAG_POSTS_TTL_MS, async () => {
    const categorySlugById = new Map(matchedCategories.map((category) => [category.id, category.slug]));
    const tagSlugById = new Map(tags.map((tag) => [tag.id, tag.slug]));
    const responses = await Promise.all(
      tags.map(async (tag) => {
        const requestUrl = new URL("/wp-json/wp/v2/posts", normalizedBaseUrl);
        requestUrl.searchParams.set("tags", String(tag.id));
        requestUrl.searchParams.set("per_page", String(perPage));
        requestUrl.searchParams.set("_fields", "id,date,slug,link,title,excerpt,categories,tags");

        const response = await fetchImplementation(requestUrl, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch WordPress posts for tag ${tag.slug}: ${response.status} ${response.statusText}`,
          );
        }

        const payload = (await response.json()) as WordPressPostPayload[];
        return payload.flatMap((post) => mapWordPressPost(post, tag.slug, tagSlugById, categorySlugById));
      }),
    );

    return responses.flat();
  });
}

function mapWordPressPost(
  post: WordPressPostPayload,
  matchedTag: string,
  tagSlugById: Map<number, string>,
  categorySlugById: Map<number, string>,
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
      matched_tags: resolveMatchedSlugs(post.tags, tagSlugById, matchedTag),
      matched_categories: resolveMatchedSlugs(post.categories, categorySlugById),
    },
  ];
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed || "https://petrage.net";
}

function buildPostsByTagsCacheKey(
  baseUrl: string,
  tags: WordPressTag[],
  matchedCategories: WordPressCategory[],
  perPage: number,
): string {
  return `wp:posts:tags:${baseUrl}:tags=${tags.map((tag) => tag.id).join(",")}:categories=${matchedCategories
    .map((category) => category.id)
    .join(",")}:per_page=${perPage}`;
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
