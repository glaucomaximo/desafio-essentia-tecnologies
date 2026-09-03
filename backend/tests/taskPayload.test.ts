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
    completed: false
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
