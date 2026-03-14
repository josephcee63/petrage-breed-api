import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildBreedIndex } from "../src/lib/buildBreedIndex.js";
import { resolveBreed } from "../src/lib/resolveBreed.js";
import type { ManualBreedMappings, NormalizedBreed } from "../src/lib/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const normalizedBreedsPath = path.join(projectRoot, "data", "generated", "breeds.normalized.json");
const manualMappingsPath = path.join(projectRoot, "data", "manual", "breed-aliases.json");

const normalizedBreeds = JSON.parse(readFileSync(normalizedBreedsPath, "utf8")) as NormalizedBreed[];
const manualMappings = JSON.parse(readFileSync(manualMappingsPath, "utf8")) as ManualBreedMappings;
const breedIndex = buildBreedIndex(normalizedBreeds, manualMappings);

describe("resolveBreed", () => {
  it.each([
    ["german-shepherd-dog", "german-shepherd-dog"],
    ["German Shepherd Dog", "german-shepherd-dog"],
    ["German Shepherd", "german-shepherd-dog"],
    ["gsd", "german-shepherd-dog"],
    ["germanshepherddog", "german-shepherd-dog"],
    ["sheltie", "shetland-sheepdog"],
    ["frenchie", "french-bulldog"],
    ["aussie", "australian-shepherd"],
    ["acd", "australian-cattle-dog"],
    ["blue heeler", "australian-cattle-dog"],
    ["red heeler", "australian-cattle-dog"],
    ["kelpie", "australian-kelpie"],
    ["akita", "akita-inu"],
    ["eskie", "american-eskimo-dog"],
  ])("resolves %s to %s", (input, expectedId) => {
    expect(resolveBreed(input, breedIndex)?.id).toBe(expectedId);
  });

  it("returns null for an unknown breed", () => {
    expect(resolveBreed("not a real breed", breedIndex)).toBeNull();
  });

  it("resolves shared lookup keys deterministically", () => {
    const firstResolution = resolveBreed("akita", breedIndex);
    const secondResolution = resolveBreed("akita", breedIndex);

    expect(firstResolution?.id).toBe("akita-inu");
    expect(secondResolution?.id).toBe("akita-inu");
  });
});
