import { env } from "../config/env.js";
import { logger } from "./logger.js";

type KeepAliveHandle = {
  stop: () => void;
};

export function startKeepAlive(): KeepAliveHandle {
  if (!env.KEEP_ALIVE_URL) {
    logger.info("Keep-alive self ping disabled");
    return { stop: () => undefined };
  }

  const intervalMs = env.KEEP_ALIVE_INTERVAL_MINUTES * 60 * 1000;

  async function ping() {
    try {
      const response = await fetch(env.KEEP_ALIVE_URL as string, {
        method: "GET",
        headers: { "User-Agent": "the-wings-api-keep-alive/1.0" }
      });

      logger.info("Keep-alive self ping completed", {
        url: env.KEEP_ALIVE_URL,
        statusCode: response.status
      });
    } catch (error) {
      logger.warn("Keep-alive self ping failed", {
        url: env.KEEP_ALIVE_URL,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const timer = setInterval(() => {
    void ping();
  }, intervalMs);
  timer.unref?.();

  logger.info("Keep-alive self ping enabled", {
    url: env.KEEP_ALIVE_URL,
    intervalMinutes: env.KEEP_ALIVE_INTERVAL_MINUTES
  });

  return {
    stop() {
      clearInterval(timer);
    }
  };
}
