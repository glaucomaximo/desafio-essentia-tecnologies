export type TaskPriority = "low" | "medium" | "high";

export interface TaskMetadata {
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  notes: string | null;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  metadata: TaskMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormPayload {
  title: string;
  description: string | null;
  completed?: boolean;
  metadata: TaskMetadata;
}

export type TaskFilter = "all" | "open" | "done";
