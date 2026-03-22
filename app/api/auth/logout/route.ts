import { NextResponse } from 'next/server'

export async function POST() {
  // Server-side logout is mostly a no-op since we use service role client.
  // The client should clear its local state and tokens.
  // If we had cookie-based sessions, we'd clear them here.

  return NextResponse.json({ success: true })
}
