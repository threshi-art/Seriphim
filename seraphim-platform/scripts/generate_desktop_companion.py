"""Generate Seraphim Desktop Companion MVP skeleton files."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "seraphim_desktop_companion"


def write(rel: str, content: str) -> None:
    path = APP / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


SENTINEL_CHECKS = [
    ("system_health", "SFC Scan & Repair", "check-sfc-scan.ps1", "Scans and repairs Windows system files"),
    ("system_health", "DISM Health Check & Restore", "check-dism-health.ps1", "Checks and restores Windows component store health"),
    ("system_health", "CHKDSK with Auto-Repair", "check-chkdsk.ps1", "Checks disk integrity and repairs errors"),
    ("system_health", "Windows Update Audit", "check-windows-updates.ps1", "Audits pending and installed Windows updates"),
    ("system_health", "Driver Integrity Check", "check-driver-integrity.ps1", "Verifies driver signatures and integrity"),
    ("system_health", "Disk Space Check", "check-disk-space.ps1", "Monitors free disk space across all drives"),
    ("system_health", "Memory Usage", "check-memory.ps1", "Reports current memory utilization"),
    ("system_health", "CPU Temperature", "check-cpu-temperature.ps1", "Reads CPU thermal sensor data"),
    ("system_health", "Service Status", "check-service-status.ps1", "Checks critical Windows service states"),
    ("system_health", "Network Connectivity", "check-network-connectivity.ps1", "Tests network adapter and internet connectivity"),
    ("security", "Startup Program Audit", "check-startup-programs.ps1", "Lists and audits auto-start programs"),
    ("security", "Process Watchdog", "check-process-watchdog.ps1", "Monitors running processes for anomalies"),
    ("security", "Network Port Monitor", "check-network-ports.ps1", "Scans open network ports and listeners"),
    ("security", "Firewall Rule Audit", "check-firewall-rules.ps1", "Audits firewall rules for risky exceptions"),
    ("security", "Event Log Criticals", "check-event-log-criticals.ps1", "Scans Windows event logs for critical errors"),
    ("performance", "Disk Defrag / Optimize", "check-disk-defrag.ps1", "Checks disk fragmentation and optimization status"),
    ("performance", "Memory Diagnostic", "check-memory-diagnostic.ps1", "Runs Windows Memory Diagnostic checks"),
    ("performance", "Resource Usage Dashboard", "check-resource-usage.ps1", "Comprehensive CPU, memory, and disk usage report"),
    ("performance", "Scheduled Task Audit", "check-scheduled-tasks.ps1", "Audits Windows scheduled tasks for anomalies"),
    ("performance", "Service Status Viewer", "check-service-status-viewer.ps1", "Detailed service status with dependencies"),
    ("performance", "Disk I/O Performance", "check-disk-io.ps1", "Measures disk read/write performance"),
    ("performance", "Network Latency", "check-network-latency.ps1", "Tests network latency to key endpoints"),
    ("performance", "Application Response Time", "check-app-response-time.ps1", "Measures application startup and response times"),
    ("inventory", "Installed Software List", "check-installed-software.ps1", "Lists all installed software with versions"),
    ("inventory", "Driver List with Versions", "check-driver-list.ps1", "Enumerates all drivers with version info"),
    ("inventory", "Patch History Timeline", "check-patch-history.ps1", "Shows Windows update and patch history"),
    ("inventory", "BSOD Dump Parser", "check-bsod-dump.ps1", "Parses blue screen crash dump files"),
    ("logs", "Session Log Timeline", "check-session-log-timeline.ps1", "Shows login/logout session timeline"),
]


def sentinel_ts() -> str:
    lines = ["export const mockSentinelChecks: SentinelCheck[] = ["]
    for idx, (category, name, script, desc) in enumerate(SENTINEL_CHECKS, start=1):
        lines.append("  {")
        lines.append(f'    id: "sentinel_{idx:03d}",')
        lines.append(f'    category: "{category}",')
        lines.append(f'    name: "{name}",')
        lines.append(f'    scriptName: "{script}",')
        lines.append(f'    description: "{desc}",')
        lines.append('    executionStatus: "requires_bridge"')
        lines.append("  },")
    lines.append("];")
    return "\n".join(lines)


def main() -> None:
    write(
        "package.json",
        """
{
  "name": "seraphim-desktop-companion",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "description": "Seraphim Desktop Companion MVP — mock-only local cockpit",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "check": "tsc -b --pretty false"
  },
  "dependencies": {
    "react": "^19.2.1",
    "react-dom": "^19.2.1"
  },
  "devDependencies": {
    "@types/react": "^19.2.1",
    "@types/react-dom": "^19.2.1",
    "@vitejs/plugin-react": "^5.0.4",
    "typescript": "5.9.3",
    "vite": "^7.1.7"
  }
}
""",
    )

    write(
        "tsconfig.json",
        """
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
""",
    )

    write(
        "tsconfig.node.json",
        """
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
""",
    )

    write(
        "vite.config.ts",
        """
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5179,
    strictPort: true
  }
});
""",
    )

    write(
        "index.html",
        """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Seraphim Desktop Companion</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
