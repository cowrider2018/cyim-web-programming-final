import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit loads this file outside the app's module graph, so it reads the
// database path straight from the environment rather than importing src/env.ts.
config();

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dbCredentials: { url: process.env.DATABASE_URL ?? './data/maisie.db' },
  strict: true,
  verbose: true,
});
