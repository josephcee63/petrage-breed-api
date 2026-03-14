import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildBreedIndex } from "../src/lib/buildBreedIndex.js";
import type { ManualBreedMappings, NormalizedBreed } from "../src/lib/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const normalizedBreedsPath = path.join(projectRoot, "data", "generated", "breeds.normalized.json");
const manualMappingsPath = path.join(projectRoot, "data", "manual", "breed-aliases.json");

function loadTestData(): {
  normalizedBreeds: NormalizedBreed[];
  manualMappings: ManualBreedMappings;
} {
  return {
    normalizedBreeds: JSON.parse(readFileSync(normalizedBreedsPath, "utf8")) as NormalizedBreed[],
    manualMappings: JSON.parse(readFileSync(manualMappingsPath, "utf8")) as ManualBreedMappings,
  };
}

describe("buildBreedIndex", () => {
  it("includes multiple tag slugs for german-shepherd-dog", () => {
    const { normalizedBreeds, manualMappings } = loadTestData();
    const breedIndex = buildBreedIndex(normalizedBreeds, manualMappings);
    const germanShepherd = breedIndex.breeds.find((breed) => breed.id === "german-shepherd-dog");

    expect(germanShepherd).toBeDefined();
    expect(germanShepherd?.tag_slugs).toEqual(
      expect.arrayContaining(["gsd", "germanshepherddog", "germanshepherd"]),
    );
    expect(germanShepherd?.preferred_tag_slug).toBe("germanshepherddog");
  });

  it("preserves the akita shared content cluster for both distinct breeds", () => {
    const { normalizedBreeds, manualMappings } = loadTestData();
    const breedIndex = buildBreedIndex(normalizedBreeds, manualMappings);
    const akitaInu = breedIndex.breeds.find((breed) => breed.id === "akita-inu");
    const americanAkita = breedIndex.breeds.find((breed) => breed.id === "american-akita");

    expect(akitaInu).toMatchObject({
      preferred_tag_slug: "akita",
      shared_content_key: "akita",
    });
    expect(americanAkita).toMatchObject({
      preferred_tag_slug: "akita",
      shared_content_key: "akita",
    });
  });
});
