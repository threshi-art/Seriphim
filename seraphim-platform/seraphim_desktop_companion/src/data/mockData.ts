import type { AgentPlanItem, ChatMessage } from "../types/agent";
import type { ApprovalRequest } from "../types/approval";
import type { LocalBridgeHealth, SentinelCheck, WorkspaceFile } from "../types/bridge";
import type { MemoryEntry } from "../types/memory";
import type { SeraphimTask } from "../types/task";

export const mockBridgeHealth: LocalBridgeHealth = {
  status: "offline",
  endpoint: "http://127.0.0.1:8768",
  capabilities: [
    "workspace_read_planned",
    "file_diff_planned",
    "powershell_sentinel_planned",
    "terminal_approval_planned"
  ],
  lastCheckedAt: new Date().toISOString()
};

export const mockPlan: AgentPlanItem[] = [
  {
    id: "plan_001",
    title: "Establish controlled workspace",
    description: "Select an approved local project folder before file inspection.",
    status: "active",
    safetyLevel: "green",
    riskLevel: "low"
  },
  {
    id: "plan_002",
    title: "Prepare approval framework",
    description: "All file edits, command execution, and local bridge actions require approval.",
    status: "planned",
    safetyLevel: "yellow",
    riskLevel: "moderate"
  },
  {
    id: "plan_003",
    title: "Defer dangerous execution",
    description: "Shell commands, deletion, package install, and PowerShell execution remain disabled in MVP.",
    status: "planned",
    safetyLevel: "red",
    riskLevel: "high"
  }
];

