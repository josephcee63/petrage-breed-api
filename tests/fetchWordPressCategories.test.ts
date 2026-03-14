import { describe, expect, it } from "vitest";

import { fetchWordPressCategories } from "../src/lib/fetchWordPressCategories.js";

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createMockFetch(routeMap: Record<string, unknown>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const requestUrl =
      typeof input === "string" ? new URL(input) : input instanceof URL ? input : new URL(input.url);
    const key = `${requestUrl.pathname}?${requestUrl.searchParams.toString()}`;
    const payload = routeMap[key];

    if (payload === undefined) {
      throw new Error(`Unexpected request: ${requestUrl.toString()}`);
    }

    return createJsonResponse(payload);
  }) as typeof fetch;
}

describe("fetchWordPressCategories", () => {
  it("returns categories in requested slug order", async () => {
    const categories = await fetchWordPressCategories(
      "https://petrage.net",
      ["dog-breed-facts", "working-dogs"],
      {
        fetchImplementation: createMockFetch({
          "/wp-json/wp/v2/categories?slug=dog-breed-facts%2Cworking-dogs&per_page=2&_fields=id%2Cname%2Cslug":
            [
              { id: 2, name: "Working Dogs", slug: "working-dogs" },
              { id: 1, name: "Dog Breed Facts", slug: "dog-breed-facts" },
            ],
        }),
      },
    );

    expect(categories.map((category) => category.slug)).toEqual(["dog-breed-facts", "working-dogs"]);
  });

  it("ignores missing categories", async () => {
    const categories = await fetchWordPressCategories(
      "https://petrage.net",
      ["dog-breed-facts", "missing-category"],
      {
        fetchImplementation: createMockFetch({
          "/wp-json/wp/v2/categories?slug=dog-breed-facts%2Cmissing-category&per_page=2&_fields=id%2Cname%2Cslug":
            [{ id: 1, name: "Dog Breed Facts", slug: "dog-breed-facts" }],
        }),
      },
    );

    expect(categories).toEqual([{ id: 1, name: "Dog Breed Facts", slug: "dog-breed-facts" }]);
  });

  it("dedupes categories correctly", async () => {
    const categories = await fetchWordPressCategories(
      "https://petrage.net",
      ["dog-breed-facts", "dog-breed-facts"],
      {
        fetchImplementation: createMockFetch({
          "/wp-json/wp/v2/categories?slug=dog-breed-facts&per_page=1&_fields=id%2Cname%2Cslug": [
            { id: 1, name: "Dog Breed Facts", slug: "dog-breed-facts" },
            { id: 1, name: "Dog Breed Facts", slug: "dog-breed-facts" },
          ],
        }),
      },
    );

    expect(categories).toEqual([{ id: 1, name: "Dog Breed Facts", slug: "dog-breed-facts" }]);
  });
});
