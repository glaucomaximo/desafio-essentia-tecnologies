#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";

const isWindows = process.platform === "win32";
const args = process.argv.slice(2);

const dockerDesktopUserPath =
  isWindows && process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, "Programs", "DockerDesktop", "resources", "bin", "docker.exe")
    : undefined;

const dockerDesktopMachinePath = isWindows
  ? join("C:", "Program Files", "Docker", "Docker", "resources", "bin", "docker.exe")
  : undefined;

const candidates = [
  process.env.DOCKER_CLI,
  dockerDesktopUserPath,
  dockerDesktopMachinePath,
  "docker"
].filter(Boolean);

const runDocker = (dockerPath) => {
  const env = { ...process.env };

  if (dockerPath !== "docker") {
    env.PATH = `${dirname(dockerPath)}${delimiter}${env.PATH ?? ""}`;
  }

  return spawnSync(dockerPath, args, {
    env,
    shell: isWindows && dockerPath === "docker",
    stdio: "inherit"
  });
};

for (const candidate of candidates) {
  if (candidate !== "docker" && !existsSync(candidate)) {
    continue;
  }

  const result = runDocker(candidate);

  if (result.error) {
    continue;
  }

  if (result.signal) {
    process.kill(process.pid, result.signal);
  }

  process.exit(result.status ?? 0);
}

console.error(
  "Docker CLI nao encontrado. Instale o Docker Desktop ou defina DOCKER_CLI com o caminho absoluto do executavel docker."
);
process.exit(127);
