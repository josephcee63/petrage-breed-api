import { beforeEach, describe, expect, it } from "vitest";

import { breedContentCache, getBreedContent } from "../src/api/getBreedContent.js";
import { wordPressCategoriesCache } from "../src/lib/fetchWordPressCategories.js";
import { wordPressPostsByCategoriesCache } from "../src/lib/fetchWordPressPostsByCategories.js";
import { wordPressPostsByTagAndCategoryCache } from "../src/lib/fetchWordPressPostsByTagAndCategory.js";
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
    wordPressPostsByTagAndCategoryCache.clear();
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

  it("resolves acd and keeps related resources limited to article-style posts", async () => {
    const breedData = await loadBreedData();
    const mockFetch = createMockFetch({
      "/wp-json/wp/v2/tags?slug=australiancattledog%2Cacd&per_page=2&_fields=id%2Cname%2Cslug": [
        { id: 11, name: "ACD", slug: "acd" },
        { id: 12, name: "Australian Cattle Dog", slug: "australiancattledog" },
      ],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts%2Cblog&per_page=2&_fields=id%2Cname%2Cslug": [
        { id: 31, name: "Dog Breed Facts", slug: "dog-breed-facts" },
        { id: 32, name: "Blog", slug: "blog" },
      ],
      "/wp-json/wp/v2/posts?tags=11&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 101,
          date: "2025-02-01T00:00:00",
          slug: "blue-heeler-facts",
          link: "https://petrage.net/blue-heeler-facts/",
          title: { rendered: "<h1>Blue Heeler Facts</h1>" },
          excerpt: { rendered: "<p>Smart <strong>working</strong> dogs.</p>" },
          categories: [],
          tags: [11, 12],
        },
        {
          id: 110,
          date: "2025-02-06T01:00:00",
          slug: "best-blue-heeler-ranch-dogs",
          link: "https://petrage.net/best-blue-heeler-ranch-dogs/",
          title: { rendered: "Best Blue Heeler Ranch Dogs" },
          excerpt: { rendered: "<p>Blue Heeler working stories from active farms.</p>" },
          categories: [32],
          tags: [11],
        },
      ],
      "/wp-json/wp/v2/posts?tags=12&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 101,
          date: "2025-02-01T00:00:00",
          slug: "blue-heeler-facts",
          link: "https://petrage.net/blue-heeler-facts/",
          title: { rendered: "<h1>Blue Heeler Facts</h1>" },
          excerpt: { rendered: "<p>Smart <strong>working</strong> dogs.</p>" },
          categories: [],
          tags: [11, 12],
        },
        {
          id: 102,
          date: "2025-02-02T00:00:00",
          slug: "blue-heeler-owner-quiz",
          link: "https://petrage.net/blue-heeler-owner-quiz/",
          title: { rendered: "Blue <em>Heeler</em> Owner Quiz" },
          excerpt: { rendered: "<p>Test your breed knowledge.</p>" },
          categories: [],
          tags: [12],
        },
        {
          id: 107,
          date: "2025-02-04T00:00:00",
          slug: "blue-heeler-user-gallery",
          link: "https://petrage.net/blue-heeler-user-gallery/",
          title: { rendered: "Blue Heeler User Gallery" },
          excerpt: { rendered: "<p>Photo gallery from owners.</p>" },
          categories: [],
          tags: [12],
        },
        {
          id: 108,
          date: "2025-02-05T00:00:00",
          slug: "dog-breeds-from-australia",
          link: "https://petrage.net/dog-breeds-from-australia/",
          title: { rendered: "Dog Breeds from Australia" },
          excerpt: { rendered: "<p>Includes the Australian Cattle Dog and other working breeds.</p>" },
          categories: [32],
          tags: [12],
        },
        {
          id: 109,
          date: "2025-02-05T01:00:00",
          slug: "best-herding-dog-breeds",
          link: "https://petrage.net/best-herding-dog-breeds/",
          title: { rendered: "Best Herding Dog Breeds" },
          excerpt: { rendered: "<p>Australian Cattle Dog stands out among top herders.</p>" },
          categories: [32],
          tags: [12],
        },
        {
          id: 106,
          date: "2025-02-06T00:00:00",
          slug: "blue-heeler-puppies-playing-video",
          link: "https://petrage.net/blue-heeler-puppies-playing-video/",
          title: { rendered: "Blue Heeler Puppies Playing Video" },
          excerpt: { rendered: "<p>Watch them play in the yard.</p>" },
          categories: [],
          tags: [12],
        },
      ],
      "/wp-json/wp/v2/posts?categories=31&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 103,
          date: "2025-02-03T00:00:00",
          slug: "australian-cattle-dog-facts",
          link: "https://petrage.net/australian-cattle-dog-facts/",
          title: { rendered: "Australian Cattle Dog Facts" },
          excerpt: { rendered: "<p>Breed facts and history.</p>" },
          categories: [31],
          tags: [],
        },
        {
          id: 104,
          date: "2025-02-04T00:00:00",
          slug: "beagle-breed-facts",
          link: "https://petrage.net/beagle-breed-facts/",
          title: { rendered: "Beagle Breed Facts" },
          excerpt: { rendered: "<p>Friendly scent hound overview.</p>" },
          categories: [31],
          tags: [],
        },
        {
          id: 105,
          date: "2025-02-05T00:00:00",
          slug: "french-bulldog-breed-facts",
          link: "https://petrage.net/french-bulldog-breed-facts/",
          title: { rendered: "French Bulldog Breed Facts" },
          excerpt: { rendered: "<p>Companion breed overview.</p>" },
          categories: [31],
          tags: [],
        },
      ],
      "/wp-json/wp/v2/posts?categories=32&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 108,
          date: "2025-02-05T00:00:00",
          slug: "dog-breeds-from-australia",
          link: "https://petrage.net/dog-breeds-from-australia/",
          title: { rendered: "Dog Breeds from Australia" },
          excerpt: { rendered: "<p>Includes the Australian Cattle Dog and other working breeds.</p>" },
          categories: [32],
          tags: [12],
        },
        {
          id: 109,
          date: "2025-02-05T01:00:00",
          slug: "best-herding-dog-breeds",
          link: "https://petrage.net/best-herding-dog-breeds/",
          title: { rendered: "Best Herding Dog Breeds" },
          excerpt: { rendered: "<p>Australian Cattle Dog stands out among top herders.</p>" },
          categories: [32],
          tags: [12],
        },
      ],
      "/wp-json/wp/v2/posts?tags=12&categories=32&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 108,
          date: "2025-02-05T00:00:00",
          slug: "dog-breeds-from-australia",
          link: "https://petrage.net/dog-breeds-from-australia/",
          title: { rendered: "Dog Breeds from Australia" },
          excerpt: { rendered: "<p>Includes the Australian Cattle Dog and other working breeds.</p>" },
          categories: [32],
          tags: [12],
        },
        {
          id: 109,
          date: "2025-02-05T01:00:00",
          slug: "best-herding-dog-breeds",
          link: "https://petrage.net/best-herding-dog-breeds/",
          title: { rendered: "Best Herding Dog Breeds" },
          excerpt: { rendered: "<p>Australian Cattle Dog stands out among top herders.</p>" },
          categories: [32],
          tags: [12],
        },
      ],
    });

    const result = await getBreedContent("acd", {
      breedData,
      fetchImplementation: mockFetch,
    });

    expect(result).not.toBeNull();
    expect(result?.breed.id).toBe("australian-cattle-dog");
    expect(result?.content_query.tag_slugs_queried).toEqual(["australiancattledog", "acd"]);
    expect(result?.content_query.matched_tag_ids).toEqual([12, 11]);
    expect(result?.content_query.category_slugs_queried).toEqual(["dog-breed-facts", "blog"]);
    expect(result?.content_query.matched_category_ids).toEqual([31, 32]);
    expect(result?.content.canonical.post?.id).toBe(103);
    expect(result?.content.direct_matches.map((post) => post.id)).toEqual([101, 107]);
    expect(result?.content.related.map((post) => post.id)).toEqual([109, 108]);
    expect(result?.content.supplemental.map((post) => post.id)).toEqual([106]);
    expect(result?.posts.map((post) => post.id)).toEqual([103, 101, 110, 107, 109, 108, 102, 106]);
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
        id: 110,
        date: "2025-02-06T01:00:00",
        slug: "best-blue-heeler-ranch-dogs",
        link: "https://petrage.net/best-blue-heeler-ranch-dogs/",
        title: "Best Blue Heeler Ranch Dogs",
        excerpt: "Blue Heeler working stories from active farms.",
        matched_tags: ["acd"],
        matched_categories: ["blog"],
        content_type: "list",
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
        matched_categories: ["blog"],
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
        matched_categories: ["blog"],
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
      "/wp-json/wp/v2/tags?slug=australianshepherd%2Caussie&per_page=2&_fields=id%2Cname%2Cslug": [
        { id: 21, name: "Aussie", slug: "aussie" },
      ],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts%2Cblog&per_page=2&_fields=id%2Cname%2Cslug": [],
      "/wp-json/wp/v2/posts?tags=21&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [],
    });

    const result = await getBreedContent("aussie", {
      breedData,
      fetchImplementation: mockFetch,
    });

    expect(result?.breed.id).toBe("australian-shepherd");
    expect(result?.content_query.tag_slugs_queried).toEqual(["australianshepherd", "aussie"]);
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
      "/wp-json/wp/v2/categories?slug=dog-breed-facts%2Cblog&per_page=2&_fields=id%2Cname%2Cslug": [
        { id: 31, name: "Dog Breed Facts", slug: "dog-breed-facts" },
        { id: 32, name: "Blog", slug: "blog" },
      ],
      "/wp-json/wp/v2/posts?tags=41&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 201,
          date: "2025-03-01T00:00:00",
          slug: "akita-facts",
          link: "https://petrage.net/akita-facts/",
          title: { rendered: "Akita Facts" },
          excerpt: { rendered: "<p>Akita breed guide.</p>" },
          categories: [],
          tags: [41],
        },
        {
          id: 202,
          date: "2025-03-02T00:00:00",
          slug: "dog-breeds-from-japan",
          link: "https://petrage.net/dog-breeds-from-japan/",
          title: { rendered: "Dog Breeds from Japan" },
          excerpt: { rendered: "<p>Japanese breeds including the Akita.</p>" },
          categories: [32],
          tags: [41],
        },
      ],
      "/wp-json/wp/v2/posts?categories=31&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 203,
          date: "2025-03-03T00:00:00",
          slug: "11-interesting-facts-about-akitas",
          link: "https://petrage.net/11-interesting-facts-about-akitas/",
          title: { rendered: "Akita Inu Breed Facts" },
          excerpt: { rendered: "<p>Strong and loyal guardian.</p>" },
          categories: [31],
          tags: [],
        },
        {
          id: 204,
          date: "2025-03-04T00:00:00",
          slug: "beagle-breed-facts",
          link: "https://petrage.net/beagle-breed-facts/",
          title: { rendered: "Beagle Breed Facts" },
          excerpt: { rendered: "<p>Beagle overview.</p>" },
          categories: [31],
          tags: [],
        },
      ],
      "/wp-json/wp/v2/posts?categories=32&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 202,
          date: "2025-03-02T00:00:00",
          slug: "dog-breeds-from-japan",
          link: "https://petrage.net/dog-breeds-from-japan/",
          title: { rendered: "Dog Breeds from Japan" },
          excerpt: { rendered: "<p>Japanese breeds including the Akita.</p>" },
          categories: [32],
          tags: [41],
        },
      ],
      "/wp-json/wp/v2/posts?tags=41&categories=32&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 202,
          date: "2025-03-02T00:00:00",
          slug: "dog-breeds-from-japan",
          link: "https://petrage.net/dog-breeds-from-japan/",
          title: { rendered: "Dog Breeds from Japan" },
          excerpt: { rendered: "<p>Japanese breeds including the Akita.</p>" },
          categories: [32],
          tags: [41],
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
    expect(result?.content_query.category_slugs_queried).toEqual(["dog-breed-facts", "blog"]);
    expect(result?.content_query.matched_category_ids).toEqual([31, 32]);
    expect(result?.content.canonical.post?.id).toBe(203);
    expect(result?.content.direct_matches.map((post) => post.id)).toEqual([201]);
    expect(result?.content.related.map((post) => post.id)).toEqual([202]);
    expect(result?.content.supplemental).toEqual([]);
    expect(result?.posts.map((post) => post.id)).toEqual([203, 201, 202]);
  });

  it("uses the direct blog plus canonical-tag query for related resources even when the broad pool is noisy", async () => {
    const breedData = await loadBreedData();
    const mockFetch = createMockFetch({
      "/wp-json/wp/v2/tags?slug=labradorretriever%2Clab&per_page=2&_fields=id%2Cname%2Cslug": [
        { id: 61, name: "Labrador Retriever", slug: "labradorretriever" },
        { id: 62, name: "Lab", slug: "lab" },
      ],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts%2Cblog&per_page=2&_fields=id%2Cname%2Cslug": [
        { id: 31, name: "Dog Breed Facts", slug: "dog-breed-facts" },
        { id: 32, name: "Blog", slug: "blog" },
      ],
      "/wp-json/wp/v2/posts?tags=61&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 401,
          date: "2025-04-01T00:00:00",
          slug: "labrador-retriever-user-gallery",
          link: "https://petrage.net/labrador-retriever-user-gallery/",
          title: { rendered: "Labrador Retriever User Gallery" },
          excerpt: { rendered: "<p>User-submitted Lab photos.</p>" },
          categories: [],
          tags: [61],
        },
        {
          id: 402,
          date: "2025-04-02T00:00:00",
          slug: "labrador-retriever-dog-breed-quiz",
          link: "https://petrage.net/labrador-retriever-dog-breed-quiz/",
          title: { rendered: "Labrador Retriever Dog Breed Quiz" },
          excerpt: { rendered: "<p>How much do you know about Labs?</p>" },
          categories: [],
          tags: [61],
        },
      ],
      "/wp-json/wp/v2/posts?tags=62&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 403,
          date: "2025-04-03T00:00:00",
          slug: "funny-lab-video-roundup",
          link: "https://petrage.net/funny-lab-video-roundup/",
          title: { rendered: "Funny Lab Video Roundup" },
          excerpt: { rendered: "<p>Playful Lab moments.</p>" },
          categories: [],
          tags: [62],
        },
      ],
      "/wp-json/wp/v2/posts?categories=31&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 404,
          date: "2025-04-04T00:00:00",
          slug: "13-interesting-facts-about-labrador-retrievers",
          link: "https://petrage.net/13-interesting-facts-about-labrador-retrievers/",
          title: { rendered: "13 Interesting Facts about Labrador Retrievers" },
          excerpt: { rendered: "<p>Breed guide and history.</p>" },
          categories: [31],
          tags: [],
        },
      ],
      "/wp-json/wp/v2/posts?categories=32&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [],
      "/wp-json/wp/v2/posts?tags=61&categories=32&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 405,
          date: "2025-04-05T00:00:00",
          slug: "best-family-activities-for-labrador-retrievers",
          link: "https://petrage.net/best-family-activities-for-labrador-retrievers/",
          title: { rendered: "Best Family Activities for Labrador Retrievers" },
          excerpt: { rendered: "<p>Fun ideas for active Labrador homes.</p>" },
          categories: [32],
          tags: [61],
        },
        {
          id: 406,
          date: "2025-04-06T00:00:00",
          slug: "labrador-retriever-shedding-guide",
          link: "https://petrage.net/labrador-retriever-shedding-guide/",
          title: { rendered: "Labrador Retriever Shedding Guide" },
          excerpt: { rendered: "<p>What Labrador owners should expect.</p>" },
          categories: [32],
          tags: [61],
        },
      ],
    });

    const result = await getBreedContent("labrador retriever", {
      breedData,
      fetchImplementation: mockFetch,
    });

    expect(result).not.toBeNull();
    expect(result?.breed.id).toBe("labrador-retriever");
    expect(result?.content_query.tag_slugs_queried).toEqual(["labradorretriever", "lab"]);
    expect(result?.content.canonical.post?.id).toBe(404);
    expect(result?.content.direct_matches.map((post) => post.id)).toEqual([401]);
    expect(result?.content.related.map((post) => post.id)).toEqual([406, 405]);
    expect(result?.posts.map((post) => post.id)).toEqual([404, 401, 402, 403]);
  });

  it("resolves doberman and keeps battle-of posts below owner-useful health/care and gallery content", async () => {
    const breedData = await loadBreedData();
    const mockFetch = createMockFetch({
      "/wp-json/wp/v2/tags?slug=doberman&per_page=1&_fields=id%2Cname%2Cslug": [
        { id: 51, name: "Doberman", slug: "doberman" },
      ],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts%2Cblog&per_page=2&_fields=id%2Cname%2Cslug": [],
      "/wp-json/wp/v2/posts?tags=51&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 301,
          date: "2025-04-01T00:00:00",
          slug: "doberman-health-issues-and-medication-sensitivity",
          link: "https://petrage.net/doberman-health-issues-and-medication-sensitivity/",
          title: { rendered: "Doberman Medication Sensitivity and Health Issues" },
          excerpt: { rendered: "<p>Important medical guidance for Doberman owners.</p>" },
          categories: [],
          tags: [51],
        },
        {
          id: 302,
          date: "2025-04-02T00:00:00",
          slug: "doberman-hypothyroidism-treatment-guide",
          link: "https://petrage.net/doberman-hypothyroidism-treatment-guide/",
          title: { rendered: "Doberman Hypothyroidism Treatment Guide" },
          excerpt: { rendered: "<p>What every owner should know about care and treatment.</p>" },
          categories: [],
          tags: [51],
        },
        {
          id: 303,
          date: "2025-04-03T00:00:00",
          slug: "doberman-user-gallery",
          link: "https://petrage.net/doberman-user-gallery/",
          title: { rendered: "Doberman User Gallery" },
          excerpt: { rendered: "<p>Owner-submitted Doberman photos.</p>" },
          categories: [],
          tags: [51],
        },
        {
          id: 304,
          date: "2025-04-04T00:00:00",
          slug: "doberman-owner-quiz",
          link: "https://petrage.net/doberman-owner-quiz/",
          title: { rendered: "Doberman Owner Quiz" },
          excerpt: { rendered: "<p>Test your Doberman knowledge.</p>" },
          categories: [],
          tags: [51],
        },
        {
          id: 306,
          date: "2025-04-04T01:00:00",
          slug: "battle-of-the-big-dogs-dobie-dogue-rotty-cane-corso",
          link: "https://petrage.net/battle-of-the-big-dogs-dobie-dogue-rotty-cane-corso/",
          title: { rendered: "Battle of the BIG Dogs-Dobie-Dogue-Rotty-Cane Corso" },
          excerpt: { rendered: "<p>Which big dog wins this showdown?</p>" },
          categories: [],
          tags: [51],
        },
        {
          id: 305,
          date: "2025-04-05T00:00:00",
          slug: "doberman-meme-roundup",
          link: "https://petrage.net/doberman-meme-roundup/",
          title: { rendered: "Doberman Meme Roundup" },
          excerpt: { rendered: "<p>Funny Doberman moments.</p>" },
          categories: [],
          tags: [51],
        },
      ],
    });

    const result = await getBreedContent("doberman", {
      breedData,
      fetchImplementation: mockFetch,
    });

    expect(result?.breed.id).toBe("dobermann-pinscher");
    expect(result?.content.canonical.post).toBeNull();
    expect(result?.content.direct_matches.map((post) => post.id)).toEqual([301, 303, 302]);
    expect(result?.content.related).toEqual([]);
    expect(result?.content.supplemental.map((post) => post.id)).toEqual([305]);
    expect(result?.posts.map((post) => post.id)).toEqual([301, 303, 302, 306, 304, 305]);
    expect(result?.posts.find((post) => post.id === 306)?.content_type).toBe("quiz");
  });

  it("supports loading breed data from generated files when not injected", async () => {
    const mockFetch = createMockFetch({
      "/wp-json/wp/v2/tags?slug=americaneskimodog%2Ceskie&per_page=2&_fields=id%2Cname%2Cslug": [],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts%2Cblog&per_page=2&_fields=id%2Cname%2Cslug": [],
    });

    const result = await getBreedContent("eskie", {
      fetchImplementation: mockFetch,
    });

    expect(result?.breed.id).toBe("american-eskimo-dog");
    expect(result?.content_query.tag_slugs_queried).toEqual(["americaneskimodog", "eskie"]);
  });

  it("reuses a cached breed content result for repeated requests", async () => {
    const breedData = await loadBreedData();
    const firstFetch = createMockFetch({
      "/wp-json/wp/v2/tags?slug=australiancattledog%2Cacd&per_page=2&_fields=id%2Cname%2Cslug": [
        { id: 11, name: "ACD", slug: "acd" },
        { id: 12, name: "Australian Cattle Dog", slug: "australiancattledog" },
      ],
      "/wp-json/wp/v2/categories?slug=dog-breed-facts%2Cblog&per_page=2&_fields=id%2Cname%2Cslug": [],
      "/wp-json/wp/v2/posts?tags=11&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [],
      "/wp-json/wp/v2/posts?tags=12&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt%2Ccategories%2Ctags": [
        {
          id: 101,
          date: "2025-02-01T00:00:00",
          slug: "blue-heeler-facts",
          link: "https://petrage.net/blue-heeler-facts/",
          title: { rendered: "Blue Heeler Facts" },
          excerpt: { rendered: "<p>Breed facts.</p>" },
          categories: [],
          tags: [12],
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
