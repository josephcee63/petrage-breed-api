const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC_REGEX = /[^a-z0-9]+/g;
const EDGE_HYPHENS_REGEX = /^-+|-+$/g;

export function slugifyBreed(input: string): string {
  return input
    .normalize("NFKD")
    .replace(COMBINING_MARKS_REGEX, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(NON_ALPHANUMERIC_REGEX, "-")
    .replace(EDGE_HYPHENS_REGEX, "");
}
