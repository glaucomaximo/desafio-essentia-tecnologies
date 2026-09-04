import { randomBytes } from "node:crypto";
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

const stringFromEnv = (name: string, fallback: string): string => {
  const raw = process.env[name];

  if (!raw || raw.trim().length === 0) {
    return fallback;
  }

  return raw;
};

const nodeEnv = process.env.NODE_ENV ?? "development";
const configuredJwtSecret = stringFromEnv("JWT_SECRET", "");

if (nodeEnv === "production" && !configuredJwtSecret) {
  throw new Error("Environment variable JWT_SECRET is required in production.");
}

if (configuredJwtSecret && configuredJwtSecret.length < 32) {
  throw new Error("Environment variable JWT_SECRET must have at least 32 characters.");
}

const jwtSecret = configuredJwtSecret || randomBytes(32).toString("hex");

export const env = {
  serviceName: process.env.SERVICE_NAME ?? "techx-tasks-api",
  version: process.env.APP_VERSION ?? process.env.npm_package_version ?? "2.1.1",
  nodeEnv,
  logLevel: process.env.LOG_LEVEL ?? "info",
  port: numberFromEnv("PORT", 3333),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:4200",
  jsonBodyLimit: process.env.JSON_BODY_LIMIT ?? "1mb",
  auth: {
    secret: jwtSecret,
    issuer: process.env.JWT_ISSUER ?? "techx-tasks-api",
    audience: process.env.JWT_AUDIENCE ?? "techx-tasks-web",
    expiresInSeconds: positiveNumberFromEnv("JWT_EXPIRES_IN_SECONDS", 3600)
  },
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
  },
  mongo: {
    uri:
      process.env.MONGO_URI ??
      "mongodb://techx_mongo:techx_mongo@127.0.0.1:27017/techx_tasks?authSource=admin",
    databaseName: process.env.MONGO_DB_NAME ?? "techx_tasks",
    taskMetadataCollection: process.env.MONGO_TASK_METADATA_COLLECTION ?? "task_metadata",
    serverSelectionTimeoutMs: positiveNumberFromEnv("MONGO_SERVER_SELECTION_TIMEOUT_MS", 5000)
  }
};
