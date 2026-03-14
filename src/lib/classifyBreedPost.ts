import type { BreedContentType, WordPressPostSummary } from "./types.js";

export function classifyBreedPost(post: WordPressPostSummary): BreedContentType {
  const title = normalizeWords(post.title);
  const slug = normalizeWords(post.slug);
  const excerpt = normalizeWords(post.excerpt);
  const combined = `${title} ${slug} ${excerpt}`.trim();

  if (matchesAny(combined, [" meme "])) {
    return "meme";
  }

  if (isQuizContent(combined)) {
    return "quiz";
  }

  if (isHealthContent(combined)) {
    return "health";
  }

  if (isTrainingContent(combined)) {
    return "training";
  }

  if (isBehaviorContent(combined)) {
    return "behavior";
  }

  if (isCareContent(combined)) {
    return "care";
  }

  if (matchesAny(combined, [" gallery ", " user gallery ", " photo gallery "])) {
    return "gallery";
  }

  if (
    matchesAny(combined, [
      " survey ",
      " owner data ",
      " owner survey ",
      " behavior survey ",
      " nutrition survey ",
    ])
  ) {
    return "survey";
  }

  if (
    matchesAny(combined, [
      " interesting facts ",
      " facts about ",
      " quick facts ",
      " breed facts ",
      " facts ",
    ])
  ) {
    return "facts";
  }

  if (
    matchesAny(combined, [
      " video ",
      " puppies playing ",
      " snow pouncing ",
      " wrestling match ",
      " playtime ",
      " kitten loves ",
      " puppy video ",
    ])
  ) {
    return "video";
  }

  if (
    matchesAny(combined, [
      " top ",
      " best ",
      " breeds from ",
      " breeds for ",
      " most ",
      " oldest dog breeds ",
      " oldest ",
      " list ",
      " complete list ",
      " strongest ",
      " smartest ",
      " search and rescue dog breeds ",
      " dog breeds from australia ",
      " dog breeds from japan ",
      " herding dog breeds ",
    ])
  ) {
    return "list";
  }

  return "misc";
}

function isQuizContent(value: string): boolean {
  return matchesAny(value, [
    " quiz ",
    " can you identify ",
    " true false ",
    " owner quiz ",
    " vs ",
    " versus ",
    " showdown ",
    " battle of the ",
    " battle of ",
    "battle of ",
    " head to head ",
    " head-to-head ",
    " which wins ",
  ]);
}

function isHealthContent(value: string): boolean {
  return matchesAny(value, [
    " health issues ",
    " disease ",
    " diagnosis ",
    " diagnosed ",
    " hypothyroidism ",
    " medication sensitivity ",
    " sensitive to medication ",
    " vet backed ",
    " treatment ",
    " medical ",
    " health concern ",
    " health concerns ",
  ]);
}

function isCareContent(value: string): boolean {
  return matchesAny(value, [
    " care ",
    " caring for ",
    " what every owner should know ",
    " guide ",
    " care guide ",
    " what to expect ",
    " owner should know ",
  ]);
}

function isBehaviorContent(value: string): boolean {
  return matchesAny(value, [
    " behavior ",
    " temperament ",
    " personality ",
    " owner insights ",
    " behavior traits ",
  ]);
}

function isTrainingContent(value: string): boolean {
  return matchesAny(value, [
    " training ",
    " obedience ",
    " train ",
    " behavior problems ",
  ]);
}

function normalizeWords(value: string): string {
  return ` ${value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function matchesAny(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => value.includes(pattern));
}
