#!/usr/bin/env node
/**
 * Static verification of published Desktop Companion artifacts.
 * Mock-safe: reads files only; does not launch shell tools or the EXE.
 */
import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const publishDir = path.join(projectRoot, "dist", "desktop");
const exePath = path.join(publishDir, "SeraphimDesktopCompanion.exe");
const wwwroot = path.join(publishDir, "wwwroot");

const REQUIRED_REPO_DOCS = [
  "repo-docs/AGENTS.md",
  "repo-docs/SERAPHIM_WHITE_PAPER.md",
  "repo-docs/docs/00_program/gap_analysis.md",
  "repo-docs/seraphim_local_bridge/main.py"
];

const NAV_LABELS = [
  "Dashboard",
  "Chat",
  "Projects",
  "Files",
  "Tasks",
  "Approvals",
  "Memory",
  "Local Bridge",
  "Sentinel",
  "Settings",
  "Logs",
  "Documentation"
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

async function statOrFail(filePath, label) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile() && !stat.isDirectory()) {
      fail(`${label} is not a file or directory: ${filePath}`);
      return null;
    }
    return stat;
  } catch {
    fail(`${label} missing: ${filePath}`);
    return null;
  }
}

async function main() {
  let ok = true;
  const markFail = (msg) => {
    ok = false;
    fail(msg);
  };

  const exeStat = await statOrFail(exePath, "Companion EXE");
  if (exeStat && exeStat.size < 1_000_000) {
    markFail(`Companion EXE suspiciously small (${exeStat.size} bytes)`);
  }

  await statOrFail(path.join(wwwroot, "index.html"), "wwwroot index.html");

  let assetDir;
  try {
    const entries = await fs.readdir(path.join(wwwroot, "assets"));
    const jsBundle = entries.find((name) => name.endsWith(".js"));
    if (!jsBundle) {
      markFail("No JS bundle under wwwroot/assets");
    } else {
      assetDir = path.join(wwwroot, "assets", jsBundle);
      const bundle = await fs.readFile(assetDir, "utf8");
      for (const label of NAV_LABELS) {
        if (!bundle.includes(label)) {
          markFail(`Nav label not found in bundle: ${label}`);
        }
      }
    }
  } catch {
    markFail("wwwroot/assets missing or unreadable");
  }

  for (const relative of REQUIRED_REPO_DOCS) {
    const full = path.join(wwwroot, relative);
    const stat = await statOrFail(full, relative);
    if (stat?.isFile() && stat.size === 0) {
      markFail(`${relative} is empty`);
    }
  }

  if (ok) {
    console.log("PASS: Desktop publish artifacts verified");
    console.log(`  EXE: ${exePath}`);
    console.log(`  wwwroot: ${wwwroot}`);
    console.log(`  nav labels in bundle: ${NAV_LABELS.length}`);
    console.log(`  repo-docs paths: ${REQUIRED_REPO_DOCS.length}`);
  }
}

await main();
