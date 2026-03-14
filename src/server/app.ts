import express from "express";

import { errorHandler } from "./errors.js";
import { createBreedRouter } from "./routes/breed.js";
import { createCardRouter } from "./routes/card.js";
import { createCompareRouter } from "./routes/compare.js";
import { createContentRouter } from "./routes/content.js";
import { createHealthRouter } from "./routes/health.js";

import type { LoadedBreedData } from "../lib/types.js";

const DEFAULT_WORDPRESS_BASE_URL = "https://petrage.net";

export interface AppDependencies {
  breedData?: LoadedBreedData;
  fetchImplementation?: typeof fetch;
  wordPressBaseUrl?: string;
}

export function createApp(dependencies?: AppDependencies) {
  const app = express();
  const sharedBreedData = dependencies?.breedData ? { breedData: dependencies.breedData } : {};

  app.use(express.json());

  app.use(createHealthRouter());
  app.use(
    createContentRouter({
      wordPressBaseUrl: normalizeWordPressBaseUrl(dependencies?.wordPressBaseUrl),
      ...sharedBreedData,
      ...(dependencies?.fetchImplementation
        ? { fetchImplementation: dependencies.fetchImplementation }
        : {}),
    }),
  );
  app.use(
    createCardRouter({
      wordPressBaseUrl: normalizeWordPressBaseUrl(dependencies?.wordPressBaseUrl),
      ...sharedBreedData,
      ...(dependencies?.fetchImplementation
        ? { fetchImplementation: dependencies.fetchImplementation }
        : {}),
    }),
  );
  app.use(createBreedRouter(sharedBreedData));
  app.use(createCompareRouter(sharedBreedData));

  app.use((_request, response) => {
    response.status(404).json({ error: "Route not found" });
  });

  app.use(errorHandler);

  return app;
}

function normalizeWordPressBaseUrl(baseUrl: string | undefined): string {
  const trimmed = (baseUrl ?? DEFAULT_WORDPRESS_BASE_URL).trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_WORDPRESS_BASE_URL;
}
