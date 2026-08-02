export interface MemoryEntry {
  id: string;
  category: string;
  key: string;
  value: string;
  source: "local_mock" | "web_seraphim" | "desktop_companion";
  createdAt: string;
}
