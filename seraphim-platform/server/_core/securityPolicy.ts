type Environment = Record<string, string | undefined>;

export function resolveServerHost(env: Environment = process.env): string {
  return env.SERAPHIM_SERVER_HOST?.trim() || "127.0.0.1";
}

export function shouldAllowAnonymousFallback(
  env: Environment = process.env,
): boolean {
  return env.NODE_ENV !== "production" && env.SERAPHIM_ALLOW_ANONYMOUS !== "0";
}

export function storageKeyBelongsToUser(key: string, userId: number): boolean {
  const normalized = key.replaceAll("\\", "/");
  const parts = normalized.split("/");
  if (
    normalized !== key ||
    normalized.includes("\0") ||
    parts.some(part => part === "" || part === "." || part === "..")
  ) {
    return false;
  }
  return normalized.startsWith(`uploads/${userId}/`);
}
