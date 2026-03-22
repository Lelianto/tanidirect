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

    const [poktanRes, anggotaRes, transaksiRes, qaRes, kontribusiRes] = await Promise.all([
      supabase.from('poktan').select('*').eq('id', poktanId!).single(),
      supabase.from('anggota_poktan').select('*, petani:petani_id(id, nama_lengkap, no_hp)').eq('poktan_id', poktanId!),
      supabase.from('transaksi').select('*').eq('poktan_id', poktanId!).order('created_at', { ascending: false }),
      supabase.from('qa_inspeksi').select('*').eq('poktan_id', poktanId!).order('created_at', { ascending: false }),
      supabase.from('kontribusi_petani').select('*, petani:petani_id(nama_lengkap)').eq('transaksi_id', poktanId!),
    ])

    // Get kontribusi for all poktan transactions
    const txIds = (transaksiRes.data || []).map(t => t.id)
    let kontribusi: unknown[] = []
    if (txIds.length > 0) {
      const { data } = await supabase
        .from('kontribusi_petani')
        .select('*, petani:petani_id(nama_lengkap)')
        .in('transaksi_id', txIds)
      kontribusi = data || []
    }

    const transaksi = transaksiRes.data || []
    const qaList = qaRes.data || []

    const stats = {
      totalAnggota: (anggotaRes.data || []).length,
      transaksiAktif: transaksi.filter(t => !['selesai', 'dibatalkan'].includes(t.status)).length,
      totalTransaksiSelesai: transaksi.filter(t => t.status === 'selesai').length,
      saldoFeeQA: qaList.reduce((sum, qa) => sum + (Number(qa.fee_dibayar) || 0), 0),
      ratingQA: qaList.length > 0
        ? Math.round(qaList.reduce((sum, qa) => sum + (Number(qa.skor_kualitas) || 0), 0) / qaList.length)
        : 0,
    }

    return NextResponse.json({
      success: true,
      poktan: poktanRes.data,
      anggota: anggotaRes.data || [],
      transaksi,
      qa_inspeksi: qaList,
      kontribusi,
      stats,
    })
  } catch (error) {
    console.error('Poktan dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