""",
    )

    write(
        "README.md",
        """
# Seraphim Desktop Companion

Mock-only local cockpit for **Seraphim Platform v9**.

This is **not** a replacement for the Web Command Center. It is the controlled local execution layer UI. MVP behavior is intentionally simulated.

## Safety

- No real shell execution
- No real file deletion
- No unapproved file writing
- No secret storage
- No external model calls

See root `AGENTS.md` and `docs/`.

## Run

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5179`.

## Planned bridge

Default health endpoint: `http://127.0.0.1:8768` (`seraphim_local_bridge`).

Note: Argus Vigil uses `8765`; existing local-agent uses `8767`.
""",
    )

    write(
        "src/vite-env.d.ts",
        """
/// <reference types="vite/client" />
""",
    )

    write(
        "src/main.tsx",
        """
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
""",
    )

    write(
        "src/App.tsx",
        """
import { SeraphimProvider } from "./state/SeraphimState";
import { AppShell } from "./components/AppShell";
import "./App.css";

export default function App() {
  return (
    <SeraphimProvider>
      <AppShell />
    </SeraphimProvider>
  );
}
""",
    )

    write(
        "src/types/agent.ts",
        """
export type SafetyLevel = "green" | "yellow" | "red";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type SeraphimMode =
  | "standard"
  | "eiram"
  | "legal"
  | "technical"
  | "political"
  | "behavioral"
  | "writing"
  | "mythic"
  | "homework"
  | "briefing"
  | "redteam"
  | "dashboard";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  mode: SeraphimMode;
  createdAt: string;
}

export interface AgentPlanItem {
  id: string;
  title: string;
  description: string;
  status: "planned" | "active" | "blocked" | "complete";
  safetyLevel: SafetyLevel;
  riskLevel: RiskLevel;
}
""",
    )

    write(
        "src/types/approval.ts",
        """
import type { RiskLevel, SafetyLevel } from "./agent";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApprovalActionType =
  | "file_create"
  | "file_edit"
  | "file_delete"
  | "shell_command"
  | "powershell_check"
  | "external_api_call"
  | "git_operation"
  | "package_install";

export interface ApprovalRequest {
  id: string;
  actionType: ApprovalActionType;
  title: string;
  reason: string;
  target: string;
  proposedCommand?: string;
  proposedDiff?: string;
  rollbackPlan?: string;
  safetyLevel: SafetyLevel;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt?: string;
}
""",
    )

    write(
        "src/types/task.ts",
        """
import type { RiskLevel, SafetyLevel } from "./agent";

export type TaskStatus =
  | "queued"
  | "planning"
  | "waiting_for_approval"
  | "running"
  | "blocked"
  | "complete"
  | "failed";

