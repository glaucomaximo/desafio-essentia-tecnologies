import { Router } from "express";
import { HttpError } from "../errors/httpError";
import { asyncHandler } from "../middleware/asyncHandler";
import { currentUserFromResponse } from "../middleware/authentication";
import { parseCreateTaskPayload, parseUpdateTaskPayload } from "../schemas/taskPayload";
import { taskService, type TaskService } from "../services/taskService";

const taskIdFromParams = (rawId: unknown): number => {
  const id = typeof rawId === "string" ? Number(rawId) : Number.NaN;

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "O id da tarefa deve ser um numero inteiro positivo.");
  }

  return id;
};

export const createTaskRouter = (service: TaskService = taskService): Router => {
  const taskRouter = Router();

  taskRouter.get(
    "/",
    asyncHandler(async (_request, response) => {
      const user = currentUserFromResponse(response.locals);

      response.json(await service.listTasks(user.id));
    })
  );

  taskRouter.get(
    "/:id",
    asyncHandler(async (request, response) => {
      const user = currentUserFromResponse(response.locals);
      const task = await service.findTaskById(taskIdFromParams(request.params.id), user.id);

      if (!task) {
        throw new HttpError(404, "Tarefa nao encontrada.");
      }

      response.json(task);
    })
  );

  taskRouter.post(
    "/",
    asyncHandler(async (request, response) => {
      const user = currentUserFromResponse(response.locals);
      const task = await service.createTask(user.id, parseCreateTaskPayload(request.body));

      response.status(201).json(task);
    })
  );

  taskRouter.put(
    "/:id",
    asyncHandler(async (request, response) => {
      const user = currentUserFromResponse(response.locals);
      const task = await service.updateTask(
        taskIdFromParams(request.params.id),
        user.id,
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
      const user = currentUserFromResponse(response.locals);
      const task = await service.updateTask(
        taskIdFromParams(request.params.id),
        user.id,
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
      const user = currentUserFromResponse(response.locals);
      const deleted = await service.deleteTask(taskIdFromParams(request.params.id), user.id);

      if (!deleted) {
        throw new HttpError(404, "Tarefa nao encontrada.");
      }

      response.status(204).send();
    })
  );

  return taskRouter;
};

export const taskRouter = createTaskRouter();
