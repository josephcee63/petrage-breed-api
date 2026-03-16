import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { breedListCache } from "../src/api/getBreedList.js";
import { breedContentCache } from "../src/api/getBreedContent.js";
import { loadBreedData } from "../src/lib/loadBreedData.js";
import { wordPressCategoriesCache } from "../src/lib/fetchWordPressCategories.js";
import { wordPressPostsByCategoriesCache } from "../src/lib/fetchWordPressPostsByCategories.js";
import { wordPressPostsByTagAndCategoryCache } from "../src/lib/fetchWordPressPostsByTagAndCategory.js";
import { wordPressPostsByTagsCache } from "../src/lib/fetchWordPressPostsByTags.js";
import { wordPressTagsCache } from "../src/lib/fetchWordPressTags.js";
import { createApp } from "../src/server/app.js";

import type { Express } from "express";
import type { LoadedBreedData } from "../src/lib/types.js";

let breedData: LoadedBreedData;

beforeAll(async () => {
  breedData = await loadBreedData();
});

describe("rate limiting", () => {
  beforeEach(() => {
    breedListCache.clear();
    breedContentCache.clear();
    wordPressTagsCache.clear();
    wordPressCategoriesCache.clear();
    wordPressPostsByTagsCache.clear();
    wordPressPostsByCategoriesCache.clear();
    wordPressPostsByTagAndCategoryCache.clear();
  });

  it("repeated requests to /compare eventually return 429", async () => {
    const app = createApp({ breedData });

    for (let requestNumber = 0; requestNumber < 20; requestNumber += 1) {
      const response = await getWithForwardedIp(app, "/compare/acd/aussie", "198.51.100.10");
      expect(response.status).toBe(200);
    }

    const limitedResponse = await getWithForwardedIp(app, "/compare/acd/aussie", "198.51.100.10");
    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body).toEqual({
      error: "Too many requests",
      message: "Please wait a moment and try again.",
    });
  });

  it("repeated requests to /breed/:input/content eventually return 429", async () => {
    const app = createApp({
      breedData,
      fetchImplementation: createEmptyJsonFetch(),
      wordPressBaseUrl: "https://petrage.net",
    });

    for (let requestNumber = 0; requestNumber < 40; requestNumber += 1) {
      const response = await getWithForwardedIp(app, "/breed/acd/content", "198.51.100.20");
      expect(response.status).toBe(200);
    }

    const limitedResponse = await getWithForwardedIp(app, "/breed/acd/content", "198.51.100.20");
    expect(limitedResponse.status).toBe(429);
  });

  it("repeated requests to /breeds eventually return 429", async () => {
    const app = createApp({ breedData });

    for (let requestNumber = 0; requestNumber < 60; requestNumber += 1) {
      const response = await getWithForwardedIp(app, "/breeds", "198.51.100.30");
      expect(response.status).toBe(200);
    }

    const limitedResponse = await getWithForwardedIp(app, "/breeds", "198.51.100.30");
    expect(limitedResponse.status).toBe(429);
  });

  it("normal requests below each threshold still return 200", async () => {
    const compareApp = createApp({ breedData });
    const compareResponse = await getWithForwardedIp(compareApp, "/compare/acd/aussie", "198.51.100.40");
    expect(compareResponse.status).toBe(200);

    const contentApp = createApp({
      breedData,
      fetchImplementation: createEmptyJsonFetch(),
      wordPressBaseUrl: "https://petrage.net",
    });
    const contentResponse = await getWithForwardedIp(contentApp, "/breed/acd/content", "198.51.100.41");
    expect(contentResponse.status).toBe(200);

    const breedsApp = createApp({ breedData });
    const breedsResponse = await getWithForwardedIp(breedsApp, "/breeds", "198.51.100.42");
    expect(breedsResponse.status).toBe(200);
  });
});

function createEmptyJsonFetch(): typeof fetch {
  return (async () =>
    new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })) as typeof fetch;
}

function getWithForwardedIp(app: Express, route: string, ipAddress: string) {
  return request(app).get(route).set("X-Forwarded-For", ipAddress);
}
