import { Router } from "express";

export function createHealthRouter(): Router {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  return router;
}
