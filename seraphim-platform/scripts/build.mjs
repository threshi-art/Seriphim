import { build as buildWithEsbuild } from "esbuild";
import { build as buildWithVite } from "vite";

await buildWithVite();

await buildWithEsbuild({
  entryPoints: ["server/_core/index.ts"],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outdir: "dist",
});

await buildWithEsbuild({
  entryPoints: ["server/local-agent/index.ts"],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outfile: "dist/local-agent.js",
});
