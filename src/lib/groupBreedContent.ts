import {
  DIRECT_MATCH_CONTENT_TYPES,
  SUPPLEMENTAL_CONTENT_TYPES,
} from "./postTypeWeights.js";

import type { BreedContentBuckets, RankedWordPressPost } from "./types.js";

const CANONICAL_THRESHOLD = 80;
const DIRECT_MATCH_THRESHOLD = 35;
const HIGH_CONFIDENCE_THRESHOLD = 65;
const HIGH_CONFIDENCE_RELATED_TO_DIRECT = new Set<RankedWordPressPost["content_type"]>([
  "survey",
]);

export function groupBreedContent(rankedPosts: RankedWordPressPost[]): BreedContentBuckets {
  const [topPost] = rankedPosts;
  const canonical =
    topPost && topPost.score >= CANONICAL_THRESHOLD
      ? {
          post: topPost.post,
          score: topPost.score,
          reasons: topPost.reasons,
        }
      : {
          post: null,
          score: null,
          reasons: [],
        };

  const remainingPosts =
    canonical.post !== null
      ? rankedPosts.filter((rankedPost) => rankedPost.post.id !== canonical.post?.id)
      : rankedPosts;

  return {
    canonical,
    direct_matches: remainingPosts.filter(isDirectMatch).map((rankedPost) => rankedPost.post),
    related: remainingPosts.filter(isRelatedMatch).map((rankedPost) => rankedPost.post),
    supplemental: remainingPosts.filter(isSupplementalMatch).map((rankedPost) => rankedPost.post),
  };
}

function isDirectMatch(rankedPost: RankedWordPressPost): boolean {
  return (
    (rankedPost.score >= DIRECT_MATCH_THRESHOLD &&
      DIRECT_MATCH_CONTENT_TYPES.includes(rankedPost.content_type)) ||
    (rankedPost.score >= HIGH_CONFIDENCE_THRESHOLD &&
      HIGH_CONFIDENCE_RELATED_TO_DIRECT.has(rankedPost.content_type))
  );
}

function isSupplementalMatch(rankedPost: RankedWordPressPost): boolean {
  return SUPPLEMENTAL_CONTENT_TYPES.includes(rankedPost.content_type) && !isDirectMatch(rankedPost);
}

function isRelatedMatch(rankedPost: RankedWordPressPost): boolean {
  return !isDirectMatch(rankedPost) && !isSupplementalMatch(rankedPost);
}
