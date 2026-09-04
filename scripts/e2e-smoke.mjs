#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const expectedVersion = process.env.E2E_EXPECTED_VERSION ?? packageJson.version;

const baseUrl = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:4200").replace(/\/$/, "");
const apiUrl = `${baseUrl}/api/v1`;
const directApiUrl = (process.env.E2E_DIRECT_API_URL ?? "http://127.0.0.1:3333").replace(/\/$/, "");
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS ?? "10000");

const request = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(options.headers ?? {})
      }
    });
  } finally {
    clearTimeout(timeout);
  }
};

const bodyAsJson = async (response) => {
  const text = await response.text();

  return text ? JSON.parse(text) : null;
};

const expectStatus = async (description, response, expectedStatus) => {
  assert.equal(
    response.status,
    expectedStatus,
    `${description}: esperado HTTP ${expectedStatus}, recebido HTTP ${response.status}`
  );
};

const postJson = async (path, payload, headers = {}) => {
  const response = await request(`${apiUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  return {
    response,
    body: await bodyAsJson(response)
  };
};

const main = async () => {
  const home = await request(`${baseUrl}/`);
  await expectStatus("frontend", home, 200);

  const html = await home.text();
  assert.match(html, /<title>Tarefas<\/title>/);
  assert.doesNotMatch(html, /Gestão segura de tarefas|TechX Tasks|Autor/);

  const frontendHealth = await request(`${baseUrl}/health`);
  await expectStatus("saude do frontend", frontendHealth, 200);
  assert.equal((await frontendHealth.text()).trim(), "ok");

  const apiHealth = await request(`${directApiUrl}/liveness`);
  await expectStatus("vivacidade da API", apiHealth, 200);
  assert.equal((await bodyAsJson(apiHealth)).version, expectedVersion);

  const suffix = Date.now();
  const email = `e2e.${suffix}@example.test`;
  const senhaTeste = "SenhaTeste123";

  const registration = await postJson("/auth/register", {
    name: "Usuario E2E",
    email,
    password: senhaTeste
  });
  await expectStatus("cadastro", registration.response, 201);
  assert.equal(registration.body.user.email, email);
  assert.equal(typeof registration.body.token, "string");

  const duplicatedRegistration = await postJson("/auth/register", {
    name: "Usuario E2E",
    email,
    password: senhaTeste
  });
  await expectStatus("cadastro duplicado", duplicatedRegistration.response, 409);

  const login = await postJson("/auth/login", { email, password: senhaTeste });
  await expectStatus("login", login.response, 200);
  assert.equal(typeof login.body.token, "string");

  const authHeaders = {
    authorization: `Bearer ${login.body.token}`
  };
  const createdTask = await postJson(
    "/tasks",
    {
      title: "Teste E2E Docker",
      description: "Fluxo completo via proxy do frontend",
      metadata: {
        priority: "high",
        dueDate: null,
        tags: ["e2e", "docker"],
        notes: "validacao automatizada"
      }
    },
    authHeaders
  );
  await expectStatus("criacao de tarefa", createdTask.response, 201);
  assert.equal(createdTask.body.title, "Teste E2E Docker");

  const listedTasks = await request(`${apiUrl}/tasks`, {
    headers: authHeaders
  });
  await expectStatus("listagem de tarefas", listedTasks, 200);
  const tasks = await bodyAsJson(listedTasks);
  assert.equal(
    tasks.some((task) => task.id === createdTask.body.id),
    true
  );

  const updatedTask = await request(`${apiUrl}/tasks/${createdTask.body.id}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ completed: true })
  });
  await expectStatus("atualizacao de tarefa", updatedTask, 200);
  assert.equal((await bodyAsJson(updatedTask)).completed, true);

  const removedTask = await request(`${apiUrl}/tasks/${createdTask.body.id}`, {
    method: "DELETE",
    headers: authHeaders
  });
  await expectStatus("remocao de tarefa", removedTask, 204);

  const metrics = await request(`${directApiUrl}/metrics`);
  await expectStatus("metricas", metrics, 200);
  assert.match(await metrics.text(), /http_requests_total/);

  console.log("Teste E2E Docker concluido com sucesso.");
};

main().catch((error) => {
  console.error("Teste E2E Docker falhou.");
  console.error(error);
  process.exit(1);
});
