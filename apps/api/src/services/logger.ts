type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const configuredLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";
const activeLevel = levelPriority[configuredLevel] ? configuredLevel : "info";

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack
    };
  }

  return error;
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  if (levelPriority[level] < levelPriority[activeLevel]) return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: "the-wings-api",
    ...context,
    error: context.error ? normalizeError(context.error) : undefined
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context)
};

export function reportError(error: unknown, context: LogContext = {}) {
  logger.error("Unhandled application error", { ...context, error });
  const webhookUrl = process.env.ERROR_MONITOR_WEBHOOK_URL;
  if (!webhookUrl) return;

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service: "the-wings-api",
      timestamp: new Date().toISOString(),
      context,
      error: normalizeError(error)
    })
  }).catch((monitorError) => {
    logger.warn("Error monitor notification failed", { error: monitorError });
  });
}
