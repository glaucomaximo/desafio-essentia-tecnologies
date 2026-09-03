import { closePool, pool } from "./pool";
import { logger } from "../shared/logger";

const createTasksTable = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(180) NOT NULL,
    description TEXT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_tasks_completed_created_at (completed, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const runMigrations = async (): Promise<void> => {
  await pool.execute(createTasksTable);
  logger.info("database_migrations_completed");
};

if (require.main === module) {
  runMigrations()
    .then(async () => {
      await closePool();
    })
    .catch(async (error: unknown) => {
      logger.error("database_migrations_failed", { error });
      await closePool();
      process.exit(1);
    });
}
