import assert from "node:assert/strict";
import test from "node:test";
import type { TaskMetadataRepository } from "../src/repositories/taskMetadataRepository";
import type { TaskRepository } from "../src/repositories/taskRepository";
import { defaultTaskMetadata } from "../src/schemas/taskPayload";
import { createTaskService } from "../src/services/taskService";
import type {
  CreateTaskRecordPayload,
  Task,
  TaskMetadata,
  UpdateTaskRecordPayload
} from "../src/types/task";

const fixedTimestamp = "2026-01-01T00:00:00.000Z";

class RecordingTaskRepository implements TaskRepository {
  readonly deletedTaskIds: number[] = [];

  async listTasks(): Promise<Task[]> {
    return [];
  }

  async findTaskById(): Promise<Task | null> {
    return null;
  }

  async createTask(ownerUserId: number, payload: CreateTaskRecordPayload): Promise<Task> {
    return {
      id: 99,
      title: payload.title,
      description: payload.description,
      completed: payload.completed,
      metadata: defaultTaskMetadata(),
      createdAt: fixedTimestamp,
      updatedAt: fixedTimestamp
    };
  }

  async updateTask(
    _id: number,
    _ownerUserId: number,
    _payload: UpdateTaskRecordPayload
  ): Promise<Task | null> {
    return null;
  }

  async deleteTask(id: number): Promise<boolean> {
    this.deletedTaskIds.push(id);
    return true;
  }
}

class FailingTaskMetadataRepository implements TaskMetadataRepository {
  async ensureIndexes(): Promise<void> {
    return undefined;
  }

  async listMetadata(): Promise<Map<number, TaskMetadata>> {
    return new Map();
  }

  async findMetadata(): Promise<TaskMetadata> {
    return defaultTaskMetadata();
  }

  async upsertMetadata(): Promise<TaskMetadata> {
    throw new Error("Falha simulada no MongoDB.");
  }

  async deleteMetadata(): Promise<void> {
    return undefined;
  }
}

test("createTask remove a tarefa principal quando metadados falham", async () => {
  const taskRepository = new RecordingTaskRepository();
  const taskService = createTaskService(taskRepository, new FailingTaskMetadataRepository());

  await assert.rejects(() =>
    taskService.createTask(1, {
      title: "Tarefa com falha de metadados",
      description: null,
      completed: false,
      metadata: defaultTaskMetadata()
    })
  );

  assert.deepEqual(taskRepository.deletedTaskIds, [99]);
});
