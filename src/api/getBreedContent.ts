import { classifyBreedPost } from "../lib/classifyBreedPost.js";
import { dedupePosts } from "../lib/dedupePosts.js";
import { fetchWordPressCategories } from "../lib/fetchWordPressCategories.js";
import { fetchWordPressPostsByCategories } from "../lib/fetchWordPressPostsByCategories.js";
import { fetchWordPressPostsByTagAndCategory } from "../lib/fetchWordPressPostsByTagAndCategory.js";
import { fetchWordPressPostsByTags } from "../lib/fetchWordPressPostsByTags.js";
import { fetchWordPressTags } from "../lib/fetchWordPressTags.js";
import { filterBreedRelevantPosts } from "../lib/filterBreedRelevantPosts.js";
import { getCanonicalContentTagSlug } from "../lib/getCanonicalContentTagSlug.js";
import { getCanonicalBreedSignals } from "../lib/getCanonicalBreedSignals.js";
import { getContentQueryTags } from "../lib/getContentQueryTags.js";
import { groupBreedContent } from "../lib/groupBreedContent.js";
import { getNormalizedBreedById, loadBreedData } from "../lib/loadBreedData.js";
import { RELATED_RESOURCE_CONTENT_TYPES } from "../lib/postTypeWeights.js";
import { rankBreedContent } from "../lib/rankBreedContent.js";
import { resolveBreed } from "../lib/resolveBreed.js";
import { SimpleCache } from "../lib/simpleCache.js";

import type {
  BreedContentType,
  BreedContentResult,
  CanonicalBreedSignals,
  LoadedBreedData,
  WordPressCategory,
  WordPressPostSummary,
  WordPressTag,
} from "../lib/types.js";

const DEFAULT_BASE_URL = "https://petrage.net";
const DEFAULT_CATEGORY_SLUGS = ["dog-breed-facts", "blog"];
const DETERMINISTIC_BUCKET_CATEGORY_SLUGS = ["user-gallery", "quiz"];
const BREED_CONTENT_CACHE_TTL_MS = 2 * 60 * 1000;

export const breedContentCache = new SimpleCache<BreedContentResult>();

export interface GetBreedContentOptions {
  baseUrl?: string;
  fetchImplementation?: typeof fetch;
  breedData?: LoadedBreedData;
  perPage?: number;
  categorySlugs?: string[];
}

