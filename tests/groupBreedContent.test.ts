import { describe, expect, it } from "vitest";

import { groupBreedContent } from "../src/lib/groupBreedContent.js";
import type { BreedContentType, RankedWordPressPost, WordPressPostSummary } from "../src/lib/types.js";

function createPost(id: number, title: string): WordPressPostSummary {
  return {
    id,
    date: "2025-01-01T00:00:00Z",
    slug: `post-${id}`,
    link: `https://petrage.net/post-${id}/`,
    title,
    excerpt: `${title} excerpt`,
    matched_tags: [],
    matched_categories: [],
  };
}

function createRankedPost(
  id: number,
  title: string,
  score: number,
  contentType: BreedContentType = "facts",
  reasons: string[] = [],
  postOverrides: Partial<WordPressPostSummary> = {},
): RankedWordPressPost {
  return {
    post: {
      ...createPost(id, title),
      content_type: contentType,
      ...postOverrides,
    },
    content_type: contentType,
    score,
    reasons,
  };
}

describe("groupBreedContent", () => {
  it("selects a canonical post when the threshold is met", () => {
    const grouped = groupBreedContent([
      createRankedPost(1, "Canonical", 90, "facts", ["article_url_exact_match"]),
      createRankedPost(2, "Direct", 45),
      createRankedPost(3, "Related", 10, "list", [], {
        matched_tags: ["breed"],
        matched_categories: ["blog"],
      }),
    ]);

    expect(grouped.canonical.post?.id).toBe(1);
    expect(grouped.canonical.score).toBe(90);
    expect(grouped.direct_matches.map((post) => post.id)).toEqual([2]);
    expect(grouped.gallery).toEqual([]);
    expect(grouped.quizzes).toEqual([]);
    expect(grouped.related).toEqual([]);
    expect(grouped.supplemental).toEqual([]);
  });

  it("direct matches favor owner-useful informational content and galleries over quiz-style engagement", () => {
    const grouped = groupBreedContent([
      createRankedPost(1, "Breed Health", 62, "health"),
      createRankedPost(2, "Breed Gallery", 52, "gallery"),
      createRankedPost(4, "Herding Dog Breeds", 46, "list", [], {
        matched_tags: ["breed"],
        matched_categories: ["blog"],
      }),
      createRankedPost(3, "Breed Showdown", 44, "quiz", [], {
        matched_tags: ["breed"],
        matched_categories: ["blog"],
      }),
    ]);

    expect(grouped.canonical.post).toBeNull();
    expect(grouped.direct_matches.map((post) => post.id)).toEqual([1, 2]);
    expect(grouped.gallery).toEqual([]);
    expect(grouped.quizzes).toEqual([]);
    expect(grouped.related).toEqual([]);
    expect(grouped.supplemental).toEqual([]);
  });

  it("keeps low-value fun content in supplemental", () => {
    const grouped = groupBreedContent([
      createRankedPost(1, "Canonical", 100, "facts"),
      createRankedPost(2, "Breed Care Guide", 54, "care"),
      createRankedPost(3, "Breed Video", 45, "video"),
      createRankedPost(4, "Breed Meme", 30, "meme"),
      createRankedPost(5, "Working Dog Quiz", 41, "quiz", [], {
        matched_tags: ["breed"],
        matched_categories: ["blog"],
      }),
    ]);

    expect(grouped.canonical.post).toBeNull();
    expect(grouped.direct_matches.map((post) => post.id)).toEqual([1, 2]);
    expect(grouped.gallery).toEqual([]);
    expect(grouped.quizzes).toEqual([]);
    expect(grouped.related).toEqual([]);
    expect(grouped.supplemental.map((post) => post.id)).toEqual([3, 4]);
  });
});
