import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per photo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const transaksi_id = formData.get('transaksi_id') as string
    const poktan_id = formData.get('poktan_id') as string
    const inspektor_id = formData.get('inspektor_id') as string
    const komoditas = formData.get('komoditas') as string
    const volume_inspeksi_kg = formData.get('volume_inspeksi_kg') as string
    const grade_hasil = formData.get('grade_hasil') as string
    const skor_kualitas = formData.get('skor_kualitas') as string
    const hasil_aktual = formData.get('hasil_aktual') as string
    const catatan_inspektor = formData.get('catatan_inspektor') as string
    const grade_rekomendasi_sistem = formData.get('grade_rekomendasi_sistem') as string
    const grade_override_reason = formData.get('grade_override_reason') as string

    const fotoBatch = formData.get('foto_batch') as File | null
    const fotoDetail = formData.get('foto_detail') as File | null
    const fotoTimbangan = formData.get('foto_timbangan') as File | null

    // Validation
    if (!transaksi_id || !poktan_id || !inspektor_id || !komoditas) {
      return NextResponse.json(
        { error: 'transaksi_id, poktan_id, inspektor_id, dan komoditas wajib diisi' },
        { status: 400 }
      )
    }

    if (!fotoBatch || !fotoDetail || !fotoTimbangan) {
      return NextResponse.json(
        { error: 'Ketiga foto (batch, detail, timbangan) wajib diupload' },
        { status: 400 }
      )
    }

    // Validate file types and sizes
    for (const [label, file] of [['batch', fotoBatch], ['detail', fotoDetail], ['timbangan', fotoTimbangan]] as [string, File][]) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Foto ${label}: ukuran file maksimum 10MB` },
          { status: 400 }
        )
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Foto ${label}: format file harus JPG, PNG, atau WebP` },
          { status: 400 }
        )
      }
    }

    const supabase = createServiceClient()

    // Upload 3 photos to storage
    const foto_urls: string[] = []
    const timestamp = Date.now()

    for (const [key, file] of [['batch', fotoBatch], ['detail', fotoDetail], ['timbangan', fotoTimbangan]] as [string, File][]) {
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${transaksi_id}/${key}_${timestamp}.${ext}`

      const arrayBuffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('qa-photos')
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error(`Upload foto ${key} error:`, uploadError)
        return NextResponse.json(
          { error: `Gagal upload foto ${key}: ${uploadError.message}` },
          { status: 500 }
        )
      }

      foto_urls.push(filePath)
    }

    // Parse hasil_aktual JSON
    let parsedHasilAktual = null
    if (hasil_aktual) {
      try {
        parsedHasilAktual = JSON.parse(hasil_aktual)
      } catch {
        // Non-fatal: store as null if invalid JSON
      }
    }

    // Calculate fee
    const volume = Number(volume_inspeksi_kg) || 0
    const fee_qa = volume * 50 // Rp 50/kg
    const potongan_fee_persen = 0
    const fee_dibayar = fee_qa * (1 - potongan_fee_persen / 100)

    // Insert qa_inspeksi
    const { data: qa, error: insertError } = await supabase
      .from('qa_inspeksi')
      .insert({
        transaksi_id,
        poktan_id,
        inspektor_id,
        jenis_inspektor: 'ketua_poktan',
        komoditas,
        volume_inspeksi_kg: volume || null,
        grade_hasil: grade_hasil || null,
        skor_kualitas: skor_kualitas ? Number(skor_kualitas) : null,
        foto_urls,
        catatan_inspektor: catatan_inspektor || null,
        status: 'perlu_tinjauan',
        hasil_aktual: parsedHasilAktual,
        fee_qa,
        fee_dibayar,
        potongan_fee_persen,
        grade_rekomendasi_sistem: grade_rekomendasi_sistem || null,
        grade_override_reason: grade_override_reason || null,
        supplier_review_status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('QA inspeksi insert error:', insertError)
      return NextResponse.json(
        { error: 'Gagal menyimpan inspeksi QA: ' + insertError.message },
        { status: 500 }
      )
    }

    // Get supplier user_id for notification
    const { data: transaksi } = await supabase
      .from('transaksi')
      .select('supplier_id')
      .eq('id', transaksi_id)
      .single()

    if (transaksi) {
      const { data: supplier } = await supabase
        .from('supplier')
        .select('user_id')
        .eq('id', transaksi.supplier_id)
        .single()

      if (supplier) {
        await supabase.from('notifikasi').insert({
          user_id: supplier.user_id,
          judul: 'Inspeksi QA Selesai — Perlu Review',
          pesan: `Inspeksi QA untuk ${komoditas} telah dilakukan. Grade hasil: ${grade_hasil || '-'}. Silakan tinjau hasil inspeksi.`,
          tipe: 'qa_review',
          link: '/supplier/qa',
          is_read: false,
        })
      }
    }

    return NextResponse.json({ success: true, qa_id: qa.id })
  } catch (error) {
    console.error('QA inspeksi error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const poktan_id = searchParams.get('poktan_id')

    if (!poktan_id) {
      return NextResponse.json(
        { error: 'poktan_id wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data: inspections, error: qaError } = await supabase
      .from('qa_inspeksi')
      .select('*, transaksi(*)')
      .eq('poktan_id', poktan_id)
      .order('created_at', { ascending: false })

    if (qaError) {
      console.error('QA fetch error:', qaError)
      return NextResponse.json(
        { error: 'Gagal mengambil data QA: ' + qaError.message },
        { status: 500 }
      )
    }

    // Also get transactions that need QA
    const { data: transactions, error: txError } = await supabase
      .from('transaksi')
      .select('*')
      .eq('poktan_id', poktan_id)
      .in('status', ['dikonfirmasi', 'dalam_pengiriman', 'tiba_di_gudang'])
      .order('created_at', { ascending: false })

    if (txError) {
      console.error('Transaction fetch error:', txError)
      return NextResponse.json(
        { error: 'Gagal mengambil data transaksi: ' + txError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      inspections: inspections || [],
      transactions: transactions || [],
    })
  } catch (error) {
    console.error('QA list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
