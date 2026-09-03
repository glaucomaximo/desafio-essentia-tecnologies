import { HttpError } from "../errors/httpError";
import type { CreateTaskPayload, UpdateTaskPayload } from "../types/task";

type RequestBody = Record<string, unknown>;

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

export const parseCreateTaskPayload = (payload: unknown): CreateTaskPayload => {
  const body = asRequestBody(payload);

  return {
    title: parseTitle(body.title, true) as string,
    description: parseDescription(body.description) ?? null,
    completed: parseCompleted(body.completed) ?? false
  };
};

export const parseUpdateTaskPayload = (payload: unknown): UpdateTaskPayload => {
  const body = asRequestBody(payload);
  const update: UpdateTaskPayload = {};
  const title = parseTitle(body.title, false);
  const description = parseDescription(body.description);
  const completed = parseCompleted(body.completed);

  if (title !== undefined) {
    update.title = title;
  }

  if (description !== undefined) {
    update.description = description;
  }

  if (completed !== undefined) {
    update.completed = completed;
  }

  if (Object.keys(update).length === 0) {
    throw new HttpError(400, "Informe ao menos um campo para atualizar.");
  }

  return update;
};
