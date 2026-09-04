import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { createJwtService, type JwtService } from "./auth/jwtService";
import { env } from "./config/env";
import { pingMongo } from "./db/mongo";
import { pool } from "./db/pool";
import { createAuthenticationMiddleware } from "./middleware/authentication";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { createRateLimiter, type RateLimitOptions } from "./middleware/rateLimiter";
import { requestContext, requestLogger } from "./middleware/requestContext";
import { metricsContentType, renderMetrics } from "./observability/metrics";
import {
  mongoTaskMetadataRepository,
  type TaskMetadataRepository
} from "./repositories/taskMetadataRepository";
import { type TaskRepository } from "./repositories/taskRepository";
import { mysqlUserRepository, type UserRepository } from "./repositories/userRepository";
import { createAuthRouter } from "./routes/authRoutes";
import { createTaskRouter } from "./routes/taskRoutes";
import { createAuthService, type AuthService } from "./services/authService";
import { createTaskService, type TaskService } from "./services/taskService";

export interface AppOptions {
  taskRepository?: TaskRepository;
  taskMetadataRepository?: TaskMetadataRepository;
  taskService?: TaskService;
  userRepository?: UserRepository;
  jwtService?: JwtService;
  authService?: AuthService;
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
  await pingMongo();
};

export const createApp = (options: AppOptions = {}): Express => {
  const app = express();
  const readinessCheck = options.readinessCheck ?? defaultReadinessCheck;
  const jwtService = options.jwtService ?? createJwtService(env.auth);
  const userRepository = options.userRepository ?? mysqlUserRepository;
  const taskRepository = options.taskRepository;
  const taskMetadataRepository = options.taskMetadataRepository ?? mongoTaskMetadataRepository;
  const authService = options.authService ?? createAuthService(userRepository, jwtService);
  const taskService =
    options.taskService ?? createTaskService(taskRepository, taskMetadataRepository);
  const authenticate = createAuthenticationMiddleware({
    jwtService,
    userRepository
  });

  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? false : env.corsOrigin
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

  app.get("/metrics", (_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.type(metricsContentType).send(renderMetrics());
  });

  app.use("/api", createRateLimiter(options.rateLimit ?? env.rateLimit));
  app.use("/api/v1/auth", createAuthRouter(authenticate, authService));
  app.use("/api/v1/tasks", authenticate, createTaskRouter(taskService));
  app.use("/api/tasks", authenticate, createTaskRouter(taskService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
