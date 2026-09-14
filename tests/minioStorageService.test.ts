import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class { send = send; },
  GetObjectCommand: class { constructor(public input: unknown) {} },
  PutObjectCommand: class { constructor(public input: unknown) {} },
  DeleteObjectCommand: class { constructor(public input: unknown) {} },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("http://minio.test/signed-image"),
}));

const { MinioStorageService } = await import("../src/services/minioStorageService.js");

describe("MinioStorageService", () => {
  beforeEach(() => send.mockReset());

  it("uploads an image with content type and metadata", async () => {
    const service = new MinioStorageService();
    await service.uploadImage({ key: "image-1", body: Buffer.from("data"), contentType: "image/jpeg", metadata: { camera: "1" } });
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0].input).toMatchObject({ Key: "image-1", ContentType: "image/jpeg", Metadata: { camera: "1" } });
  });

  it("returns a signed URL", async () => {
    const service = new MinioStorageService();
    await expect(service.getSignedImageUrl("image-1", 120)).resolves.toBe("http://minio.test/signed-image");
  });

  it("converts an image to a data URL and deletes it", async () => {
    send.mockResolvedValueOnce({ Body: { transformToByteArray: async () => new Uint8Array([65, 66]), }, ContentType: "image/png" });
    const service = new MinioStorageService();
    await expect(service.getImageAsBase64("image-1")).resolves.toBe("data:image/png;base64,QUI=");
    await service.deleteImage("image-1");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("returns null for a missing object", async () => {
    send.mockRejectedValueOnce({ name: "NoSuchKey", message: "missing" })
      .mockRejectedValueOnce({ Code: "NoSuchKey", message: "missing" });
    const service = new MinioStorageService();
    await expect(service.getImageAsBase64("missing")).resolves.toBeNull();
    await expect(service.getImageStream("missing")).resolves.toBeNull();
  });
});
