import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const [usersRes, poktanRes, supplierRes, transaksiRes, preOrderRes, disputeRes] = await Promise.all([
      supabase.from('users').select('id, role, is_verified, kyc_status, created_at'),
      supabase.from('poktan').select('id, nama_poktan, jumlah_anggota, skor_qa, total_transaksi'),
      supabase.from('supplier').select('id, nama_perusahaan, is_verified, rating, total_preorder'),
      supabase.from('transaksi').select('id, status, komoditas, total_nilai, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('pre_order').select('id, status, komoditas, volume_kg, created_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('disputes').select('id, status, kategori, created_at').order('created_at', { ascending: false }).limit(20),
    ])

    const users = usersRes.data || []
    const transaksi = transaksiRes.data || []

    const stats = {
      totalUsers: users.length,
      totalPetani: users.filter(u => u.role === 'petani').length,
      totalKetuaPoktan: users.filter(u => u.role === 'ketua_poktan').length,
      totalSupplier: users.filter(u => u.role === 'supplier').length,
      totalPoktan: (poktanRes.data || []).length,
      totalSupplierVerified: (supplierRes.data || []).filter(s => s.is_verified).length,
      totalTransaksi: transaksi.length,
      transaksiAktif: transaksi.filter(t => !['selesai', 'dibatalkan'].includes(t.status)).length,
      totalNilaiTransaksi: transaksi.reduce((sum, t) => sum + (Number(t.total_nilai) || 0), 0),
      kycPending: users.filter(u => u.kyc_status === 'docs_submitted').length,
      disputeAktif: (disputeRes.data || []).filter(d => d.status !== 'selesai').length,
    }

    return NextResponse.json({
      success: true,
      stats,
      users,
      poktan: poktanRes.data || [],
      supplier: supplierRes.data || [],
      transaksi,
      pre_orders: preOrderRes.data || [],
      disputes: disputeRes.data || [],
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
