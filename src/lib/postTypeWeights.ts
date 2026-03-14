import type { BreedContentType } from "./types.js";

export const POST_TYPE_WEIGHTS: Record<BreedContentType, number> = {
  facts: 40,
  health: 34,
  care: 30,
  behavior: 28,
  training: 28,
  gallery: 32,
  survey: 18,
  comparison: -10,
  list: 16,
  quiz: -10,
  video: -20,
  meme: -25,
  misc: -12,
};

export const DIRECT_MATCH_CONTENT_TYPES: BreedContentType[] = [
  "facts",
  "health",
  "care",
  "behavior",
  "training",
  "gallery",
];

export const SUPPLEMENTAL_CONTENT_TYPES: BreedContentType[] = ["video", "meme", "misc"];
