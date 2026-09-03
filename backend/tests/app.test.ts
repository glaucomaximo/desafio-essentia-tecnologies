import assert from "node:assert/strict";
import test from "node:test";
import type { Express } from "express";
import request from "supertest";
import { createJwtService } from "../src/auth/jwtService";
import { HttpError } from "../src/errors/httpError";
import { createApp, type AppOptions } from "../src/app";
import type { TaskMetadataRepository } from "../src/repositories/taskMetadataRepository";
import type { TaskRepository } from "../src/repositories/taskRepository";
import type { CreateUserRecordPayload, UserRepository } from "../src/repositories/userRepository";
import { defaultTaskMetadata } from "../src/schemas/taskPayload";
import type { AuthenticatedUser, UserWithPassword } from "../src/types/auth";
import type {
  CreateTaskRecordPayload,
  Task,
  TaskMetadata,
  UpdateTaskRecordPayload
} from "../src/types/task";

const fixedTimestamp = "2026-01-01T00:00:00.000Z";
const jwtService = createJwtService({
  secret: "segredo-de-teste-com-tamanho-minimo-adequado",
  issuer: "suite-backend",
  audience: "suite-frontend",
  expiresInSeconds: 3600
});

type StoredTask = Task & {
  ownerUserId: number;
};

class InMemoryTaskRepository implements TaskRepository {
  private nextId = 2;

  private tasks: StoredTask[] = [
    {
      id: 1,
      ownerUserId: 1,
      title: "Revisar backlog",
      description: "Priorizar tarefas",
      completed: false,
      metadata: defaultTaskMetadata(),
      createdAt: fixedTimestamp,
      updatedAt: fixedTimestamp
    }
  ];

  async listTasks(ownerUserId: number): Promise<Task[]> {
    return this.tasks.filter((task) => task.ownerUserId === ownerUserId);
  }

  async findTaskById(id: number, ownerUserId: number): Promise<Task | null> {
    return this.tasks.find((task) => task.id === id && task.ownerUserId === ownerUserId) ?? null;
  }

  async createTask(ownerUserId: number, payload: CreateTaskRecordPayload): Promise<Task> {
    const task: StoredTask = {
      id: this.nextId,
      ownerUserId,
      title: payload.title,
      description: payload.description,
      completed: payload.completed,
      metadata: defaultTaskMetadata(),
      createdAt: fixedTimestamp,
      updatedAt: fixedTimestamp
    };

    this.nextId += 1;
    this.tasks.push(task);

    return task;
  }

  async updateTask(
    id: number,
    ownerUserId: number,
    payload: UpdateTaskRecordPayload
  ): Promise<Task | null> {
    const index = this.tasks.findIndex(
      (task) => task.id === id && task.ownerUserId === ownerUserId
    );

    if (index === -1) {
      return null;
    }

    const updatedTask: StoredTask = {
      ...this.tasks[index],
      ...payload,
      updatedAt: fixedTimestamp
    };

    this.tasks[index] = updatedTask;

    return updatedTask;
  }

  async deleteTask(id: number, ownerUserId: number): Promise<boolean> {
    const originalLength = this.tasks.length;
    this.tasks = this.tasks.filter((task) => task.id !== id || task.ownerUserId !== ownerUserId);

    return this.tasks.length !== originalLength;
  }
}

class InMemoryTaskMetadataRepository implements TaskMetadataRepository {
  private readonly metadataByTask = new Map<string, TaskMetadata>();

  async ensureIndexes(): Promise<void> {
    return undefined;
  }

  async listMetadata(taskIds: number[], ownerUserId: number): Promise<Map<number, TaskMetadata>> {
    return new Map(
      taskIds.map((taskId) => [
        taskId,
        this.metadataByTask.get(this.key(taskId, ownerUserId)) ?? defaultTaskMetadata()
      ])
    );
  }

  async findMetadata(taskId: number, ownerUserId: number): Promise<TaskMetadata> {
    return this.metadataByTask.get(this.key(taskId, ownerUserId)) ?? defaultTaskMetadata();
  }

  async upsertMetadata(
    taskId: number,
    ownerUserId: number,
    metadata: TaskMetadata
  ): Promise<TaskMetadata> {
    this.metadataByTask.set(this.key(taskId, ownerUserId), metadata);

    return metadata;
  }

  async deleteMetadata(taskId: number, ownerUserId: number): Promise<void> {
    this.metadataByTask.delete(this.key(taskId, ownerUserId));
  }

  private key(taskId: number, ownerUserId: number): string {
    return `${ownerUserId}:${taskId}`;
  }
}

class InMemoryUserRepository implements UserRepository {
  private nextId = 1;
  private readonly users = new Map<number, UserWithPassword>();

  async createUser(payload: CreateUserRecordPayload): Promise<AuthenticatedUser> {
    if (await this.findUserByEmail(payload.email)) {
      throw new HttpError(409, "E-mail ja cadastrado.");
    }

    const user: UserWithPassword = {
      id: this.nextId,
      name: payload.name,
      email: payload.email,
      passwordHash: payload.passwordHash,
      createdAt: fixedTimestamp,
      updatedAt: fixedTimestamp
    };

    this.nextId += 1;
    this.users.set(user.id, user);

    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }

