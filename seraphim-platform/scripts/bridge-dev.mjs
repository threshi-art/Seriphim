#!/usr/bin/env node
/** Start seraphim_local_bridge with correct working directory for local imports. */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const bridgeDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "seraphim_local_bridge");
const python = process.env.PYTHON ?? "python";

const child = spawn(python, ["main.py"], {
  cwd: bridgeDir,
  stdio: "inherit",
  shell: false,
  env: process.env
});

child.on("exit", (code) => process.exit(code ?? 0));
