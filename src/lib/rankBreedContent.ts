import { classifyBreedPost } from "./classifyBreedPost.js";
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
  const normalizedTitle = normalizeLookupKey(post.title);
  const normalizedSlug = normalizeLookupKey(post.slug);
  const normalizedExcerpt = normalizeLookupKey(post.excerpt);
  const normalizedDisplayName = normalizeLookupKey(signals.display_name);
  const normalizedAliases = signals.aliases.map((alias) => normalizeLookupKey(alias)).filter(Boolean);

  if (signals.article_url && normalizeUrl(post.link) === normalizeUrl(signals.article_url)) {
    score += 100;
    reasons.push("article_url_exact_match");
  }

  if (normalizedDisplayName && normalizedTitle.includes(normalizedDisplayName)) {
    score += 50;
    reasons.push("display_name_in_title");
  }

  if (normalizedDisplayName && normalizedExcerpt.includes(normalizedDisplayName)) {
    score += 20;
    reasons.push("display_name_in_excerpt");
  }

  if (
    normalizedDisplayName &&
    normalizedTitle.includes(normalizedDisplayName) &&
    post.matched_categories.length > 0
  ) {
    score += 15;
    reasons.push("display_name_in_breed_category");
  }

  const aliasMatch = normalizedAliases.find((alias) => normalizedTitle.includes(alias));
  if (aliasMatch) {
    score += 35;
    reasons.push("alias_in_title");
  }

  const aliasExcerptMatch = normalizedAliases.find((alias) => normalizedExcerpt.includes(alias));
  if (aliasExcerptMatch) {
    score += 14;
    reasons.push("alias_in_excerpt");
  }

  if (
    signals.preferred_tag_slug &&
    post.matched_tags.some((tag) => tag.toLowerCase() === signals.preferred_tag_slug?.toLowerCase())
  ) {
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

  if (
    normalizedDisplayName &&
    (normalizedSlug.includes(normalizedDisplayName) ||
      normalizedAliases.some((alias) => normalizedSlug.includes(alias)))
  ) {
    score += 5;
    reasons.push("breed_like_slug");
  }

  const postTypeWeight = POST_TYPE_WEIGHTS[contentType];
  if (postTypeWeight !== 0) {
    score += postTypeWeight;
    reasons.push(`content_type_${contentType}`);
  }

  if (
    contentType === "list" &&
    (post.matched_tags.length > 0 ||
      (normalizedDisplayName && normalizedExcerpt.includes(normalizedDisplayName)) ||
      normalizedAliases.some((alias) => normalizedExcerpt.includes(alias)))
  ) {
    score += 14;
    reasons.push("supporting_list_content");
  }

  return { score, reasons };
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
