import { normalizeLookupKey } from "./normalizeLookupKey.js";

import type { CanonicalBreedSignals, WordPressPostSummary } from "./types.js";

export interface BreedPostMatchSignals {
  articleUrlExactMatch: boolean;
  displayNameInTitle: boolean;
  displayNameInSlug: boolean;
  displayNameInExcerpt: boolean;
  aliasInTitle: boolean;
  aliasInSlug: boolean;
  aliasInExcerpt: boolean;
  breedConceptInTitle: boolean;
  breedConceptInSlug: boolean;
  breedConceptInExcerpt: boolean;
  preferredTagMatch: boolean;
  matchedBreedTag: boolean;
  matchedBreedCategory: boolean;
  titleOrSlugMatch: boolean;
  excerptMatch: boolean;
  tagOnlyMatch: boolean;
}

export function getBreedPostMatchSignals(
  post: WordPressPostSummary,
  signals: CanonicalBreedSignals,
): BreedPostMatchSignals {
  const normalizedTitle = normalizeLookupKey(post.title);
  const normalizedSlug = normalizeLookupKey(post.slug);
  const normalizedExcerpt = normalizeLookupKey(post.excerpt);
  const normalizedDisplayName = normalizeLookupKey(signals.display_name);
  const aliasConcepts = getAliasConcepts(signals);

  const articleUrlExactMatch =
    Boolean(signals.article_url) && normalizeUrl(post.link) === normalizeUrl(signals.article_url ?? "");
  const displayNameInTitle =
    normalizedDisplayName.length > 0 && normalizedTitle.includes(normalizedDisplayName);
  const displayNameInSlug =
    normalizedDisplayName.length > 0 && normalizedSlug.includes(normalizedDisplayName);
  const displayNameInExcerpt =
    normalizedDisplayName.length > 0 && normalizedExcerpt.includes(normalizedDisplayName);

  const aliasInTitle = aliasConcepts.some((alias) =>
    matchesSurface(alias, post.title, normalizedTitle, { allowShortWholeWord: true }),
  );
  const aliasInSlug = aliasConcepts.some((alias) =>
    matchesSurface(alias, post.slug, normalizedSlug, { allowShortWholeWord: true }),
  );
  const aliasInExcerpt = aliasConcepts.some((alias) =>
    matchesSurface(alias, post.excerpt, normalizedExcerpt, { allowShortWholeWord: false }),
  );

  const breedConcepts = getBreedConcepts(signals);
  const breedConceptInTitle = breedConcepts.some((concept) =>
    matchesSurface(concept, post.title, normalizedTitle, { allowShortWholeWord: true }),
  );
  const breedConceptInSlug = breedConcepts.some((concept) =>
    matchesSurface(concept, post.slug, normalizedSlug, { allowShortWholeWord: true }),
  );
  const breedConceptInExcerpt = breedConcepts.some((concept) =>
    matchesSurface(concept, post.excerpt, normalizedExcerpt, { allowShortWholeWord: false }),
  );

  const matchedBreedTag = post.matched_tags.some((tag) =>
    signals.tag_slugs.includes(tag.trim().toLowerCase()),
  );
  const preferredTagMatch =
    Boolean(signals.preferred_tag_slug) &&
    post.matched_tags.some((tag) => tag.trim().toLowerCase() === signals.preferred_tag_slug?.toLowerCase());
  const matchedBreedCategory = post.matched_categories.length > 0;
  const titleOrSlugMatch =
    displayNameInTitle ||
    displayNameInSlug ||
    aliasInTitle ||
    aliasInSlug ||
    breedConceptInTitle ||
    breedConceptInSlug;
  const excerptMatch = displayNameInExcerpt || aliasInExcerpt || breedConceptInExcerpt;
  const tagOnlyMatch = matchedBreedTag && !titleOrSlugMatch && !excerptMatch;

  return {
    articleUrlExactMatch,
    displayNameInTitle,
    displayNameInSlug,
    displayNameInExcerpt,
    aliasInTitle,
    aliasInSlug,
    aliasInExcerpt,
    breedConceptInTitle,
    breedConceptInSlug,
    breedConceptInExcerpt,
    preferredTagMatch,
    matchedBreedTag,
    matchedBreedCategory,
    titleOrSlugMatch,
    excerptMatch,
    tagOnlyMatch,
  };
}

function getAliasConcepts(signals: CanonicalBreedSignals): string[] {
  return dedupeConcepts(signals.aliases.filter((alias) => normalizeConcept(alias).length > 1));
}

function getBreedConcepts(signals: CanonicalBreedSignals): string[] {
  return dedupeConcepts([
    signals.preferred_tag_slug ?? "",
    signals.shared_content_key ?? "",
    ...signals.tag_slugs,
  ]);
}

function dedupeConcepts(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = normalizeConcept(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(value.trim());
  }

  return unique;
}

function normalizeConcept(value: string): string {
  return normalizeLookupKey(value.replace(/[-_]+/g, " "));
}

function matchesSurface(
  concept: string,
  rawSurface: string,
  normalizedSurface: string,
  options: { allowShortWholeWord: boolean },
): boolean {
  const normalizedConcept = normalizeConcept(concept);
  if (!normalizedConcept) {
    return false;
  }

  if (normalizedConcept.length <= 3 && !options.allowShortWholeWord) {
    return false;
  }

  if (shouldUseWholeWordMatch(normalizedConcept, options.allowShortWholeWord)) {
    return containsWholeWord(rawSurface, normalizedConcept);
  }

  const pluralConcept = normalizedConcept.includes(" ") ? null : `${normalizedConcept}s`;

  return (
    normalizedSurface.includes(normalizedConcept) ||
    (pluralConcept !== null && normalizedSurface.includes(pluralConcept))
  );
}

function shouldUseWholeWordMatch(normalizedConcept: string, allowShortWholeWord: boolean): boolean {
  return allowShortWholeWord && normalizedConcept.length > 0 && normalizedConcept.length <= 3;
}

function containsWholeWord(value: string, target: string): boolean {
  const normalized = normalizeTextWords(value);
  return normalized.length > 0 && normalized.split(" ").includes(target);
}

function normalizeTextWords(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}
