import { GetObjectCommand, PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { minioConfig } from "../config/database.js";
import type { Readable } from "node:stream";

export interface ImageStream {
  stream: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
}

export interface ImageUpload {
  key: string;
  body: Uint8Array | Buffer | Readable;
  contentType?: string;
  metadata?: Record<string, string>;
}

export class MinioStorageService {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(client?: S3Client) {
    this.bucketName = minioConfig.bucketName;
    this.client = client ?? new S3Client({
      region: minioConfig.region,
      endpoint: `${minioConfig.useSSL ? "https" : "http"}://${minioConfig.endpoint}:${minioConfig.port}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: minioConfig.accessKey,
        secretAccessKey: minioConfig.secretKey,
      },
    });
  }

  private isMissingObject(error: unknown): boolean {
    if (typeof error === "string") return error.includes("NoSuchKey");
    if (typeof error !== "object" || error === null) return false;
    const candidate = error as { name?: unknown; Code?: unknown; code?: unknown; message?: unknown };
    return [candidate.name, candidate.Code, candidate.code, candidate.message]
      .some((value) => typeof value === "string" && value.includes("NoSuchKey"));
  }

  async uploadImage(image: ImageUpload): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: image.key,
      Body: image.body,
      ContentType: image.contentType,
      Metadata: image.metadata,
    }));
  }

  async getSignedImageUrl(imageId: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({
      Bucket: this.bucketName,
      Key: imageId,
    }), { expiresIn });
  }

  async getImageAsBase64(imageId: string): Promise<string | null> {
    try {
      const response = await this.client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: imageId,
      }));
      if (!response.Body) return null;
      const bytes = await response.Body.transformToByteArray();
      return `data:${response.ContentType || "image/jpeg"};base64,${Buffer.from(bytes).toString("base64")}`;
    } catch (error) {
      if (this.isMissingObject(error)) return null;
      throw error;
    }
  }

  async getImageStream(imageId: string): Promise<ImageStream | null> {
    try {
      const response = await this.client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: imageId,
      }));
      if (!response.Body) return null;
      return {
        stream: response.Body as NodeJS.ReadableStream,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
      };
    } catch (error) {
      if (this.isMissingObject(error)) return null;
      throw error;
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: imageId,
    }));
  }
}

export const minioStorageService = new MinioStorageService();