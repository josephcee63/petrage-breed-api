import {
  extractFirstImageUrl,
  extractFirstLinkUrl,
  extractHeadingText,
  extractListItems,
  htmlToText,
  splitDelimitedList,
} from "./extractHtmlFields.js";
import { slugifyBreed } from "./slugifyBreed.js";

import type {
  BreedStats,
  BreedTraits,
  HtmlListItem,
  NormalizedBreed,
  RawBreedRow,
} from "./types.js";

const AKA_SPLIT_REGEX = /\s+aka\s+/i;
const ALIAS_SEPARATOR_REGEX = /\s*(?:,|\/|\||;|\bor\b)\s*/i;

const TRAIT_LABEL_MAP: Record<string, keyof BreedTraits> = {
  temperament: "temperament",
  purpose: "purpose",
  "good with families": "good_with_families",
  "owner type": "owner_type",
  intelligence: "intelligence",
  "exercise needs": "exercise_needs",
};

const DETAIL_VALUE_MAP: Record<
  string,
  Exclude<keyof BreedStats, "shedding" | "origin" | "size" | "hair_length">
> = {
  "female height": "female_height",
  "male height": "male_height",
  "female weight": "female_weight",
  "male weight": "male_weight",
  "life span": "life_span",
  "litter size": "litter_size",
};

export interface ParsedBreedName {
  displayName: string;
  akaNames: string[];
  rawBreedField: string;
}

export function parseBreedName(rawBreedField: string): ParsedBreedName {
  const normalized = rawBreedField.replace(/\s+/g, " ").trim();
  const [primarySegment, ...akaSegments] = normalized.split(AKA_SPLIT_REGEX);
  const displayName = (primarySegment ?? "").trim();
  const akaNames = akaSegments
    .flatMap((segment) => segment.split(ALIAS_SEPARATOR_REGEX))
    .map((segment) => segment.trim())
    .filter(Boolean);

  return {
    displayName,
    akaNames,
    rawBreedField: normalized,
  };
}

export function parseBreedRow(row: RawBreedRow): NormalizedBreed | null {
  const value = row.value;
  if (!value) {
    return null;
  }

  const breedHeading = extractHeadingText(value.dog_breeds);
  if (!breedHeading) {
    return null;
  }

  const parsedName = parseBreedName(breedHeading);
  const id = slugifyBreed(parsedName.displayName);
  if (!id) {
    return null;
  }

  const traits = parseTraits(extractListItems(value.dog_breeds));
  const stats = parseStats(extractListItems(value.details));

  return {
    id,
    display_name: parsedName.displayName,
    aka_names: parsedName.akaNames,
    alpha: normalizeOptional(value.alpha),
    traits,
    stats,
    media: {
      image_url: extractFirstImageUrl(value.photo),
      article_url: extractFirstLinkUrl(value.description),
      tag_url: extractFirstLinkUrl(value.link),
    },
    description_text: htmlToText(value.description),
    source: {
      table_row_id: normalizeOptional(row.position),
      raw_breed_field: parsedName.rawBreedField,
    },
  };
}

function parseTraits(items: HtmlListItem[]): BreedTraits {
  const traits: BreedTraits = {
    temperament: null,
    purpose: null,
    good_with_families: null,
    owner_type: null,
    intelligence: null,
    exercise_needs: null,
  };

  for (const item of items) {
    const key = TRAIT_LABEL_MAP[toLookupKey(item.label)];
    if (!key) {
      continue;
    }

    traits[key] = normalizeOptional(item.value);
  }

  return traits;
}

function parseStats(items: HtmlListItem[]): BreedStats {
  const stats: BreedStats = {
    female_height: null,
    male_height: null,
    female_weight: null,
    male_weight: null,
    life_span: null,
    litter_size: null,
    shedding: [],
    origin: [],
    size: [],
    hair_length: [],
  };

  for (const item of items) {
    const label = toLookupKey(item.label);
    const scalarKey = DETAIL_VALUE_MAP[label];
    if (scalarKey) {
      stats[scalarKey] = normalizeOptional(item.value);
      continue;
    }

    if (label === "shedding") {
      stats.shedding = splitDelimitedList(item.value);
      continue;
    }

    if (label === "origin") {
      stats.origin = splitDelimitedList(item.value);
      continue;
    }

    if (label === "size") {
      stats.size = splitDelimitedList(item.value);
      continue;
    }

    if (label === "hair length") {
      stats.hair_length = splitDelimitedList(item.value);
    }
  }

  return stats;
}

function toLookupKey(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeOptional(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || null;
}
