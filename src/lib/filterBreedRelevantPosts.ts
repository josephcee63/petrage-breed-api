import { isBreedRelevantPost } from "./isBreedRelevantPost.js";

import type { CanonicalBreedSignals, WordPressPostSummary } from "./types.js";

export function filterBreedRelevantPosts(
  posts: WordPressPostSummary[],
  signals: CanonicalBreedSignals,
): WordPressPostSummary[] {
  return posts.filter((post) => {
    if (post.matched_tags.some((tag) => signals.tag_slugs.includes(tag.trim().toLowerCase()))) {
      return true;
    }

    if (post.matched_categories.length > 0 && post.matched_tags.length === 0) {
      return isBreedRelevantPost(post, signals);
    }

    return isBreedRelevantPost(post, signals);
  });
}
