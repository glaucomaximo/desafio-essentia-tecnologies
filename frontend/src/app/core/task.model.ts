export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormPayload {
  title: string;
  description: string | null;
  completed?: boolean;
}

export type TaskFilter = "all" | "open" | "done";
