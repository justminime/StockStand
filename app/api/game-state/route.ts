/**
 * Game state API — cross-device save/load for signed-in players.
 *
 * GET  /api/game-state  → returns { gameState, lastSeen } or null
 * POST /api/game-state  → upserts game state for the authenticated user
 *
 * COPPA rules:
 *  - Requires valid session (only teen/adult users reach this — children never sign in)
 *  - Rejects body.ageTier === 'child' as defense-in-depth
 *  - Never reads/writes raw google_sub — uses sha256(session.user.id)
 */
import { auth }          from '@/auth';
import { db, schema }    from '@/lib/db';
import { hashSubject }   from '@/lib/crypto';
import { eq }            from 'drizzle-orm';
import { NextResponse }  from 'next/server';
import type { GameState } from '@/types/game';

// Node.js runtime — Drizzle + @vercel/postgres don't run in edge
export const runtime = 'nodejs';

export async function GET() {
  // Graceful no-op when DB is not provisioned (local dev without POSTGRES_URL)
  if (!process.env.POSTGRES_URL) return NextResponse.json(null);

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const hashed = await hashSubject(session.user.id);
  const [row]  = await db.select()
    .from(schema.gameUsers)
    .where(eq(schema.gameUsers.googleSubHashed, hashed))
    .limit(1);

  if (!row) return NextResponse.json(null);

  return NextResponse.json({
    gameState: row.gameState,
    lastSeen:  row.lastSeen,
  });
}

export async function POST(req: Request) {
  if (!process.env.POSTGRES_URL) return NextResponse.json({ ok: true }); // silently skip

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { gameState: GameState; ageTier: string };

  // COPPA defense-in-depth: refuse to create rows for under-13
  if (!body.ageTier || body.ageTier === 'child') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ageTier = body.ageTier as 'teen' | 'adult';
  const hashed  = await hashSubject(session.user.id);
  const now     = new Date();

  await db.insert(schema.gameUsers)
    .values({
      googleSubHashed: hashed,
      ageTier,
      gameState: body.gameState,
      lastSeen:  now,
    })
    .onConflictDoUpdate({
      target: schema.gameUsers.googleSubHashed,
      set: { gameState: body.gameState, ageTier, lastSeen: now },
    });

  return NextResponse.json({ ok: true });
}
