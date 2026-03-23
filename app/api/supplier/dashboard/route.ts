import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id')
    const supplierIdParam = request.nextUrl.searchParams.get('supplier_id')
    if (!userId && !supplierIdParam) {
      return NextResponse.json({ error: 'user_id atau supplier_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    let supplierId = supplierIdParam
    if (!supplierId && userId) {
      const { data: supplier } = await supabase.from('supplier').select('id').eq('user_id', userId).single()
      if (!supplier) return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 })
      supplierId = supplier.id
    }

    const [supplierRes, preOrderRes, transaksiRes] = await Promise.all([
      supabase.from('supplier').select('id, nama_perusahaan, npwp, jenis_usaha, kapasitas_bulanan_ton, wilayah_operasi, deposit_escrow, rating, total_preorder, is_verified, created_at').eq('id', supplierId!).single(),
      supabase.from('pre_order').select('id, komoditas, grade, volume_kg, harga_penawaran_per_kg, tanggal_dibutuhkan, wilayah_tujuan, status, deposit_dibayar, poktan_matched_id, created_at').eq('supplier_id', supplierId!).order('created_at', { ascending: false }),
      supabase.from('transaksi').select('id, komoditas, grade, volume_estimasi_kg, volume_aktual_kg, harga_per_kg, total_nilai, status, created_at').eq('supplier_id', supplierId!).order('created_at', { ascending: false }),
    ])

    const txIds = (transaksiRes.data || []).map(t => t.id)
    let qaList: unknown[] = []
    if (txIds.length > 0) {
      const { data } = await supabase.from('qa_inspeksi').select('id, transaksi_id, grade_hasil, skor_kualitas, status, supplier_review_status, created_at').in('transaksi_id', txIds)
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
