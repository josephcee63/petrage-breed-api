const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC_REGEX = /[^a-z0-9]+/g;

export function normalizeLookupKey(input: string | null | undefined): string {
  if (!input) {
    return "";
  }

  const normalized = input
    .normalize("NFKD")
    .replace(COMBINING_MARKS_REGEX, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['\u2019]/g, "")
    .replace(NON_ALPHANUMERIC_REGEX, " ")
    .replace(/\s+/g, "")
    .trim();

  return normalized;
}
