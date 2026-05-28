-- Wave 3: Game state cross-device persistence
-- COPPA-compliant schema: no PII, under-13 excluded by application layer,
-- google_sub hashed with SHA-256 before insert (see lib/crypto.ts)

create table if not exists game_users (
  id                uuid        primary key default gen_random_uuid(),
  google_sub_hashed text        unique not null,
  age_tier          text        not null check (age_tier in ('teen', 'adult')),
  game_state        jsonb,
  last_seen         timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

-- Index used by the 90-day auto-purge cron job (app/api/cron/purge-inactive)
create index if not exists idx_game_users_last_seen
  on game_users (last_seen);

-- To apply: psql $POSTGRES_URL -f db/migrations/001_game_users.sql
-- Or: npx drizzle-kit push (reads drizzle.config.ts)
