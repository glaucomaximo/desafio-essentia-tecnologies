import type { RowDataPacket } from "mysql2";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  completed: number | boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateTaskPayload {
  title: string;
  description: string | null;
  completed: boolean;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  completed?: boolean;
}
