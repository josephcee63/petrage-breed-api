import { describe, expect, it } from "vitest";

import { dedupePosts } from "../src/lib/dedupePosts.js";
import type { WordPressPostSummary } from "../src/lib/types.js";

describe("dedupePosts", () => {
  it("collapses duplicate posts by id and merges matched tags", () => {
    const posts: WordPressPostSummary[] = [
      {
        id: 10,
        date: "2025-01-01T00:00:00",
        slug: "post-one",
        link: "https://example.com/post-one",
        title: "Post One",
        excerpt: "Excerpt One",
        matched_tags: ["acd"],
        matched_categories: [],
      },
      {
        id: 10,
        date: "2025-01-01T00:00:00",
        slug: "post-one",
        link: "https://example.com/post-one",
        title: "Post One",
        excerpt: "Excerpt One",
        matched_tags: ["australiancattledog", "acd"],
        matched_categories: ["dog-breed-facts"],
      },
    ];

    expect(dedupePosts(posts)).toEqual([
      {
        id: 10,
        date: "2025-01-01T00:00:00",
        slug: "post-one",
        link: "https://example.com/post-one",
        title: "Post One",
        excerpt: "Excerpt One",
        matched_tags: ["acd", "australiancattledog"],
        matched_categories: ["dog-breed-facts"],
      },
    ]);
  });

  it("preserves stable order", () => {
    const posts: WordPressPostSummary[] = [
      {
        id: 1,
        date: "2025-01-01T00:00:00",
        slug: "first-post",
        link: "https://example.com/first-post",
        title: "First",
        excerpt: "First excerpt",
        matched_tags: ["first"],
        matched_categories: [],
      },
      {
        id: 2,
        date: "2025-01-02T00:00:00",
        slug: "second-post",
        link: "https://example.com/second-post",
        title: "Second",
        excerpt: "Second excerpt",
        matched_tags: ["second"],
        matched_categories: [],
      },
      {
        id: 1,
        date: "2025-01-01T00:00:00",
        slug: "first-post",
        link: "https://example.com/first-post",
        title: "First",
        excerpt: "First excerpt",
        matched_tags: ["also-first"],
        matched_categories: ["facts"],
      },
    ];

    expect(dedupePosts(posts).map((post) => post.id)).toEqual([1, 2]);
    expect(dedupePosts(posts)[0]?.matched_tags).toEqual(["first", "also-first"]);
    expect(dedupePosts(posts)[0]?.matched_categories).toEqual(["facts"]);
  });
});
