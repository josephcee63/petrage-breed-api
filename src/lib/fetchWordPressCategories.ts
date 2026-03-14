import type { WordPressCategory } from "./types.js";

export interface FetchWordPressCategoriesOptions {
  fetchImplementation?: typeof fetch;
}

export async function fetchWordPressCategories(
  baseUrl: string,
  categorySlugs: string[],
  options?: FetchWordPressCategoriesOptions,
): Promise<WordPressCategory[]> {
  const uniqueCategorySlugs = dedupeSlugs(categorySlugs);
  if (uniqueCategorySlugs.length === 0) {
    return [];
  }

  const requestUrl = new URL("/wp-json/wp/v2/categories", normalizeBaseUrl(baseUrl));
  requestUrl.searchParams.set("slug", uniqueCategorySlugs.join(","));
  requestUrl.searchParams.set("per_page", String(Math.min(100, uniqueCategorySlugs.length)));
  requestUrl.searchParams.set("_fields", "id,name,slug");

  const fetchImplementation = options?.fetchImplementation ?? globalThis.fetch;
  const response = await fetchImplementation(requestUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch WordPress categories: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as Array<{
    id?: number;
    name?: string;
    slug?: string;
  }>;

  const categoriesBySlug = new Map<string, WordPressCategory>();
  for (const item of payload) {
    if (typeof item.id !== "number" || typeof item.name !== "string" || typeof item.slug !== "string") {
      continue;
    }

    const normalizedSlug = item.slug.trim().toLowerCase();
    if (!normalizedSlug || categoriesBySlug.has(normalizedSlug)) {
      continue;
    }

    categoriesBySlug.set(normalizedSlug, {
      id: item.id,
      name: item.name.trim(),
      slug: normalizedSlug,
    });
  }

  return uniqueCategorySlugs.flatMap((slug) => {
    const category = categoriesBySlug.get(slug);
    return category ? [category] : [];
  });
}

function dedupeSlugs(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = value.trim().toLowerCase();
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
