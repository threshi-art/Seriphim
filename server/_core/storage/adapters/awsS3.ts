import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageData, StorageProvider, StoragePutResult } from "../types";

export class AwsS3StorageAdapter implements StorageProvider {
  name = "s3";

  isAvailable(): boolean {
    return Boolean(process.env.SERAPHIM_S3_BUCKET);
  }

  async put(key: string, data: StorageData, contentType: string): Promise<StoragePutResult> {
    const bucket = this.requireBucket();
    await this.client().send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: typeof data === "string" ? Buffer.from(data) : Buffer.from(data),
      ContentType: contentType,
    }));
    return { key, url: await this.getUrl(key) };
  }

  async getUrl(key: string, expiresIn = 3600): Promise<string> {
    const publicUrl = process.env.SERAPHIM_S3_PUBLIC_URL?.replace(/\/+$/, "");
    if (publicUrl) return `${publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;

    return getSignedUrl(
      this.client(),
      new GetObjectCommand({ Bucket: this.requireBucket(), Key: key }),
      { expiresIn },
    );
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.getUrl(key, expiresIn);
  }

  private requireBucket(): string {
    const bucket = process.env.SERAPHIM_S3_BUCKET;
    if (!bucket) throw new Error("S3 storage requires SERAPHIM_S3_BUCKET.");
    return bucket;
  }

  private client(): S3Client {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    return new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      endpoint: process.env.SERAPHIM_S3_ENDPOINT,
      forcePathStyle: process.env.SERAPHIM_S3_FORCE_PATH_STYLE === "true",
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }
}
