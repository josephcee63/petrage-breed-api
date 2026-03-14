import { describe, expect, it } from "vitest";

import { parseBreedName, parseBreedRow } from "../src/lib/parseBreedRow.js";
import type { RawBreedRow } from "../src/lib/types.js";

describe("parseBreedName", () => {
  it("parses a primary breed name and aka aliases", () => {
    expect(parseBreedName("YORKSHIRE TERRIER aka YORKIE")).toEqual({
      displayName: "YORKSHIRE TERRIER",
      akaNames: ["YORKIE"],
      rawBreedField: "YORKSHIRE TERRIER aka YORKIE",
    });
  });
});

describe("parseBreedRow", () => {
  it("extracts media links and structured fields from HTML blobs", () => {
    const row: RawBreedRow = {
      position: "101",
      value: {
        alpha: "Y",
        dog_breeds:
          "<h3><strong>YORKSHIRE TERRIER aka YORKIE</strong></h3><ul><li><strong>Temperament</strong>: Spirited</li><li><strong>Purpose</strong>: Companion</li><li><strong>Good with Families</strong>: Good family dog</li><li><strong>Owner Type</strong>: Novice</li><li><strong>Intelligence</strong>: Highly Intelligent</li><li><strong>Exercise Needs</strong>: Minimal Exercise</li></ul>",
        photo: '<img src="https://cdn.example.com/yorkie.jpg" />',
        description:
          '<h4>Read more on the <a href="https://example.com/yorkie">Yorkie page</a></h4><span>Small and bold companion dog.</span>',
        details:
          "<p><strong>YORKSHIRE TERRIER aka YORKIE details</strong></p><ul><li><strong>female height</strong>: 5.99 to 7.01 inches</li><li><strong>male height</strong>: 5.99 to 7.01 inches</li><li><strong>female weight</strong>: 5.99 to 7.01 pounds</li><li><strong>male weight</strong>: 5.99 to 7.01 pounds</li><li><strong>life span</strong>: 12 to 15 years</li><li><strong>litter size</strong>: 3 to 5</li><li><strong>shedding</strong>: none</li><li><strong>origin</strong>: United Kingdom | England</li><li><strong>size</strong>: toy</li><li><strong>hair length</strong>: long</li></ul>",
        link: '<h5><a href="https://example.com/tags/yorkie">More Yorkie Stuff Here</a></h5>',
      },
    };

    const parsed = parseBreedRow(row);

    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({
      id: "yorkshire-terrier",
      display_name: "YORKSHIRE TERRIER",
      aka_names: ["YORKIE"],
      alpha: "Y",
      media: {
        image_url: "https://cdn.example.com/yorkie.jpg",
        article_url: "https://example.com/yorkie",
        tag_url: "https://example.com/tags/yorkie",
      },
      description_text: "Read more on the Yorkie page Small and bold companion dog.",
      stats: {
        female_height: "5.99 to 7.01 inches",
        male_height: "5.99 to 7.01 inches",
        female_weight: "5.99 to 7.01 pounds",
        male_weight: "5.99 to 7.01 pounds",
        life_span: "12 to 15 years",
        litter_size: "3 to 5",
        shedding: ["none"],
        origin: ["United Kingdom", "England"],
        size: ["toy"],
        hair_length: ["long"],
      },
      traits: {
        temperament: "Spirited",
        purpose: "Companion",
        good_with_families: "Good family dog",
        owner_type: "Novice",
        intelligence: "Highly Intelligent",
        exercise_needs: "Minimal Exercise",
      },
      source: {
        table_row_id: "101",
        raw_breed_field: "YORKSHIRE TERRIER aka YORKIE",
      },
    });
  });

  it("returns null when the row does not contain a breed heading", () => {
    const row: RawBreedRow = {
      position: "102",
      value: {
        alpha: "Z",
        dog_breeds: "",
        photo: "",
        description: "",
        details: "",
        link: "",
      },
    };

    expect(parseBreedRow(row)).toBeNull();
  });

  it("gracefully handles missing optional values", () => {
    const row: RawBreedRow = {
      position: null,
      value: {
        alpha: "",
        dog_breeds:
          "<h3><strong>AIDI</strong></h3><ul><li><strong>Temperament</strong>: Protective</li></ul>",
        photo: "",
        description: "<span>Guard dog from Morocco.</span>",
        details:
          "<ul><li><strong>origin</strong>: Morocco</li><li><strong>size</strong>: medium</li></ul>",
        link: "",
      },
    };

    expect(parseBreedRow(row)).toEqual({
      id: "aidi",
      display_name: "AIDI",
      aka_names: [],
      alpha: null,
      traits: {
        temperament: "Protective",
        purpose: null,
        good_with_families: null,
        owner_type: null,
        intelligence: null,
        exercise_needs: null,
      },
      stats: {
        female_height: null,
        male_height: null,
        female_weight: null,
        male_weight: null,
        life_span: null,
        litter_size: null,
        shedding: [],
        origin: ["Morocco"],
        size: ["medium"],
        hair_length: [],
      },
      media: {
        image_url: null,
        article_url: null,
        tag_url: null,
      },
      description_text: "Guard dog from Morocco.",
      source: {
        table_row_id: null,
        raw_breed_field: "AIDI",
      },
    });
  });
});
