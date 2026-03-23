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

    // Resolve poktan_id from user_id if needed
    let poktanId = poktanIdParam
    if (!poktanId && userId) {
      const { data: poktan, error: poktanErr } = await supabase
        .from('poktan')
        .select('id')
        .eq('ketua_id', userId)
        .single()
      if (poktanErr || !poktan) {
        return NextResponse.json({ error: 'Poktan tidak ditemukan untuk user ini' }, { status: 404 })
      }
      poktanId = poktan.id
    }

    const [poktanRes, anggotaRes, transaksiRes, qaRes] = await Promise.all([
      supabase
        .from('poktan')
        .select('id, nama_poktan, kode_poktan, desa, kecamatan, kabupaten, provinsi, komoditas_utama, jumlah_anggota, skor_qa, skor_ketepatan, total_transaksi, is_qa_certified, status_sertifikasi, created_at')
        .eq('id', poktanId!)
        .single(),
      supabase
        .from('anggota_poktan')
        .select('id, poktan_id, petani_id, lahan_ha, komoditas, status, tanggal_bergabung, petani:petani_id(id, nama_lengkap, no_hp)')
        .eq('poktan_id', poktanId!),
      supabase
        .from('transaksi')
        .select('id, komoditas, grade, volume_estimasi_kg, volume_aktual_kg, harga_per_kg, total_nilai, status, created_at')
        .eq('poktan_id', poktanId!)
        .order('created_at', { ascending: false }),
      supabase
        .from('qa_inspeksi')
        .select('id, transaksi_id, grade_hasil, skor_kualitas, status, fee_qa, fee_dibayar, created_at')
        .eq('poktan_id', poktanId!)
        .order('created_at', { ascending: false }),
    ])

    // Get kontribusi for all poktan transactions
    const transaksi = transaksiRes.data || []
    const txIds = transaksi.map(t => t.id)
    let kontribusi: unknown[] = []
    if (txIds.length > 0) {
      const { data } = await supabase
        .from('kontribusi_petani')
        .select('*, petani:petani_id(nama_lengkap)')
        .in('transaksi_id', txIds)
      kontribusi = data || []
    }

    // Fetch pre-orders matching poktan's komoditas
    const komoditasUtama = poktanRes.data?.komoditas_utama
    let preOrdersTersedia: unknown[] = []
    if (komoditasUtama) {
      // Get all komoditas poktan produces (from anggota + poktan utama)
      const anggotaKomoditas = [...new Set((anggotaRes.data || []).map(a => a.komoditas).filter(Boolean))]
      const allKomoditas = [...new Set([komoditasUtama, ...anggotaKomoditas])]

      const { data: preOrders } = await supabase
        .from('pre_order')
        .select('id, komoditas, grade, volume_kg, harga_penawaran_per_kg, status, tanggal_dibutuhkan, supplier:supplier_id(nama_lengkap)')
        .in('komoditas', allKomoditas)
        .eq('status', 'open')
        .order('tanggal_dibutuhkan', { ascending: true })
        .limit(5)
      preOrdersTersedia = preOrders || []
    }

    // Fetch recent notifications for the user
    let notifikasiList: unknown[] = []
    if (userId) {
      const { data: notif } = await supabase
        .from('notifikasi')
        .select('id, judul, pesan, tipe, link, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
      notifikasiList = notif || []
    }

    const anggota = anggotaRes.data || []
    const qaList = qaRes.data || []
    const transaksiAktif = transaksi.filter(t => !['selesai', 'dibatalkan'].includes(t.status))

    const stats = {
      jumlah_anggota: anggota.filter(a => a.status === 'aktif').length || anggota.length,
      transaksi_aktif: transaksiAktif.length,
      total_transaksi_selesai: transaksi.filter(t => t.status === 'selesai').length,
      total_fee_qa: qaList.reduce((sum, qa) => sum + (Number(qa.fee_dibayar) || 0), 0),
      skor_qa: qaList.length > 0
        ? Math.round(qaList.reduce((sum, qa) => sum + (Number(qa.skor_kualitas) || 0), 0) / qaList.length)
        : poktanRes.data?.skor_qa || 0,
    }

    return NextResponse.json({
      success: true,
      poktan: poktanRes.data,
      anggota,
      transaksi,
      transaksi_aktif: transaksiAktif,
      pre_orders_tersedia: preOrdersTersedia,
      notifikasi: notifikasiList,
      qa_inspeksi: qaList,
      kontribusi,
      stats,
    })
  } catch (error) {
    console.error('Poktan dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
