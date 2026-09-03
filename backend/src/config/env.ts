import dotenv from "dotenv";

dotenv.config();

const numberFromEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return parsed;
};

const booleanFromEnv = (name: string, fallback: boolean): boolean => {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  if (["1", "true", "yes", "on"].includes(raw.toLowerCase())) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(raw.toLowerCase())) {
    return false;
  }

  throw new Error(`Environment variable ${name} must be boolean-like.`);
};

const positiveNumberFromEnv = (name: string, fallback: number): number => {
  const parsed = numberFromEnv(name, fallback);

  if (parsed <= 0) {
    throw new Error(`Environment variable ${name} must be positive.`);
  }

  return parsed;
};

export const env = {
  serviceName: process.env.SERVICE_NAME ?? "techx-tasks-api",
  version: process.env.APP_VERSION ?? process.env.npm_package_version ?? "1.1.2",
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL ?? "info",
  port: numberFromEnv("PORT", 3333),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:4200",
  jsonBodyLimit: process.env.JSON_BODY_LIMIT ?? "1mb",
  rateLimit: {
    enabled: booleanFromEnv("RATE_LIMIT_ENABLED", true),
    windowMs: positiveNumberFromEnv("RATE_LIMIT_WINDOW_MS", 900000),
    maxRequests: positiveNumberFromEnv("RATE_LIMIT_MAX_REQUESTS", 100)
  },
  database: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: numberFromEnv("DB_PORT", 3306),
    user: process.env.DB_USER ?? "techx",
    password: process.env.DB_PASSWORD ?? "techx",
    name: process.env.DB_NAME ?? "techx_tasks"
  }
};
