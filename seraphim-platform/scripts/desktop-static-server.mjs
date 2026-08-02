#!/usr/bin/env node
/** Static HTTP server for seraphim_desktop_companion/dist (walkthrough / local preview). */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(projectRoot, "seraphim_desktop_companion", "dist");

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".md")) return "text/plain; charset=utf-8";
  if (filePath.endsWith(".py")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

export function startDesktopDistServer(port = 5179, host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
      const relative = urlPath === "/" ? "/index.html" : urlPath;
      const filePath = path.normalize(path.join(distDir, relative));

      if (!filePath.startsWith(distDir)) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }

      fs.readFile(filePath, (error, data) => {
        if (error) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        res.setHeader("Content-Type", contentType(filePath));
        res.end(data);
      });
    });

    server.listen(port, host, () => resolve(server));
    server.on("error", reject);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.SERAPHIM_DESKTOP_PREVIEW_PORT ?? 5179);
  const server = await startDesktopDistServer(port);
  console.log(`Desktop dist preview: http://127.0.0.1:${port}`);
  process.on("SIGINT", () => {
    server.close();
    process.exit(0);
  });
}
