import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { breedCardCache } from "../src/api/getBreedCard.js";
import { breedContentCache } from "../src/api/getBreedContent.js";
import { wordPressCategoriesCache } from "../src/lib/fetchWordPressCategories.js";
import { wordPressPostsByCategoriesCache } from "../src/lib/fetchWordPressPostsByCategories.js";
import { wordPressPostsByTagsCache } from "../src/lib/fetchWordPressPostsByTags.js";
import { wordPressTagsCache } from "../src/lib/fetchWordPressTags.js";
import { loadBreedData } from "../src/lib/loadBreedData.js";
import { createApp } from "../src/server/app.js";

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

describe("server", () => {
  beforeEach(() => {
    breedCardCache.clear();
    breedContentCache.clear();
    wordPressTagsCache.clear();
    wordPressCategoriesCache.clear();
    wordPressPostsByTagsCache.clear();
    wordPressPostsByCategoriesCache.clear();
  });

  it("GET / returns 200 and the API index", async () => {
    const app = createApp();
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      service: "dog-breed-api",
      endpoints: [
        "/health",
        "/breed/:input",
        "/breed/:input/content",
        "/breed/:input/card",
        "/compare/:left/:right",
      ],
    });
  });

  it("GET /health returns 200 and ok", async () => {
    const app = createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("GET /breed/acd returns 200 and the correct breed id", async () => {
    const breedData = await loadBreedData();
    const app = createApp({ breedData });
    const response = await request(app).get("/breed/acd");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe("australian-cattle-dog");
  });

  it("GET /breed/unknownbreed returns 404", async () => {
    const breedData = await loadBreedData();
    const app = createApp({ breedData });
    const response = await request(app).get("/breed/unknownbreed");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Breed not found" });
  });

  it("GET /breed/acd/content returns 200 using mocked fetch behavior", async () => {
    const breedData = await loadBreedData();
    const app = createApp({
      breedData,
      fetchImplementation: createMockFetch({
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
        "/wp-json/wp/v2/posts?tags=12&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [],
        "/wp-json/wp/v2/posts?categories=31&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [],
      }),
      wordPressBaseUrl: "https://petrage.net",
    });
    const response = await request(app).get("/breed/acd/content");

    expect(response.status).toBe(200);
    expect(response.body.breed.id).toBe("australian-cattle-dog");
    expect(response.body.content.canonical.post).toMatchObject({
      id: 101,
      content_type: "facts",
    });
    expect(response.body.content.related).toEqual([]);
    expect(response.body.content.supplemental).toEqual([]);
    expect(response.body.posts[0]).toMatchObject({
      id: 101,
      title: "Blue Heeler Facts",
      excerpt: "Smart working dogs.",
    });
  });

  it("GET /breed/acd/card returns 200 with a frontend-ready payload", async () => {
    const breedData = await loadBreedData();
    const app = createApp({
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
        ],
        "/wp-json/wp/v2/posts?categories=31&per_page=20&_fields=id%2Cdate%2Cslug%2Clink%2Ctitle%2Cexcerpt": [
          {
            id: 104,
            date: "2025-02-04T00:00:00",
            slug: "australian-cattle-dog-facts",
            link: "https://petrage.net/australian-cattle-dog-facts/",
            title: { rendered: "Australian Cattle Dog Facts" },
            excerpt: { rendered: "<p>Breed facts and history.</p>" },
          },
        ],
      }),
      wordPressBaseUrl: "https://petrage.net",
    });
    const response = await request(app).get("/breed/acd/card");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      breed: {
        id: "australian-cattle-dog",
        display_name: "Australian Cattle Dog",
      },
      featured: {
        main_article: {
          title: "Australian Cattle Dog Facts",
        },
        owner_help: [{ title: "Blue Heeler Health Issues" }],
        gallery: {
          title: "Blue Heeler User Gallery",
        },
        fun_extras: [{ title: "Blue Heeler Owner Quiz" }],
      },
      meta: {
        preferred_tag_slug: "acd",
      },
    });
  });

  it("GET /breed/doberman/card returns 200", async () => {
    const breedData = await loadBreedData();
    const app = createApp({
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
        ],
      }),
      wordPressBaseUrl: "https://petrage.net",
    });
    const response = await request(app).get("/breed/doberman/card");

    expect(response.status).toBe(200);
    expect(response.body.breed.id).toBe("dobermann-pinscher");
    expect(response.body.breed.display_name).toBe("Dobermann Pinscher");
    expect(response.body.featured.owner_help[0]).toMatchObject({
      title: "Doberman Medication Sensitivity",
    });
  });

  it("GET /breed/unknownbreed/card returns 404", async () => {
    const breedData = await loadBreedData();
    const app = createApp({ breedData });
    const response = await request(app).get("/breed/unknownbreed/card");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Breed not found" });
  });

  it("GET /compare/acd/aussie returns 200", async () => {
    const breedData = await loadBreedData();
    const app = createApp({ breedData });
    const response = await request(app).get("/compare/acd/aussie");

    expect(response.status).toBe(200);
    expect(response.body.left.id).toBe("australian-cattle-dog");
    expect(response.body.right.id).toBe("australian-shepherd");
  });

  it("GET /compare/acd/unknownbreed returns 404", async () => {
    const breedData = await loadBreedData();
    const app = createApp({ breedData });
    const response = await request(app).get("/compare/acd/unknownbreed");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "One or both breeds not found" });
  });

  it("unknown route returns 404 JSON", async () => {
    const app = createApp();
    const response = await request(app).get("/not-a-route");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Route not found" });
  });
});