export interface SeraphimTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  safetyLevel: SafetyLevel;
  riskLevel: RiskLevel;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}
""",
    )

    write(
        "src/types/bridge.ts",
        """
export type BridgeStatus = "offline" | "online" | "degraded" | "unknown";

export interface LocalBridgeHealth {
  status: BridgeStatus;
  endpoint: string;
  version?: string;
  capabilities: string[];
  lastCheckedAt?: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  relativePath: string;
  kind: "file" | "folder";
  sizeBytes?: number;
  lastModified?: string;
}

export interface SentinelCheck {
  id: string;
  category: "system_health" | "security" | "performance" | "inventory" | "logs";
  name: string;
  scriptName: string;
  description: string;
  executionStatus: "planned" | "simulated" | "requires_bridge" | "complete" | "failed";
}
""",
    )

    write(
        "src/types/memory.ts",
        """
export interface MemoryEntry {
  id: string;
  category: string;
  key: string;
  value: string;
  source: "local_mock" | "web_seraphim" | "desktop_companion";
  createdAt: string;
}
""",
    )

    write(
        "src/services/localStorageService.ts",
        """
export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  window.localStorage.removeItem(key);
}
""",
    )

    write(
        "src/services/bridgeClient.ts",
        """
import type { LocalBridgeHealth } from "../types/bridge";

/** Planned seraphim_local_bridge port. Avoids Argus Vigil :8765 and local-agent :8767. */
export const DEFAULT_BRIDGE_ENDPOINT = "http://127.0.0.1:8768";

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
""",
    )

    write(
        "src/data/mockData.ts",
        f"""
import type {{ AgentPlanItem, ChatMessage }} from "../types/agent";
import type {{ ApprovalRequest }} from "../types/approval";
import type {{ LocalBridgeHealth, SentinelCheck, WorkspaceFile }} from "../types/bridge";
import type {{ MemoryEntry }} from "../types/memory";
import type {{ SeraphimTask }} from "../types/task";

export const mockBridgeHealth: LocalBridgeHealth = {{
  status: "offline",
  endpoint: "http://127.0.0.1:8768",
  capabilities: [
    "workspace_read_planned",
    "file_diff_planned",
    "powershell_sentinel_planned",
    "terminal_approval_planned"
  ],
  lastCheckedAt: new Date().toISOString()
}};

export const mockPlan: AgentPlanItem[] = [
  {{
    id: "plan_001",
    title: "Establish controlled workspace",
    description: "Select an approved local project folder before file inspection.",
    status: "active",
    safetyLevel: "green",
    riskLevel: "low"
  }},
  {{
    id: "plan_002",
    title: "Prepare approval framework",
    description: "All file edits, command execution, and local bridge actions require approval.",
    status: "planned",
    safetyLevel: "yellow",
    riskLevel: "moderate"
  }},
  {{
    id: "plan_003",
    title: "Defer dangerous execution",
    description: "Shell commands, deletion, package install, and PowerShell execution remain disabled in MVP.",
    status: "planned",
    safetyLevel: "red",
    riskLevel: "high"
  }}
];

