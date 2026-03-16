import { createApp } from "./app.js";
import { rateLimitConfig } from "../config/rateLimit.js";

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3000;
const DEFAULT_WORDPRESS_BASE_URL = "https://petrage.net";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://petrage.net",
  "https://www.petrage.net",
  "https://alldogbreeds.net",
  "https://www.alldogbreeds.net",
];

const port = parsePort(process.env.PORT);
const wordPressBaseUrl = normalizeWordPressBaseUrl(process.env.WORDPRESS_BASE_URL);
const allowedOrigins = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS);
const app = createApp({
  wordPressBaseUrl,
  allowedOrigins,
});

app.listen(port, DEFAULT_HOST, () => {
  console.log(`dog-breed-api listening on http://localhost:${port}`);
  console.log(`Listening on ${DEFAULT_HOST}:${port}`);
  console.log(`WordPress base URL: ${wordPressBaseUrl}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log(
    `Rate limits: compare ${rateLimitConfig.compare.max} per ${rateLimitConfig.compare.windowMs}ms, ` +
      `breed content ${rateLimitConfig.breedContent.max} per ${rateLimitConfig.breedContent.windowMs}ms, ` +
      `breeds ${rateLimitConfig.breeds.max} per ${rateLimitConfig.breeds.windowMs}ms, ` +
      `api safety ${rateLimitConfig.apiSafety.max} per ${rateLimitConfig.apiSafety.windowMs}ms`,
  );
});

function parsePort(portValue: string | undefined): number {
  const parsed = Number(portValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function normalizeWordPressBaseUrl(baseUrl: string | undefined): string {
  const trimmed = (baseUrl ?? DEFAULT_WORDPRESS_BASE_URL).trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_WORDPRESS_BASE_URL;
}

function parseAllowedOrigins(originsValue: string | undefined): string[] {
  if (!originsValue?.trim()) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const allowedOrigins = originsValue
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter((origin) => origin.length > 0);

  return allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS;
}
