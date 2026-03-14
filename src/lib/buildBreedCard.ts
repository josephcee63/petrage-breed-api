import type {
  BreedCardFeaturedItem,
  BreedCardResult,
  BreedContentResult,
  BreedContentType,
  BreedDetails,
  WordPressPostSummary,
} from "./types.js";

const DESCRIPTION_MAX_LENGTH = 420;
const OWNER_HELP_TYPES: BreedContentType[] = ["health", "care", "behavior", "training", "facts"];
const RELATED_READ_TYPES: BreedContentType[] = [
  "list",
  "survey",
  "health",
  "care",
  "behavior",
  "training",
  "facts",
];
const FUN_EXTRA_TYPES: BreedContentType[] = ["quiz", "video", "meme", "misc"];

export function buildBreedCard(
  breedDetail: BreedDetails,
  breedContent: BreedContentResult,
): BreedCardResult {
  const usedKeys = new Set<string>();
  const mainArticle = toFeaturedItem(breedContent.content.canonical.post);
  markUsed(usedKeys, mainArticle);

  const combinedAliases = dedupeStrings([...breedDetail.aka_names, ...breedDetail.aliases]);
  const ownerHelp = pickFeaturedItems({
    posts: [...breedContent.content.direct_matches, ...breedContent.content.related],
    preferredTypes: OWNER_HELP_TYPES,
    limit: 4,
    usedKeys,
  });
  const gallery = pickFirstMatchingPost({
    posts: [...breedContent.content.direct_matches, ...breedContent.content.related],
    predicate: (post) => post.content_type === "gallery",
    usedKeys,
  });
  const relatedReads = pickFeaturedItems({
    posts: [...breedContent.content.related, ...breedContent.content.direct_matches],
    preferredTypes: RELATED_READ_TYPES,
    limit: 4,
    usedKeys,
  });
  const funExtras = pickFeaturedItems({
    posts: [
      ...breedContent.content.related,
      ...breedContent.content.supplemental,
      ...breedContent.content.direct_matches,
    ],
    preferredTypes: FUN_EXTRA_TYPES,
    limit: 3,
    usedKeys,
  });

  return {
    breed: {
      id: breedDetail.id,
      display_name: toTitleCase(breedDetail.display_name),
      aliases: combinedAliases,
      image_url: breedDetail.media.image_url,
      description_text: truncateAtSentence(breedDetail.description_text),
      origin: breedDetail.stats.origin,
      size: breedDetail.stats.size,
      life_span: breedDetail.stats.life_span,
      temperament: breedDetail.traits.temperament,
      exercise_needs: breedDetail.traits.exercise_needs,
      good_with_families: breedDetail.traits.good_with_families,
      owner_type: breedDetail.traits.owner_type,
    },
    featured: {
      main_article: mainArticle,
      owner_help: ownerHelp,
      gallery,
      related_reads: relatedReads,
      fun_extras: funExtras,
    },
    meta: {
      preferred_tag_slug: breedDetail.preferred_tag_slug,
      shared_content_key: breedDetail.shared_content_key,
    },
  };
}

interface PickFeaturedItemsOptions {
  posts: WordPressPostSummary[];
  preferredTypes: BreedContentType[];
  limit: number;
  usedKeys: Set<string>;
}

function pickFeaturedItems(options: PickFeaturedItemsOptions): BreedCardFeaturedItem[] {
  const selected: BreedCardFeaturedItem[] = [];

  for (const preferredType of options.preferredTypes) {
    for (const post of options.posts) {
      if (selected.length >= options.limit) {
        return selected;
      }

      if (post.content_type !== preferredType) {
        continue;
      }

      const featuredItem = toFeaturedItem(post);
      if (!featuredItem || hasUsedKey(options.usedKeys, featuredItem)) {
        continue;
      }

      markUsed(options.usedKeys, featuredItem);
      selected.push(featuredItem);
    }
  }

  return selected;
}

interface PickFirstMatchingPostOptions {
  posts: WordPressPostSummary[];
  predicate: (post: WordPressPostSummary) => boolean;
  usedKeys: Set<string>;
}

function pickFirstMatchingPost(options: PickFirstMatchingPostOptions): BreedCardFeaturedItem | null {
  for (const post of options.posts) {
    if (!options.predicate(post)) {
      continue;
    }

    const featuredItem = toFeaturedItem(post);
    if (!featuredItem || hasUsedKey(options.usedKeys, featuredItem)) {
      continue;
    }

    markUsed(options.usedKeys, featuredItem);
    return featuredItem;
  }

  return null;
}

function toFeaturedItem(post: WordPressPostSummary | null | undefined): BreedCardFeaturedItem | null {
  if (!post) {
    return null;
  }

  const title = post.title.trim();
  const link = post.link.trim();
  if (!title || !link) {
    return null;
  }

  return {
    title,
    link,
    content_type: post.content_type ?? null,
  };
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const normalized = trimmed.toLowerCase();
    if (!trimmed || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(trimmed);
  }

  return unique;
}

function toTitleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

function truncateAtSentence(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length <= DESCRIPTION_MAX_LENGTH) {
    return trimmed;
  }

  const truncated = trimmed.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd();
  const sentenceBoundary = findLastSentenceBoundary(truncated);
  if (sentenceBoundary !== -1) {
    return truncated.slice(0, sentenceBoundary + 1).trimEnd();
  }

  const wordBoundary = truncated.lastIndexOf(" ");
  if (wordBoundary !== -1) {
    return `${truncated.slice(0, wordBoundary).trimEnd()}...`;
  }

  return `${truncated}...`;
}

function findLastSentenceBoundary(value: string): number {
  let boundary = -1;

  for (const marker of [".", "!", "?"]) {
    const markerIndex = value.lastIndexOf(marker);
    if (markerIndex > boundary) {
      boundary = markerIndex;
    }
  }

  return boundary;
}

function markUsed(usedKeys: Set<string>, item: BreedCardFeaturedItem | null): void {
  if (!item) {
    return;
  }

  usedKeys.add(toFeaturedItemKey(item));
}

function hasUsedKey(usedKeys: Set<string>, item: BreedCardFeaturedItem): boolean {
  return usedKeys.has(toFeaturedItemKey(item));
}

function toFeaturedItemKey(item: BreedCardFeaturedItem): string {
  return `${item.link.toLowerCase()}::${item.title.toLowerCase()}`;
}
