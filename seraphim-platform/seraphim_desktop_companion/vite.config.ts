import fs from "node:fs/promises";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const COMPANION_ROOT = import.meta.dirname;
const REPO_ROOT = path.resolve(COMPANION_ROOT, "..");

async function copyRepoDocs(targetRoot: string) {
  await fs.mkdir(targetRoot, { recursive: true });
  await fs.cp(path.join(REPO_ROOT, "docs"), path.join(targetRoot, "docs"), {
    recursive: true
  });
  await fs.copyFile(path.join(REPO_ROOT, "AGENTS.md"), path.join(targetRoot, "AGENTS.md"));
  await fs.copyFile(
    path.join(REPO_ROOT, "SERAPHIM_WHITE_PAPER.md"),
    path.join(targetRoot, "SERAPHIM_WHITE_PAPER.md")
  );

  const bridgeDir = path.join(targetRoot, "seraphim_local_bridge");
  await fs.mkdir(bridgeDir, { recursive: true });
  const bridgeFiles = ["main.py", "workspace_guard.py", "audit.py", "requirements.txt"];
  for (const name of bridgeFiles) {
    await fs.copyFile(path.join(REPO_ROOT, "seraphim_local_bridge", name), path.join(bridgeDir, name));
  }
}

function serveRepoDocsPlugin(): Plugin {
  return {
    name: "serve-seraphim-repo-docs",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/repo-docs/")) {
          next();
          return;
        }

        const relativePath = decodeURIComponent(req.url.slice("/repo-docs/".length));
        const allowed =
          relativePath.startsWith("docs/") ||
          relativePath === "AGENTS.md" ||
          relativePath === "SERAPHIM_WHITE_PAPER.md" ||
          relativePath.startsWith("seraphim_local_bridge/");

        if (!allowed) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        const filePath = path.resolve(REPO_ROOT, relativePath);
        if (!filePath.startsWith(REPO_ROOT)) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        try {
          const body = await fs.readFile(filePath, "utf8");
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(body);
        } catch {
          res.statusCode = 404;
          res.end("Not found");
        }
      });
    },
  };
}

function bundleRepoDocsPlugin(): Plugin {
  return {
    name: "bundle-seraphim-repo-docs",
    async closeBundle() {
      const outDir = path.resolve(COMPANION_ROOT, "dist", "repo-docs");
      await fs.rm(outDir, { recursive: true, force: true });
      await copyRepoDocs(outDir);
    },
  };
}

export default defineConfig({
  root: COMPANION_ROOT,
  plugins: [react(), serveRepoDocsPlugin(), bundleRepoDocsPlugin()],
  server: {
    port: 5179,
    strictPort: true,
  },
});
