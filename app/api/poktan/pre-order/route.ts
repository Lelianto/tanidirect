import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id')
    const poktanIdParam = request.nextUrl.searchParams.get('poktan_id')
    if (!userId && !poktanIdParam) {
      return NextResponse.json({ error: 'user_id atau poktan_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    let poktanId = poktanIdParam
    if (!poktanId && userId) {
      const { data: poktan } = await supabase.from('poktan').select('id').eq('ketua_id', userId).single()
      if (!poktan) return NextResponse.json({ error: 'Poktan tidak ditemukan' }, { status: 404 })
      poktanId = poktan.id
    }

    // Pre-orders matched to this poktan
    const { data: matched, error: matchedError } = await supabase
      .from('pre_order')
      .select('*, supplier:supplier_id(id, nama_perusahaan, rating, wilayah_operasi)')
      .eq('poktan_matched_id', poktanId!)
      .order('created_at', { ascending: false })

    if (matchedError) {
      return NextResponse.json({ error: matchedError.message }, { status: 500 })
    }

    // Also get open pre-orders (available for matching)
    const { data: open } = await supabase
      .from('pre_order')
      .select('*, supplier:supplier_id(id, nama_perusahaan, rating, wilayah_operasi)')
      .eq('status', 'open')
      .is('poktan_matched_id', null)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      success: true,
      matched: matched || [],
      open: open || [],
    })
  } catch (error) {
    console.error('Poktan pre-order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
