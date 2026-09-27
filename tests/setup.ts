import 'reflect-metadata';
import { container } from 'tsyringe';
import { vi } from 'vitest';

process.env.SUPABASE_URL = "http://localhost:8000";
process.env.SUPABASE_KEY = "dummy-key";

beforeEach(() => {
  container.clearInstances();
});
