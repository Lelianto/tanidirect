import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Get users whose KYC has been reviewed (approved or rejected)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, nama_lengkap, role, no_hp, kyc_status, kyc_submitted_at, kyc_reviewed_at, kyc_reviewer_notes')
      .not('kyc_status', 'in', '("pending","docs_submitted","docs_revision","docs_incomplete")')
      .not('kyc_status', 'is', 'null')
      .order('kyc_reviewed_at', { ascending: false })

    if (usersError) {
      console.error('KYC reviewed fetch error:', usersError)
      return NextResponse.json(
        { error: 'Gagal mengambil data: ' + usersError.message },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, reviewed: [] })
    }

    const userIds = users.map((u) => u.id)

    // Get kyc_documents for those users
    const { data: docs } = await supabase
      .from('kyc_documents')
      .select('user_id, doc_type, file_path, status')
      .in('user_id', userIds)

    const docsByUser = new Map<string, typeof docs>()
    for (const doc of docs || []) {
      const existing = docsByUser.get(doc.user_id) || []
      existing.push(doc)
      docsByUser.set(doc.user_id, existing)
    }

    const reviewed = users.map((u) => ({
      id: u.id,
      user_id: u.id,
      user_nama: u.nama_lengkap,
      user_role: u.role,
      kyc_status: u.kyc_status,
      kyc_submitted_at: u.kyc_submitted_at,
      kyc_reviewed_at: u.kyc_reviewed_at,
      kyc_reviewer_notes: u.kyc_reviewer_notes,
      docs: docsByUser.get(u.id) || [],
    }))

    return NextResponse.json({ success: true, reviewed })
  } catch (error) {
    console.error('KYC reviewed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
