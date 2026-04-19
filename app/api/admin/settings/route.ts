import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'

// GET: ambil semua platform config
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth
    const { data, error } = await supabase
      .from('platform_config')
      .select('key, value, updated_at')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform array ke object { rekening_escrow: {...}, qris: {...} }
    const config: Record<string, unknown> = {}
    for (const row of data || []) {
      config[row.key] = row.value
    }

    return NextResponse.json(config)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: update satu key di platform config
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

    const { key, value, adminId } = await request.json()

    if (!key || !value) {
      return NextResponse.json({ error: 'key dan value wajib diisi' }, { status: 400 })
    }

    const { error } = await supabase
      .from('platform_config')
      .update({
        value,
        updated_at: new Date().toISOString(),
        updated_by: adminId || null,
      })
      .eq('key', key)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
