import { describe, expect, it } from "vitest";

import { rankBreedContent } from "../src/lib/rankBreedContent.js";
import type { CanonicalBreedSignals, WordPressPostSummary } from "../src/lib/types.js";

function createPost(overrides: Partial<WordPressPostSummary>): WordPressPostSummary {
  return {
    id: 1,
    date: "2025-01-01T00:00:00Z",
    slug: "post",
    link: "https://petrage.net/post/",
    title: "Generic Post",
    excerpt: "Generic excerpt",
    matched_tags: [],
    matched_categories: [],
    ...overrides,
  };
}

const baseSignals: CanonicalBreedSignals = {
  display_name: "AUSTRALIAN CATTLE DOG",
  aliases: ["Blue Heeler", "ACD"],
  article_url: "https://petrage.net/australian-cattle-dog/",
  preferred_tag_slug: "acd",
  tag_slugs: ["acd", "australiancattledog"],
  shared_content_key: null,
};

describe("rankBreedContent", () => {
  it("article_url exact match ranks first", () => {
    const ranked = rankBreedContent(
      [
        createPost({ id: 1, link: "https://petrage.net/generic/", title: "Generic Dog Post" }),
        createPost({
          id: 2,
          link: "https://petrage.net/australian-cattle-dog/",
          title: "Australian Cattle Dog Facts",
          matched_tags: ["acd"],
        }),
      ],
      baseSignals,
    );

    expect(ranked[0]?.post.id).toBe(2);
    expect(ranked[0]?.reasons).toContain("article_url_exact_match");
  });

  it("display_name in title outranks a generic post", () => {
    const ranked = rankBreedContent(
      [
        createPost({ id: 1, title: "Generic Dog Post" }),
        createPost({ id: 2, title: "Australian Cattle Dog Guide" }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(ranked[0]?.post.id).toBe(2);
    expect(ranked[0]?.reasons).toContain("display_name_in_title");
  });

  it("alias, preferred tag, multiple tag matches, and category matches all boost score", () => {
    const ranked = rankBreedContent(
      [
        createPost({
          id: 1,
          title: "Blue Heeler Training Tips",
          matched_tags: ["acd", "australiancattledog"],
          matched_categories: ["dog-breed-facts"],
        }),
        createPost({
          id: 2,
          title: "Working Dog Training Tips",
          matched_tags: ["australiancattledog"],
          matched_categories: [],
        }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(ranked[0]?.post.id).toBe(1);
    expect(ranked[0]?.reasons).toEqual(
      expect.arrayContaining([
        "alias_in_title",
        "preferred_tag_match",
        "multiple_tag_matches",
        "matched_breed_category",
        "content_type_training",
      ]),
    );
  });

  it("health articles outrank quizzes when breed relevance is similar", () => {
    const ranked = rankBreedContent(
      [
        createPost({ id: 1, title: "Blue Heeler Owner Quiz", matched_tags: ["acd"] }),
        createPost({ id: 2, title: "Blue Heeler Health Issues and Treatment", matched_tags: ["acd"] }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(ranked[0]?.post.id).toBe(2);
    expect(ranked[0]?.content_type).toBe("health");
    expect(ranked[1]?.content_type).toBe("quiz");
  });

  it("care articles outrank quizzes", () => {
    const ranked = rankBreedContent(
      [
        createPost({ id: 1, title: "Australian Cattle Dog Owner Quiz", matched_tags: ["acd"] }),
        createPost({ id: 2, title: "Australian Cattle Dog Care Guide", matched_tags: ["acd"] }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(ranked[0]?.post.id).toBe(2);
    expect(ranked[0]?.content_type).toBe("care");
    expect(ranked[1]?.content_type).toBe("quiz");
  });

  it("behavior articles outrank quizzes", () => {
    const ranked = rankBreedContent(
      [
        createPost({ id: 1, title: "Blue Heeler Owner Quiz", matched_tags: ["acd"] }),
        createPost({ id: 2, title: "Blue Heeler Temperament and Personality", matched_tags: ["acd"] }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(ranked[0]?.post.id).toBe(2);
    expect(ranked[0]?.content_type).toBe("behavior");
    expect(ranked[1]?.content_type).toBe("quiz");
  });

  it("gallery outranks quiz when both are breed-relevant", () => {
    const ranked = rankBreedContent(
      [
        createPost({ id: 1, title: "Blue Heeler Owner Quiz", matched_tags: ["acd"] }),
        createPost({ id: 2, title: "Blue Heeler User Gallery", matched_tags: ["acd"] }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(ranked[0]?.post.id).toBe(2);
    expect(ranked[0]?.content_type).toBe("gallery");
    expect(ranked[1]?.content_type).toBe("quiz");
  });

  it("strong breed-relevant lists outrank quizzes", () => {
    const ranked = rankBreedContent(
      [
        createPost({ id: 1, title: "Blue Heeler Owner Quiz", matched_tags: ["acd"] }),
        createPost({ id: 2, title: "Dog Breeds from Australia", excerpt: "Australian Cattle Dog and other herders.", matched_tags: ["acd"] }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(ranked[0]?.post.id).toBe(2);
    expect(ranked[0]?.content_type).toBe("list");
    expect(ranked[1]?.content_type).toBe("quiz");
  });

  it("battle-of engagement posts do not outrank stronger related informational content", () => {
    const ranked = rankBreedContent(
      [
        createPost({ id: 1, title: "Battle of the BIG Dogs-Dobie-Dogue-Rotty-Cane Corso", matched_tags: ["acd"] }),
        createPost({ id: 2, title: "Dog Breeds from Australia", excerpt: "Australian Cattle Dog and other herders.", matched_tags: ["acd"] }),
      ],
      { ...baseSignals, article_url: null },
    );

    expect(ranked[0]?.post.id).toBe(2);
    expect(ranked[0]?.content_type).toBe("list");
    expect(ranked[1]?.content_type).toBe("quiz");
  });

  it("canonical exact-match facts article still stays first", () => {
    const ranked = rankBreedContent(
      [
        createPost({ id: 1, link: "https://petrage.net/australian-cattle-dog/", title: "Australian Cattle Dog Facts", matched_tags: ["acd"] }),
        createPost({ id: 2, title: "Blue Heeler Medication Sensitivity", matched_tags: ["acd"] }),
      ],
      baseSignals,
    );

    expect(ranked[0]?.post.id).toBe(1);
    expect(ranked[0]?.content_type).toBe("facts");
  });
});
