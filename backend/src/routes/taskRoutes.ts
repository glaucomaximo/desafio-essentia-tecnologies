import { Router } from "express";
import { HttpError } from "../errors/httpError";
import { asyncHandler } from "../middleware/asyncHandler";
import { mysqlTaskRepository, type TaskRepository } from "../repositories/taskRepository";
import { parseCreateTaskPayload, parseUpdateTaskPayload } from "../schemas/taskPayload";

const taskIdFromParams = (rawId: unknown): number => {
  const id = typeof rawId === "string" ? Number(rawId) : Number.NaN;

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "O id da tarefa deve ser um numero inteiro positivo.");
  }

  return id;
};

export const createTaskRouter = (taskRepository: TaskRepository = mysqlTaskRepository): Router => {
  const taskRouter = Router();

  taskRouter.get(
    "/",
    asyncHandler(async (_request, response) => {
      response.json(await taskRepository.listTasks());
    })
  );

  taskRouter.get(
    "/:id",
    asyncHandler(async (request, response) => {
      const task = await taskRepository.findTaskById(taskIdFromParams(request.params.id));

      if (!task) {
        throw new HttpError(404, "Tarefa nao encontrada.");
      }

      response.json(task);
    })
  );

  taskRouter.post(
    "/",
    asyncHandler(async (request, response) => {
      const task = await taskRepository.createTask(parseCreateTaskPayload(request.body));

      response.status(201).json(task);
    })
  );

  taskRouter.put(
    "/:id",
    asyncHandler(async (request, response) => {
      const task = await taskRepository.updateTask(
        taskIdFromParams(request.params.id),
        parseUpdateTaskPayload(request.body)
      );

      if (!task) {
        throw new HttpError(404, "Tarefa nao encontrada.");
      }

      response.json(task);
    })
  );

  taskRouter.patch(
    "/:id",
    asyncHandler(async (request, response) => {
      const task = await taskRepository.updateTask(
        taskIdFromParams(request.params.id),
        parseUpdateTaskPayload(request.body)
      );

      if (!task) {
        throw new HttpError(404, "Tarefa nao encontrada.");
      }

      response.json(task);
    })
  );

  taskRouter.delete(
    "/:id",
    asyncHandler(async (request, response) => {
      const deleted = await taskRepository.deleteTask(taskIdFromParams(request.params.id));

      if (!deleted) {
        throw new HttpError(404, "Tarefa nao encontrada.");
      }

      response.status(204).send();
    })
  );

  return taskRouter;
};

export const taskRouter = createTaskRouter();
