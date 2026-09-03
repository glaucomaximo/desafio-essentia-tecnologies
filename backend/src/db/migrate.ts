import type { RowDataPacket } from "mysql2";
import { closePool, pool } from "./pool";
import { closeMongo } from "./mongo";
import { mongoTaskMetadataRepository } from "../repositories/taskMetadataRepository";
import { logger } from "../shared/logger";

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE INDEX idx_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const createTasksTable = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(180) NOT NULL,
    description TEXT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    owner_user_id INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_tasks_completed_created_at (completed, created_at),
    INDEX idx_tasks_owner_status_created_at (owner_user_id, completed, created_at),
    CONSTRAINT fk_tasks_owner_user
      FOREIGN KEY (owner_user_id)
      REFERENCES users (id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  return rows.length > 0;
};

const indexExists = async (tableName: string, indexName: string): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?
     LIMIT 1`,
    [tableName, indexName]
  );

  return rows.length > 0;
};

const constraintExists = async (tableName: string, constraintName: string): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ?
     LIMIT 1`,
    [tableName, constraintName]
  );

  return rows.length > 0;
};

const ensureTasksOwnership = async (): Promise<void> => {
  if (!(await columnExists("tasks", "owner_user_id"))) {
    await pool.execute(
      "ALTER TABLE tasks ADD COLUMN owner_user_id INT UNSIGNED NULL AFTER completed"
    );
  }

  if (!(await indexExists("tasks", "idx_tasks_owner_status_created_at"))) {
    await pool.execute(
      "CREATE INDEX idx_tasks_owner_status_created_at ON tasks (owner_user_id, completed, created_at)"
    );
  }

  if (!(await constraintExists("tasks", "fk_tasks_owner_user"))) {
    await pool.execute(
      `ALTER TABLE tasks
       ADD CONSTRAINT fk_tasks_owner_user
       FOREIGN KEY (owner_user_id)
       REFERENCES users (id)
       ON DELETE CASCADE`
    );
  }
};

export const runMigrations = async (): Promise<void> => {
  await pool.execute(createUsersTable);
  await pool.execute(createTasksTable);
  await ensureTasksOwnership();
  await mongoTaskMetadataRepository.ensureIndexes();
  logger.info("database_migrations_completed");
};

if (require.main === module) {
  runMigrations()
    .then(async () => {
      await Promise.all([closePool(), closeMongo()]);
    })
    .catch(async (error: unknown) => {
      logger.error("database_migrations_failed", { error });
      await Promise.all([closePool(), closeMongo()]);
      process.exit(1);
    });
}
