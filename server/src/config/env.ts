import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173'),
  /** When set, POST /api/calls/inbound requires X-Inbound-Secret or Authorization: Bearer */
  INBOUND_WEBHOOK_SECRET: z.string().optional(),
  OUTBOUND_SIMULATE_CONNECT_MS: z.coerce.number().min(0).default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const origins = parsed.data.CLIENT_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const env = {
  ...parsed.data,
  clientOrigins: origins,
};
