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
      display_name: "AUSTRALIAN CATTLE DOG",
      id: "australian-cattle-dog",
    });

    expect(getContentQueryTags(breed)).toEqual(["australiancattledog", "acd", "workingdogs"]);
  });

  it("removes duplicates and ignores blanks", () => {
    const breed = createBreed({
      preferred_tag_slug: "  aussie ",
      tag_slugs: ["", "aussie", " australianshepherd ", "AUSSIE"],
      display_name: "AUSTRALIAN SHEPHERD",
      id: "australian-shepherd",
    });

    expect(getContentQueryTags(breed)).toEqual(["australianshepherd", "aussie"]);
  });

  it("prefers the full breed-specific slug over a short alias tag", () => {
    const breed = createBreed({
      id: "labrador-retriever",
      display_name: "LABRADOR RETRIEVER",
      preferred_tag_slug: "lab",
      tag_slugs: ["lab", "labradorretriever"],
    });

    expect(getContentQueryTags(breed)).toEqual(["labradorretriever", "lab"]);
  });
});
