import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../src/errors/httpError";
import { parseCreateTaskPayload, parseUpdateTaskPayload } from "../src/schemas/taskPayload";

test("parseCreateTaskPayload normalizes a valid task", () => {
  const payload = parseCreateTaskPayload({
    title: "  Revisar backlog  ",
    description: "  Priorizar tarefas do dia  ",
    completed: false
  });

  assert.deepEqual(payload, {
    title: "Revisar backlog",
    description: "Priorizar tarefas do dia",
    completed: false,
    metadata: {
      priority: "medium",
      dueDate: null,
      tags: [],
      notes: null
    }
  });
});

test("parseCreateTaskPayload rejects empty titles", () => {
  assert.throws(
    () => parseCreateTaskPayload({ title: "   " }),
    (error) => error instanceof HttpError && error.statusCode === 400
  );
});

test("parseUpdateTaskPayload requires at least one valid field", () => {
  assert.throws(
    () => parseUpdateTaskPayload({}),
    (error) => error instanceof HttpError && error.statusCode === 400
  );
});

test("parseUpdateTaskPayload accepts completion toggles", () => {
  assert.deepEqual(parseUpdateTaskPayload({ completed: true }), {
    completed: true
  });
});

test("parseCreateTaskPayload sanitizes task metadata", () => {
  assert.deepEqual(
    parseCreateTaskPayload({
      title: "Mapear entrega",
      metadata: {
        priority: "high",
        dueDate: "2026-09-10",
        tags: [" api ", "api", " seguranca "],
        notes: "  Revisar contrato  "
      }
    }).metadata,
    {
      priority: "high",
      dueDate: "2026-09-10",
      tags: ["api", "seguranca"],
      notes: "Revisar contrato"
    }
  );
});

test("parseUpdateTaskPayload accepts metadata-only updates", () => {
  assert.deepEqual(
    parseUpdateTaskPayload({
      metadata: {
        priority: "low",
        tags: ["documentacao"]
      }
    }),
    {
      metadata: {
        priority: "low",
        dueDate: null,
        tags: ["documentacao"],
        notes: null
      }
    }
  );
});

test("parseCreateTaskPayload rejects invalid metadata", () => {
  assert.throws(
    () =>
      parseCreateTaskPayload({
        title: "Tarefa invalida",
        metadata: {
          priority: "urgent",
          dueDate: "2026-99-99"
        }
      }),
    (error) => error instanceof HttpError && error.statusCode === 400
  );
});
