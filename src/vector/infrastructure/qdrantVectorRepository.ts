import { injectable } from "tsyringe";
import { qdrantConfig } from "@core/config/database.js";
import { VectorRepository } from "@vector/domain/vectorRepository.js";

@injectable()
export class QdrantVectorRepository implements VectorRepository {
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${qdrantConfig.url}/collections`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listCollections(): Promise<string[]> {
    const response = await fetch(`${qdrantConfig.url}/collections`);
    if (!response.ok) throw new Error(`Qdrant returned HTTP ${response.status}`);

    const payload = (await response.json()) as { result?: { collections?: { name: string }[] } };
    return payload.result?.collections?.map((collection) => collection.name) ?? [];
  }
}