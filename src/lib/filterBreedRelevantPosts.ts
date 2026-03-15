import { isBreedRelevantPost } from "./isBreedRelevantPost.js";

import type { CanonicalBreedSignals, WordPressPostSummary } from "./types.js";

export function filterBreedRelevantPosts(
  posts: WordPressPostSummary[],
  signals: CanonicalBreedSignals,
): WordPressPostSummary[] {
  return posts.filter((post) => isBreedRelevantPost(post, signals));
}