export const mockTasks: SeraphimTask[] = [
  {{
    id: "task_001",
    title: "Review Seraphim v8 baseline",
    description: "Confirm current web platform architecture, modules, routes, tests, and deferred scope.",
    status: "queued",
    safetyLevel: "green",
    riskLevel: "low",
    nextAction: "Open documentation baseline.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }},
  {{
    id: "task_002",
    title: "Design local bridge contract",
    description: "Define localhost endpoints for health, workspace read, diff proposal, and Sentinel checks.",
    status: "planning",
    safetyLevel: "yellow",
    riskLevel: "moderate",
    nextAction: "Create interface control document.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }},
  {{
    id: "task_003",
    title: "Keep Red actions disabled",
    description: "No shell, delete, or PowerShell execution until approval gates are verified.",
    status: "blocked",
    safetyLevel: "red",
    riskLevel: "critical",
    nextAction: "Wait for Phase 6+ gate.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }}
];

export const mockApprovals: ApprovalRequest[] = [
  {{
    id: "approval_001",
    actionType: "shell_command",
    title: "Run type check",
    reason: "Validate the desktop companion TypeScript build.",
    target: "seraphim_desktop_companion",
    proposedCommand: "pnpm check",
    rollbackPlan: "No file changes expected. If command fails, capture output only.",
    safetyLevel: "red",
    riskLevel: "moderate",
    status: "pending",
    createdAt: new Date().toISOString()
  }},
  {{
    id: "approval_002",
    actionType: "file_edit",
    title: "Create requirements trace matrix",
    reason: "Add controlled traceability document for DO-178 style evidence package.",
    target: "docs/02_requirements/requirements_trace_matrix.md",
    proposedDiff: "+ Add initial trace matrix headings and first safety requirements.",
    rollbackPlan: "Delete generated file if rejected before release baseline.",
    safetyLevel: "yellow",
    riskLevel: "low",
    status: "pending",
    createdAt: new Date().toISOString()
  }},
  {{
    id: "approval_003",
    actionType: "powershell_check",
    title: "Run disk space Sentinel check",
    reason: "SIMULATED proposal only. Real PowerShell is disabled in MVP.",
    target: "check-disk-space.ps1",
    proposedCommand: "pwsh -File check-disk-space.ps1",
    rollbackPlan: "Read-only check; no rollback required if never executed.",
    safetyLevel: "red",
    riskLevel: "high",
    status: "pending",
    createdAt: new Date().toISOString()
  }}
];

export const mockFiles: WorkspaceFile[] = [
  {{
    id: "file_001",
    name: "README.md",
    relativePath: "README.md",
    kind: "file",
    sizeBytes: 2400,
    lastModified: new Date().toISOString()
  }},
  {{
    id: "file_002",
    name: "src",
    relativePath: "src",
    kind: "folder",
    lastModified: new Date().toISOString()
  }},
  {{
    id: "file_003",
    name: "AGENTS.md",
    relativePath: "AGENTS.md",
    kind: "file",
    sizeBytes: 5200,
    lastModified: new Date().toISOString()
  }},
  {{
    id: "file_004",
    name: "docs",
    relativePath: "docs",
    kind: "folder",
    lastModified: new Date().toISOString()
  }}
];

export const mockMemories: MemoryEntry[] = [
  {{
    id: "memory_001",
    category: "program",
    key: "seraphim_direction",
    value: "Web command center remains baseline. Desktop companion provides controlled local hands.",
    source: "local_mock",
    createdAt: new Date().toISOString()
  }},
  {{
    id: "memory_002",
    category: "safety",
    key: "execution_policy",
    value: "MVP is mock-only. No shell, delete, or unapproved writes.",
    source: "desktop_companion",
    createdAt: new Date().toISOString()
  }}
];

export const mockChat: ChatMessage[] = [
  {{
    id: "chat_001",
    role: "assistant",
    content:
      "Seraphim Desktop Companion online in MOCK mode. Local execution disabled until approval gates and seraphim_local_bridge are verified.",
    mode: "technical",
    createdAt: new Date().toISOString()
  }}
];

export const mockProjects = [
  {{
    id: "project_001",
    name: "Seraphim Web Command Center",
    path: "Seraphim",
    status: "baseline",
    notes: "Existing React/Express/tRPC application."
  }},
  {{
    id: "project_002",
    name: "Seraphim Desktop Companion",
    path: "seraphim_desktop_companion",
    status: "mvp_mock",
    notes: "This cockpit. Mock execution only."
  }},
  {{
    id: "project_003",
    name: "seraphim_local_bridge",
    path: "planned",
    status: "planned",
    notes: "Future localhost service on :8768."
  }}
] as const;

{sentinel_ts()}
""",
    )

    # Continue with state and components in part 2 - file is getting long
    print("part1 written, continuing...")


if __name__ == "__main__":
    main()
