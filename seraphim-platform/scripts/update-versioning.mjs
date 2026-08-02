#!/usr/bin/env node
/**
 * Refresh versioning/VERSION.json and the status table in versioning/CHANGELOG.md.
 * Mock-safe: optional verify runs existing pnpm scripts only.
 */
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const versionPath = path.join(projectRoot, "versioning", "VERSION.json");
const changelogPath = path.join(projectRoot, "versioning", "CHANGELOG.md");

function parseArgs(argv) {
  let summary = null;
  let verify = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--verify") {
      verify = true;
      continue;
    }
    if (arg === "--summary") {
      const parts = [];
      for (let j = i + 1; j < argv.length; j += 1) {
        if (argv[j].startsWith("--")) {
          break;
        }
        parts.push(argv[j]);
      }
      summary = parts.join(" ").trim() || null;
      i += parts.length;
    }
  }

  return { verify, summary };
}

function resolvePnpmCommand() {
  const local = path.join(projectRoot, "node_modules", ".bin", "pnpm.cmd");
  return process.platform === "win32" ? `"${local}"` : "pnpm";
}

function runVerifyFull() {
  const pnpm = resolvePnpmCommand();
  execSync(`${pnpm} verify:full`, {
    cwd: projectRoot,
    stdio: "pipe",
    shell: true,
    env: process.env
  });
}

async function loadVersion() {
  const raw = await fs.readFile(versionPath, "utf8");
  return JSON.parse(raw);
}

async function saveVersion(version) {
  await fs.writeFile(versionPath, `${JSON.stringify(version, null, 2)}\n`, "utf8");
}

function formatDate(iso) {
  return iso.slice(0, 10);
}

function buildStatusTable(version) {
  const verifyLine =
    version.verifyStatus === "pass"
      ? `${version.testCount}/${version.testCount} tests pass; desktop publish check ${version.desktopPublishCheck}`
      : `verify ${version.verifyStatus}`;

  return `| Field | Value |
|-------|-------|
| **Platform** | ${version.platform} |
| **Version** | \`${version.version}\` |
| **Phase** | ${version.phase} |
| **Last edit** | ${formatDate(version.lastEdit)} |
| **Last edit summary** | ${version.lastEditSummary} |
| **Verification** | ${verifyLine} |
| **Operator launch** | \`${version.operatorEntrypoint}\` → \`dist\\desktop\\SeraphimDesktopCompanion.exe\` |
| **Safety** | ${version.safetyPosture} |`;
}

async function refreshChangelogStatusTable(version) {
  const changelog = await fs.readFile(changelogPath, "utf8");
  const start = "## Current status";
  const end = "**Deferred:**";
  const startIdx = changelog.indexOf(start);
  const endIdx = changelog.indexOf(end, startIdx);

  if (startIdx < 0 || endIdx < 0) {
    throw new Error("CHANGELOG.md missing Current status section markers");
  }

  const table = buildStatusTable(version);
  const updated =
    changelog.slice(0, startIdx) +
    `${start}\n\n${table}\n\n` +
    changelog.slice(endIdx);

  await fs.writeFile(changelogPath, updated, "utf8");
}

async function main() {
  const { verify, summary } = parseArgs(process.argv.slice(2));
  const version = await loadVersion();
  const now = new Date().toISOString();

  version.lastRefresh = now;
  if (summary) {
    version.lastEdit = now;
    version.lastEditSummary = summary;
  }

  if (verify) {
    try {
      runVerifyFull();
      version.verifyStatus = "pass";
      version.desktopPublishCheck = "pass";
    } catch {
      version.verifyStatus = "fail";
      version.desktopPublishCheck = "unknown";
    }
  }

  await saveVersion(version);
  await refreshChangelogStatusTable(version);

  console.log(`Versioning refreshed: ${version.version}`);
  console.log(`  lastEdit: ${formatDate(version.lastEdit)}`);
  console.log(`  summary: ${version.lastEditSummary}`);
  console.log(`  verify: ${version.verifyStatus}`);
}

await main();
