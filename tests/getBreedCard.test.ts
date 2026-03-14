import { beforeEach, describe, expect, it } from "vitest";

import { breedCardCache, getBreedCard } from "../src/api/getBreedCard.js";
import { breedContentCache } from "../src/api/getBreedContent.js";
import { wordPressCategoriesCache } from "../src/lib/fetchWordPressCategories.js";
import { wordPressPostsByCategoriesCache } from "../src/lib/fetchWordPressPostsByCategories.js";
import { wordPressPostsByTagsCache } from "../src/lib/fetchWordPressPostsByTags.js";
import { wordPressTagsCache } from "../src/lib/fetchWordPressTags.js";
import { loadBreedData } from "../src/lib/loadBreedData.js";

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createMockFetch(routeMap: Record<string, unknown>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const requestUrl =
      typeof input === "string" ? new URL(input) : input instanceof URL ? input : new URL(input.url);
    const key = `${requestUrl.pathname}?${requestUrl.searchParams.toString()}`;
    const payload = routeMap[key];

    if (payload === undefined) {
      throw new Error(`Unexpected request: ${requestUrl.toString()}`);
    }

    return createJsonResponse(payload);
  }) as typeof fetch;
}

describe("getBreedCard", () => {
  beforeEach(() => {
    breedCardCache.clear();
    breedContentCache.clear();
    wordPressTagsCache.clear();
    wordPressCategoriesCache.clear();
    wordPressPostsByTagsCache.clear();
    wordPressPostsByCategoriesCache.clear();
  });

  it("returns null for an unresolved breed", async () => {
    const breedData = await loadBreedData();

    await expect(
      getBreedCard("definitely-not-a-breed", {
        breedData,
        fetchImplementation: createMockFetch({}),
      }),
    ).resolves.toBeNull();
  });

  it("returns a valid acd card with gallery and owner-help content", async () => {
    const breedData = await loadBreedData();
    const result = await getBreedCard("acd", {
      breedData,
      fetchImplementation: createMockFetch({
        "/wp-json/wp/v2/tags?slug=acd%2Caustraliancattledog&per_page=2&_fields=id%2Cname%2Cslug": [
          { id: 11, name: "ACD", slug: "acd" },
          { id: 12, name: "Australian Cattle Dog", slug: "australiancattledog" },
        ],
        "/wp-json/wp/v2/categories?slug=dog-breed-facts&per_page=1&_fields=id%2Cname%2Cslug": [
          { id: 31, name: "Dog Breed Facts", slug: "dog-breed-facts" },
        ],
        "/wp-json/wp/v2/posts?tags=11&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [],
        "/wp-json/wp/v2/posts?tags=12&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
          {
            id: 101,
            date: "2025-02-01T00:00:00",
            slug: "blue-heeler-health-issues",
            link: "https://petrage.net/blue-heeler-health-issues/",
            title: { rendered: "Blue Heeler Health Issues" },
            excerpt: { rendered: "<p>Important health concerns.</p>" },
          },
          {
            id: 102,
            date: "2025-02-02T00:00:00",
            slug: "blue-heeler-user-gallery",
            link: "https://petrage.net/blue-heeler-user-gallery/",
            title: { rendered: "Blue Heeler User Gallery" },
            excerpt: { rendered: "<p>Owner-submitted photos.</p>" },
          },
          {
            id: 103,
            date: "2025-02-03T00:00:00",
            slug: "blue-heeler-owner-quiz",
            link: "https://petrage.net/blue-heeler-owner-quiz/",
            title: { rendered: "Blue Heeler Owner Quiz" },
            excerpt: { rendered: "<p>Test your breed knowledge.</p>" },
          },
          {
            id: 104,
            date: "2025-02-04T00:00:00",
            slug: "best-herding-dog-breeds",
            link: "https://petrage.net/best-herding-dog-breeds/",
            title: { rendered: "Best Herding Dog Breeds" },
            excerpt: { rendered: "<p>Australian Cattle Dog stands out.</p>" },
          },
        ],
        "/wp-json/wp/v2/posts?categories=31&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
          {
            id: 105,
            date: "2025-02-05T00:00:00",
            slug: "australian-cattle-dog-facts",
            link: "https://petrage.net/australian-cattle-dog-facts/",
            title: { rendered: "Australian Cattle Dog Facts" },
            excerpt: { rendered: "<p>Breed facts and history.</p>" },
          },
        ],
      }),
    });

    expect(result?.breed.id).toBe("australian-cattle-dog");
    expect(result?.breed.display_name).toBe("Australian Cattle Dog");
    expect(result?.featured.main_article?.title).toBe("Australian Cattle Dog Facts");
    expect(result?.featured.owner_help.map((item) => item.title)).toEqual(["Blue Heeler Health Issues"]);
    expect(result?.featured.gallery?.title).toBe("Blue Heeler User Gallery");
    expect(result?.featured.related_reads.map((item) => item.title)).toEqual(["Best Herding Dog Breeds"]);
    expect(result?.featured.fun_extras.map((item) => item.title)).toEqual(["Blue Heeler Owner Quiz"]);
  });

  it("returns a valid doberman card with owner-help content above fun extras", async () => {
    const breedData = await loadBreedData();
    const result = await getBreedCard("doberman", {
      breedData,
      fetchImplementation: createMockFetch({
        "/wp-json/wp/v2/tags?slug=doberman&per_page=1&_fields=id%2Cname%2Cslug": [
          { id: 51, name: "Doberman", slug: "doberman" },
        ],
        "/wp-json/wp/v2/categories?slug=dog-breed-facts&per_page=1&_fields=id%2Cname%2Cslug": [],
        "/wp-json/wp/v2/posts?tags=51&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
          {
            id: 301,
            date: "2025-04-01T00:00:00",
            slug: "doberman-medication-sensitivity",
            link: "https://petrage.net/doberman-medication-sensitivity/",
            title: { rendered: "Doberman Medication Sensitivity" },
            excerpt: { rendered: "<p>Health guidance for owners.</p>" },
          },
          {
            id: 302,
            date: "2025-04-02T00:00:00",
            slug: "doberman-user-gallery",
            link: "https://petrage.net/doberman-user-gallery/",
            title: { rendered: "Doberman User Gallery" },
            excerpt: { rendered: "<p>Photo gallery.</p>" },
          },
          {
            id: 303,
            date: "2025-04-03T00:00:00",
            slug: "battle-of-the-big-dogs-dobie-dogue-rotty-cane-corso",
            link: "https://petrage.net/battle-of-the-big-dogs-dobie-dogue-rotty-cane-corso/",
            title: { rendered: "Battle of the BIG Dogs-Dobie-Dogue-Rotty-Cane Corso" },
            excerpt: { rendered: "<p>Which big dog wins?</p>" },
          },
        ],
      }),
    });

    expect(result?.breed.id).toBe("dobermann-pinscher");
    expect(result?.breed.display_name).toBe("Dobermann Pinscher");
    expect(result?.featured.owner_help.map((item) => item.title)).toEqual(["Doberman Medication Sensitivity"]);
    expect(result?.featured.gallery?.title).toBe("Doberman User Gallery");
    expect(result?.featured.fun_extras.map((item) => item.title)).toEqual([
      "Battle of the BIG Dogs-Dobie-Dogue-Rotty-Cane Corso",
    ]);
  });

  it("reuses a cached breed card result for repeated requests", async () => {
    const breedData = await loadBreedData();
    const firstResult = await getBreedCard("acd", {
      breedData,
      fetchImplementation: createMockFetch({
        "/wp-json/wp/v2/tags?slug=acd%2Caustraliancattledog&per_page=2&_fields=id%2Cname%2Cslug": [
          { id: 11, name: "ACD", slug: "acd" },
          { id: 12, name: "Australian Cattle Dog", slug: "australiancattledog" },
        ],
        "/wp-json/wp/v2/categories?slug=dog-breed-facts&per_page=1&_fields=id%2Cname%2Cslug": [],
        "/wp-json/wp/v2/posts?tags=11&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [],
        "/wp-json/wp/v2/posts?tags=12&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
          {
            id: 101,
            date: "2025-02-01T00:00:00",
            slug: "blue-heeler-health-issues",
            link: "https://petrage.net/blue-heeler-health-issues/",
            title: { rendered: "Blue Heeler Health Issues" },
            excerpt: { rendered: "<p>Important health concerns.</p>" },
          },
        ],
      }),
    });

    const secondResult = await getBreedCard("acd", {
      breedData,
      fetchImplementation: createMockFetch({}),
    });

    expect(secondResult).toEqual(firstResult);
  });
});
