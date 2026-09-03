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
