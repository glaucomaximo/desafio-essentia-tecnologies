import type { Server } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { runMigrations } from "./db/migrate";
import { closeMongo } from "./db/mongo";
import { closePool } from "./db/pool";
import { waitForDatabase } from "./db/waitForDatabase";
import { waitForMongoDatabase } from "./db/waitForMongoDatabase";
import { logger } from "./shared/logger";

let server: Server | undefined;

const bootstrap = async (): Promise<void> => {
  await waitForDatabase();
  await waitForMongoDatabase();
  await runMigrations();

  server = createApp().listen(env.port, () => {
    logger.info("api_started", {
      port: env.port
    });
  });
};

const shutdown = (signal: NodeJS.Signals): void => {
  logger.info("api_shutdown_started", { signal });

  const timeout = setTimeout(() => {
    logger.error("api_shutdown_forced", { signal });
    process.exit(1);
  }, 10000);

  timeout.unref();

  const closeDependenciesAndExit = async (): Promise<void> => {
    await Promise.all([closePool(), closeMongo()]);
    process.exit(0);
  };

  if (!server) {
    closeDependenciesAndExit().catch((error: unknown) => {
      logger.error("dependency_close_failed", { error });
      process.exit(1);
    });
    return;
  }

  server.close((error?: Error) => {
    if (error) {
      logger.error("http_server_close_failed", { error });
      process.exit(1);
    }

    closeDependenciesAndExit().catch((closeError: unknown) => {
      logger.error("dependency_close_failed", { error: closeError });
      process.exit(1);
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

bootstrap().catch((error: unknown) => {
  logger.error("api_start_failed", { error });
  process.exit(1);
});
