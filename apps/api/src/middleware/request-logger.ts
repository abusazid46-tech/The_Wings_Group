import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../services/logger.js";

export type RequestWithId = Request & {
  requestId?: string;
};

export function requestLogger(req: RequestWithId, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  const requestId = req.header("x-request-id") || crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    logger.info("HTTP request completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
      userAgent: req.header("user-agent")
    });
  });

  next();
}
