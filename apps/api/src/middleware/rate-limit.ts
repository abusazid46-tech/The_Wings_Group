import type { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
  keyPrefix: string;
  windowMs: number;
  max: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 1000) return;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit({ keyPrefix, windowMs, max }: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    cleanupExpiredBuckets(now);

    const identity = req.ip || req.header("x-forwarded-for") || "unknown";
    const key = `${keyPrefix}:${identity}`;
    const existing = buckets.get(key);
    const bucket = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(max - bucket.count, 0);
    res.setHeader("ratelimit-limit", String(max));
    res.setHeader("ratelimit-remaining", String(remaining));
    res.setHeader("ratelimit-reset", String(Math.ceil((bucket.resetAt - now) / 1000)));

    if (bucket.count > max) {
      return res.status(429).json({ error: "Too many requests. Please try again shortly." });
    }

    return next();
  };
}
