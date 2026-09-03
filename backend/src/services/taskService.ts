import {
  mongoTaskMetadataRepository,
  type TaskMetadataRepository
} from "../repositories/taskMetadataRepository";
import { mysqlTaskRepository, type TaskRepository } from "../repositories/taskRepository";
import { defaultTaskMetadata } from "../schemas/taskPayload";
import { logger } from "../shared/logger";
import type {
  CreateTaskPayload,
  Task,
  UpdateTaskPayload,
  UpdateTaskRecordPayload
} from "../types/task";

export interface TaskService {
  listTasks(ownerUserId: number): Promise<Task[]>;
  findTaskById(id: number, ownerUserId: number): Promise<Task | null>;
  createTask(ownerUserId: number, payload: CreateTaskPayload): Promise<Task>;
  updateTask(id: number, ownerUserId: number, payload: UpdateTaskPayload): Promise<Task | null>;
  deleteTask(id: number, ownerUserId: number): Promise<boolean>;
}

const mergeMetadata = (task: Task, metadata = defaultTaskMetadata()): Task => ({
  ...task,
  metadata
});

const recordPayloadFromUpdate = (payload: UpdateTaskPayload): UpdateTaskRecordPayload => {
  const recordPayload: UpdateTaskRecordPayload = {};

  if (payload.title !== undefined) {
    recordPayload.title = payload.title;
  }

  if (payload.description !== undefined) {
    recordPayload.description = payload.description;
  }

  if (payload.completed !== undefined) {
    recordPayload.completed = payload.completed;
  }

  return recordPayload;
};

export const createTaskService = (
  taskRepository: TaskRepository = mysqlTaskRepository,
  taskMetadataRepository: TaskMetadataRepository = mongoTaskMetadataRepository
): TaskService => ({
  async listTasks(ownerUserId) {
    const tasks = await taskRepository.listTasks(ownerUserId);
    const metadataByTask = await taskMetadataRepository.listMetadata(
      tasks.map((task) => task.id),
      ownerUserId
    );

    return tasks.map((task) => mergeMetadata(task, metadataByTask.get(task.id)));
  },

  async findTaskById(id, ownerUserId) {
    const task = await taskRepository.findTaskById(id, ownerUserId);

    if (!task) {
      return null;
    }

    return mergeMetadata(task, await taskMetadataRepository.findMetadata(id, ownerUserId));
  },

  async createTask(ownerUserId, payload) {
    const task = await taskRepository.createTask(ownerUserId, payload);

    try {
      const metadata = await taskMetadataRepository.upsertMetadata(
        task.id,
        ownerUserId,
        payload.metadata
      );

      return mergeMetadata(task, metadata);
    } catch (error) {
      await taskRepository.deleteTask(task.id, ownerUserId).catch((deleteError: unknown) => {
        logger.error("task_compensation_delete_failed", {
          taskId: task.id,
          ownerUserId,
          error: deleteError
        });
      });

      throw error;
    }
  },

  async updateTask(id, ownerUserId, payload) {
    const recordPayload = recordPayloadFromUpdate(payload);
    const task =
      Object.keys(recordPayload).length > 0
        ? await taskRepository.updateTask(id, ownerUserId, recordPayload)
        : await taskRepository.findTaskById(id, ownerUserId);

    if (!task) {
      return null;
    }

    const metadata =
      payload.metadata !== undefined
        ? await taskMetadataRepository.upsertMetadata(id, ownerUserId, payload.metadata)
        : await taskMetadataRepository.findMetadata(id, ownerUserId);

    return mergeMetadata(task, metadata);
  },

  async deleteTask(id, ownerUserId) {
    const deleted = await taskRepository.deleteTask(id, ownerUserId);

    if (deleted) {
      await taskMetadataRepository.deleteMetadata(id, ownerUserId);
    }

    return deleted;
  }
});

export const taskService = createTaskService();
