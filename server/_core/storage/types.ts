export type StorageData = Buffer | Uint8Array | string;

export type StoragePutResult = {
  key: string;
  url: string;
};

export interface StorageProvider {
  name: string;
  isAvailable(): boolean;
  put(key: string, data: StorageData, contentType: string): Promise<StoragePutResult>;
  getUrl(key: string, expiresIn?: number): Promise<string>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

export function normalizeStorageKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/\\/g, "/");
}

export function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
