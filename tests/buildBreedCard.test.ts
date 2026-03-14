import { describe, expect, it } from "vitest";

import { buildBreedCard } from "../src/lib/buildBreedCard.js";
import type { BreedContentResult, BreedDetails, WordPressPostSummary } from "../src/lib/types.js";

function createPost(
  id: number,
  title: string,
  contentType: WordPressPostSummary["content_type"],
  overrides?: Partial<WordPressPostSummary>,
): WordPressPostSummary {
  return {
    id,
    date: "2025-01-01T00:00:00Z",
    slug: `post-${id}`,
    link: `https://petrage.net/post-${id}/`,
    title,
    excerpt: `${title} excerpt`,
    matched_tags: [],
    matched_categories: [],
    ...(contentType ? { content_type: contentType } : {}),
    ...overrides,
  };
}

function createBreedDetail(overrides?: Partial<BreedDetails>): BreedDetails {
  return {
    id: "australian-cattle-dog",
    display_name: "AUSTRALIAN CATTLE DOG",
    aka_names: ["Blue Heeler"],
    aliases: ["ACD", "Blue Heeler"],
    tag_slugs: ["acd", "australiancattledog"],
    preferred_tag_slug: "acd",
    shared_content_key: null,
    traits: {
      temperament: "Alert",
      purpose: "Herding",
      good_with_families: "Yes",
      owner_type: "Active",
      intelligence: "High",
      exercise_needs: "High",
    },
    stats: {
      female_height: null,
      male_height: null,
      female_weight: null,
      male_weight: null,
      life_span: "12-15 years",
      litter_size: null,
      shedding: [],
      origin: ["Australia"],
      size: ["Medium"],
      hair_length: [],
    },
    media: {
      image_url: "https://petrage.net/acd.jpg",
      article_url: "https://petrage.net/acd-facts/",
      tag_url: null,
    },
    description_text:
      "A compact herding breed with stamina and drive. This description should be long enough to verify truncation does not break valid output.",
    ...overrides,
  };
}

function createBreedContent(overrides?: Partial<BreedContentResult>): BreedContentResult {
  const canonical = createPost(1, "Australian Cattle Dog Facts", "facts", {
    link: "https://petrage.net/acd-facts/",
  });

  return {
    resolved_input: "acd",
    breed: {
      id: "australian-cattle-dog",
      display_name: "AUSTRALIAN CATTLE DOG",
      aka_names: ["Blue Heeler"],
      aliases: ["ACD", "Blue Heeler"],
      tag_slugs: ["acd", "australiancattledog"],
      preferred_tag_slug: "acd",
      shared_content_key: null,
    },
    content_query: {
      base_url: "https://petrage.net",
      tag_slugs_queried: ["acd", "australiancattledog"],
      matched_tag_ids: [11, 12],
      matched_tag_slugs: ["acd", "australiancattledog"],
      category_slugs_queried: ["dog-breed-facts"],
      matched_category_ids: [31],
      matched_category_slugs: ["dog-breed-facts"],
    },
    content: {
      canonical: {
        post: canonical,
        score: 100,
        reasons: ["article_url_exact_match"],
      },
      direct_matches: [
        createPost(2, "Australian Cattle Dog Health Issues", "health"),
        createPost(3, "Australian Cattle Dog Care Guide", "care"),
        createPost(4, "Australian Cattle Dog User Gallery", "gallery"),
        createPost(5, "Australian Cattle Dog Owner Quiz", "quiz"),
      ],
      related: [
        createPost(6, "Best Herding Dog Breeds", "list"),
        createPost(7, "Australian Cattle Dog Survey", "survey"),
        createPost(8, "Australian Cattle Dog Owner Quiz", "quiz", {
          link: "https://petrage.net/post-5/",
        }),
      ],
      supplemental: [
        createPost(9, "Australian Cattle Dog Puppies Playing Video", "video"),
      ],
    },
    posts: [],
    ...overrides,
  };
}

