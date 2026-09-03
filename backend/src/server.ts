import type { Server } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { runMigrations } from "./db/migrate";
import { closePool } from "./db/pool";
import { waitForDatabase } from "./db/waitForDatabase";
import { logger } from "./shared/logger";

let server: Server | undefined;

const bootstrap = async (): Promise<void> => {
  await waitForDatabase();
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

  const closeDatabaseAndExit = async (): Promise<void> => {
    await closePool();
    process.exit(0);
  };

  if (!server) {
    closeDatabaseAndExit().catch((error: unknown) => {
      logger.error("database_pool_close_failed", { error });
      process.exit(1);
    });
    return;
  }

  server.close((error?: Error) => {
    if (error) {
      logger.error("http_server_close_failed", { error });
      process.exit(1);
    }

    closeDatabaseAndExit().catch((closeError: unknown) => {
      logger.error("database_pool_close_failed", { error: closeError });
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
