import type { Collection, WithId } from "mongodb";
import { env } from "../config/env";
import { mongoDatabase } from "../db/mongo";
import { defaultTaskMetadata } from "../schemas/taskPayload";
import type { TaskMetadata } from "../types/task";

interface TaskMetadataDocument {
  taskId: number;
  ownerUserId: number;
  priority: TaskMetadata["priority"];
  dueDate: string | null;
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskMetadataRepository {
  ensureIndexes(): Promise<void>;
  listMetadata(taskIds: number[], ownerUserId: number): Promise<Map<number, TaskMetadata>>;
  findMetadata(taskId: number, ownerUserId: number): Promise<TaskMetadata>;
  upsertMetadata(
    taskId: number,
    ownerUserId: number,
    metadata: TaskMetadata
  ): Promise<TaskMetadata>;
  deleteMetadata(taskId: number, ownerUserId: number): Promise<void>;
}

const collection = (): Collection<TaskMetadataDocument> =>
  mongoDatabase.collection<TaskMetadataDocument>(env.mongo.taskMetadataCollection);

const mapDocument = (document: WithId<TaskMetadataDocument>): TaskMetadata => ({
  priority: document.priority,
  dueDate: document.dueDate,
  tags: document.tags,
  notes: document.notes
});

export const ensureTaskMetadataIndexes = async (): Promise<void> => {
  await collection().createIndexes([
    {
      key: { ownerUserId: 1, taskId: 1 },
      name: "ux_task_metadata_owner_task",
      unique: true
    },
    {
      key: { ownerUserId: 1, priority: 1 },
      name: "idx_task_metadata_owner_priority"
    }
  ]);
};

export const listMetadata = async (
  taskIds: number[],
  ownerUserId: number
): Promise<Map<number, TaskMetadata>> => {
  if (taskIds.length === 0) {
    return new Map();
  }

  const documents = await collection()
    .find({
      ownerUserId,
      taskId: { $in: taskIds }
    })
    .toArray();

  return new Map(documents.map((document) => [document.taskId, mapDocument(document)]));
};

export const findMetadata = async (taskId: number, ownerUserId: number): Promise<TaskMetadata> => {
  const document = await collection().findOne({
    ownerUserId,
    taskId
  });

  return document ? mapDocument(document) : defaultTaskMetadata();
};

export const upsertMetadata = async (
  taskId: number,
  ownerUserId: number,
  metadata: TaskMetadata
): Promise<TaskMetadata> => {
  const now = new Date();

  await collection().updateOne(
    { ownerUserId, taskId },
    {
      $set: {
        priority: metadata.priority,
        dueDate: metadata.dueDate,
        tags: metadata.tags,
        notes: metadata.notes,
        updatedAt: now
      },
      $setOnInsert: {
        ownerUserId,
        taskId,
        createdAt: now
      }
    },
    { upsert: true }
  );

  return metadata;
};

export const deleteMetadata = async (taskId: number, ownerUserId: number): Promise<void> => {
  await collection().deleteOne({
    ownerUserId,
    taskId
  });
};

export const mongoTaskMetadataRepository: TaskMetadataRepository = {
  ensureIndexes: ensureTaskMetadataIndexes,
  listMetadata,
  findMetadata,
  upsertMetadata,
  deleteMetadata
};
