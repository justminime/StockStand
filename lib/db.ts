/**
 * Drizzle database client (Vercel Postgres / Neon).
 *
 * This module is server-only. Never import it in client components.
 * The connection is lazy — no attempt is made until a query executes.
 */
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql }     from '@vercel/postgres';
import * as schema from '@/lib/schema';

export const db = drizzle(sql, { schema });
export { schema };
