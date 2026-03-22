import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const FONNTE_API_URL = 'https://api.fonnte.com/send'

async function sendWhatsApp(phone: string, message: string) {
  const apiKey = process.env.FONNTE_API_KEY
  if (!apiKey) {
    console.warn('FONNTE_API_KEY not configured, skipping WhatsApp notification')
    return
  }

  try {
    const res = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: phone,
        message,
        countryCode: '62',
      }),
    })

    if (!res.ok) {
      console.error('Fonnte API error:', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    console.error('WhatsApp send error:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, notes, adminId } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId dan action wajib diisi' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject', 'revision'].includes(action)) {
      return NextResponse.json(
        { error: 'action harus "approve", "reject", atau "revision"' },
        { status: 400 }
      )
    }

    if ((action === 'reject' || action === 'revision') && !notes) {
      return NextResponse.json(
        { error: 'Catatan wajib diisi untuk reject dan revision' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Map action to kyc_status
    const statusMap: Record<string, string> = {
      approve: 'layer1_passed',
      reject: 'layer1_failed',
      revision: 'docs_revision',
    }

    const newStatus = statusMap[action]

    // Update user kyc_status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        kyc_status: newStatus,
        kyc_reviewed_at: new Date().toISOString(),
        kyc_reviewer_id: adminId || null,
        kyc_reviewer_notes: notes || null,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('User update error:', updateError)
      return NextResponse.json(
        { error: 'Gagal update status KYC: ' + updateError.message },
        { status: 500 }
      )
    }

    // Update document statuses
    if (action === 'approve') {
      await supabase
        .from('kyc_documents')
        .update({ status: 'verified', reviewed_at: new Date().toISOString() })
        .eq('user_id', userId)
    } else if (action === 'reject') {
      await supabase
        .from('kyc_documents')
        .update({
          status: 'rejected',
          reviewer_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    }

    // Insert audit log
    await supabase.from('kyc_audit_log').insert({
      user_id: userId,
      admin_id: adminId || null,
      action: `kyc_${action}`,
      notes: notes || `KYC ${action} oleh admin`,
    })

    // Send WhatsApp notification
    const { data: userData } = await supabase
      .from('users')
      .select('no_hp, nama_lengkap')
      .eq('id', userId)
      .single()

    if (userData?.no_hp) {
      const messages: Record<string, string> = {
        approve: `✅ Dokumen identitas Anda sudah diverifikasi di taninesia. Silakan lanjutkan ke langkah berikutnya.`,
        reject: `❌ Verifikasi dokumen ditolak. Alasan: ${notes}. Hubungi support jika ada pertanyaan.`,
        revision: `⚠️ Dokumen Anda perlu diperbaiki. Catatan: ${notes}. Silakan upload ulang di taninesia.`,
      }

      await sendWhatsApp(userData.no_hp, messages[action])
    }

    // Send in-app notification to user
    const notifMessages: Record<string, { judul: string; pesan: string }> = {
      approve: {
        judul: 'KYC Disetujui',
        pesan: 'Dokumen identitas Anda telah diverifikasi. Selamat!',
      },
      reject: {
        judul: 'KYC Ditolak',
        pesan: `Verifikasi ditolak. Alasan: ${notes}`,
      },
      revision: {
        judul: 'KYC Perlu Revisi',
        pesan: `Dokumen perlu diperbaiki. Catatan: ${notes}`,
      },
    }

    await supabase.from('notifikasi').insert({
      user_id: userId,
      judul: notifMessages[action].judul,
      pesan: notifMessages[action].pesan,
      tipe: 'kyc_review',
      link: action === 'revision' ? '/register/kyc' : undefined,
      is_read: false,
    })

    return NextResponse.json({ success: true, newStatus })
  } catch (error) {
    console.error('KYC review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
