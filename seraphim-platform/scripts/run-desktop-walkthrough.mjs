#!/usr/bin/env node
/**
 * Start bridge + static dist preview, run walkthrough harness, then stop.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startDesktopDistServer } from "./desktop-static-server.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const companionDir = path.join(projectRoot, "seraphim_desktop_companion");
const previewPort = Number(process.env.SERAPHIM_WALKTHROUGH_PORT ?? 5179);
const nodeBin = process.execPath;
const viteCli = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");
const bridgeDev = path.join(projectRoot, "scripts", "bridge-dev.mjs");

/** @type {import("node:child_process").ChildProcess[]} */
const children = [];
/** @type {import("node:http").Server | null} */
let previewServer = null;

function waitForPort(port, timeoutMs = 30_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Port ${port} not ready within ${timeoutMs}ms`));
          return;
        }
        setTimeout(tick, 300);
      });
    };
    tick();
  });
}

function spawnChild(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "ignore",
    shell: Boolean(options.shell),
    cwd: options.cwd,
    env: options.env ?? process.env
  });
  children.push(child);
  return child;
}

function stopAll() {
  if (previewServer) {
    previewServer.close();
    previewServer = null;
  }
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

async function ensureDesktopBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(nodeBin, [viteCli, "build"], {
      cwd: companionDir,
      stdio: "inherit",
      shell: false
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Desktop vite build failed with code ${code}`));
      }
    });
  });
}

async function runWalkthroughScript() {
  return new Promise((resolve, reject) => {
    const child = spawn(nodeBin, ["scripts/desktop-walkthrough.mjs"], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false,
      env: {
        ...process.env,
        SERAPHIM_WALKTHROUGH_URL: `http://127.0.0.1:${previewPort}`
      }
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Walkthrough exited with code ${code}`));
      }
    });
  });
}

async function main() {
  if (process.argv.includes("--walkthrough-only")) {
    await import("./desktop-walkthrough.mjs");
    return;
  }

  console.log("Building desktop companion for walkthrough...");
  await ensureDesktopBuild();

  previewServer = await startDesktopDistServer(previewPort);

  spawnChild(nodeBin, [bridgeDev], {
    env: {
      ...process.env,
      SERAPHIM_BRIDGE_WORKSPACE_ROOT: projectRoot
    }
  });

  try {
    await Promise.all([waitForPort(previewPort), waitForPort(8768)]);
    console.log(`Preview: http://127.0.0.1:${previewPort}`);
    console.log("Bridge ready on :8768 with workspace root set");
    await runWalkthroughScript();
    console.log("Walkthrough complete.");
  } finally {
    stopAll();
  }
}

process.on("SIGINT", () => {
  stopAll();
  process.exit(130);
});

await main();
