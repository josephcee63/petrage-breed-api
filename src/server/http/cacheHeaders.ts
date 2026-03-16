import type { Response } from "express";

const BREEDS_CACHE_CONTROL = "public, max-age=300, s-maxage=86400";
const COMPARE_CACHE_CONTROL = "public, max-age=300, s-maxage=3600";
const NO_STORE_CACHE_CONTROL = "no-store";

export function setBreedsCacheHeaders(response: Response): void {
  response.set("Cache-Control", BREEDS_CACHE_CONTROL);
}

export function setCompareCacheHeaders(response: Response): void {
  response.set("Cache-Control", COMPARE_CACHE_CONTROL);
}

export function setNoStoreHeaders(response: Response): void {
  response.set("Cache-Control", NO_STORE_CACHE_CONTROL);
}
