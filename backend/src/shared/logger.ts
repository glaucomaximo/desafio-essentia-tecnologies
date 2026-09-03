import { env } from "../config/env";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const configuredLevel = (env.logLevel in levelPriority ? env.logLevel : "info") as LogLevel;

const sensitiveKeyPattern = /(password|secret|token|apiKey|authorization|cookie)/i;

const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as LogContext).map(([key, nestedValue]) => [
        key,
        sensitiveKeyPattern.test(key) ? "[REDACTED]" : redact(nestedValue)
      ])
    );
  }

  return value;
};

const write = (level: LogLevel, message: string, context: LogContext = {}): void => {
  if (levelPriority[level] < levelPriority[configuredLevel]) {
    return;
  }

  const safeContext = redact(context) as LogContext;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: env.serviceName,
    environment: env.nodeEnv,
    message,
    ...safeContext
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
};

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context)
};
