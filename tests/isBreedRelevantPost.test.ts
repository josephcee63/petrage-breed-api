import { describe, expect, it } from "vitest";

import { isBreedRelevantPost } from "../src/lib/isBreedRelevantPost.js";
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
  aliases: ["Blue Heeler", "ACD", "A"],
  article_url: "https://petrage.net/australian-cattle-dog/",
  preferred_tag_slug: "acd",
  tag_slugs: ["acd", "australiancattledog"],
  shared_content_key: null,
};

describe("isBreedRelevantPost", () => {
  it("returns true for an exact article_url match", () => {
    expect(
      isBreedRelevantPost(
        createPost({ link: "https://petrage.net/australian-cattle-dog/" }),
        baseSignals,
      ),
    ).toBe(true);
  });

  it("returns true when the full breed name appears in the title", () => {
    expect(
      isBreedRelevantPost(
        createPost({ title: "Australian Cattle Dog Breed Facts" }),
        { ...baseSignals, article_url: null },
      ),
    ).toBe(true);
  });

  it("returns true when an alias appears in the title", () => {
    expect(
      isBreedRelevantPost(
        createPost({ title: "Blue Heeler Training Tips" }),
        { ...baseSignals, article_url: null },
      ),
    ).toBe(true);
  });

  it("returns true when the breed name appears in the slug", () => {
    expect(
      isBreedRelevantPost(
        createPost({ slug: "australian-cattle-dog-guide" }),
        { ...baseSignals, article_url: null },
      ),
    ).toBe(true);
  });

  it("returns true when an alias appears in the slug", () => {
    expect(
      isBreedRelevantPost(
        createPost({ slug: "blue-heeler-guide" }),
        { ...baseSignals, article_url: null },
      ),
    ).toBe(true);
  });

  it("returns true when the breed name appears in the excerpt", () => {
    expect(
      isBreedRelevantPost(
        createPost({ excerpt: "The Australian Cattle Dog is a strong herding breed." }),
        { ...baseSignals, article_url: null },
      ),
    ).toBe(true);
  });

  it("returns false for an unrelated dog-breed-facts article", () => {
    expect(
      isBreedRelevantPost(
        createPost({
          title: "Beagle Breed Facts",
          slug: "beagle-breed-facts",
          excerpt: "Everything to know about Beagles.",
          matched_categories: ["dog-breed-facts"],
        }),
        { ...baseSignals, article_url: null },
      ),
    ).toBe(false);
  });

  it("does not let a short noisy alias create a false positive", () => {
    expect(
      isBreedRelevantPost(
        createPost({
          title: "A practical guide to dog care",
          slug: "a-practical-guide-to-dog-care",
          excerpt: "General dog advice.",
        }),
        { ...baseSignals, article_url: null },
      ),
    ).toBe(false);
  });
});
