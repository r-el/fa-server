import 'reflect-metadata';
import { container } from 'tsyringe';
import { vi } from 'vitest';

process.env.SUPABASE_URL = "http://localhost:8000";
process.env.SUPABASE_KEY = "dummy-key";
process.env.MONGO_URI = "mongodb://localhost:27017/dummy";

beforeEach(() => {
  container.clearInstances();
});
