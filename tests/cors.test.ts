import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../src/server/app.js";

describe("CORS policy", () => {
  it("allows petrage.net origins", async () => {
    const app = createApp();

    const response = await request(app).get("/health").set("Origin", "https://petrage.net");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("https://petrage.net");
  });

  it("allows alldogbreeds.net origins", async () => {
    const app = createApp();

    const response = await request(app)
      .get("/health")
      .set("Origin", "https://alldogbreeds.net");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("https://alldogbreeds.net");
  });

  it("handles allowed preflight requests", async () => {
    const app = createApp();

    const response = await request(app)
      .options("/health")
      .set("Origin", "https://www.petrage.net")
      .set("Access-Control-Request-Method", "GET");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("https://www.petrage.net");
  });

  it("blocks disallowed origins without returning a CORS allow header", async () => {
    const app = createApp();
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const response = await request(app).get("/health").set("Origin", "https://example.com");

      expect(response.status).toBe(403);
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith("Blocked CORS origin:", "https://example.com");
    } finally {
      consoleWarnSpy.mockRestore();
    }
  });
});
