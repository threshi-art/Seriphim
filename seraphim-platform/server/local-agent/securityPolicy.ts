import fs from "node:fs/promises";
import path from "node:path";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const TRUSTED_WORKSPACE_TOOLS = new Set([
  "workspace.writeText",
  "project.typecheck",
  "project.tests",
  "project.build",
  "project.healthCheck",
  "sentinel.runCheck",
  "report.writeMarkdown",
]);

export function parseAllowedAgentOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
}

export function isAllowedAgentOrigin(
  origin: string,
  explicitlyAllowedOrigins: readonly string[],
): boolean {
  try {
    const url = new URL(origin);
    if (LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) return true;
    return explicitlyAllowedOrigins.includes(url.origin);
  } catch {
    return false;
  }
}

export function requiresTrustedWorkspace(toolId: string): boolean {
  return TRUSTED_WORKSPACE_TOOLS.has(toolId);
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function canonicalRoots(roots: readonly string[]): Promise<string[]> {
  return Promise.all(roots.map(root => fs.realpath(root)));
}

function assertWithinRoots(candidate: string, roots: readonly string[]): void {
  if (!roots.some(root => isWithinRoot(root, candidate))) {
    throw new Error("Path is outside approved Seraphim agent roots.");
  }
}

export async function resolveExistingPathWithinRoots(
  candidate: string,
  roots: readonly string[],
): Promise<string> {
  const resolved = await fs.realpath(candidate);
  assertWithinRoots(resolved, await canonicalRoots(roots));
  return candidate;
}

export async function resolveWritablePathWithinRoots(
  candidate: string,
  roots: readonly string[],
): Promise<string> {
  const approvedRoots = await canonicalRoots(roots);
  try {
    const resolved = await fs.realpath(candidate);
    assertWithinRoots(resolved, approvedRoots);
    return candidate;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  let existingParent = path.dirname(candidate);
  while (true) {
    try {
      const resolvedParent = await fs.realpath(existingParent);
      assertWithinRoots(resolvedParent, approvedRoots);
      return candidate;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const next = path.dirname(existingParent);
      if (next === existingParent) throw error;
      existingParent = next;
    }
  }
}
