import { HttpError } from "../errors/httpError";
import type {
  CreateTaskPayload,
  TaskMetadata,
  TaskPriority,
  UpdateTaskPayload
} from "../types/task";

type RequestBody = Record<string, unknown>;
type MetadataBody = Record<string, unknown>;

const allowedPriorities = new Set<TaskPriority>(["low", "medium", "high"]);

export const defaultTaskMetadata = (): TaskMetadata => ({
  priority: "medium",
  dueDate: null,
  tags: [],
  notes: null
});

const asRequestBody = (payload: unknown): RequestBody => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpError(400, "O corpo da requisicao deve ser um objeto JSON.");
  }

  return payload as RequestBody;
};

const parseTitle = (value: unknown, required: boolean): string | undefined => {
  if (value === undefined) {
    if (required) {
      throw new HttpError(400, "O titulo da tarefa e obrigatorio.");
    }

    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "O titulo da tarefa deve ser um texto.");
  }

  const title = value.trim();

  if (!title) {
    throw new HttpError(400, "O titulo da tarefa nao pode ficar vazio.");
  }

  if (title.length > 180) {
    throw new HttpError(400, "O titulo da tarefa deve ter no maximo 180 caracteres.");
  }

  return title;
};

const parseDescription = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "A descricao da tarefa deve ser um texto.");
  }

  const description = value.trim();

  return description.length > 0 ? description : null;
};

const parseCompleted = (value: unknown): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new HttpError(400, "O status de conclusao deve ser verdadeiro ou falso.");
  }

  return value;
};

const parsePriority = (value: unknown): TaskPriority => {
  if (value === undefined || value === null || value === "") {
    return "medium";
  }

  if (typeof value !== "string" || !allowedPriorities.has(value as TaskPriority)) {
    throw new HttpError(400, "A prioridade deve ser low, medium ou high.");
  }

  return value as TaskPriority;
};

const parseDueDate = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, "O prazo deve usar o formato YYYY-MM-DD.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  const normalized = date.toISOString().slice(0, 10);

  if (Number.isNaN(date.getTime()) || normalized !== value) {
    throw new HttpError(400, "O prazo informado nao e uma data valida.");
  }

  return value;
};

const parseTags = (value: unknown): string[] => {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, "As etiquetas devem ser uma lista de textos.");
  }

  if (value.length > 10) {
    throw new HttpError(400, "Informe no maximo 10 etiquetas.");
  }

  const tags = value.map((tag) => {
    if (typeof tag !== "string") {
      throw new HttpError(400, "Cada etiqueta deve ser um texto.");
    }

    const normalizedTag = tag.trim();

    if (!normalizedTag) {
      throw new HttpError(400, "Etiquetas vazias nao sao permitidas.");
    }

    if (normalizedTag.length > 40) {
      throw new HttpError(400, "Cada etiqueta deve ter no maximo 40 caracteres.");
    }

    return normalizedTag;
  });

  return [...new Set(tags)];
};

const parseNotes = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "As observacoes devem ser um texto.");
  }

  const notes = value.trim();

  if (notes.length > 1000) {
    throw new HttpError(400, "As observacoes devem ter no maximo 1000 caracteres.");
  }

  return notes.length > 0 ? notes : null;
};

const asMetadataBody = (payload: unknown): MetadataBody => {
  if (payload === undefined || payload === null) {
    return {};
  }

  if (typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpError(400, "Os metadados da tarefa devem ser um objeto JSON.");
  }

  return payload as MetadataBody;
};

const parseMetadata = (value: unknown, required: boolean): TaskMetadata | undefined => {
  if (value === undefined && !required) {
    return undefined;
  }

  const body = asMetadataBody(value);

  return {
    priority: parsePriority(body.priority),
    dueDate: parseDueDate(body.dueDate),
    tags: parseTags(body.tags),
    notes: parseNotes(body.notes)
  };
};

export const parseCreateTaskPayload = (payload: unknown): CreateTaskPayload => {
  const body = asRequestBody(payload);

  return {
    title: parseTitle(body.title, true) as string,
    description: parseDescription(body.description) ?? null,
    completed: parseCompleted(body.completed) ?? false,
    metadata: parseMetadata(body.metadata, true) as TaskMetadata
  };
};

export const parseUpdateTaskPayload = (payload: unknown): UpdateTaskPayload => {
  const body = asRequestBody(payload);
  const update: UpdateTaskPayload = {};
  const title = parseTitle(body.title, false);
  const description = parseDescription(body.description);
  const completed = parseCompleted(body.completed);
  const metadata = parseMetadata(body.metadata, false);

  if (title !== undefined) {
    update.title = title;
  }

  if (description !== undefined) {
    update.description = description;
  }

  if (completed !== undefined) {
    update.completed = completed;
  }

  if (metadata !== undefined) {
    update.metadata = metadata;
  }

  if (Object.keys(update).length === 0) {
    throw new HttpError(400, "Informe ao menos um campo para atualizar.");
  }

  return update;
};
