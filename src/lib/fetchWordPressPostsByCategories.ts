import { stripHtml } from "./stripHtml.js";

import type { WordPressCategory, WordPressPostSummary } from "./types.js";

export interface FetchWordPressPostsByCategoriesOptions {
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
}

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
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  const responses = await Promise.all(
    categories.map(async (category) => {
      const requestUrl = new URL("/wp-json/wp/v2/posts", normalizedBaseUrl);
      requestUrl.searchParams.set("categories", String(category.id));
      requestUrl.searchParams.set("per_page", String(perPage));
      requestUrl.searchParams.set("_fields", "id,date,slug,link,title,excerpt");

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
      return payload.flatMap((post) => mapWordPressPost(post, category.slug));
    }),
  );

  return responses.flat();
}

function mapWordPressPost(post: WordPressPostPayload, matchedCategory: string): WordPressPostSummary[] {
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
      matched_tags: [],
      matched_categories: [matchedCategory],
    },
  ];
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed || "https://petrage.net";
}
