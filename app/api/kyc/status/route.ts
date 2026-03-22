import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ error: 'user_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const [userRes, docsRes, submissionsRes] = await Promise.all([
      supabase.from('users')
        .select('id, kyc_status, kyc_submitted_at, kyc_reviewed_at, kyc_reviewer_notes')
        .eq('id', userId)
        .single(),
      supabase.from('kyc_documents')
        .select('*')
        .eq('user_id', userId),
      supabase.from('kyc_submissions')
        .select('*, documents:kyc_submission_documents(*)')
        .eq('user_id', userId)
        .order('layer', { ascending: true }),
    ])

    if (userRes.error) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      kyc_status: userRes.data.kyc_status,
      kyc_submitted_at: userRes.data.kyc_submitted_at,
      kyc_reviewed_at: userRes.data.kyc_reviewed_at,
      kyc_reviewer_notes: userRes.data.kyc_reviewer_notes,
      documents: docsRes.data || [],
      submissions: submissionsRes.data || [],
    })
  } catch (error) {
    console.error('KYC status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
