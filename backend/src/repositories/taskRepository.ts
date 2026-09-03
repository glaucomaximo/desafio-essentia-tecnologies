import type { ResultSetHeader } from "mysql2";
import { pool } from "../db/pool";
import type {
  CreateTaskRecordPayload,
  Task,
  TaskRow,
  UpdateTaskRecordPayload
} from "../types/task";

export interface TaskRepository {
  listTasks(ownerUserId: number): Promise<Task[]>;
  findTaskById(id: number, ownerUserId: number): Promise<Task | null>;
  createTask(ownerUserId: number, payload: CreateTaskRecordPayload): Promise<Task>;
  updateTask(
    id: number,
    ownerUserId: number,
    payload: UpdateTaskRecordPayload
  ): Promise<Task | null>;
  deleteTask(id: number, ownerUserId: number): Promise<boolean>;
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
  metadata: {
    priority: "medium",
    dueDate: null,
    tags: [],
    notes: null
  },
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at)
});

export const listTasks = async (ownerUserId: number): Promise<Task[]> => {
  const [rows] = await pool.query<TaskRow[]>(
    `SELECT id, title, description, completed, owner_user_id, created_at, updated_at
     FROM tasks
     WHERE owner_user_id = ?
     ORDER BY completed ASC, created_at DESC`,
    [ownerUserId]
  );

  return rows.map(mapTask);
};

export const findTaskById = async (id: number, ownerUserId: number): Promise<Task | null> => {
  const [rows] = await pool.query<TaskRow[]>(
    `SELECT id, title, description, completed, owner_user_id, created_at, updated_at
     FROM tasks
     WHERE id = ?
       AND owner_user_id = ?
     LIMIT 1`,
    [id, ownerUserId]
  );

  return rows[0] ? mapTask(rows[0]) : null;
};

export const createTask = async (
  ownerUserId: number,
  payload: CreateTaskRecordPayload
): Promise<Task> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO tasks (title, description, completed, owner_user_id)
     VALUES (?, ?, ?, ?)`,
    [payload.title, payload.description, payload.completed, ownerUserId]
  );

  const task = await findTaskById(result.insertId, ownerUserId);

  if (!task) {
    throw new Error("Nao foi possivel carregar a tarefa criada.");
  }

  return task;
};

export const updateTask = async (
  id: number,
  ownerUserId: number,
  payload: UpdateTaskRecordPayload
): Promise<Task | null> => {
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
  values.push(id, ownerUserId);

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE tasks
     SET ${fields.join(", ")}
     WHERE id = ?
       AND owner_user_id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findTaskById(id, ownerUserId);
};

export const deleteTask = async (id: number, ownerUserId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM tasks
     WHERE id = ?
       AND owner_user_id = ?`,
    [id, ownerUserId]
  );

  return result.affectedRows > 0;
};

export const mysqlTaskRepository: TaskRepository = {
  listTasks,
  findTaskById,
  createTask,
  updateTask,
  deleteTask
};
