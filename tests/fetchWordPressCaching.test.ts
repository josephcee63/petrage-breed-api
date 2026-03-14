import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchWordPressCategories,
  wordPressCategoriesCache,
} from "../src/lib/fetchWordPressCategories.js";
import {
  fetchWordPressPostsByCategories,
  wordPressPostsByCategoriesCache,
} from "../src/lib/fetchWordPressPostsByCategories.js";
import { fetchWordPressPostsByTags, wordPressPostsByTagsCache } from "../src/lib/fetchWordPressPostsByTags.js";
import { fetchWordPressTags, wordPressTagsCache } from "../src/lib/fetchWordPressTags.js";

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("WordPress fetch caching", () => {
  beforeEach(() => {
    wordPressTagsCache.clear();
    wordPressCategoriesCache.clear();
    wordPressPostsByTagsCache.clear();
    wordPressPostsByCategoriesCache.clear();
  });

  it("reuses cached tag lookups", async () => {
    const fetchImplementation = vi.fn(async () =>
      createJsonResponse([{ id: 1, name: "ACD", slug: "acd" }]),
    ) as typeof fetch;

    const first = await fetchWordPressTags("https://petrage.net", ["acd"], { fetchImplementation });
    const second = await fetchWordPressTags("https://petrage.net", ["acd"], { fetchImplementation });

    expect(first).toEqual([{ id: 1, name: "ACD", slug: "acd" }]);
    expect(second).toEqual(first);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("reuses cached category lookups", async () => {
    const fetchImplementation = vi.fn(async () =>
      createJsonResponse([{ id: 31, name: "Dog Breed Facts", slug: "dog-breed-facts" }]),
    ) as typeof fetch;

    const first = await fetchWordPressCategories("https://petrage.net", ["dog-breed-facts"], {
      fetchImplementation,
    });
    const second = await fetchWordPressCategories("https://petrage.net", ["dog-breed-facts"], {
      fetchImplementation,
    });

    expect(first).toEqual([{ id: 31, name: "Dog Breed Facts", slug: "dog-breed-facts" }]);
    expect(second).toEqual(first);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("reuses cached post lookups by tag ids", async () => {
    const fetchImplementation = vi.fn(async () =>
      createJsonResponse([
        {
          id: 101,
          date: "2025-02-01T00:00:00",
          slug: "blue-heeler-facts",
          link: "https://petrage.net/blue-heeler-facts/",
          title: { rendered: "Blue Heeler Facts" },
          excerpt: { rendered: "<p>Breed facts.</p>" },
        },
      ]),
    ) as typeof fetch;

    const tags = [{ id: 11, name: "ACD", slug: "acd" }];
    const first = await fetchWordPressPostsByTags("https://petrage.net", tags, {
      fetchImplementation,
    });
    const second = await fetchWordPressPostsByTags("https://petrage.net", tags, {
      fetchImplementation,
    });

    expect(first).toEqual([
      {
        id: 101,
        date: "2025-02-01T00:00:00",
        slug: "blue-heeler-facts",
        link: "https://petrage.net/blue-heeler-facts/",
        title: "Blue Heeler Facts",
        excerpt: "Breed facts.",
        matched_tags: ["acd"],
        matched_categories: [],
      },
    ]);
    expect(second).toEqual(first);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("reuses cached post lookups by category ids", async () => {
    const fetchImplementation = vi.fn(async () =>
      createJsonResponse([
        {
          id: 201,
          date: "2025-03-01T00:00:00",
          slug: "akita-breed-facts",
          link: "https://petrage.net/akita-breed-facts/",
          title: { rendered: "Akita Breed Facts" },
          excerpt: { rendered: "<p>Akita overview.</p>" },
        },
      ]),
    ) as typeof fetch;

    const categories = [{ id: 31, name: "Dog Breed Facts", slug: "dog-breed-facts" }];
    const first = await fetchWordPressPostsByCategories("https://petrage.net", categories, {
      fetchImplementation,
    });
    const second = await fetchWordPressPostsByCategories("https://petrage.net", categories, {
      fetchImplementation,
    });

    expect(first).toEqual([
      {
        id: 201,
        date: "2025-03-01T00:00:00",
        slug: "akita-breed-facts",
        link: "https://petrage.net/akita-breed-facts/",
        title: "Akita Breed Facts",
        excerpt: "Akita overview.",
        matched_tags: [],
        matched_categories: ["dog-breed-facts"],
      },
    ]);
    expect(second).toEqual(first);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });
});
