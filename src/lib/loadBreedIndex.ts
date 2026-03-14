import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { findProjectRoot } from "./projectPaths.js";
import type { BreedIndex } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = findProjectRoot(__dirname);

export const DEFAULT_BREED_INDEX_PATH = path.join(
  projectRoot,
  "data",
  "generated",
  "breeds.index.json",
);

export async function loadBreedIndex(filePath = DEFAULT_BREED_INDEX_PATH): Promise<BreedIndex> {
  const rawFile = await readFile(filePath, "utf8");
  const parsed = JSON.parse(rawFile) as BreedIndex;

  if (!parsed || !Array.isArray(parsed.breeds)) {
    throw new Error(`Invalid breed index at ${filePath}`);
  }

  return parsed;
}
