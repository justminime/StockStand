import type { Config } from 'drizzle-kit';

export default {
  schema:  './lib/schema.ts',
  out:     './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;
