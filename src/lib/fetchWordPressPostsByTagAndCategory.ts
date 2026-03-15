import { SimpleCache } from "./simpleCache.js";
import { stripHtml } from "./stripHtml.js";

import type { WordPressCategory, WordPressPostSummary, WordPressTag } from "./types.js";

export interface FetchWordPressPostsByTagAndCategoryOptions {
  fetchImplementation?: typeof fetch;
  perPage?: number;
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

const TAG_AND_CATEGORY_POSTS_TTL_MS = 5 * 60 * 1000;

export const wordPressPostsByTagAndCategoryCache = new SimpleCache<WordPressPostSummary[]>();

export async function fetchWordPressPostsByTagAndCategory(
  baseUrl: string,
  tag: WordPressTag,
  category: WordPressCategory,
  options?: FetchWordPressPostsByTagAndCategoryOptions,
): Promise<WordPressPostSummary[]> {
  const fetchImplementation = options?.fetchImplementation ?? globalThis.fetch;
  const perPage = options?.perPage ?? 20;
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const cacheKey = buildPostsByTagAndCategoryCacheKey(normalizedBaseUrl, tag, category, perPage);

  return wordPressPostsByTagAndCategoryCache.getOrSet(cacheKey, TAG_AND_CATEGORY_POSTS_TTL_MS, async () => {
    const requestUrl = new URL("/wp-json/wp/v2/posts", normalizedBaseUrl);
    requestUrl.searchParams.set("tags", String(tag.id));
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
        `Failed to fetch WordPress posts for tag ${tag.slug} in category ${category.slug}: ${response.status} ${response.statusText}`,
      );
    }

    const payload = (await response.json()) as WordPressPostPayload[];
    return payload.flatMap((post) => mapWordPressPost(post, tag, category));
  });
}

function mapWordPressPost(
  post: WordPressPostPayload,
  tag: WordPressTag,
  category: WordPressCategory,
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
      matched_tags: [tag.slug],
      matched_categories: [category.slug],
    },
  ];
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed || "https://petrage.net";
}

function buildPostsByTagAndCategoryCacheKey(
  baseUrl: string,
  tag: WordPressTag,
  category: WordPressCategory,
  perPage: number,
): string {
  return `wp:posts:tag-category:${baseUrl}:tag=${tag.id}:category=${category.id}:per_page=${perPage}`;
}