export async function getBreedContent(
  input: string,
  options?: GetBreedContentOptions,
): Promise<BreedContentResult | null> {
  const breedData = options?.breedData ?? (await loadBreedData());
  const resolvedBreed = resolveBreed(input, breedData.breedIndex);

  if (!resolvedBreed) {
    return null;
  }

  const baseUrl = normalizeBaseUrl(options?.baseUrl);
  const categorySlugsQueried = dedupeSlugs(options?.categorySlugs ?? DEFAULT_CATEGORY_SLUGS);
  const cacheKey = buildBreedContentCacheKey(baseUrl, resolvedBreed.id, options?.perPage, categorySlugsQueried);

  return breedContentCache.getOrSet(cacheKey, BREED_CONTENT_CACHE_TTL_MS, async () => {
    const normalizedBreed = getNormalizedBreedById(breedData.normalizedBreeds, resolvedBreed.id);
    if (!normalizedBreed) {
      throw new Error(`Resolved breed ${resolvedBreed.id} is missing from normalized breed data.`);
    }

    const tagSlugsQueried = getContentQueryTags(resolvedBreed);
    const canonicalContentTagSlug = getCanonicalContentTagSlug(resolvedBreed);
    const matchedTags = await fetchWordPressTags(baseUrl, tagSlugsQueried, buildTagFetchOptions(options));
    const matchedCategories = await fetchOptionalCategories(baseUrl, categorySlugsQueried, options);
    const deterministicBucketCategories = await fetchOptionalCategories(
      baseUrl,
      DETERMINISTIC_BUCKET_CATEGORY_SLUGS,
      options,
    );

    const tagPosts =
      matchedTags.length > 0
        ? await fetchWordPressPostsByTags(baseUrl, matchedTags, {
            ...buildPostFetchOptions(options),
            matchedCategories,
          })
        : [];
    const categoryPosts =
      matchedCategories.length > 0
        ? await fetchOptionalCategoryPosts(baseUrl, matchedCategories, matchedTags, options)
        : [];
    const relatedPosts = await fetchOptionalRelatedPosts(
      baseUrl,
      matchedTags,
      matchedCategories,
      canonicalContentTagSlug,
      options,
    );
    const galleryPosts = await fetchOptionalDeterministicBucketPosts(
      baseUrl,
      matchedTags,
      deterministicBucketCategories,
      canonicalContentTagSlug,
      "user-gallery",
      options,
    );
    const quizPosts = await fetchOptionalDeterministicBucketPosts(
      baseUrl,
      matchedTags,
      deterministicBucketCategories,
      canonicalContentTagSlug,
      "quiz",
      options,
    );

    const posts = dedupePosts([...tagPosts, ...categoryPosts]);
    const canonicalSignals = getCanonicalBreedSignals(normalizedBreed, resolvedBreed);
    const relevantPosts = filterBreedRelevantPosts(posts, canonicalSignals);
    const rankedPosts = rankBreedContent(relevantPosts, canonicalSignals);
    const groupedContent = groupBreedContent(rankedPosts);
    const relatedContent = selectRelatedPosts(
      relatedPosts,
      canonicalSignals,
      canonicalContentTagSlug,
      groupedContent.canonical.post?.id ?? null,
    );
    const galleryContent = selectDeterministicBucketPosts(galleryPosts, "gallery", 1);
    const quizzesContent = selectDeterministicBucketPosts(quizPosts, "quiz", 3);

    return {
      resolved_input: input,
      breed: {
        id: normalizedBreed.id,
        display_name: resolvedBreed.display_name,
        aka_names: resolvedBreed.aka_names,
        aliases: resolvedBreed.aliases,
        tag_slugs: resolvedBreed.tag_slugs,
        preferred_tag_slug: resolvedBreed.preferred_tag_slug,
        shared_content_key: resolvedBreed.shared_content_key,
      },
      content_query: {
        base_url: baseUrl,
        tag_slugs_queried: tagSlugsQueried,
        matched_tag_ids: matchedTags.map((tag) => tag.id),
        matched_tag_slugs: matchedTags.map((tag) => tag.slug),
        category_slugs_queried: categorySlugsQueried,
        matched_category_ids: matchedCategories.map((category) => category.id),
        matched_category_slugs: matchedCategories.map((category) => category.slug),
      },
      content: {
        ...groupedContent,
        gallery: galleryContent,
        quizzes: quizzesContent,
        related: relatedContent,
      },
      posts: rankedPosts.map((rankedPost) => rankedPost.post),
    };
  });
}

