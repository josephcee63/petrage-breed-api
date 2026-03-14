import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadBreedIndex } from "./loadBreedIndex.js";
import { findProjectRoot } from "./projectPaths.js";

import type { BreedIndexBreed, LoadedBreedData, NormalizedBreed } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = findProjectRoot(__dirname);

export const DEFAULT_NORMALIZED_BREEDS_PATH = path.join(
  projectRoot,
  "data",
  "generated",
  "breeds.normalized.json",
);

export async function loadNormalizedBreeds(
  filePath = DEFAULT_NORMALIZED_BREEDS_PATH,
): Promise<NormalizedBreed[]> {
  const rawFile = await readFile(filePath, "utf8");
  const parsed = JSON.parse(rawFile) as NormalizedBreed[];

  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid normalized breed data at ${filePath}`);
  }

  return parsed;
}

export async function loadBreedData(options?: {
  normalizedBreedsPath?: string;
  breedIndexPath?: string;
}): Promise<LoadedBreedData> {
  const [normalizedBreeds, breedIndex] = await Promise.all([
    loadNormalizedBreeds(options?.normalizedBreedsPath),
    loadBreedIndex(options?.breedIndexPath),
  ]);

  return {
    normalizedBreeds,
    breedIndex,
  };
}

export function getNormalizedBreedById(
  normalizedBreeds: NormalizedBreed[],
  breedId: string,
): NormalizedBreed | null {
  return normalizedBreeds.find((breed) => breed.id === breedId) ?? null;
}

export function getBreedIndexEntryById(
  breedIndexBreeds: BreedIndexBreed[],
  breedId: string,
): BreedIndexBreed | null {
  return breedIndexBreeds.find((breed) => breed.id === breedId) ?? null;
}
