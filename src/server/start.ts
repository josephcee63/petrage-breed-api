import { createApp } from "./app.js";

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3000;
const DEFAULT_WORDPRESS_BASE_URL = "https://petrage.net";

const port = parsePort(process.env.PORT);
const wordPressBaseUrl = normalizeWordPressBaseUrl(process.env.WORDPRESS_BASE_URL);
const app = createApp({
  wordPressBaseUrl,
});

app.listen(port, DEFAULT_HOST, () => {
  console.log(`dog-breed-api listening on http://localhost:${port}`);
  console.log(`Listening on ${DEFAULT_HOST}:${port}`);
  console.log(`WordPress base URL: ${wordPressBaseUrl}`);
});

function parsePort(portValue: string | undefined): number {
  const parsed = Number(portValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function normalizeWordPressBaseUrl(baseUrl: string | undefined): string {
  const trimmed = (baseUrl ?? DEFAULT_WORDPRESS_BASE_URL).trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_WORDPRESS_BASE_URL;
}