  async findUserByEmail(email: string): Promise<UserWithPassword | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async findUserById(id: number): Promise<AuthenticatedUser | null> {
    const user = this.users.get(id);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }
}

const createTestApp = (options: Partial<AppOptions> = {}) =>
  createApp({
    taskRepository: new InMemoryTaskRepository(),
    taskMetadataRepository: new InMemoryTaskMetadataRepository(),
    userRepository: new InMemoryUserRepository(),
    jwtService,
    readinessCheck: async () => undefined,
    rateLimit: {
      enabled: false,
      windowMs: 60_000,
      maxRequests: 100
    },
    ...options
  });

const registerAndToken = async (
  app: Express,
  email = "glauco.maximo@example.test"
): Promise<string> => {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Glauco Maximo",
      email,
      password: "Senha1234"
    })
    .expect(201);

  assert.equal(response.body.user.name, "Glauco Maximo");

  return response.body.token as string;
};

test("GET /liveness and GET /readiness expose service health", async () => {
  const app = createTestApp();

  await request(app).get("/liveness").expect(200);
  await request(app).get("/readiness").expect(200);
});

test("POST /api/v1/auth/register, POST /login and GET /me manage authenticated sessions", async () => {
  const app = createTestApp();
  const token = await registerAndToken(app);

  const loginResponse = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "glauco.maximo@example.test",
      password: "Senha1234"
    })
    .expect(200);

  assert.equal(loginResponse.body.user.email, "glauco.maximo@example.test");
  assert.equal(typeof loginResponse.body.token, "string");

  const meResponse = await request(app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(meResponse.body.user.name, "Glauco Maximo");
});

test("GET /api/v1/tasks requires a Bearer token", async () => {
  const app = createTestApp();
  const response = await request(app).get("/api/v1/tasks").expect(401);

  assert.equal(response.body.message, "Token de autenticacao ausente.");
});

test("GET /api/v1/tasks lists tasks owned by the authenticated user", async () => {
  const app = createTestApp();
  const token = await registerAndToken(app);
  const response = await request(app)
    .get("/api/v1/tasks")
    .set("Authorization", `Bearer ${token}`)
    .set("X-Request-ID", "characterization-test")
    .expect(200);

  assert.equal(response.headers["x-request-id"], "characterization-test");
  assert.equal(response.body[0].title, "Revisar backlog");
  assert.deepEqual(response.body[0].metadata, defaultTaskMetadata());
});

test("tasks are isolated by owner", async () => {
  const app = createTestApp();
  await registerAndToken(app, "primeiro.usuario@example.test");
  const secondToken = await registerAndToken(app, "segundo.usuario@example.test");
  const response = await request(app)
    .get("/api/v1/tasks")
    .set("Authorization", `Bearer ${secondToken}`)
    .expect(200);

  assert.deepEqual(response.body, []);
});

test("POST /api/v1/tasks creates normalized tasks with metadata", async () => {
  const app = createTestApp();
  const token = await registerAndToken(app);
  const response = await request(app)
    .post("/api/v1/tasks")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "  Nova tarefa  ",
      description: "  Documentar API  ",
      metadata: {
        priority: "high",
        dueDate: "2026-09-10",
        tags: [" api ", "documentacao"],
        notes: "Registrar contrato HTTP"
      }
    })
    .expect(201);

  assert.equal(response.body.id, 2);
  assert.equal(response.body.title, "Nova tarefa");
  assert.equal(response.body.description, "Documentar API");
  assert.equal(response.body.completed, false);
  assert.deepEqual(response.body.metadata, {
    priority: "high",
    dueDate: "2026-09-10",
    tags: ["api", "documentacao"],
    notes: "Registrar contrato HTTP"
  });
});

test("PATCH /api/tasks/:id preserves the legacy route with authentication", async () => {
  const app = createTestApp();
  const token = await registerAndToken(app);
  const response = await request(app)
    .patch("/api/tasks/1")
    .set("Authorization", `Bearer ${token}`)
    .send({ completed: true })
    .expect(200);

  assert.equal(response.body.completed, true);
});

test("PATCH /api/v1/tasks/:id can update metadata only", async () => {
  const app = createTestApp();
  const token = await registerAndToken(app);
  const response = await request(app)
    .patch("/api/v1/tasks/1")
    .set("Authorization", `Bearer ${token}`)
    .send({
      metadata: {
        priority: "low",
        tags: ["suporte"],
        notes: "Atualizacao apenas documental"
      }
    })
    .expect(200);

  assert.equal(response.body.title, "Revisar backlog");
  assert.deepEqual(response.body.metadata, {
    priority: "low",
    dueDate: null,
    tags: ["suporte"],
    notes: "Atualizacao apenas documental"
  });
});

test("invalid task ids return a client error with request id", async () => {
  const app = createTestApp();
  const token = await registerAndToken(app);
  const response = await request(app)
    .get("/api/v1/tasks/not-a-number")
    .set("Authorization", `Bearer ${token}`)
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

  await request(app).get("/api/v1/tasks").expect(401);

  const response = await request(app).get("/api/v1/tasks").expect(429);

  assert.equal(response.body.message, "Muitas requisicoes. Tente novamente mais tarde.");
});
