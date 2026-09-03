import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { createApp, type AppOptions } from "../src/app";
import type { TaskRepository } from "../src/repositories/taskRepository";
import type { CreateTaskPayload, Task, UpdateTaskPayload } from "../src/types/task";

const fixedTimestamp = "2026-01-01T00:00:00.000Z";

class InMemoryTaskRepository implements TaskRepository {
  private nextId = 2;

  private tasks: Task[] = [
    {
      id: 1,
      title: "Revisar backlog",
      description: "Priorizar tarefas",
      completed: false,
      createdAt: fixedTimestamp,
      updatedAt: fixedTimestamp
    }
  ];

  async listTasks(): Promise<Task[]> {
    return [...this.tasks];
  }

  async findTaskById(id: number): Promise<Task | null> {
    return this.tasks.find((task) => task.id === id) ?? null;
  }

  async createTask(payload: CreateTaskPayload): Promise<Task> {
    const task: Task = {
      id: this.nextId,
      title: payload.title,
      description: payload.description,
      completed: payload.completed,
      createdAt: fixedTimestamp,
      updatedAt: fixedTimestamp
    };

    this.nextId += 1;
    this.tasks.push(task);

    return task;
  }

  async updateTask(id: number, payload: UpdateTaskPayload): Promise<Task | null> {
    const index = this.tasks.findIndex((task) => task.id === id);

    if (index === -1) {
      return null;
    }

    const updatedTask = {
      ...this.tasks[index],
      ...payload,
      updatedAt: fixedTimestamp
    };

    this.tasks[index] = updatedTask;

    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const originalLength = this.tasks.length;
    this.tasks = this.tasks.filter((task) => task.id !== id);

    return this.tasks.length !== originalLength;
  }
}

const createTestApp = (options: Partial<AppOptions> = {}) =>
  createApp({
    taskRepository: new InMemoryTaskRepository(),
    readinessCheck: async () => undefined,
    rateLimit: {
      enabled: false,
      windowMs: 60_000,
      maxRequests: 100
    },
    ...options
  });

test("GET /liveness and GET /readiness expose service health", async () => {
  const app = createTestApp();

  await request(app).get("/liveness").expect(200);
  await request(app).get("/readiness").expect(200);
});

test("GET /api/v1/tasks lists tasks and echoes request id", async () => {
  const app = createTestApp();
  const response = await request(app)
    .get("/api/v1/tasks")
    .set("X-Request-ID", "characterization-test")
    .expect(200);

  assert.equal(response.headers["x-request-id"], "characterization-test");
  assert.equal(response.body[0].title, "Revisar backlog");
});

test("POST /api/v1/tasks creates normalized tasks", async () => {
  const app = createTestApp();
  const response = await request(app)
    .post("/api/v1/tasks")
    .send({
      title: "  Nova tarefa  ",
      description: "  Documentar API  "
    })
    .expect(201);

  assert.equal(response.body.id, 2);
  assert.equal(response.body.title, "Nova tarefa");
  assert.equal(response.body.description, "Documentar API");
  assert.equal(response.body.completed, false);
});

test("PATCH /api/tasks/:id preserves the legacy route", async () => {
  const app = createTestApp();
  const response = await request(app).patch("/api/tasks/1").send({ completed: true }).expect(200);

  assert.equal(response.body.completed, true);
});

test("invalid task ids return a client error with request id", async () => {
  const app = createTestApp();
  const response = await request(app)
    .get("/api/v1/tasks/not-a-number")
    .set("X-Request-ID", "invalid-id-test")
    .expect(400);

  assert.equal(response.body.requestId, "invalid-id-test");
  assert.match(response.body.message, /inteiro positivo/);
});

test("invalid JSON returns a client error instead of an internal error", async () => {
  const app = createTestApp();
  const response = await request(app)
    .post("/api/v1/tasks")
    .set("Content-Type", "application/json")
    .send("{")
    .expect(400);

  assert.equal(response.body.message, "Requisicao invalida.");
});

test("rate limiter returns HTTP 429 after the configured threshold", async () => {
  const app = createTestApp({
    rateLimit: {
      enabled: true,
      windowMs: 60_000,
      maxRequests: 1
    }
  });

  await request(app).get("/api/v1/tasks").expect(200);

  const response = await request(app).get("/api/v1/tasks").expect(429);

  assert.equal(response.body.message, "Muitas requisicoes. Tente novamente mais tarde.");
});
