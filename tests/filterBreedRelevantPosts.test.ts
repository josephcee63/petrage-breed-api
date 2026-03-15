import { describe, expect, it } from "vitest";

import { filterBreedRelevantPosts } from "../src/lib/filterBreedRelevantPosts.js";
import type { CanonicalBreedSignals, WordPressPostSummary } from "../src/lib/types.js";

function createPost(overrides: Partial<WordPressPostSummary>): WordPressPostSummary {
  return {
    id: 1,
    date: "2025-01-01T00:00:00Z",
    slug: "generic-dog-post",
    link: "https://petrage.net/generic-dog-post/",
    title: "Generic Dog Post",
    excerpt: "Generic dog excerpt",
    matched_tags: [],
    matched_categories: [],
    ...overrides,
  };
}

const baseSignals: CanonicalBreedSignals = {
  display_name: "AUSTRALIAN CATTLE DOG",
  aliases: ["Blue Heeler", "Red Heeler", "ACD"],
  article_url: "https://petrage.net/australian-cattle-dog/",
  preferred_tag_slug: "acd",
  tag_slugs: ["acd", "australiancattledog"],
  shared_content_key: null,
};

describe("filterBreedRelevantPosts", () => {
  it("drops tag-only posts with no breed wording in the content", () => {
    const filtered = filterBreedRelevantPosts(
      [
        createPost({
          id: 1,
          title: "Working Dog Post",
          matched_tags: ["acd"],
        }),
      ],
      baseSignals,
    );

    expect(filtered).toEqual([]);
  });

  it("retains excerpt-supported posts when the breed query metadata also matches", () => {
    const filtered = filterBreedRelevantPosts(
      [
        createPost({
          id: 1,
          title: "Working Dog Post",
          excerpt: "The Australian Cattle Dog excels at herding livestock.",
          matched_tags: ["acd"],
        }),
      ],
      baseSignals,
    );

    expect(filtered.map((post) => post.id)).toEqual([1]);
  });

  it("removes unrelated category-only posts", () => {
    const filtered = filterBreedRelevantPosts(
      [
        createPost({
          id: 1,
          title: "Beagle Breed Facts",
          slug: "beagle-breed-facts",
          matched_categories: ["dog-breed-facts"],
        }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(filtered).toEqual([]);
  });

  it("retains relevant category-only posts", () => {
    const filtered = filterBreedRelevantPosts(
      [
        createPost({
          id: 1,
          title: "Australian Cattle Dog Breed Facts",
          slug: "australian-cattle-dog-breed-facts",
          matched_categories: ["dog-breed-facts"],
        }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(filtered.map((post) => post.id)).toEqual([1]);
  });

  it("preserves stable order for retained posts", () => {
    const filtered = filterBreedRelevantPosts(
      [
        createPost({
          id: 1,
          title: "Australian Cattle Dog Breed Facts",
          slug: "australian-cattle-dog-breed-facts",
          matched_categories: ["dog-breed-facts"],
        }),
        createPost({
          id: 2,
          title: "Blue Heeler Training Tips",
          slug: "blue-heeler-training-tips",
          matched_categories: ["dog-breed-facts"],
        }),
        createPost({
          id: 3,
          title: "French Bulldog Breed Facts",
          slug: "french-bulldog-breed-facts",
          matched_categories: ["dog-breed-facts"],
        }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(filtered.map((post) => post.id)).toEqual([1, 2]);
  });
});
