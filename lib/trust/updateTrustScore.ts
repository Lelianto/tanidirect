import { createServiceClient } from '@/lib/supabase/server'

type TrustLevel = 'baru' | 'terpercaya' | 'andalan' | 'bintang'

function getTrustLevel(score: number): TrustLevel {
  if (score >= 85) return 'bintang'
  if (score >= 70) return 'andalan'
  if (score >= 40) return 'terpercaya'
  return 'baru'
}

function buildAlasan(transaksi: {
  has_dispute: boolean
  dispute_salah_poktan: boolean
  tiba_at: string | null
  estimasi_tiba_at: string | null
  rating_supplier: number | null
  selisih_volume_pct: number | null
}): string {
  const parts: string[] = []

  if (!transaksi.has_dispute) {
    parts.push('+5 transaksi selesai tanpa dispute')
  }

  if (transaksi.tiba_at && transaksi.estimasi_tiba_at && transaksi.tiba_at <= transaksi.estimasi_tiba_at) {
    parts.push('+3 pengiriman tepat waktu')
  }

  if (transaksi.rating_supplier && transaksi.rating_supplier >= 4) {
    parts.push('+2 rating supplier >= 4')
  }

  if (transaksi.dispute_salah_poktan) {
    parts.push('-5 dispute kesalahan poktan')
  }

  if (transaksi.selisih_volume_pct && transaksi.selisih_volume_pct > 10) {
    parts.push('-3 selisih volume > 10%')
  }

  return parts.join('; ') || 'Tidak ada perubahan'
}

export async function updateTrustScore(transaksiId: string) {
  const supabase = createServiceClient()

  // Ambil data transaksi
  const { data: transaksi, error: txError } = await supabase
    .from('transaksi')
    .select('*')
    .eq('id', transaksiId)
    .single()

  if (txError || !transaksi) {
    console.error('updateTrustScore: transaksi not found', transaksiId, txError)
    return
  }

  const userId = transaksi.poktan_user_id
  if (!userId) {
    console.error('updateTrustScore: no poktan_user_id on transaksi', transaksiId)
    return
  }

  // Hitung delta
  let delta = 0

  // +5 poin: transaksi selesai tanpa dispute
  if (transaksi.status === 'selesai' && !transaksi.has_dispute) delta += 5

  // +3 poin: pengiriman tepat waktu
  if (transaksi.tiba_at && transaksi.estimasi_tiba_at && transaksi.tiba_at <= transaksi.estimasi_tiba_at) delta += 3

  // +2 poin: Supplier beri rating >= 4
  if (transaksi.rating_supplier && transaksi.rating_supplier >= 4) delta += 2

  // -5 poin: dispute terbukti kesalahan Poktan
  if (transaksi.dispute_salah_poktan) delta -= 5

  // -3 poin: volume aktual kurang >10% dari yang dijanjikan
  if (transaksi.selisih_volume_pct && transaksi.selisih_volume_pct > 10) delta -= 3

  // Ambil skor sekarang
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('trust_score, trust_level')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    console.error('updateTrustScore: user not found', userId, userError)
    return
  }

  const skorLama = user.trust_score ?? 0
  const skorBaru = Math.min(100, Math.max(0, skorLama + delta))
  const levelBaru = getTrustLevel(skorBaru)

  // Update DB
  await supabase
    .from('users')
    .update({
      trust_score: skorBaru,
      trust_level: levelBaru,
      trust_updated: new Date().toISOString(),
    })
    .eq('id', userId)

  // Insert log
  await supabase.from('trust_score_log').insert({
    user_id: userId,
    transaksi_id: transaksiId,
    delta,
    skor_sebelum: skorLama,
    skor_sesudah: skorBaru,
    alasan: buildAlasan(transaksi),
  })

  // Notif ke Poktan jika naik level
  if (levelBaru !== user.trust_level && user.trust_level !== 'unverified') {
    await supabase.from('notifikasi').insert({
      user_id: userId,
      judul: 'Level Kepercayaan Naik!',
      pesan: `Selamat! Level kepercayaan Poktan Anda naik ke ${levelBaru.charAt(0).toUpperCase() + levelBaru.slice(1)}. Terus jaga kualitas dan konsistensi!`,
      tipe: 'trust_level_up',
      is_read: false,
    })
  }
}
