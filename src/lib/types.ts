export interface RawNinjaTablesExport {
  original_rows?: RawBreedRow[];
}

export interface RawBreedRow {
  position?: string | null;
  value?: RawBreedRowValue | null;
}

export interface RawBreedRowValue {
  alpha?: string | null;
  dog_breeds?: string | null;
  photo?: string | null;
  description?: string | null;
  details?: string | null;
  link?: string | null;
}

export interface BreedTraits {
  temperament: string | null;
  purpose: string | null;
  good_with_families: string | null;
  owner_type: string | null;
  intelligence: string | null;
  exercise_needs: string | null;
}

export interface BreedStats {
  female_height: string | null;
  male_height: string | null;
  female_weight: string | null;
  male_weight: string | null;
  life_span: string | null;
  litter_size: string | null;
  shedding: string[];
  origin: string[];
  size: string[];
  hair_length: string[];
}

export interface BreedMedia {
  image_url: string | null;
  article_url: string | null;
  tag_url: string | null;
}

export interface NormalizedBreed {
  id: string;
  display_name: string;
  aka_names: string[];
  alpha: string | null;
  traits: BreedTraits;
  stats: BreedStats;
  media: BreedMedia;
  description_text: string | null;
  source: {
    table_row_id: string | null;
    raw_breed_field: string | null;
  };
}

export interface HtmlListItem {
  label: string;
  value: string;
}

export interface ManualBreedMapping {
  aliases: string[];
  tag_slugs: string[];
  preferred_tag_slug: string | null;
  shared_content_key: string | null;
}

export type ManualBreedMappings = Record<string, ManualBreedMapping>;

export interface BreedIndexBreed {
  id: string;
  display_name: string;
  aka_names: string[];
  aliases: string[];
  tag_slugs: string[];
  preferred_tag_slug: string | null;
  shared_content_key: string | null;
  lookup_keys: string[];
}

export interface BreedIndex {
  breeds: BreedIndexBreed[];
}

export interface LoadedBreedData {
  normalizedBreeds: NormalizedBreed[];
  breedIndex: BreedIndex;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

export type BreedContentType =
  | "facts"
  | "health"
  | "care"
  | "behavior"
  | "training"
  | "quiz"
  | "gallery"
  | "comparison"
  | "survey"
  | "list"
  | "video"
  | "meme"
  | "misc";

export interface WordPressPostSummary {
  id: number;
  date: string;
  slug: string;
  link: string;
  title: string;
  excerpt: string;
  matched_tags: string[];
  matched_categories: string[];
  content_type?: BreedContentType;
}

export interface CanonicalBreedSignals {
  display_name: string;
  aliases: string[];
  article_url: string | null;
  preferred_tag_slug: string | null;
  tag_slugs: string[];
  shared_content_key: string | null;
}

export interface RankedWordPressPost {
  post: WordPressPostSummary;
  content_type: BreedContentType;
  score: number;
  reasons: string[];
}

export interface BreedContentBuckets {
  canonical: {
    post: WordPressPostSummary | null;
    score: number | null;
    reasons: string[];
  };
  direct_matches: WordPressPostSummary[];
  gallery: WordPressPostSummary[];
  quizzes: WordPressPostSummary[];
  related: WordPressPostSummary[];
  supplemental: WordPressPostSummary[];
}

export interface BreedContentResult {
  resolved_input: string;
  breed: {
    id: string;
    display_name: string;
    aka_names: string[];
    aliases: string[];
    tag_slugs: string[];
    preferred_tag_slug: string | null;
    shared_content_key: string | null;
  };
  content_query: {
    base_url: string;
    tag_slugs_queried: string[];
    matched_tag_ids: number[];
    matched_tag_slugs: string[];
    category_slugs_queried: string[];
    matched_category_ids: number[];
    matched_category_slugs: string[];
  };
  content: BreedContentBuckets;
  posts: WordPressPostSummary[];
}

export interface BreedDetails {
  id: string;
  display_name: string;
  aka_names: string[];
  aliases: string[];
  tag_slugs: string[];
  preferred_tag_slug: string | null;
  shared_content_key: string | null;
  traits: BreedTraits;
  stats: BreedStats;
  media: BreedMedia;
  description_text: string | null;
}

export interface BreedComparisonResult {
  left: BreedDetails;
  right: BreedDetails;
}

export interface BreedCardFeaturedItem {
  title: string;
  link: string;
  content_type: BreedContentType | null;
}

export interface BreedCardResult {
  breed: {
    id: string;
    display_name: string;
    aliases: string[];
    image_url: string | null;
    description_text: string | null;
    origin: string[];
    size: string[];
    life_span: string | null;
    temperament: string | null;
    exercise_needs: string | null;
    good_with_families: string | null;
    owner_type: string | null;
  };
  featured: {
    main_article: BreedCardFeaturedItem | null;
    owner_help: BreedCardFeaturedItem[];
    gallery: BreedCardFeaturedItem | null;
    related_reads: BreedCardFeaturedItem[];
    fun_extras: BreedCardFeaturedItem[];
  };
  meta: {
    preferred_tag_slug: string | null;
    shared_content_key: string | null;
  };
}
