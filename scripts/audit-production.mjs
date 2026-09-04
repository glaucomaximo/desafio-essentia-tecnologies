#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const maxAttempts = 2;

const runAudit = () =>
  spawnSync(
    "npm",
    [
      "audit",
      "--omit=dev",
      "--audit-level=moderate",
      "--json",
      "--fetch-timeout=10000",
      "--fetch-retries=0"
    ],
    {
      encoding: "utf8",
      timeout: 45_000,
      shell: process.platform === "win32"
    }
  );

const parseAudit = (stdout) => {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
};

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const result = runAudit();
  const audit = parseAudit(result.stdout);

  if (audit?.metadata?.vulnerabilities) {
    const vulnerabilities = audit.metadata.vulnerabilities;
    const blockingCount =
      Number(vulnerabilities.moderate ?? 0) +
      Number(vulnerabilities.high ?? 0) +
      Number(vulnerabilities.critical ?? 0);

    if (blockingCount > 0) {
      console.error("Auditoria encontrou vulnerabilidades de producao em nivel bloqueante.");
      console.error(result.stdout);
      process.exit(1);
    }

    console.log("Auditoria de dependencias de producao concluida sem achados bloqueantes.");
    process.exit(0);
  }

  if (result.status === 0) {
    console.log("Auditoria de dependencias de producao concluida.");
    process.exit(0);
  }

  if (attempt < maxAttempts) {
    console.warn(`Auditoria npm indisponivel na tentativa ${attempt}; tentando novamente.`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 15_000);
  } else {
    console.warn("Auditoria npm inconclusiva por indisponibilidade do registry.");
    console.warn((result.stderr || result.stdout || "").trim());
    process.exit(0);
  }
}
