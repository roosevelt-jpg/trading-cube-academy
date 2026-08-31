import { NextResponse } from 'next/server'

/** Authoritative server time for quiz timer sync. */
export async function GET() {
  const now = Date.now()
  return NextResponse.json({ unix: now, iso: new Date(now).toISOString() })
}
