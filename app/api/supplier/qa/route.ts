import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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

    // Get transactions for this supplier
    const { data: transactions, error: txError } = await supabase
      .from('transaksi')
      .select('id')
      .eq('supplier_id', supplier_id)

    if (txError) {
      console.error('Transaction fetch error:', txError)
      return NextResponse.json(
        { error: 'Gagal mengambil data transaksi: ' + txError.message },
        { status: 500 }
      )
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ success: true, inspections: [] })
    }

    const txIds = transactions.map((t) => t.id)

    // Get QA inspections for those transactions
    const { data: inspections, error: qaError } = await supabase
      .from('qa_inspeksi')
      .select('*, transaksi(komoditas, grade)')
      .in('transaksi_id', txIds)
      .order('created_at', { ascending: false })

    if (qaError) {
      console.error('QA fetch error:', qaError)
      return NextResponse.json(
        { error: 'Gagal mengambil data QA: ' + qaError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      inspections: inspections || [],
    })
  } catch (error) {
    console.error('Supplier QA list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
