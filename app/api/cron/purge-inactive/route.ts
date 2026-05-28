import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron placeholder — no-op in the anonymous localStorage-only game.
 * Kept wired in vercel.json so the endpoint exists if a DB is ever added.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, deleted: 0, note: 'anonymous game — no DB' });
}