describe("buildBreedCard", () => {
  it("normalizes display_name to title case for presentation", () => {
    const card = buildBreedCard(
      createBreedDetail({ display_name: "DOBERMANN PINSCHER" }),
      createBreedContent(),
    );

    expect(card.breed.display_name).toBe("Dobermann Pinscher");
  });

  it("uses the canonical article as the featured main article", () => {
    const card = buildBreedCard(createBreedDetail(), createBreedContent());

    expect(card.featured.main_article).toEqual({
      title: "Australian Cattle Dog Facts",
      link: "https://petrage.net/acd-facts/",
      content_type: "facts",
    });
  });

  it("prefers owner-help content over quizzes", () => {
    const card = buildBreedCard(createBreedDetail(), createBreedContent());

    expect(card.featured.owner_help.map((item) => item.title)).toEqual([
      "Australian Cattle Dog Health Issues",
      "Australian Cattle Dog Care Guide",
    ]);
  });

  it("selects a gallery when present", () => {
    const card = buildBreedCard(createBreedDetail(), createBreedContent());

    expect(card.featured.gallery).toEqual({
      title: "Australian Cattle Dog User Gallery",
      link: "https://petrage.net/post-4/",
      content_type: "gallery",
    });
  });

  it("prefers list and informational supporting items for related reads", () => {
    const card = buildBreedCard(createBreedDetail(), createBreedContent());

    expect(card.featured.related_reads.map((item) => item.title)).toEqual([
      "Best Herding Dog Breeds",
      "Australian Cattle Dog Survey",
    ]);
  });

  it("puts engagement items in fun extras", () => {
    const card = buildBreedCard(createBreedDetail(), createBreedContent());

    expect(card.featured.fun_extras.map((item) => item.title)).toEqual([
      "Australian Cattle Dog Owner Quiz",
      "Australian Cattle Dog Puppies Playing Video",
    ]);
  });

  it("dedupes items across buckets", () => {
    const card = buildBreedCard(createBreedDetail(), createBreedContent());
    const allLinks = [
      card.featured.main_article?.link,
      ...card.featured.owner_help.map((item) => item.link),
      card.featured.gallery?.link,
      ...card.featured.related_reads.map((item) => item.link),
      ...card.featured.fun_extras.map((item) => item.link),
    ].filter((value): value is string => Boolean(value));

    expect(new Set(allLinks).size).toBe(allLinks.length);
  });

  it("keeps short descriptions unchanged", () => {
    const card = buildBreedCard(
      createBreedDetail({ description_text: "This is a short description." }),
      createBreedContent(),
    );

    expect(card.breed.description_text).toBe("This is a short description.");
  });

  it("truncates long descriptions at a sentence boundary when possible", () => {
    const longDescription = Array.from({ length: 12 }, () =>
      "This is sentence one. This is sentence two. This is sentence three.",
    ).join(" ");

    const card = buildBreedCard(
      createBreedDetail({ description_text: longDescription }),
      createBreedContent(),
    );

    expect(card.breed.description_text?.length).toBeLessThanOrEqual(420);
    expect(card.breed.description_text?.endsWith(".")).toBe(true);
    expect(card.breed.description_text?.endsWith("...")).toBe(false);
  });

  it("falls back to truncating at the last full word when no sentence boundary exists", () => {
    const longDescription =
      "a very long string without punctuation anywhere in the text that must be truncated cleanly for presentation ".repeat(
        8,
      );

    const card = buildBreedCard(
      createBreedDetail({ description_text: longDescription }),
      createBreedContent(),
    );

    expect(card.breed.description_text?.endsWith("...")).toBe(true);
    expect(card.breed.description_text?.length).toBeLessThanOrEqual(423);
    expect(card.breed.description_text?.endsWith(" ...")).toBe(false);
  });

  it("does not cut a description in the middle of a word", () => {
    const longDescription =
      "This sentence explains proper training and socialization but keeps going without another punctuation marker before the card limit so truncation needs to stay word safe ".repeat(
        5,
      );

    const card = buildBreedCard(
      createBreedDetail({ description_text: longDescription }),
      createBreedContent(),
    );

    expect(card.breed.description_text?.includes("socialization bu...")).toBe(false);
  });

  it("returns a valid card when optional content is missing", () => {
    const card = buildBreedCard(
      createBreedDetail({ description_text: null }),
      createBreedContent({
        content: {
          canonical: { post: null, score: null, reasons: [] },
          direct_matches: [],
          related: [],
          supplemental: [],
        },
      }),
    );

    expect(card.featured.main_article).toBeNull();
    expect(card.featured.owner_help).toEqual([]);
    expect(card.featured.gallery).toBeNull();
    expect(card.featured.related_reads).toEqual([]);
    expect(card.featured.fun_extras).toEqual([]);
    expect(card.breed.description_text).toBeNull();
  });
});
