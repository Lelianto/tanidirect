import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const {
      supplier_id,
      komoditas,
      grade,
      volume_kg,
      harga_penawaran_per_kg,
      tanggal_dibutuhkan,
      wilayah_tujuan,
      catatan_spesifikasi,
      catatan_kualitas_supplier,
    } = await request.json()

    if (!supplier_id || !komoditas || !grade || !volume_kg || !harga_penawaran_per_kg || !tanggal_dibutuhkan || !wilayah_tujuan) {
      return NextResponse.json(
        { error: 'supplier_id, komoditas, grade, volume_kg, harga_penawaran_per_kg, tanggal_dibutuhkan, dan wilayah_tujuan wajib diisi' },
        { status: 400 }
      )
    }

    if (!['A', 'B', 'C'].includes(grade)) {
      return NextResponse.json(
        { error: 'grade harus "A", "B", atau "C"' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Verify supplier exists
    const { data: supplier, error: supplierError } = await supabase
      .from('supplier')
      .select('id, user_id')
      .eq('id', supplier_id)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Supplier tidak ditemukan' },
        { status: 404 }
      )
    }

    const deposit_dibayar = Number(volume_kg) * Number(harga_penawaran_per_kg) * 0.10

    // If catatan_kualitas_supplier provided, call AI to generate QA steps
    let ai_qa_steps = null
    if (catatan_kualitas_supplier && catatan_kualitas_supplier.trim()) {
      try {
        const aiRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL ? request.nextUrl.origin : 'http://localhost:3000'}/api/ai/qa-notes`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              catatan: catatan_kualitas_supplier,
              komoditas,
              grade,
            }),
          }
        )
        if (aiRes.ok) {
          const aiData = await aiRes.json()
          if (aiData.steps && aiData.steps.length > 0) {
            ai_qa_steps = aiData.steps
          }
        }
      } catch (err) {
        console.error('AI QA steps generation failed (non-fatal):', err)
      }
    }

    // Insert pre_orders
    const { data: preOrder, error: insertError } = await supabase
      .from('pre_order')
      .insert({
        supplier_id,
        komoditas,
        grade,
        volume_kg: Number(volume_kg),
        harga_penawaran_per_kg: Number(harga_penawaran_per_kg),
        tanggal_dibutuhkan,
        wilayah_tujuan,
        catatan_spesifikasi: catatan_spesifikasi || null,
        catatan_kualitas_supplier: catatan_kualitas_supplier || null,
        ai_qa_steps: ai_qa_steps || null,
        deposit_dibayar,
        status: 'open',
      })
      .select('id, status, deposit_dibayar, created_at')
      .single()

    if (insertError) {
      console.error('Pre-order insert error:', insertError)
      return NextResponse.json(
        { error: 'Gagal membuat pre-order: ' + insertError.message },
        { status: 500 }
      )
    }

    // Insert notification for supplier
    await supabase.from('notifikasi').insert({
      user_id: supplier.user_id,
      judul: 'Pre-Order Dibuat',
      pesan: `Pre-order ${komoditas} Grade ${grade} sebanyak ${volume_kg} kg berhasil dibuat. Deposit: Rp ${deposit_dibayar.toLocaleString('id-ID')}.`,
      tipe: 'pre_order',
      link: '/supplier/pre-order',
      is_read: false,
    })

    return NextResponse.json({
      success: true,
      pre_order: preOrder,
    })
  } catch (error) {
    console.error('Pre-order create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplier_id = searchParams.get('supplier_id')

    if (!supplier_id) {
      return NextResponse.json(
        { error: 'supplier_id wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data: preOrders, error } = await supabase
      .from('pre_order')
      .select('*')
      .eq('supplier_id', supplier_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Pre-order fetch error:', error)
      return NextResponse.json(
        { error: 'Gagal mengambil data pre-order: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, pre_orders: preOrders || [] })
  } catch (error) {
    console.error('Pre-order list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
