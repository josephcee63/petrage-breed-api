import cors, { type CorsOptions } from "cors";
import express from "express";

import { errorHandler } from "./errors.js";
import { createBreedRouter } from "./routes/breed.js";
import { createCardRouter } from "./routes/card.js";
import { createCompareRouter } from "./routes/compare.js";
import { createContentRouter } from "./routes/content.js";
import { createHealthRouter } from "./routes/health.js";
import { createRootRouter } from "./routes/root.js";

import type { LoadedBreedData } from "../lib/types.js";

const DEFAULT_WORDPRESS_BASE_URL = "https://petrage.net";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://petrage.net",
  "https://www.petrage.net",
  "https://alldogbreeds.net",
  "https://www.alldogbreeds.net",
];

export interface AppDependencies {
  breedData?: LoadedBreedData;
  fetchImplementation?: typeof fetch;
  allowedOrigins?: string[];
  wordPressBaseUrl?: string;
}

export function createApp(dependencies?: AppDependencies) {
  const app = express();
  const allowedOrigins = normalizeAllowedOrigins(
    dependencies?.allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS,
  );
  const sharedBreedData = dependencies?.breedData ? { breedData: dependencies.breedData } : {};
  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
    credentials: false,
  };

  app.use(express.json());
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  app.use(createRootRouter());
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

function normalizeAllowedOrigins(origins: string[]): string[] {
  return origins
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter((origin) => origin.length > 0);
}
