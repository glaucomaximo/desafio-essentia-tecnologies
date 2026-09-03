import type { RowDataPacket } from "mysql2";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  metadata: TaskMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  completed: number | boolean;
  owner_user_id: number | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export type TaskPriority = "low" | "medium" | "high";

export interface TaskMetadata {
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  notes: string | null;
}

export interface CreateTaskPayload {
  title: string;
  description: string | null;
  completed: boolean;
  metadata: TaskMetadata;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  completed?: boolean;
  metadata?: TaskMetadata;
}

export type CreateTaskRecordPayload = Pick<
  CreateTaskPayload,
  "title" | "description" | "completed"
>;
export type UpdateTaskRecordPayload = Pick<
  UpdateTaskPayload,
  "title" | "description" | "completed"
>;
