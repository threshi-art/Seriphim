import fs from "node:fs/promises";
import path from "node:path";
import { StorageData, StorageProvider, StoragePutResult } from "../types";

export class LocalDiskStorageAdapter implements StorageProvider {
  name = "local";
  private readonly rootDir = path.resolve(process.env.SERAPHIM_STORAGE_LOCAL_DIR ?? ".seraphim-storage");

  isAvailable(): boolean {
    return true;
  }

  async put(key: string, data: StorageData, _contentType: string): Promise<StoragePutResult> {
    const destination = this.resolveKey(key);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, typeof data === "string" ? data : Buffer.from(data));
    return { key, url: await this.getUrl(key) };
  }

  async getUrl(key: string): Promise<string> {
    this.resolveKey(key);
    return `/api/storage/local/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  async getSignedUrl(key: string): Promise<string> {
    return this.getUrl(key);
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolveKey(key));
  }

  private resolveKey(key: string): string {
    const resolved = path.resolve(this.rootDir, key);
    if (resolved !== this.rootDir && !resolved.startsWith(`${this.rootDir}${path.sep}`)) {
      throw new Error("Invalid storage key path.");
    }
    return resolved;
  }
}
