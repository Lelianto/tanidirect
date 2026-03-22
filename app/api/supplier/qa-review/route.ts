import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { qa_id, action, catatan, supplier_id } = await request.json()

    if (!qa_id || !action || !supplier_id) {
      return NextResponse.json(
        { error: 'qa_id, action, dan supplier_id wajib diisi' },
        { status: 400 }
      )
    }

    if (!['approved', 'disputed'].includes(action)) {
      return NextResponse.json(
        { error: 'action harus "approved" atau "disputed"' },
        { status: 400 }
      )
    }

    if (action === 'disputed' && !catatan) {
      return NextResponse.json(
        { error: 'Catatan wajib diisi untuk dispute' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Verify QA exists and belongs to supplier's transaction
    const { data: qa, error: qaError } = await supabase
      .from('qa_inspeksi')
      .select('id, transaksi_id, poktan_id, komoditas, supplier_review_status')
      .eq('id', qa_id)
      .single()

    if (qaError || !qa) {
      return NextResponse.json(
        { error: 'Inspeksi QA tidak ditemukan' },
        { status: 404 }
      )
    }

    if (qa.supplier_review_status !== 'pending') {
      return NextResponse.json(
        { error: 'Inspeksi QA sudah direview' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Update qa_inspeksi
    const updateData: Record<string, unknown> = {
      supplier_review_status: action,
      supplier_review_catatan: catatan || null,
      supplier_reviewed_at: now,
    }

    // If approved, set QA status to 'lulus'
    if (action === 'approved') {
      updateData.status = 'lulus'
    }

    const { error: updateError } = await supabase
      .from('qa_inspeksi')
      .update(updateData)
      .eq('id', qa_id)

    if (updateError) {
      console.error('QA review update error:', updateError)
      return NextResponse.json(
        { error: 'Gagal update review QA: ' + updateError.message },
        { status: 500 }
      )
    }

    // Get poktan ketua for notification
    if (qa.poktan_id) {
      const { data: poktan } = await supabase
        .from('poktan')
        .select('ketua_id')
        .eq('id', qa.poktan_id)
        .single()

      if (poktan) {
        const notifMsg = action === 'approved'
          ? {
              judul: 'Review QA Disetujui',
              pesan: `Supplier telah menyetujui hasil inspeksi QA untuk ${qa.komoditas}. Status: Lulus.`,
            }
          : {
              judul: 'Review QA Disengketakan',
              pesan: `Supplier mengajukan dispute untuk inspeksi QA ${qa.komoditas}. Alasan: ${catatan}`,
            }

        await supabase.from('notifikasi').insert({
          user_id: poktan.ketua_id,
          judul: notifMsg.judul,
          pesan: notifMsg.pesan,
          tipe: 'qa_review',
          link: '/poktan/qa',
          is_read: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      newStatus: action,
    })
  } catch (error) {
    console.error('QA review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
