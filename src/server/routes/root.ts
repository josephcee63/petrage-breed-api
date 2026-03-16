import { Router } from "express";

const API_ENDPOINTS = [
  "/health",
  "/breeds",
  "/breed/:input",
  "/breed/:input/content",
  "/breed/:input/card",
  "/compare/:left/:right",
];

export function createRootRouter(): Router {
  const router = Router();

  router.get("/", (_request, response) => {
    response.json({
      ok: true,
      service: "dog-breed-api",
      endpoints: API_ENDPOINTS,
    });
  });

  return router;
}
