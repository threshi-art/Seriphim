import { ENV } from "../../env";
import { StorageData, StorageProvider, StoragePutResult } from "../types";

export class ManusForgeStorageAdapter implements StorageProvider {
  name = "manus";

  isAvailable(): boolean {
    return Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);
  }

  async put(key: string, data: StorageData, contentType: string): Promise<StoragePutResult> {
    if (!this.isAvailable()) {
      throw new Error("Manus Forge storage is not configured.");
    }

    const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
    const presignUrl = new URL("v1/storage/presign/put", `${forgeUrl}/`);
    presignUrl.searchParams.set("path", key);

    const presignResponse = await fetch(presignUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!presignResponse.ok) {
      const detail = await presignResponse.text().catch(() => presignResponse.statusText);
      throw new Error(`Storage presign failed (${presignResponse.status}): ${detail}`);
    }

    const { url: uploadUrl } = (await presignResponse.json()) as { url: string };
    if (!uploadUrl) throw new Error("Manus Forge returned an empty upload URL.");

    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const body = new Blob([arrayBuffer], { type: contentType });
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Storage upload failed (${uploadResponse.status}).`);
    }

    return { key, url: `/manus-storage/${key}` };
  }

  async getUrl(key: string): Promise<string> {
    return `/manus-storage/${key}`;
  }

  async getSignedUrl(key: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("Manus Forge storage is not configured.");
    }

    const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
    const signedUrl = new URL("v1/storage/presign/get", `${forgeUrl}/`);
    signedUrl.searchParams.set("path", key);
    const response = await fetch(signedUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new Error(`Storage signed URL failed (${response.status}): ${detail}`);
    }

    const { url } = (await response.json()) as { url: string };
    if (!url) throw new Error("Manus Forge returned an empty signed URL.");
    return url;
  }
}
