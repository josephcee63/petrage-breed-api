import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { breedListCache } from "../src/api/getBreedList.js";
import { loadBreedData } from "../src/lib/loadBreedData.js";
import { createApp } from "../src/server/app.js";

import type { Express } from "express";
import type { LoadedBreedData, NormalizedBreed } from "../src/lib/types.js";

let breedData: LoadedBreedData;

beforeAll(async () => {
  breedData = await loadBreedData();
});

describe("cache headers", () => {
  beforeEach(() => {
    breedListCache.clear();
  });

  it("GET /breeds success includes the breeds cache header", async () => {
    const app = createApp({
      breedData: {
        normalizedBreeds: [createNormalizedBreed({ display_name: "AFFENPINSCHER" })],
        breedIndex: {
          breeds: [],
        },
      },
    });

    const response = await request(app).get("/breeds");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("public, max-age=300, s-maxage=86400");
  });

  it("HEAD /breeds success includes the breeds cache header", async () => {
    const app = createApp({
      breedData: {
        normalizedBreeds: [createNormalizedBreed({ display_name: "AFFENPINSCHER" })],
        breedIndex: {
          breeds: [],
        },
      },
    });

    const response = await request(app).head("/breeds");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("public, max-age=300, s-maxage=86400");
  });

  it("GET /compare success includes the compare cache header", async () => {
    const app = createApp({ breedData });

    const response = await request(app).get("/compare/labrador-retriever/poodle");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("public, max-age=300, s-maxage=3600");
  });

  it("HEAD /compare success includes the compare cache header", async () => {
    const app = createApp({ breedData });

    const response = await request(app).head("/compare/labrador-retriever/poodle");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("public, max-age=300, s-maxage=3600");
  });

  it("rate-limited compare responses do not get the success cache header", async () => {
    const app = createApp({ breedData });

    for (let requestNumber = 0; requestNumber < 20; requestNumber += 1) {
      await getWithForwardedIp(app, "/compare/acd/aussie", "198.51.100.50");
    }

    const response = await getWithForwardedIp(app, "/compare/acd/aussie", "198.51.100.50");

    expect(response.status).toBe(429);
    expect(response.headers["cache-control"]).toBeUndefined();
  });

  it("compare not-found responses do not get the success cache header", async () => {
    const app = createApp({ breedData });

    const response = await request(app).get("/compare/acd/unknownbreed");

    expect(response.status).toBe(404);
    expect(response.headers["cache-control"]).toBeUndefined();
  });
});

function createNormalizedBreed(overrides: Partial<NormalizedBreed>): NormalizedBreed {
  return {
    id: overrides.id ?? "test-breed",
    display_name: overrides.display_name ?? "TEST BREED",
    aka_names: overrides.aka_names ?? [],
    alpha: overrides.alpha ?? "T",
    traits: overrides.traits ?? {
      temperament: null,
      purpose: null,
      good_with_families: null,
      owner_type: null,
      intelligence: null,
      exercise_needs: null,
    },
    stats: overrides.stats ?? {
      female_height: null,
      male_height: null,
      female_weight: null,
      male_weight: null,
      life_span: null,
      litter_size: null,
      shedding: [],
      origin: [],
      size: [],
      hair_length: [],
    },
    media: overrides.media ?? {
      image_url: null,
      article_url: null,
      tag_url: null,
    },
    description_text: overrides.description_text ?? null,
    source: overrides.source ?? {
      table_row_id: null,
      raw_breed_field: null,
    },
  };
}

function getWithForwardedIp(app: Express, route: string, ipAddress: string) {
  return request(app).get(route).set("X-Forwarded-For", ipAddress);
}
