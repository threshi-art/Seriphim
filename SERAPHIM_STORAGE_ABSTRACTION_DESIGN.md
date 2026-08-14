# SERAPHIM STORAGE ABSTRACTION DESIGN (MISSION 03)

**Prepared by:** Manus AI Agent  
**Project:** Seraphim AI Agent (v10.1)  
**Date:** August 14, 2026  
**Status:** Design Package — Storage Abstraction Decoupling  

---

## 1. Current State & Coupling Analysis

Currently, Seraphim file uploads and media persistence rely on `server/storage.ts`, which interacts directly with Manus Forge presign endpoints (`v1/storage/presign/put`). This couples Seraphim's artifact storage to the Manus platform.

To achieve full backend sovereignty, we need a unified storage interface (`StorageProvider`) with pluggable adapters:
- **Local Filesystem Adapter:** Stores files directly in a local directory (`/uploads` or `.seraphim-storage`) for standalone VPS deployments.
- **AWS S3 / MinIO Adapter:** Standard S3 client (`@aws-sdk/client-s3`) supporting AWS S3, Cloudflare R2, and self-hosted MinIO.
- **Manus Forge Adapter:** Preserves existing platform behavior when running inside Manus.

---

## 2. Proposed Architecture & Interface

```text
Seraphim File Upload Routers
            ↓
`server/_core/storage/index.ts` (Unified Storage Interface)
      ├── LocalDiskAdapter (Local filesystem storage)
      ├── AwsS3Adapter (S3 / MinIO / R2 compatible)
      └── ManusForgeAdapter (Platform default)
```

### Core Interface Specification (`StorageProvider`)
```typescript
export interface StoragePutResult {
  key: string;
  url: string;
}

export interface StorageProvider {
  name: string;
  isAvailable(): boolean;
  put(relKey: string, data: Buffer | Uint8Array | string, contentType?: string): Promise<StoragePutResult>;
  getSignedUrl(relKey: string, expiresIn?: number): Promise<string>;
}
```

---

## 3. Proposed File Structure

```text
server/
  _core/
    storage/
      index.ts           ← Unified storage entry point and helper exports
      types.ts           ← Storage provider interfaces
      adapters/
        localDisk.ts     ← Local filesystem adapter
        awsS3.ts         ← Standard AWS S3 / MinIO adapter
        manusForge.ts    ← Legacy Manus Forge proxy adapter
```

---

## 4. Migration & Rollout Sequence

1. **Phase 1 (Design Approval):** Review and approve Mission 03 storage abstraction design.
2. **Phase 2 (Adapter Implementation):** Implement `server/_core/storage/` with Local, S3, and Manus Forge adapters.
3. **Phase 3 (Environment Configuration):** Configure `SERAPHIM_STORAGE_PROVIDER=local|s3|manus`.
4. **Phase 4 (Validation):** Rerun test suites and verify upload/download flows.
