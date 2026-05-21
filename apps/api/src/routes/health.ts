import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "the-wings-api",
    timestamp: new Date().toISOString()
  });
});

healthRouter.get("/live", (_req, res) => {
  res.json({
    ok: true,
    service: "the-wings-api",
    check: "live",
    timestamp: new Date().toISOString()
  });
});

healthRouter.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      ok: true,
      service: "the-wings-api",
      check: "ready",
      database: "ok",
      timestamp: new Date().toISOString()
    });
  } catch {
    return res.status(503).json({
      ok: false,
      service: "the-wings-api",
      check: "ready",
      database: "unavailable",
      timestamp: new Date().toISOString()
    });
  }
});
