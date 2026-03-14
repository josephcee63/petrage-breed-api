import { describe, expect, it } from "vitest";

import { getContentQueryTags } from "../src/lib/getContentQueryTags.js";
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

describe("getContentQueryTags", () => {
  it("puts the preferred tag first", () => {
    const breed = createBreed({
      preferred_tag_slug: "primary",
      tag_slugs: ["secondary", "primary"],
    });

    expect(getContentQueryTags(breed)).toEqual(["primary", "secondary"]);
  });

  it("returns multiple tag slugs in stable order", () => {
    const breed = createBreed({
      preferred_tag_slug: "acd",
      tag_slugs: ["acd", "australiancattledog", "workingdogs"],
    });

    expect(getContentQueryTags(breed)).toEqual(["acd", "australiancattledog", "workingdogs"]);
  });

  it("removes duplicates and ignores blanks", () => {
    const breed = createBreed({
      preferred_tag_slug: "  aussie ",
      tag_slugs: ["", "aussie", " australianshepherd ", "AUSSIE"],
    });

    expect(getContentQueryTags(breed)).toEqual(["aussie", "australianshepherd"]);
  });
});
