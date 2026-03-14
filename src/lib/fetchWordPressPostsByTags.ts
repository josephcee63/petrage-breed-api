import { stripHtml } from "./stripHtml.js";

import type { WordPressPostSummary, WordPressTag } from "./types.js";

export interface FetchWordPressPostsByTagsOptions {
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
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  const responses = await Promise.all(
    tags.map(async (tag) => {
      const requestUrl = new URL("/wp-json/wp/v2/posts", normalizedBaseUrl);
      requestUrl.searchParams.set("tags", String(tag.id));
      requestUrl.searchParams.set("per_page", String(perPage));
      requestUrl.searchParams.set("_fields", "id,date,slug,link,title,excerpt");

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
      return payload.flatMap((post) => mapWordPressPost(post, tag.slug));
    }),
  );

  return responses.flat();
}

function mapWordPressPost(post: WordPressPostPayload, matchedTag: string): WordPressPostSummary[] {
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
      matched_tags: [matchedTag],
      matched_categories: [],
    },
  ];
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed || "https://petrage.net";
}
