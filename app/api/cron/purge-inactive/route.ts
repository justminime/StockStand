/**
 * Cron job: purge game accounts inactive for > 90 days.
 *
 * Schedule: daily at 03:00 UTC (configured in vercel.json)
 * Security: Vercel sends "Authorization: Bearer <CRON_SECRET>" on every invocation.
 *
 * COPPA data retention requirement:
 *  "Auto-purge inactive teen/adult accounts after 90 days"
 *  (under-13 accounts are never created, so this only affects teen/adult rows)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, schema }  from '@/lib/db';
import { lt }          from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Verify Vercel Cron secret (prevents unauthorized triggering)
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.POSTGRES_URL) {
    return NextResponse.json({ skipped: true, reason: 'no db configured' });
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

  const result = await db
    .delete(schema.gameUsers)
    .where(lt(schema.gameUsers.lastSeen, cutoff));

  return NextResponse.json({
    ok:      true,
    deleted: (result as unknown as { rowCount?: number }).rowCount ?? 0,
    cutoff:  cutoff.toISOString(),
  });
}
