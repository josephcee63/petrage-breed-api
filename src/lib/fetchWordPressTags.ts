import type { WordPressTag } from "./types.js";

export interface FetchWordPressTagsOptions {
  fetchImplementation?: typeof fetch;
}

export async function fetchWordPressTags(
  baseUrl: string,
  tagSlugs: string[],
  options?: FetchWordPressTagsOptions,
): Promise<WordPressTag[]> {
  const uniqueTagSlugs = dedupeTagSlugs(tagSlugs);
  if (uniqueTagSlugs.length === 0) {
    return [];
  }

  const requestUrl = new URL("/wp-json/wp/v2/tags", normalizeBaseUrl(baseUrl));
  requestUrl.searchParams.set("slug", uniqueTagSlugs.join(","));
  requestUrl.searchParams.set("per_page", String(Math.min(100, uniqueTagSlugs.length)));
  requestUrl.searchParams.set("_fields", "id,name,slug");

  const fetchImplementation = options?.fetchImplementation ?? globalThis.fetch;
  const response = await fetchImplementation(requestUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch WordPress tags: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as Array<{
    id?: number;
    name?: string;
    slug?: string;
  }>;

  const tagsBySlug = new Map<string, WordPressTag>();
  for (const item of payload) {
    if (typeof item.id !== "number" || typeof item.name !== "string" || typeof item.slug !== "string") {
      continue;
    }

    const normalizedSlug = item.slug.trim().toLowerCase();
    if (!normalizedSlug || tagsBySlug.has(normalizedSlug)) {
      continue;
    }

    tagsBySlug.set(normalizedSlug, {
      id: item.id,
      name: item.name.trim(),
      slug: normalizedSlug,
    });
  }

  return uniqueTagSlugs.flatMap((slug) => {
    const matchedTag = tagsBySlug.get(slug);
    return matchedTag ? [matchedTag] : [];
  });
}

function dedupeTagSlugs(tagSlugs: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const tagSlug of tagSlugs) {
    const normalized = tagSlug.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(normalized);
  }

  return unique;
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed || "https://petrage.net";
}
