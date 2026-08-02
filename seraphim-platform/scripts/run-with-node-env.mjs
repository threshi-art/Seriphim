import { spawn } from "node:child_process";

const [, , nodeEnv, command, ...args] = process.argv;

if (!nodeEnv || !command) {
  console.error("Usage: node scripts/run-with-node-env.mjs <NODE_ENV> <command> [...args]");
  process.exit(1);
}

const child = spawn(command, args, {
  env: {
    ...process.env,
    NODE_ENV: nodeEnv,
  },
  shell: true,
  stdio: "inherit",
});

child.on("exit", code => {
  process.exit(code ?? 1);
});
