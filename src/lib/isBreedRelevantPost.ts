import { normalizeLookupKey } from "./normalizeLookupKey.js";

import type { CanonicalBreedSignals, WordPressPostSummary } from "./types.js";

export function isBreedRelevantPost(post: WordPressPostSummary, signals: CanonicalBreedSignals): boolean {
  if (signals.article_url && normalizeUrl(post.link) === normalizeUrl(signals.article_url)) {
    return true;
  }

  const textSurfaces = [post.title, post.slug, post.excerpt];
  const displayName = signals.display_name.trim();

  if (matchesPhrase(displayName, textSurfaces)) {
    return true;
  }

  for (const alias of signals.aliases) {
    if (matchesAlias(alias, textSurfaces)) {
      return true;
    }
  }

  return post.matched_tags.some((tag) => signals.tag_slugs.includes(tag.trim().toLowerCase()));
}

function matchesPhrase(phrase: string, textSurfaces: string[]): boolean {
  const normalizedPhrase = normalizeLookupKey(phrase);
  if (!normalizedPhrase) {
    return false;
  }

  return textSurfaces.some((surface) => normalizeLookupKey(surface).includes(normalizedPhrase));
}

function matchesAlias(alias: string, textSurfaces: string[]): boolean {
  const trimmedAlias = alias.trim();
  if (!trimmedAlias) {
    return false;
  }

  if (isAcronym(trimmedAlias)) {
    return textSurfaces.some((surface) => containsWholeWord(surface, trimmedAlias.toLowerCase()));
  }

  const normalizedAlias = normalizeLookupKey(trimmedAlias);
  if (normalizedAlias.length < 4) {
    return false;
  }

  const pluralAlias = isSingleWord(trimmedAlias) ? `${normalizedAlias}s` : null;

  return textSurfaces.some((surface) => {
    const normalizedSurface = normalizeLookupKey(surface);
    return (
      normalizedSurface.includes(normalizedAlias) ||
      (pluralAlias !== null && normalizedSurface.includes(pluralAlias))
    );
  });
}

function containsWholeWord(value: string, target: string): boolean {
  const normalized = normalizeTextWords(value);
  return normalized.length > 0 && normalized.split(" ").includes(target);
}

function isAcronym(value: string): boolean {
  return /^[A-Z0-9]{2,5}$/.test(value.trim());
}

function isSingleWord(value: string): boolean {
  return normalizeTextWords(value).split(" ").filter(Boolean).length === 1;
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
