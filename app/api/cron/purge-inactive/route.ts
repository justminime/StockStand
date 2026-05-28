import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO Wave 6: delete from users where last_seen < 90 days ago
  return NextResponse.json({
    message: 'ok',
    deleted: 0,
    note:    'Full purge logic added in Wave 6',
  });
}
