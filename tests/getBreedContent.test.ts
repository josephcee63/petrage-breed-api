import { beforeEach, describe, expect, it } from "vitest";

import { breedContentCache, getBreedContent } from "../src/api/getBreedContent.js";
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

describe("getBreedContent", () => {
  beforeEach(() => {
    breedContentCache.clear();
    wordPressTagsCache.clear();
    wordPressCategoriesCache.clear();
    wordPressPostsByTagsCache.clear();
    wordPressPostsByCategoriesCache.clear();
  });

  it("returns null for an unknown breed", async () => {
    const breedData = await loadBreedData();

    await expect(
      getBreedContent("definitely-not-a-breed", {
        breedData,
        fetchImplementation: createMockFetch({}),
      }),
    ).resolves.toBeNull();
  });

  it("resolves acd and ranks galleries and strong list content above quizzes", async () => {
    const breedData = await loadBreedData();
    const mockFetch = createMockFetch({
      "/wp-json/wp/v2/tags?slug=acd%2Caustraliancattledog&per_page=2&_fields=id%2Cname%2Cslug": [
        { id: 11, name: "ACD", slug: "acd" },
        { id: 12, name: "Australian Cattle Dog", slug: "australiancattledog" },
      ],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts&per_page=1&_fields=id%2Cname%2Cslug": [
        { id: 31, name: "Dog Breed Facts", slug: "dog-breed-facts" },
      ],
      "/wp-json/wp/v2/posts?tags=11&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
        {
          id: 101,
          date: "2025-02-01T00:00:00",
          slug: "blue-heeler-facts",
          link: "https://petrage.net/blue-heeler-facts/",
          title: { rendered: "<h1>Blue Heeler Facts</h1>" },
          excerpt: { rendered: "<p>Smart <strong>working</strong> dogs.</p>" },
        },
      ],
      "/wp-json/wp/v2/posts?tags=12&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
        {
          id: 101,
          date: "2025-02-01T00:00:00",
          slug: "blue-heeler-facts",
          link: "https://petrage.net/blue-heeler-facts/",
          title: { rendered: "<h1>Blue Heeler Facts</h1>" },
          excerpt: { rendered: "<p>Smart <strong>working</strong> dogs.</p>" },
        },
        {
          id: 102,
          date: "2025-02-02T00:00:00",
          slug: "blue-heeler-owner-quiz",
          link: "https://petrage.net/blue-heeler-owner-quiz/",
          title: { rendered: "Blue <em>Heeler</em> Owner Quiz" },
          excerpt: { rendered: "<p>Test your breed knowledge.</p>" },
        },
        {
          id: 107,
          date: "2025-02-04T00:00:00",
          slug: "blue-heeler-user-gallery",
          link: "https://petrage.net/blue-heeler-user-gallery/",
          title: { rendered: "Blue Heeler User Gallery" },
          excerpt: { rendered: "<p>Photo gallery from owners.</p>" },
        },
        {
          id: 108,
          date: "2025-02-05T00:00:00",
          slug: "dog-breeds-from-australia",
          link: "https://petrage.net/dog-breeds-from-australia/",
          title: { rendered: "Dog Breeds from Australia" },
          excerpt: { rendered: "<p>Includes the Australian Cattle Dog and other working breeds.</p>" },
        },
        {
          id: 109,
          date: "2025-02-05T01:00:00",
          slug: "best-herding-dog-breeds",
          link: "https://petrage.net/best-herding-dog-breeds/",
          title: { rendered: "Best Herding Dog Breeds" },
          excerpt: { rendered: "<p>Australian Cattle Dog stands out among top herders.</p>" },
        },
        {
          id: 106,
          date: "2025-02-06T00:00:00",
          slug: "blue-heeler-puppies-playing-video",
          link: "https://petrage.net/blue-heeler-puppies-playing-video/",
          title: { rendered: "Blue Heeler Puppies Playing Video" },
          excerpt: { rendered: "<p>Watch them play in the yard.</p>" },
        },
      ],
      "/wp-json/wp/v2/posts?categories=31&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
        {
          id: 103,
          date: "2025-02-03T00:00:00",
          slug: "australian-cattle-dog-facts",
          link: "https://petrage.net/australian-cattle-dog-facts/",
          title: { rendered: "Australian Cattle Dog Facts" },
          excerpt: { rendered: "<p>Breed facts and history.</p>" },
        },
        {
          id: 104,
          date: "2025-02-04T00:00:00",
          slug: "beagle-breed-facts",
          link: "https://petrage.net/beagle-breed-facts/",
          title: { rendered: "Beagle Breed Facts" },
          excerpt: { rendered: "<p>Friendly scent hound overview.</p>" },
        },
        {
          id: 105,
          date: "2025-02-05T00:00:00",
          slug: "french-bulldog-breed-facts",
          link: "https://petrage.net/french-bulldog-breed-facts/",
          title: { rendered: "French Bulldog Breed Facts" },
          excerpt: { rendered: "<p>Companion breed overview.</p>" },
        },
      ],
    });

    const result = await getBreedContent("acd", {
      breedData,
      fetchImplementation: mockFetch,
    });

    expect(result).not.toBeNull();
    expect(result?.breed.id).toBe("australian-cattle-dog");
    expect(result?.content_query.tag_slugs_queried).toEqual(["acd", "australiancattledog"]);
    expect(result?.content_query.matched_tag_ids).toEqual([11, 12]);
    expect(result?.content_query.category_slugs_queried).toEqual(["dog-breed-facts"]);
    expect(result?.content_query.matched_category_ids).toEqual([31]);
    expect(result?.content.canonical.post?.id).toBe(103);
    expect(result?.content.direct_matches.map((post) => post.id)).toEqual([101, 107]);
    expect(result?.content.related.map((post) => post.id)).toEqual([109, 108, 102]);
    expect(result?.content.supplemental.map((post) => post.id)).toEqual([106]);
    expect(result?.posts.map((post) => post.id)).toEqual([103, 101, 107, 109, 108, 102, 106]);
    expect(result?.posts).toEqual([
      {
        id: 103,
        date: "2025-02-03T00:00:00",
        slug: "australian-cattle-dog-facts",
        link: "https://petrage.net/australian-cattle-dog-facts/",
        title: "Australian Cattle Dog Facts",
        excerpt: "Breed facts and history.",
        matched_tags: [],
        matched_categories: ["dog-breed-facts"],
        content_type: "facts",
      },
      {
        id: 101,
        date: "2025-02-01T00:00:00",
        slug: "blue-heeler-facts",
        link: "https://petrage.net/blue-heeler-facts/",
        title: "Blue Heeler Facts",
        excerpt: "Smart working dogs.",
        matched_tags: ["acd", "australiancattledog"],
        matched_categories: [],
        content_type: "facts",
      },
      {
        id: 107,
        date: "2025-02-04T00:00:00",
        slug: "blue-heeler-user-gallery",
        link: "https://petrage.net/blue-heeler-user-gallery/",
        title: "Blue Heeler User Gallery",
        excerpt: "Photo gallery from owners.",
        matched_tags: ["australiancattledog"],
        matched_categories: [],
        content_type: "gallery",
      },
      {
        id: 109,
        date: "2025-02-05T01:00:00",
        slug: "best-herding-dog-breeds",
        link: "https://petrage.net/best-herding-dog-breeds/",
        title: "Best Herding Dog Breeds",
        excerpt: "Australian Cattle Dog stands out among top herders.",
        matched_tags: ["australiancattledog"],
        matched_categories: [],
        content_type: "list",
      },
      {
        id: 108,
        date: "2025-02-05T00:00:00",
        slug: "dog-breeds-from-australia",
        link: "https://petrage.net/dog-breeds-from-australia/",
        title: "Dog Breeds from Australia",
        excerpt: "Includes the Australian Cattle Dog and other working breeds.",
        matched_tags: ["australiancattledog"],
        matched_categories: [],
        content_type: "list",
      },
      {
        id: 102,
        date: "2025-02-02T00:00:00",
        slug: "blue-heeler-owner-quiz",
        link: "https://petrage.net/blue-heeler-owner-quiz/",
        title: "Blue Heeler Owner Quiz",
        excerpt: "Test your breed knowledge.",
        matched_tags: ["australiancattledog"],
        matched_categories: [],
        content_type: "quiz",
      },
      {
        id: 106,
        date: "2025-02-06T00:00:00",
        slug: "blue-heeler-puppies-playing-video",
        link: "https://petrage.net/blue-heeler-puppies-playing-video/",
        title: "Blue Heeler Puppies Playing Video",
        excerpt: "Watch them play in the yard.",
        matched_tags: ["australiancattledog"],
        matched_categories: [],
        content_type: "video",
      },
    ]);
  });

  it("resolves aussie and handles no matching posts gracefully", async () => {
    const breedData = await loadBreedData();
    const mockFetch = createMockFetch({
      "/wp-json/wp/v2/tags?slug=aussie%2Caustralianshepherd&per_page=2&_fields=id%2Cname%2Cslug": [
        { id: 21, name: "Aussie", slug: "aussie" },
      ],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts&per_page=1&_fields=id%2Cname%2Cslug": [],
      "/wp-json/wp/v2/posts?tags=21&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [],
    });

    const result = await getBreedContent("aussie", {
      breedData,
      fetchImplementation: mockFetch,
    });

    expect(result?.breed.id).toBe("australian-shepherd");
    expect(result?.content_query.tag_slugs_queried).toEqual(["aussie", "australianshepherd"]);
    expect(result?.content_query.matched_tag_slugs).toEqual(["aussie"]);
    expect(result?.content_query.matched_category_slugs).toEqual([]);
    expect(result?.content.canonical.post).toBeNull();
    expect(result?.content.direct_matches).toEqual([]);
    expect(result?.content.related).toEqual([]);
    expect(result?.content.supplemental).toEqual([]);
    expect(result?.posts).toEqual([]);
  });

  it("resolves akita, preserves shared content metadata, and handles no matching categories gracefully", async () => {
    const breedData = await loadBreedData();
    const mockFetch = createMockFetch({
      "/wp-json/wp/v2/tags?slug=akita&per_page=1&_fields=id%2Cname%2Cslug": [
        { id: 41, name: "Akita", slug: "akita" },
      ],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts&per_page=1&_fields=id%2Cname%2Cslug": [
        { id: 31, name: "Dog Breed Facts", slug: "dog-breed-facts" },
      ],
      "/wp-json/wp/v2/posts?tags=41&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
        {
          id: 201,
          date: "2025-03-01T00:00:00",
          slug: "akita-facts",
          link: "https://petrage.net/akita-facts/",
          title: { rendered: "Akita Facts" },
          excerpt: { rendered: "<p>Akita breed guide.</p>" },
        },
        {
          id: 202,
          date: "2025-03-02T00:00:00",
          slug: "dog-breeds-from-japan",
          link: "https://petrage.net/dog-breeds-from-japan/",
          title: { rendered: "Dog Breeds from Japan" },
          excerpt: { rendered: "<p>Japanese breeds including the Akita.</p>" },
        },
      ],
      "/wp-json/wp/v2/posts?categories=31&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
        {
          id: 203,
          date: "2025-03-03T00:00:00",
          slug: "11-interesting-facts-about-akitas",
          link: "https://petrage.net/11-interesting-facts-about-akitas/",
          title: { rendered: "Akita Inu Breed Facts" },
          excerpt: { rendered: "<p>Strong and loyal guardian.</p>" },
        },
        {
          id: 204,
          date: "2025-03-04T00:00:00",
          slug: "beagle-breed-facts",
          link: "https://petrage.net/beagle-breed-facts/",
          title: { rendered: "Beagle Breed Facts" },
          excerpt: { rendered: "<p>Beagle overview.</p>" },
        },
      ],
    });

    const result = await getBreedContent("akita", {
      breedData,
      fetchImplementation: mockFetch,
    });

    expect(result?.breed.id).toBe("akita-inu");
    expect(result?.breed.shared_content_key).toBe("akita");
    expect(result?.content_query.tag_slugs_queried).toEqual(["akita"]);
    expect(result?.content_query.matched_tag_ids).toEqual([41]);
    expect(result?.content_query.category_slugs_queried).toEqual(["dog-breed-facts"]);
    expect(result?.content_query.matched_category_ids).toEqual([31]);
    expect(result?.content.canonical.post?.id).toBe(203);
    expect(result?.content.direct_matches.map((post) => post.id)).toEqual([201]);
    expect(result?.content.related.map((post) => post.id)).toEqual([202]);
    expect(result?.content.supplemental).toEqual([]);
    expect(result?.posts.map((post) => post.id)).toEqual([203, 201, 202]);
  });

  it("resolves doberman and keeps battle-of posts below owner-useful health/care and gallery content", async () => {
    const breedData = await loadBreedData();
    const mockFetch = createMockFetch({
      "/wp-json/wp/v2/tags?slug=doberman&per_page=1&_fields=id%2Cname%2Cslug": [
        { id: 51, name: "Doberman", slug: "doberman" },
      ],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts&per_page=1&_fields=id%2Cname%2Cslug": [],
      "/wp-json/wp/v2/posts?tags=51&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
        {
          id: 301,
          date: "2025-04-01T00:00:00",
          slug: "doberman-health-issues-and-medication-sensitivity",
          link: "https://petrage.net/doberman-health-issues-and-medication-sensitivity/",
          title: { rendered: "Doberman Medication Sensitivity and Health Issues" },
          excerpt: { rendered: "<p>Important medical guidance for Doberman owners.</p>" },
        },
        {
          id: 302,
          date: "2025-04-02T00:00:00",
          slug: "doberman-hypothyroidism-treatment-guide",
          link: "https://petrage.net/doberman-hypothyroidism-treatment-guide/",
          title: { rendered: "Doberman Hypothyroidism Treatment Guide" },
          excerpt: { rendered: "<p>What every owner should know about care and treatment.</p>" },
        },
        {
          id: 303,
          date: "2025-04-03T00:00:00",
          slug: "doberman-user-gallery",
          link: "https://petrage.net/doberman-user-gallery/",
          title: { rendered: "Doberman User Gallery" },
          excerpt: { rendered: "<p>Owner-submitted Doberman photos.</p>" },
        },
        {
          id: 304,
          date: "2025-04-04T00:00:00",
          slug: "doberman-owner-quiz",
          link: "https://petrage.net/doberman-owner-quiz/",
          title: { rendered: "Doberman Owner Quiz" },
          excerpt: { rendered: "<p>Test your Doberman knowledge.</p>" },
        },
        {
          id: 306,
          date: "2025-04-04T01:00:00",
          slug: "battle-of-the-big-dogs-dobie-dogue-rotty-cane-corso",
          link: "https://petrage.net/battle-of-the-big-dogs-dobie-dogue-rotty-cane-corso/",
          title: { rendered: "Battle of the BIG Dogs-Dobie-Dogue-Rotty-Cane Corso" },
          excerpt: { rendered: "<p>Which big dog wins this showdown?</p>" },
        },
        {
          id: 305,
          date: "2025-04-05T00:00:00",
          slug: "doberman-meme-roundup",
          link: "https://petrage.net/doberman-meme-roundup/",
          title: { rendered: "Doberman Meme Roundup" },
          excerpt: { rendered: "<p>Funny Doberman moments.</p>" },
        },
      ],
    });

    const result = await getBreedContent("doberman", {
      breedData,
      fetchImplementation: mockFetch,
    });

    expect(result?.breed.id).toBe("dobermann-pinscher");
    expect(result?.content.direct_matches.map((post) => post.id)).toEqual([302, 301, 303]);
    expect(result?.content.related.map((post) => post.id)).toEqual([306, 304]);
    expect(result?.content.supplemental.map((post) => post.id)).toEqual([305]);
    expect(result?.posts.map((post) => post.id)).toEqual([302, 301, 303, 306, 304, 305]);
    expect(result?.posts.find((post) => post.id === 306)?.content_type).toBe("quiz");
  });

  it("supports loading breed data from generated files when not injected", async () => {
    const mockFetch = createMockFetch({
      "/wp-json/wp/v2/tags?slug=eskie%2Camericaneskimodog&per_page=2&_fields=id%2Cname%2Cslug": [],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts&per_page=1&_fields=id%2Cname%2Cslug": [],
    });

    const result = await getBreedContent("eskie", {
      fetchImplementation: mockFetch,
    });

    expect(result?.breed.id).toBe("american-eskimo-dog");
    expect(result?.content_query.tag_slugs_queried).toEqual(["eskie", "americaneskimodog"]);
  });

  it("reuses a cached breed content result for repeated requests", async () => {
    const breedData = await loadBreedData();
    const firstFetch = createMockFetch({
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
          slug: "blue-heeler-facts",
          link: "https://petrage.net/blue-heeler-facts/",
          title: { rendered: "Blue Heeler Facts" },
          excerpt: { rendered: "<p>Breed facts.</p>" },
        },
      ],
    });

    const firstResult = await getBreedContent("acd", {
      breedData,
      fetchImplementation: firstFetch,
    });
    const secondResult = await getBreedContent("acd", {
      breedData,
      fetchImplementation: createMockFetch({}),
    });

    expect(firstResult).toEqual(secondResult);
  });
});
