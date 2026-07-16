import { config } from 'dotenv';
import { z } from 'zod';

config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default('./data/maisie.db'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('admin1234'),
  SEED_CUSTOMER_PASSWORD: z.string().min(8).default('password1234'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`Invalid environment configuration:\n${issues}\n\nCopy .env.example to server/.env and fill in the blanks.`);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
