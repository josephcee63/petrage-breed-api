import type { RequestHandler, Response } from "express";

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

export const enforceBreedsCacheHeadersOnSuccess = createSuccessCacheHeaderMiddleware(
  BREEDS_CACHE_CONTROL,
);

export const enforceCompareCacheHeadersOnSuccess = createSuccessCacheHeaderMiddleware(
  COMPARE_CACHE_CONTROL,
);

function createSuccessCacheHeaderMiddleware(cacheControlValue: string): RequestHandler {
  return (_request, response, next) => {
    const originalWriteHead = response.writeHead;

    response.writeHead = function writeHead(
      this: Response,
      ...args: Parameters<Response["writeHead"]>
    ) {
      if (this.statusCode === 200) {
        this.setHeader("Cache-Control", cacheControlValue);
      }

      return originalWriteHead.apply(this, args);
    } as Response["writeHead"];

    next();
  };
}
