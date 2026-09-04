#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
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

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const decodeBase32 = (value) => {
  let bits = "";

  for (const character of value.replace(/=+$/u, "").toUpperCase()) {
    const index = base32Alphabet.indexOf(character);

    if (index === -1) {
      throw new Error("Segredo MFA invalido.");
    }

    bits += index.toString(2).padStart(5, "0");
  }

  const bytes = [];

  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
};

const createTotpCode = (secret, timestamp = Date.now()) => {
  const counter = Math.floor(timestamp / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
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

  const mfaSetup = await postJson("/auth/mfa/setup", {}, authHeaders);
  await expectStatus("setup MFA", mfaSetup.response, 201);
  assert.equal(typeof mfaSetup.body.secret, "string");

  const mfaEnable = await postJson(
    "/auth/mfa/enable",
    { code: createTotpCode(mfaSetup.body.secret) },
    authHeaders
  );
  await expectStatus("habilitacao MFA", mfaEnable.response, 204);

  const loginSemMfa = await postJson("/auth/login", { email, password: senhaTeste });
  await expectStatus("login sem MFA", loginSemMfa.response, 401);

  const loginComMfa = await postJson("/auth/login", {
    email,
    password: senhaTeste,
    mfaCode: createTotpCode(mfaSetup.body.secret)
  });
  await expectStatus("login com MFA", loginComMfa.response, 200);

  const resetRequest = await postJson("/auth/password-reset/request", { email });
  await expectStatus("solicitacao de recuperacao", resetRequest.response, 202);
  assert.equal(typeof resetRequest.body.resetToken, "string");

  const resetConfirm = await postJson("/auth/password-reset/confirm", {
    token: resetRequest.body.resetToken,
    password: "SenhaNova123"
  });
  await expectStatus("confirmacao de recuperacao", resetConfirm.response, 204);

  const revokedSession = await request(`${apiUrl}/auth/me`, {
    headers: {
      authorization: `Bearer ${loginComMfa.body.token}`
    }
  });
  await expectStatus("sessao revogada apos recuperacao", revokedSession, 401);

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
