import type { NextFunction, Request, RequestHandler, Response } from "express";

export class HttpError extends Error {
  public readonly statusCode: number;

  public constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message);
}

export function notFound(message: string): HttpError {
  return new HttpError(404, message);
}

export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Internal server error" });
}
