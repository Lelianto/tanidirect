import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Get users with pending KYC status
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, nama_lengkap, role, no_hp, kyc_status, kyc_submitted_at, kyc_reviewer_notes')
      .in('kyc_status', ['docs_submitted', 'docs_revision'])
      .order('kyc_submitted_at', { ascending: true })

    if (usersError) {
      console.error('KYC queue fetch error:', usersError)
      return NextResponse.json(
        { error: 'Gagal mengambil antrian KYC: ' + usersError.message },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, queue: [] })
    }

    const userIds = users.map((u) => u.id)

    // Get kyc_documents for those users
    const { data: docs, error: docsError } = await supabase
      .from('kyc_documents')
      .select('user_id, doc_type, file_path, status')
      .in('user_id', userIds)

    if (docsError) {
      console.error('KYC docs fetch error:', docsError)
    }

    const docsByUser = new Map<string, typeof docs>()
    for (const doc of docs || []) {
      const existing = docsByUser.get(doc.user_id) || []
      existing.push(doc)
      docsByUser.set(doc.user_id, existing)
    }

    const queue = users.map((u) => {
      const submittedAt = u.kyc_submitted_at ? new Date(u.kyc_submitted_at) : new Date()
      const daysWaiting = Math.floor((Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: u.id,
        user_id: u.id,
        user_nama: u.nama_lengkap,
        user_role: u.role,
        kyc_status: u.kyc_status,
        kyc_submitted_at: u.kyc_submitted_at,
        kyc_reviewer_notes: u.kyc_reviewer_notes,
        docs: docsByUser.get(u.id) || [],
        days_waiting: daysWaiting,
      }
    })

    return NextResponse.json({ success: true, queue })
  } catch (error) {
    console.error('KYC queue error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
