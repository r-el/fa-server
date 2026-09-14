import logger from "@core/utils/logger.js";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { minioConfig } from "@core/config/database.js";

/**
 * MinIO Storage Service
 * A generic S3-compatible service that replaces GridFS for better scalability
 * and cloud-native architecture.
 */
class MinioStorageService {
  client: S3Client;
  bucketName: string;

  constructor() {
    this.bucketName = minioConfig.bucketName;
    const protocol = minioConfig.useSSL ? 'https' : 'http';
    const endpoint = `${protocol}://${minioConfig.endpoint}:${minioConfig.port}`;

    this.client = new S3Client({
      region: minioConfig.region,
      endpoint: endpoint,
      forcePathStyle: true, // Needed for MinIO
      credentials: {
        accessKeyId: minioConfig.accessKey,
        secretAccessKey: minioConfig.secretKey,
      }
    });
  }

  /**
   * Generates a signed URL to fetch an image directly from MinIO
   * @param imageId - The ID of the image
   * @param expiresIn - Seconds until the URL expires (default: 3600)
   * @returns Signed URL string
   */
  async getSignedImageUrl(imageId: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: imageId
      });
      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      logger.error(`Failed to generate signed URL for image ${imageId}:`, error);
      return null;
    }
  }

  /**
   * Retrieves an image as a base64 string
   * Note: For frontend performance, using signed URLs is preferred.
   * @param imageId - The ID of the image
   */
  async getImageAsBase64(imageId: string): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: imageId
      });

      const response = await this.client.send(command);

      if (!response.Body) return null;

      const byteArray = await response.Body.transformToByteArray();
      const buffer = Buffer.from(byteArray);
      const base64String = buffer.toString('base64');
      const contentType = response.ContentType || 'image/jpeg';

      return `data:${contentType};base64,${base64String}`;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') return null;
      logger.error(`Failed to get base64 image ${imageId}:`, error);
      throw error;
    }
  }

  /**
   * Gets the raw read stream for an image
   * @param imageId - The ID of the image
   */
  async getImageStream(imageId: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: imageId
      });

      const response = await this.client.send(command);
      return {
        stream: response.Body as NodeJS.ReadableStream,
        contentType: response.ContentType,
        contentLength: response.ContentLength
      };
    } catch (error: any) {
      if (error.name === 'NoSuchKey') return null;
      logger.error(`Failed to get image stream ${imageId}:`, error);
      throw error;
    }
  }
}

export const minioStorageService = new MinioStorageService();
export default minioStorageService;
