import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET — List pembayaran for a supplier
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplier_id = searchParams.get('supplier_id')
    const pre_order_id = searchParams.get('pre_order_id')

    if (!supplier_id) {
      return NextResponse.json({ error: 'supplier_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    let query = supabase
      .from('pembayaran_escrow')
      .select('*, pre_order(id, komoditas, grade, volume_kg, harga_penawaran_per_kg, status)')
      .eq('supplier_id', supplier_id)
      .order('created_at', { ascending: false })

    if (pre_order_id) {
      query = query.eq('pre_order_id', pre_order_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, pembayaran: data || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — Create pembayaran record when supplier submits pre-order
export async function POST(request: NextRequest) {
  try {
    const { pre_order_id, supplier_id, jenis_pembayaran } = await request.json()

    if (!pre_order_id || !supplier_id || !jenis_pembayaran) {
      return NextResponse.json(
        { error: 'pre_order_id, supplier_id, dan jenis_pembayaran wajib diisi' },
        { status: 400 }
      )
    }

    if (!['deposit', 'full'].includes(jenis_pembayaran)) {
      return NextResponse.json({ error: 'jenis_pembayaran harus "deposit" atau "full"' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check pre-order exists
    const { data: preOrder, error: poError } = await supabase
      .from('pre_order')
      .select('id, volume_kg, harga_penawaran_per_kg, supplier_id')
      .eq('id', pre_order_id)
      .single()

    if (poError || !preOrder) {
      return NextResponse.json({ error: 'Pre-order tidak ditemukan' }, { status: 404 })
    }

    // Check no existing active pembayaran
    const { data: existing } = await supabase
      .from('pembayaran_escrow')
      .select('id, status')
      .eq('pre_order_id', pre_order_id)
      .in('status', ['menunggu_pembayaran', 'menunggu_verifikasi', 'terverifikasi'])
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Sudah ada pembayaran aktif untuk pre-order ini', pembayaran_id: existing[0].id },
        { status: 409 }
      )
    }

    const totalNilai = Number(preOrder.volume_kg) * Number(preOrder.harga_penawaran_per_kg)
    const jumlah = jenis_pembayaran === 'deposit' ? totalNilai * 0.1 : totalNilai

    const { data: pembayaran, error: insertError } = await supabase
      .from('pembayaran_escrow')
      .insert({
        pre_order_id,
        supplier_id,
        jenis_pembayaran,
        jumlah,
        total_nilai_po: totalNilai,
        status: 'menunggu_pembayaran',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, pembayaran })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
