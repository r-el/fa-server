import { describe, expect, it, vi, afterEach } from "vitest";
import { QdrantVectorRepository } from "@vector/infrastructure/qdrantVectorRepository.js";

describe("QdrantVectorRepository", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports a healthy Qdrant endpoint", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    await expect(new QdrantVectorRepository().isHealthy()).resolves.toBe(true);
  });

  it("reads collection names from Qdrant", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ result: { collections: [{ name: "faces" }] } }), { status: 200 }),
    );

    await expect(new QdrantVectorRepository().listCollections()).resolves.toEqual(["faces"]);
  });
});