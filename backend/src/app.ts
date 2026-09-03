import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { pool } from "./db/pool";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { createRateLimiter, type RateLimitOptions } from "./middleware/rateLimiter";
import { requestContext, requestLogger } from "./middleware/requestContext";
import { type TaskRepository } from "./repositories/taskRepository";
import { createTaskRouter } from "./routes/taskRoutes";

export interface AppOptions {
  taskRepository?: TaskRepository;
  rateLimit?: RateLimitOptions;
  readinessCheck?: () => Promise<void>;
}

const serviceStatus = () => ({
  status: "ok",
  service: env.serviceName,
  version: env.version
});

const defaultReadinessCheck = async (): Promise<void> => {
  await pool.query("SELECT 1");
};

export const createApp = (options: AppOptions = {}): Express => {
  const app = express();
  const readinessCheck = options.readinessCheck ?? defaultReadinessCheck;

  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin
    })
  );
  app.use(express.json({ limit: env.jsonBodyLimit }));

  app.get("/liveness", (_request, response) => {
    response.json(serviceStatus());
  });

  app.get("/readiness", async (_request, response, next) => {
    try {
      await readinessCheck();
      response.json(serviceStatus());
    } catch (error) {
      next(error);
    }
  });

  app.get("/health", (_request, response) => {
    response.json(serviceStatus());
  });

  app.use("/api", createRateLimiter(options.rateLimit ?? env.rateLimit));
  app.use("/api/v1/tasks", createTaskRouter(options.taskRepository));
  app.use("/api/tasks", createTaskRouter(options.taskRepository));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