export const mockTasks: SeraphimTask[] = [
  {
    id: "task_001",
    title: "Review Seraphim v8 baseline",
    description: "Confirm current web platform architecture, modules, routes, tests, and deferred scope.",
    status: "queued",
    safetyLevel: "green",
    riskLevel: "low",
    nextAction: "Open documentation baseline.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task_002",
    title: "Design local bridge contract",
    description: "Define localhost endpoints for health, workspace read, diff proposal, and Sentinel checks.",
    status: "planning",
    safetyLevel: "yellow",
    riskLevel: "moderate",
    nextAction: "Create interface control document.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task_003",
    title: "Keep Red actions disabled",
    description: "No shell, delete, or PowerShell execution until approval gates are verified.",
    status: "blocked",
    safetyLevel: "red",
    riskLevel: "critical",
    nextAction: "Wait for Phase 6+ gate.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockApprovals: ApprovalRequest[] = [
  {
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
  },
  {
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
  },
  {
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
  }
];

export const mockFiles: WorkspaceFile[] = [
  {
    id: "file_001",
    name: "README.md",
    relativePath: "README.md",
    kind: "file",
    sizeBytes: 2400,
    lastModified: new Date().toISOString()
  },
  {
    id: "file_002",
    name: "src",
    relativePath: "src",
    kind: "folder",
    lastModified: new Date().toISOString()
  },
  {
    id: "file_003",
    name: "AGENTS.md",
    relativePath: "AGENTS.md",
    kind: "file",
    sizeBytes: 5200,
    lastModified: new Date().toISOString()
  },
  {
    id: "file_004",
    name: "docs",
    relativePath: "docs",
    kind: "folder",
    lastModified: new Date().toISOString()
  }
];

export const mockMemories: MemoryEntry[] = [
  {
    id: "memory_001",
    category: "program",
    key: "seraphim_direction",
    value: "Web command center remains baseline. Desktop companion provides controlled local hands.",
    source: "local_mock",
    createdAt: new Date().toISOString()
  },
  {
    id: "memory_002",
    category: "safety",
    key: "execution_policy",
    value: "MVP is mock-only. No shell, delete, or unapproved writes.",
    source: "desktop_companion",
    createdAt: new Date().toISOString()
  }
];

export const mockChat: ChatMessage[] = [
  {
    id: "chat_001",
    role: "assistant",
    content:
      "**Bottom line:** Desktop Companion is online in mock mode.\n\n**Analysis:** Local execution remains disabled until seraphim_local_bridge and Yellow/Red approval gates are verified.\n\n**Confidence:** High\n\n**Caveats:** No shell, delete, or unapproved writes in this build.\n\n**Recommended move:** Set workspace path, then run bridge health check.",
    mode: "briefing",
    createdAt: new Date().toISOString()
  }
];

export const mockProjects = [
  {
    id: "project_001",
    name: "Seraphim Web Command Center",
    path: "Seraphim",
    status: "baseline",
    notes: "Existing React/Express/tRPC application."
  },
  {
    id: "project_002",
    name: "Seraphim Desktop Companion",
    path: "seraphim_desktop_companion",
    status: "mvp_mock",
    notes: "This cockpit. Mock execution only."
  },
  {
    id: "project_003",
    name: "seraphim_local_bridge",
    path: "planned",
    status: "planned",
    notes: "Future localhost service on :8768."
  }
] as const;

export const mockSentinelChecks: SentinelCheck[] = [
  {
    id: "sentinel_001",
    category: "system_health",
    name: "SFC Scan & Repair",
    scriptName: "check-sfc-scan.ps1",
    description: "Scans and repairs Windows system files",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_002",
    category: "system_health",
    name: "DISM Health Check & Restore",
    scriptName: "check-dism-health.ps1",
    description: "Checks and restores Windows component store health",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_003",
    category: "system_health",
    name: "CHKDSK with Auto-Repair",
    scriptName: "check-chkdsk.ps1",
    description: "Checks disk integrity and repairs errors",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_004",
    category: "system_health",
    name: "Windows Update Audit",
    scriptName: "check-windows-updates.ps1",
    description: "Audits pending and installed Windows updates",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_005",
    category: "system_health",
    name: "Driver Integrity Check",
    scriptName: "check-driver-integrity.ps1",
    description: "Verifies driver signatures and integrity",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_006",
    category: "system_health",
    name: "Disk Space Check",
    scriptName: "check-disk-space.ps1",
    description: "Monitors free disk space across all drives",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_007",
    category: "system_health",
    name: "Memory Usage",
    scriptName: "check-memory.ps1",
    description: "Reports current memory utilization",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_008",
    category: "system_health",
    name: "CPU Temperature",
    scriptName: "check-cpu-temperature.ps1",
    description: "Reads CPU thermal sensor data",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_009",
    category: "system_health",
    name: "Service Status",
    scriptName: "check-service-status.ps1",
    description: "Checks critical Windows service states",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_010",
    category: "system_health",
    name: "Network Connectivity",
    scriptName: "check-network-connectivity.ps1",
    description: "Tests network adapter and internet connectivity",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_011",
    category: "security",
    name: "Startup Program Audit",
    scriptName: "check-startup-programs.ps1",
    description: "Lists and audits auto-start programs",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_012",
    category: "security",
    name: "Process Watchdog",
    scriptName: "check-process-watchdog.ps1",
    description: "Monitors running processes for anomalies",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_013",
    category: "security",
    name: "Network Port Monitor",
    scriptName: "check-network-ports.ps1",
    description: "Scans open network ports and listeners",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_014",
    category: "security",
    name: "Firewall Rule Audit",
    scriptName: "check-firewall-rules.ps1",
    description: "Audits firewall rules for risky exceptions",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_015",
    category: "security",
    name: "Event Log Criticals",
    scriptName: "check-event-log-criticals.ps1",
    description: "Scans Windows event logs for critical errors",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_016",
    category: "performance",
    name: "Disk Defrag / Optimize",
    scriptName: "check-disk-defrag.ps1",
    description: "Checks disk fragmentation and optimization status",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_017",
    category: "performance",
    name: "Memory Diagnostic",
    scriptName: "check-memory-diagnostic.ps1",
    description: "Runs Windows Memory Diagnostic checks",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_018",
    category: "performance",
    name: "Resource Usage Dashboard",
    scriptName: "check-resource-usage.ps1",
    description: "Comprehensive CPU, memory, and disk usage report",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_019",
    category: "performance",
    name: "Scheduled Task Audit",
    scriptName: "check-scheduled-tasks.ps1",
    description: "Audits Windows scheduled tasks for anomalies",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_020",
    category: "performance",
    name: "Service Status Viewer",
    scriptName: "check-service-status-viewer.ps1",
    description: "Detailed service status with dependencies",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_021",
    category: "performance",
    name: "Disk I/O Performance",
    scriptName: "check-disk-io.ps1",
    description: "Measures disk read/write performance",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_022",
    category: "performance",
    name: "Network Latency",
    scriptName: "check-network-latency.ps1",
    description: "Tests network latency to key endpoints",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_023",
    category: "performance",
    name: "Application Response Time",
    scriptName: "check-app-response-time.ps1",
    description: "Measures application startup and response times",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_024",
    category: "inventory",
    name: "Installed Software List",
    scriptName: "check-installed-software.ps1",
    description: "Lists all installed software with versions",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_025",
    category: "inventory",
    name: "Driver List with Versions",
    scriptName: "check-driver-list.ps1",
    description: "Enumerates all drivers with version info",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_026",
    category: "inventory",
    name: "Patch History Timeline",
    scriptName: "check-patch-history.ps1",
    description: "Shows Windows update and patch history",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_027",
    category: "inventory",
    name: "BSOD Dump Parser",
    scriptName: "check-bsod-dump.ps1",
    description: "Parses blue screen crash dump files",
    executionStatus: "requires_bridge"
  },
  {
    id: "sentinel_028",
    category: "logs",
    name: "Session Log Timeline",
    scriptName: "check-session-log-timeline.ps1",
    description: "Shows login/logout session timeline",
    executionStatus: "requires_bridge"
  },
];
