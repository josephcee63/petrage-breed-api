import { describe, expect, it } from "vitest";

import { classifyBreedPost } from "../src/lib/classifyBreedPost.js";
import type { WordPressPostSummary } from "../src/lib/types.js";

function createPost(overrides: Partial<WordPressPostSummary>): WordPressPostSummary {
  return {
    id: 1,
    date: "2025-01-01T00:00:00Z",
    slug: "generic-post",
    link: "https://petrage.net/generic-post/",
    title: "Generic Post",
    excerpt: "Generic excerpt",
    matched_tags: [],
    matched_categories: [],
    ...overrides,
  };
}

describe("classifyBreedPost", () => {
  it("classifies facts articles", () => {
    expect(
      classifyBreedPost(createPost({ title: "11 Interesting Facts About Akitas" })),
    ).toBe("facts");
  });

  it("classifies medication sensitivity content as health", () => {
    expect(
      classifyBreedPost(createPost({ title: "Doberman Medication Sensitivity What Every Owner Should Know" })),
    ).toBe("health");
  });

  it("classifies hypothyroidism guides as health", () => {
    expect(
      classifyBreedPost(createPost({ title: "Doberman Hypothyroidism Treatment Guide" })),
    ).toBe("health");
  });

  it("classifies owner behavior insights as behavior", () => {
    expect(
      classifyBreedPost(createPost({ title: "Doberman Owner Insights on Temperament and Personality" })),
    ).toBe("behavior");
  });

  it("classifies training posts", () => {
    expect(classifyBreedPost(createPost({ title: "Blue Heeler Obedience Training Guide" }))).toBe("training");
  });

  it("classifies breed-specific user galleries", () => {
    expect(classifyBreedPost(createPost({ title: "Blue Heeler User Gallery" }))).toBe("gallery");
  });

  it("classifies vs posts as quiz-style engagement", () => {
    expect(classifyBreedPost(createPost({ title: "Siberian Husky vs Doberman" }))).toBe("quiz");
  });

  it("classifies showdown posts as quiz-style engagement", () => {
    expect(
      classifyBreedPost(createPost({ title: "Husky vs Ridgeback vs St. Bernard vs Doberman-4 Dog Showdown" })),
    ).toBe("quiz");
  });

  it("classifies battle posts as quiz-style engagement", () => {
    expect(
      classifyBreedPost(createPost({ title: "Battle of the BIG Dogs-Dobie-Dogue-Rotty-Cane Corso" })),
    ).toBe("quiz");
  });

  it("classifies surveys", () => {
    expect(classifyBreedPost(createPost({ title: "Akita Nutrition Survey" }))).toBe("survey");
  });

  it("classifies strong breed-role lists", () => {
    expect(classifyBreedPost(createPost({ title: "Best Herding Dog Breeds for Busy Farms" }))).toBe("list");
  });

  it("classifies owner quizzes", () => {
    expect(classifyBreedPost(createPost({ title: "Australian Shepherd Owner Quiz" }))).toBe("quiz");
  });

  it("classifies videos", () => {
    expect(classifyBreedPost(createPost({ title: "Akita Puppies Playing Video" }))).toBe("video");
  });

  it("classifies memes", () => {
    expect(classifyBreedPost(createPost({ title: "Akita Meme Roundup" }))).toBe("meme");
  });

  it("falls back to misc", () => {
    expect(classifyBreedPost(createPost({ title: "Akita Story Roundup" }))).toBe("misc");
  });
});
