import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseBreedRow } from "../src/lib/parseBreedRow.js";
import { findProjectRoot } from "../src/lib/projectPaths.js";
import type { NormalizedBreed, RawBreedRow, RawNinjaTablesExport } from "../src/lib/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = findProjectRoot(__dirname);
const inputPath = path.join(projectRoot, "data", "raw", "complete-list-of-all-dog-breeds.json");
const outputPath = path.join(projectRoot, "data", "generated", "breeds.normalized.json");

async function main(): Promise<void> {
  const rawFile = await readFile(inputPath, "utf8");
  const exportPayload = JSON.parse(rawFile) as RawNinjaTablesExport;
  const rows = exportPayload.original_rows ?? [];

  const normalizedBreeds: NormalizedBreed[] = [];
  const skippedRows: Array<{ index: number; reason: string }> = [];

  rows.forEach((row, index) => {
    const parsed = parseBreedRow(row as RawBreedRow);
    if (!parsed) {
      skippedRows.push({
        index,
        reason: "Missing or unparsable breed heading",
      });
      return;
    }

    normalizedBreeds.push(parsed);
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(normalizedBreeds, null, 2) + "\n", "utf8");

  console.log(`Rows read: ${rows.length}`);
  console.log(`Breeds parsed: ${normalizedBreeds.length}`);
  console.log(`Rows skipped: ${skippedRows.length}`);

  if (skippedRows.length > 0) {
    for (const skippedRow of skippedRows) {
      console.log(`Skipped row ${skippedRow.index}: ${skippedRow.reason}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error("Normalization failed.");
  console.error(error);
  process.exitCode = 1;
});
