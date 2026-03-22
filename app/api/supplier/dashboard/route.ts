import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supplierId = request.nextUrl.searchParams.get('supplier_id')
    if (!supplierId) {
      return NextResponse.json({ error: 'supplier_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const [supplierRes, preOrderRes, transaksiRes] = await Promise.all([
      supabase.from('supplier').select('*').eq('id', supplierId).single(),
      supabase.from('pre_order').select('*').eq('supplier_id', supplierId).order('created_at', { ascending: false }),
      supabase.from('transaksi').select('*').eq('supplier_id', supplierId).order('created_at', { ascending: false }),
    ])

    const txIds = (transaksiRes.data || []).map(t => t.id)
    let qaList: unknown[] = []
    if (txIds.length > 0) {
      const { data } = await supabase.from('qa_inspeksi').select('*').in('transaksi_id', txIds)
      qaList = data || []
    }

    const preOrders = preOrderRes.data || []
    const transaksi = transaksiRes.data || []

    const stats = {
      totalPreOrder: preOrders.length,
      preOrderAktif: preOrders.filter(po => ['open', 'matched', 'confirmed'].includes(po.status)).length,
      transaksiAktif: transaksi.filter(t => !['selesai', 'dibatalkan'].includes(t.status)).length,
      totalTransaksiSelesai: transaksi.filter(t => t.status === 'selesai').length,
      depositEscrow: Number(supplierRes.data?.deposit_escrow) || 0,
    }

    return NextResponse.json({
      success: true,
      supplier: supplierRes.data,
      pre_orders: preOrders,
      transaksi,
      qa_inspeksi: qaList,
      stats,
    })
  } catch (error) {
    console.error('Supplier dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
