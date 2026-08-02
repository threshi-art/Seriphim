import type {
  LocalBridgeHealth,
  WorkspaceConfig,
  WorkspaceListResult,
  WorkspaceReadResult
} from "../types/bridge";

/** Planned seraphim_local_bridge port. Avoids Argus Vigil :8765 and local-agent :8767. */
export const DEFAULT_BRIDGE_ENDPOINT = "http://127.0.0.1:8768";

interface BridgeErrorEnvelope {
  error?: string;
  message?: string;
  workspaceReadEnabled?: boolean;
}

export class BridgeClientError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly workspaceReadEnabled?: boolean;

  constructor(message: string, statusCode: number, code?: string, workspaceReadEnabled?: boolean) {
    super(message);
    this.name = "BridgeClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.workspaceReadEnabled = workspaceReadEnabled;
  }
}

function buildBridgeUrl(endpoint: string, path: string, query?: Record<string, string>) {
  const url = new URL(path, endpoint.endsWith("/") ? endpoint : `${endpoint}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function parseBridgeError(response: Response): Promise<BridgeClientError> {
  try {
    const data = (await response.json()) as BridgeErrorEnvelope;
    return new BridgeClientError(
      data.message || `Bridge request failed with HTTP ${response.status}.`,
      response.status,
      data.error,
      data.workspaceReadEnabled
    );
  } catch {
    return new BridgeClientError(
      `Bridge request failed with HTTP ${response.status}.`,
      response.status
    );
  }
}

async function getBridgeJson<T>(endpoint: string, path: string, query?: Record<string, string>) {
  const response = await fetch(buildBridgeUrl(endpoint, path, query), {
    method: "GET"
  });

  if (!response.ok) {
    throw await parseBridgeError(response);
  }

  return (await response.json()) as T;
}

export async function checkLocalBridgeHealth(
  endpoint = DEFAULT_BRIDGE_ENDPOINT
): Promise<LocalBridgeHealth> {
  try {
    const response = await fetch(`${endpoint}/health`, {
      method: "GET"
    });

    if (!response.ok) {
      return {
        status: "degraded",
        endpoint,
        capabilities: [],
        lastCheckedAt: new Date().toISOString()
      };
    }

    const data = (await response.json()) as {
      version?: string;
      capabilities?: unknown;
    };

    return {
      status: "online",
      endpoint,
      version: data.version,
      capabilities: Array.isArray(data.capabilities)
        ? data.capabilities.filter((item): item is string => typeof item === "string")
        : [],
      lastCheckedAt: new Date().toISOString()
    };
  } catch {
    return {
      status: "offline",
      endpoint,
      capabilities: [],
      lastCheckedAt: new Date().toISOString()
    };
  }
}

export async function fetchWorkspaceConfig(
  endpoint = DEFAULT_BRIDGE_ENDPOINT
): Promise<WorkspaceConfig> {
  return getBridgeJson<WorkspaceConfig>(endpoint, "workspace/config");
}

export async function listWorkspace(
  endpoint = DEFAULT_BRIDGE_ENDPOINT,
  relativePath = ""
): Promise<WorkspaceListResult> {
  return getBridgeJson<WorkspaceListResult>(endpoint, "workspace/list", {
    relativePath
  });
}

export async function readWorkspaceFile(
  endpoint = DEFAULT_BRIDGE_ENDPOINT,
  relativePath: string
): Promise<WorkspaceReadResult> {
  return getBridgeJson<WorkspaceReadResult>(endpoint, "workspace/read", {
    relativePath
  });
}
