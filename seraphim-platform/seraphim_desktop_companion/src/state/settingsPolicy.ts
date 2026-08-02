export function settingsForPersistence<T extends { apiKeyPlaceholder: string }>(settings: T): T {
  return { ...settings, apiKeyPlaceholder: "" };
}
