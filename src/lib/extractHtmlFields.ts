import { load } from "cheerio";

import type { HtmlListItem } from "./types.js";

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function htmlToText(html: string | null | undefined): string | null {
  if (!html || !html.trim()) {
    return null;
  }

  const $ = load(html);
  // Add separators to common block-level elements so adjacent tags do not collapse
  // into unreadable text when the source HTML omits whitespace between siblings.
  $("br").replaceWith(" ");
  $("p, div, li, h1, h2, h3, h4, h5, h6").append(" ");

  const text = normalizeWhitespace($.root().text());
  return text || null;
}

export function extractFirstImageUrl(html: string | null | undefined): string | null {
  if (!html || !html.trim()) {
    return null;
  }

  const $ = load(html);
  const imageUrl = $("img").first().attr("src");
  return imageUrl ? imageUrl.trim() : null;
}

export function extractFirstLinkUrl(html: string | null | undefined): string | null {
  if (!html || !html.trim()) {
    return null;
  }

  const $ = load(html);
  const linkUrl = $("a").first().attr("href");
  return linkUrl ? linkUrl.trim() : null;
}

export function extractHeadingText(html: string | null | undefined): string | null {
  if (!html || !html.trim()) {
    return null;
  }

  const $ = load(html);
  const heading = $("h1, h2, h3, h4, h5, h6").first();
  const text = normalizeWhitespace(heading.text());
  if (text) {
    return text;
  }

  const strong = $("strong").first();
  const fallback = normalizeWhitespace(strong.text());
  return fallback || null;
}

export function extractListItems(html: string | null | undefined): HtmlListItem[] {
  if (!html || !html.trim()) {
    return [];
  }

  const $ = load(html);
  const items: HtmlListItem[] = [];

  $("li").each((_, element) => {
    const item = $(element);
    const strong = item.find("strong").first();
    const label = normalizeWhitespace(strong.text()).replace(/:$/, "");

    if (!label) {
      return;
    }

    // Cheerio flattens nested markup, so remove the leading label text manually and
    // preserve linked values such as origin countries that are wrapped in anchors.
    const fullText = normalizeWhitespace(item.text());
    const value = normalizeWhitespace(
      fullText.replace(new RegExp(`^${escapeRegExp(label)}\\s*:?\\s*`, "i"), ""),
    );

    items.push({
      label,
      value,
    });
  });

  return items;
}

export function splitDelimitedList(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split("|")
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
