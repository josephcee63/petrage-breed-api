import { classifyBreedPost } from "./classifyBreedPost.js";
import { getBreedPostMatchSignals } from "./getBreedPostMatchSignals.js";
import { normalizeLookupKey } from "./normalizeLookupKey.js";
import { POST_TYPE_WEIGHTS } from "./postTypeWeights.js";

import type { CanonicalBreedSignals, RankedWordPressPost, WordPressPostSummary } from "./types.js";

export function rankBreedContent(
  posts: WordPressPostSummary[],
  signals: CanonicalBreedSignals,
): RankedWordPressPost[] {
  return posts
    .map((post, index) => {
      const contentType = classifyBreedPost(post);

      return {
        post: {
          ...post,
          content_type: contentType,
        },
        content_type: contentType,
        ...scorePost(post, signals, contentType),
        index,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const rightTimestamp = toTimestamp(right.post.date);
      const leftTimestamp = toTimestamp(left.post.date);
      if (rightTimestamp !== leftTimestamp) {
        return rightTimestamp - leftTimestamp;
      }

      return left.index - right.index;
    })
    .map(({ index: _index, ...rankedPost }) => rankedPost);
}

function scorePost(
  post: WordPressPostSummary,
  signals: CanonicalBreedSignals,
  contentType: RankedWordPressPost["content_type"],
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const normalizedExcerpt = normalizeLookupKey(post.excerpt);
  const matchSignals = getBreedPostMatchSignals(post, signals);

  if (matchSignals.articleUrlExactMatch) {
    score += 100;
    reasons.push("article_url_exact_match");
  }

  if (matchSignals.displayNameInTitle) {
    score += 50;
    reasons.push("display_name_in_title");
  }

  if (matchSignals.displayNameInExcerpt) {
    score += 20;
    reasons.push("display_name_in_excerpt");
  }

  if (matchSignals.displayNameInSlug) {
    score += 20;
    reasons.push("display_name_in_slug");
  }

  if (matchSignals.displayNameInTitle && post.matched_categories.length > 0) {
    score += 15;
    reasons.push("display_name_in_breed_category");
  }

  if (matchSignals.aliasInTitle) {
    score += 35;
    reasons.push("alias_in_title");
  }

  if (matchSignals.aliasInExcerpt) {
    score += 14;
    reasons.push("alias_in_excerpt");
  }

  if (matchSignals.aliasInSlug) {
    score += 16;
    reasons.push("alias_in_slug");
  }

  if (matchSignals.breedConceptInTitle) {
    score += 24;
    reasons.push("breed_concept_in_title");
  }

  if (matchSignals.breedConceptInExcerpt) {
    score += 10;
    reasons.push("breed_concept_in_excerpt");
  }

  if (matchSignals.breedConceptInSlug) {
    score += 12;
    reasons.push("breed_concept_in_slug");
  }

  if (matchSignals.preferredTagMatch) {
    score += 25;
    reasons.push("preferred_tag_match");
  }

  if (post.matched_tags.length > 1) {
    score += 15;
    reasons.push("multiple_tag_matches");
  }

  if (post.matched_categories.length > 0) {
    score += 10;
    reasons.push("matched_breed_category");
  }

  const postTypeWeight = POST_TYPE_WEIGHTS[contentType];
  if (postTypeWeight !== 0) {
    score += postTypeWeight;
    reasons.push(`content_type_${contentType}`);
  }

  if (
    contentType === "list" &&
    (matchSignals.matchedBreedTag || matchSignals.excerptMatch)
  ) {
    score += 14;
    reasons.push("supporting_list_content");
  }

  if (matchSignals.excerptMatch && !matchSignals.titleOrSlugMatch) {
    score -= 8;
    reasons.push("excerpt_only_relevance");
  }

  if (
    ["list", "survey", "comparison"].includes(contentType) &&
    !matchSignals.titleOrSlugMatch &&
    matchSignals.excerptMatch
  ) {
    score -= 18;
    reasons.push("generic_multi_breed_format");
  }

  if (matchSignals.tagOnlyMatch) {
    score -= 35;
    reasons.push("incidental_tag_only_match");
  }

  return { score, reasons };
}

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