function normalizeBaseUrl(baseUrl: string | undefined): string {
  const trimmed = (baseUrl ?? DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_BASE_URL;
}

function buildTagFetchOptions(options: GetBreedContentOptions | undefined): {
  fetchImplementation?: typeof fetch;
} {
  return options?.fetchImplementation ? { fetchImplementation: options.fetchImplementation } : {};
}

function buildPostFetchOptions(options: GetBreedContentOptions | undefined): {
  fetchImplementation?: typeof fetch;
  perPage?: number;
} {
  return {
    ...(options?.fetchImplementation ? { fetchImplementation: options.fetchImplementation } : {}),
    ...(options?.perPage ? { perPage: options.perPage } : {}),
  };
}

async function fetchOptionalCategories(
  baseUrl: string,
  categorySlugs: string[],
  options: GetBreedContentOptions | undefined,
) {
  if (categorySlugs.length === 0) {
    return [];
  }

  try {
    return await fetchWordPressCategories(baseUrl, categorySlugs, buildTagFetchOptions(options));
  } catch {
    return [];
  }
}

async function fetchOptionalCategoryPosts(
  baseUrl: string,
  matchedCategories: Awaited<ReturnType<typeof fetchOptionalCategories>>,
  matchedTags: Awaited<ReturnType<typeof fetchWordPressTags>>,
  options: GetBreedContentOptions | undefined,
) {
  try {
    return await fetchWordPressPostsByCategories(baseUrl, matchedCategories, {
      ...buildPostFetchOptions(options),
      matchedTags,
    });
  } catch {
    return [];
  }
}

async function fetchOptionalRelatedPosts(
  baseUrl: string,
  matchedTags: Awaited<ReturnType<typeof fetchWordPressTags>>,
  matchedCategories: Awaited<ReturnType<typeof fetchOptionalCategories>>,
  canonicalTagSlug: string | null,
  options: GetBreedContentOptions | undefined,
) {
  if (!canonicalTagSlug) {
    return [];
  }

  const canonicalTag = findTagBySlug(matchedTags, canonicalTagSlug);
  const blogCategory = findCategoryBySlug(matchedCategories, "blog");
  if (!canonicalTag || !blogCategory) {
    return [];
  }

  try {
    return await fetchWordPressPostsByTagAndCategory(baseUrl, canonicalTag, blogCategory, buildPostFetchOptions(options));
  } catch {
    return [];
  }
}

async function fetchOptionalDeterministicBucketPosts(
  baseUrl: string,
  matchedTags: Awaited<ReturnType<typeof fetchWordPressTags>>,
  matchedCategories: Awaited<ReturnType<typeof fetchOptionalCategories>>,
  canonicalTagSlug: string | null,
  categorySlug: string,
  options: GetBreedContentOptions | undefined,
) {
  if (!canonicalTagSlug) {
    return [];
  }

  const canonicalTag = findTagBySlug(matchedTags, canonicalTagSlug);
  const matchedCategory = findCategoryBySlug(matchedCategories, categorySlug);
  if (!canonicalTag || !matchedCategory) {
    return [];
  }

  try {
    return await fetchWordPressPostsByTagAndCategory(baseUrl, canonicalTag, matchedCategory, buildPostFetchOptions(options));
  } catch {
    return [];
  }
}

function selectRelatedPosts(
  posts: WordPressPostSummary[],
  signals: CanonicalBreedSignals,
  canonicalTagSlug: string | null,
  canonicalPostId: number | null,
): WordPressPostSummary[] {
  return posts
    .map((post) => ({
      ...post,
      content_type: classifyBreedPost(post),
    }))
    .filter((post) => RELATED_RESOURCE_CONTENT_TYPES.includes(post.content_type))
    .filter((post) => (canonicalTagSlug ? post.matched_tags.includes(canonicalTagSlug) : false))
    .filter((post) => post.matched_categories.includes("blog"))
    .filter((post) => !isCanonicalGuidePost(post, signals, canonicalPostId))
    .sort(compareRelatedPosts)
    .slice(0, 5);
}

function selectDeterministicBucketPosts(
  posts: WordPressPostSummary[],
  contentType: BreedContentType,
  limit: number,
): WordPressPostSummary[] {
  return posts
    .map((post) => ({
      ...post,
      content_type: contentType,
    }))
    .sort(compareRelatedPosts)
    .slice(0, limit);
}

function isCanonicalGuidePost(
  post: WordPressPostSummary,
  signals: CanonicalBreedSignals,
  canonicalPostId: number | null,
): boolean {
  if (canonicalPostId !== null && post.id === canonicalPostId) {
    return true;
  }

  if (!signals.article_url) {
    return false;
  }

  return normalizeUrl(post.link) === normalizeUrl(signals.article_url);
}

function compareRelatedPosts(left: WordPressPostSummary, right: WordPressPostSummary): number {
  const rightTimestamp = toTimestamp(right.date);
  const leftTimestamp = toTimestamp(left.date);
  if (rightTimestamp !== leftTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  return right.id - left.id;
}

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function findTagBySlug(tags: WordPressTag[], slug: string): WordPressTag | null {
  return tags.find((tag) => tag.slug === slug) ?? null;
}

function findCategoryBySlug(categories: WordPressCategory[], slug: string): WordPressCategory | null {
  return categories.find((category) => category.slug === slug) ?? null;
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

function dedupeSlugs(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(normalized);
  }

  return unique;
}

function buildBreedContentCacheKey(
  baseUrl: string,
  breedId: string,
  perPage: number | undefined,
  categorySlugs: string[],
): string {
  return `breed-content:${baseUrl}:${breedId}:per_page=${perPage ?? 20}:categories=${categorySlugs.join(",")}`;
}
