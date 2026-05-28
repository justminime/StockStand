/**
 * Drizzle ORM table definitions.
 *
 * COPPA rules enforced here:
 *  - Under-13 users NEVER have a row in game_users (application layer prevents it)
 *  - Raw google_sub is NEVER stored — only sha256(sub) via lib/crypto.ts
 *  - ageTier check constraint ('teen' | 'adult') provides DB-layer enforcement
 */
import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import type { GameState } from '@/types/game';

export const gameUsers = pgTable('game_users', {
  id:              uuid('id').primaryKey().defaultRandom(),
  googleSubHashed: text('google_sub_hashed').unique().notNull(),
  ageTier:         text('age_tier').notNull(), // 'teen' | 'adult' — enforced by app layer
  gameState:       jsonb('game_state').$type<GameState>(),
  lastSeen:        timestamp('last_seen',  { withTimezone: true }).defaultNow().notNull(),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type GameUser = typeof gameUsers.$inferSelect;
