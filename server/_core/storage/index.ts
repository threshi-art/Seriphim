import type { Express } from "express";
import { AwsS3StorageAdapter } from "./adapters/awsS3";
import { LocalDiskStorageAdapter } from "./adapters/localDisk";
import { ManusForgeStorageAdapter } from "./adapters/manusForge";
import { appendHashSuffix, normalizeStorageKey, StorageData, StorageProvider, StoragePutResult } from "./types";

export * from "./types";

const providers: StorageProvider[] = [
  new ManusForgeStorageAdapter(),
  new AwsS3StorageAdapter(),
  new LocalDiskStorageAdapter(),
];

export function getStorageProvider(): StorageProvider {
  const requested = process.env.SERAPHIM_STORAGE_PROVIDER?.trim().toLowerCase();
  if (requested) {
    const selected = providers.find((provider) => provider.name === requested);
    if (!selected) throw new Error(`Unknown storage provider: ${requested}.`);
    if (!selected.isAvailable()) throw new Error(`Storage provider ${requested} is not configured.`);
    return selected;
  }

  // Preserve v10.1's Manus behavior unless a provider is explicitly selected.
  return providers.find((provider) => provider.name === "manus" && provider.isAvailable())
    ?? providers.find((provider) => provider.name === "s3" && provider.isAvailable())
    ?? providers.find((provider) => provider.name === "local")!;
}

export async function storagePut(
  relKey: string,
  data: StorageData,
  contentType = "application/octet-stream",
): Promise<StoragePutResult> {
  const key = appendHashSuffix(normalizeStorageKey(relKey));
  return getStorageProvider().put(key, data, contentType);
}

export async function storageGet(relKey: string): Promise<StoragePutResult> {
  const key = normalizeStorageKey(relKey);
  return { key, url: await getStorageProvider().getUrl(key) };
}

export async function storageGetSignedUrl(relKey: string, expiresIn?: number): Promise<string> {
  return getStorageProvider().getSignedUrl(normalizeStorageKey(relKey), expiresIn);
}

export function registerLocalStorageRoutes(app: Express): void {
  app.get("/api/storage/local/*", async (req, res) => {
    const provider = getStorageProvider();
    if (!(provider instanceof LocalDiskStorageAdapter)) {
      res.status(404).send("Local storage provider is not active.");
      return;
    }

    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key.");
      return;
    }

    try {
      const file = await provider.read(key);
      res.set("Cache-Control", "private, max-age=3600");
      res.send(file);
    } catch (error) {
      res.status(404).send("Stored file not found.");
    }
  });
}
