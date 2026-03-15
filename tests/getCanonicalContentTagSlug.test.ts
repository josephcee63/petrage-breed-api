import { describe, expect, it } from "vitest";

import { getCanonicalContentTagSlug } from "../src/lib/getCanonicalContentTagSlug.js";
import type { BreedIndexBreed } from "../src/lib/types.js";

function createBreed(overrides: Partial<BreedIndexBreed> = {}): BreedIndexBreed {
  return {
    id: "test-breed",
    display_name: "TEST BREED",
    aka_names: [],
    aliases: [],
    tag_slugs: [],
    preferred_tag_slug: null,
    shared_content_key: null,
    lookup_keys: [],
    ...overrides,
  };
}

describe("getCanonicalContentTagSlug", () => {
  it("uses the standardized canonical content tag across common breeds", () => {
    expect(
      getCanonicalContentTagSlug(
        createBreed({
          id: "labrador-retriever",
          display_name: "LABRADOR RETRIEVER",
          preferred_tag_slug: "labradorretriever",
          tag_slugs: ["labradorretriever", "lab"],
        }),
      ),
    ).toBe("labradorretriever");

    expect(
      getCanonicalContentTagSlug(
        createBreed({
          id: "golden-retriever",
          display_name: "GOLDEN RETRIEVER",
          preferred_tag_slug: "goldenretriever",
          tag_slugs: ["goldenretriever"],
        }),
      ),
    ).toBe("goldenretriever");

    expect(
      getCanonicalContentTagSlug(
        createBreed({
          id: "rhodesian-ridgeback",
          display_name: "RHODESIAN RIDGEBACK",
          preferred_tag_slug: "rhodesianridgeback",
          tag_slugs: ["rhodesianridgeback"],
        }),
      ),
    ).toBe("rhodesianridgeback");

    expect(
      getCanonicalContentTagSlug(
        createBreed({
          id: "french-bulldog",
          display_name: "FRENCH BULLDOG",
          preferred_tag_slug: "frenchbulldog",
          tag_slugs: ["frenchie", "frenchbulldog"],
        }),
      ),
    ).toBe("frenchbulldog");
  });

  it("prefers the full breed slug over a short alias when both exist", () => {
    const breed = createBreed({
      id: "labrador-retriever",
      display_name: "LABRADOR RETRIEVER",
      preferred_tag_slug: "lab",
      tag_slugs: ["lab", "labradorretriever"],
    });

    expect(getCanonicalContentTagSlug(breed)).toBe("labradorretriever");
  });

  it("falls back to the preferred tag when no standardized breed slug is present", () => {
    const breed = createBreed({
      id: "akita-inu",
      display_name: "AKITA INU",
      preferred_tag_slug: "akita",
      tag_slugs: ["akita", "akita inu"],
    });

    expect(getCanonicalContentTagSlug(breed)).toBe("akita");
  });
});
