import { container } from "@core/di.js";
import { VECTOR_REPOSITORY } from "@vector/infrastructure/tokens.js";
import { VectorRepository } from "@vector/domain/vectorRepository.js";

export const healthController = async (req, res) => {
  const vectorRepository = container.resolve<VectorRepository>(VECTOR_REPOSITORY);
  const isQdrantHealthy = await vectorRepository.isHealthy();

  res.status(200).json({
    success: isQdrantHealthy,
    message: isQdrantHealthy ? "Server is healthy" : "Vector database is unavailable",
    dependencies: { qdrant: isQdrantHealthy ? "healthy" : "unavailable" },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
};
