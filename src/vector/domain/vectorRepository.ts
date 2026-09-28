export interface VectorRepository {
  isHealthy(): Promise<boolean>;
  listCollections(): Promise<string[]>;
}