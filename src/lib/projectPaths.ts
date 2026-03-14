import { existsSync } from "node:fs";
import path from "node:path";

export function findProjectRoot(startDirectory: string): string {
  let currentDirectory = startDirectory;

  while (true) {
    if (existsSync(path.join(currentDirectory, "package.json"))) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      throw new Error(`Could not locate project root from ${startDirectory}`);
    }

    currentDirectory = parentDirectory;
  }
}
