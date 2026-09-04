-- TechX Tasks database schema
-- Author: Glauco Maximo <glaucomaximo@gmail.com>

CREATE DATABASE IF NOT EXISTS techx_tasks
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'techx'@'%' IDENTIFIED BY 'techx';
CREATE USER IF NOT EXISTS 'techx'@'localhost' IDENTIFIED BY 'techx';
GRANT ALL PRIVILEGES ON techx_tasks.* TO 'techx'@'%';
GRANT ALL PRIVILEGES ON techx_tasks.* TO 'techx'@'localhost';
FLUSH PRIVILEGES;

USE techx_tasks;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret VARCHAR(64) NULL,
  failed_login_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS token_sessions (
  token_id CHAR(36) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_id),
  INDEX idx_token_sessions_user_revoked (user_id, revoked_at),
  INDEX idx_token_sessions_expires_at (expires_at),
  CONSTRAINT fk_token_sessions_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_password_reset_tokens_hash (token_hash),
  INDEX idx_password_reset_tokens_user_active (user_id, consumed_at, expires_at),
  CONSTRAINT fk_password_reset_tokens_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
