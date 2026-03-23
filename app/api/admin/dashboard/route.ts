import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const [usersRes, poktanRes, supplierRes, transaksiRes, anomaliRes, kreditRes, disputeRes] = await Promise.all([
      supabase.from('users').select('id, role, is_verified, kyc_status, created_at'),
      supabase.from('poktan').select('id, nama_poktan, jumlah_anggota, skor_qa, total_transaksi'),
      supabase.from('supplier').select('id, nama_perusahaan, is_verified, rating, total_preorder'),
      supabase.from('transaksi').select('id, status, komoditas, total_nilai, harga_per_kg, komisi_platform, volume_aktual_kg, volume_estimasi_kg, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('anomali_log').select('*, poktan:poktan_id(id, nama_poktan)').eq('status_tindak_lanjut', 'open').order('scanned_at', { ascending: false }).limit(5),
      supabase.from('kredit').select('*, petani:petani_id(id, nama_lengkap)').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      supabase.from('disputes').select('id, status, kategori, created_at').order('created_at', { ascending: false }).limit(20),
    ])

    const users = usersRes.data || []
    const transaksi = transaksiRes.data || []
    const anomaliOpen = anomaliRes.data || []
    const kreditPending = kreditRes.data || []

    const totalKomisi = transaksi.reduce((sum, t) => sum + (Number(t.komisi_platform) || 0), 0)
    const totalVolume = transaksi
      .filter(t => t.status === 'selesai')
      .reduce((sum, t) => sum + (Number(t.volume_aktual_kg) || Number(t.volume_estimasi_kg) || 0), 0)

    const stats = {
      total_users: users.length,
      poktan_aktif: (poktanRes.data || []).length,
      supplier_verified: (supplierRes.data || []).filter(s => s.is_verified).length,
      transaksi_selesai: transaksi.filter(t => t.status === 'selesai').length,
      total_komisi: totalKomisi,
      total_volume: totalVolume,
      anomali_open: anomaliOpen.length,
      kredit_pending: kreditPending.length,
      pre_order_open: 0,
      disputes_aktif: (disputeRes.data || []).filter(d => d.status !== 'selesai').length,
    }

    return NextResponse.json({
      success: true,
      stats,
      recent_anomali: anomaliOpen,
      recent_kredit: kreditPending,
      transaksi,
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
