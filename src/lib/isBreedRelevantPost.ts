import { getBreedPostMatchSignals } from "./getBreedPostMatchSignals.js";

import type { CanonicalBreedSignals, WordPressPostSummary } from "./types.js";

export function isBreedRelevantPost(post: WordPressPostSummary, signals: CanonicalBreedSignals): boolean {
  const matchSignals = getBreedPostMatchSignals(post, signals);

  return (
    matchSignals.articleUrlExactMatch ||
    matchSignals.titleOrSlugMatch ||
    (matchSignals.excerptMatch && (matchSignals.matchedBreedTag || matchSignals.matchedBreedCategory))
  );
}
