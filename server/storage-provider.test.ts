import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalDiskStorageAdapter } from "./_core/storage/adapters/localDisk";
import { getStorageProvider, storageGetSignedUrl, storagePut } from "./_core/storage";

const originalProvider = process.env.SERAPHIM_STORAGE_PROVIDER;
const originalRoot = process.env.SERAPHIM_STORAGE_LOCAL_DIR;
const temporaryRoots: string[] = [];

afterEach(async () => {
  if (originalProvider === undefined) delete process.env.SERAPHIM_STORAGE_PROVIDER;
  else process.env.SERAPHIM_STORAGE_PROVIDER = originalProvider;
  if (originalRoot === undefined) delete process.env.SERAPHIM_STORAGE_LOCAL_DIR;
  else process.env.SERAPHIM_STORAGE_LOCAL_DIR = originalRoot;
  await Promise.all(temporaryRoots.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("storage provider abstraction", () => {
  it("writes and reads a local storage object without path traversal", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "seraphim-storage-"));
    temporaryRoots.push(tempRoot);
    process.env.SERAPHIM_STORAGE_LOCAL_DIR = tempRoot;

    const adapter = new LocalDiskStorageAdapter();
    const result = await adapter.put("reports/example.txt", "classified", "text/plain");

    expect(result.url).toBe("/api/storage/local/reports/example.txt");
    await expect(adapter.read("reports/example.txt")).resolves.toEqual(Buffer.from("classified"));
    await expect(adapter.read("../outside.txt")).rejects.toThrow("Invalid storage key path");
  });

  it("selects local storage explicitly and preserves unique keys", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "seraphim-storage-"));
    temporaryRoots.push(tempRoot);
    process.env.SERAPHIM_STORAGE_LOCAL_DIR = tempRoot;
    process.env.SERAPHIM_STORAGE_PROVIDER = "local";

    expect(getStorageProvider().name).toBe("local");
    const first = await storagePut("uploads/evidence.txt", "one", "text/plain");
    const second = await storagePut("uploads/evidence.txt", "two", "text/plain");

    expect(first.key).not.toBe(second.key);
    expect(first.url).toContain("/api/storage/local/uploads/");
  });

  it("preserves Manus signed-download behavior through the compatibility API", async () => {
    process.env.SERAPHIM_STORAGE_PROVIDER = "manus";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://signed.example.test/reports/evidence.pdf" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(storageGetSignedUrl("reports/evidence.pdf"))
      .resolves.toBe("https://signed.example.test/reports/evidence.pdf");
    expect(mockFetch.mock.calls[0][0].toString()).toContain("v1/storage/presign/get");
    vi.unstubAllGlobals();
  });
});
