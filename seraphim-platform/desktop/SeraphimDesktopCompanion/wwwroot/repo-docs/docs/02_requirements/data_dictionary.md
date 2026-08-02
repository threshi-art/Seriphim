# Data Dictionary

## Desktop Companion (MVP)

| Entity | Key Fields |
|--------|------------|
| ChatMessage | id, role, content, mode, createdAt |
| ApprovalRequest | id, actionType, title, reason, target, proposedCommand, proposedDiff, rollbackPlan, safetyLevel, riskLevel, status |
| SeraphimTask | id, title, description, status, safetyLevel, riskLevel, nextAction |
| LocalBridgeHealth | status, endpoint, version, capabilities, lastCheckedAt |
| MemoryEntry | id, category, key, value, source, createdAt |
| ActivityEvent | id, message, level, createdAt |
| SeraphimSettings | modelProvider, modelName, apiKeyPlaceholder, defaultWorkspace, safetyMode, theme |

## Web (Existing)

See `drizzle/schema.ts` for authoritative SQL entities: users, conversations, messages, memory_entries, audit_logs, sentinel_checks, etc.
