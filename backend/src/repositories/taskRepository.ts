import type { ResultSetHeader } from "mysql2";
import { pool } from "../db/pool";
import type { CreateTaskPayload, Task, TaskRow, UpdateTaskPayload } from "../types/task";

export interface TaskRepository {
  listTasks(): Promise<Task[]>;
  findTaskById(id: number): Promise<Task | null>;
  createTask(payload: CreateTaskPayload): Promise<Task>;
  updateTask(id: number, payload: UpdateTaskPayload): Promise<Task | null>;
  deleteTask(id: number): Promise<boolean>;
}

const toIsoString = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
};

const mapTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  completed: Boolean(row.completed),
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at)
});

export const listTasks = async (): Promise<Task[]> => {
  const [rows] = await pool.query<TaskRow[]>(
    `SELECT id, title, description, completed, created_at, updated_at
     FROM tasks
     ORDER BY completed ASC, created_at DESC`
  );

  return rows.map(mapTask);
};

export const findTaskById = async (id: number): Promise<Task | null> => {
  const [rows] = await pool.query<TaskRow[]>(
    `SELECT id, title, description, completed, created_at, updated_at
     FROM tasks
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ? mapTask(rows[0]) : null;
};

export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO tasks (title, description, completed)
     VALUES (?, ?, ?)`,
    [payload.title, payload.description, payload.completed]
  );

  const task = await findTaskById(result.insertId);

  if (!task) {
    throw new Error("Nao foi possivel carregar a tarefa criada.");
  }

  return task;
};

export const updateTask = async (id: number, payload: UpdateTaskPayload): Promise<Task | null> => {
  const fields: string[] = [];
  const values: Array<string | boolean | null | number> = [];

  if (payload.title !== undefined) {
    fields.push("title = ?");
    values.push(payload.title);
  }

  if (payload.description !== undefined) {
    fields.push("description = ?");
    values.push(payload.description);
  }

  if (payload.completed !== undefined) {
    fields.push("completed = ?");
    values.push(payload.completed);
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE tasks
     SET ${fields.join(", ")}
     WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findTaskById(id);
};

export const deleteTask = async (id: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>("DELETE FROM tasks WHERE id = ?", [id]);

  return result.affectedRows > 0;
};

export const mysqlTaskRepository: TaskRepository = {
  listTasks,
  findTaskById,
  createTask,
  updateTask,
  deleteTask
};
