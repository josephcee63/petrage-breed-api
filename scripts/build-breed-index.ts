import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildBreedIndex, summarizeBreedIndex } from "../src/lib/buildBreedIndex.js";
import { findProjectRoot } from "../src/lib/projectPaths.js";
import type { ManualBreedMappings, NormalizedBreed } from "../src/lib/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = findProjectRoot(__dirname);
const normalizedBreedsPath = path.join(projectRoot, "data", "generated", "breeds.normalized.json");
const manualMappingsPath = path.join(projectRoot, "data", "manual", "breed-aliases.json");
const outputPath = path.join(projectRoot, "data", "generated", "breeds.index.json");

async function main(): Promise<void> {
  const [normalizedBreedsFile, manualMappingsFile] = await Promise.all([
    readFile(normalizedBreedsPath, "utf8"),
    readFile(manualMappingsPath, "utf8"),
  ]);

  const normalizedBreeds = JSON.parse(normalizedBreedsFile) as NormalizedBreed[];
  const manualMappings = JSON.parse(manualMappingsFile) as ManualBreedMappings;
  const breedIndex = buildBreedIndex(normalizedBreeds, manualMappings);
  const stats = summarizeBreedIndex(breedIndex);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(breedIndex, null, 2) + "\n", "utf8");

  console.log(`Breeds processed: ${stats.breedsProcessed}`);
  console.log(`Total aliases: ${stats.totalAliases}`);
  console.log(`Total tag slugs: ${stats.totalTagSlugs}`);
  console.log(`Total lookup keys: ${stats.totalLookupKeys}`);
}

main().catch((error: unknown) => {
  console.error("Breed index build failed.");
  console.error(error);
  process.exitCode = 1;
});
