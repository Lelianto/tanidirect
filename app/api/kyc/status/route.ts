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
        .select('id, role, kyc_status, kyc_submitted_at, kyc_reviewed_at, kyc_reviewer_notes')
        .eq('id', userId)
        .single(),
      supabase.from('kyc_documents')
        .select('id, doc_type, file_path, status, reviewer_notes, uploaded_at, reviewed_at')
        .eq('user_id', userId),
      supabase.from('kyc_submissions')
        .select('*, documents:kyc_submission_documents(*)')
        .eq('user_id', userId)
        .order('layer', { ascending: true }),
    ])

    if (userRes.error) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    let submissions = submissionsRes.data || []
    const documents = docsRes.data || []

    // Self-healing: if user has uploaded KTP+selfie but no kyc_submissions record exists,
    // backfill the Layer 1 submission so the KYC status page shows correctly.
    const hasKtp = documents.some((d) => d.doc_type === 'ktp')
    const hasSelfie = documents.some((d) => d.doc_type === 'selfie')
    const hasLayer1Submission = submissions.some((s) => s.layer === 1)

    if (hasKtp && hasSelfie && !hasLayer1Submission) {
      const now = new Date().toISOString()

      const { data: submission } = await supabase
        .from('kyc_submissions')
        .upsert(
          {
            user_id: userId,
            user_role: userRes.data.role || 'petani',
            layer: 1,
            status: 'pending',
            submitted_at: now,
          },
          { onConflict: 'user_id,layer' }
        )
        .select('id')
        .single()

      if (submission) {
        // Link existing documents to the submission
        await supabase
          .from('kyc_submission_documents')
          .delete()
          .eq('submission_id', submission.id)

        const submissionDocs = documents
          .filter((d) => d.doc_type === 'ktp' || d.doc_type === 'selfie')
          .map((doc) => ({
            submission_id: submission.id,
            nama: doc.doc_type === 'ktp' ? 'Foto KTP' : 'Selfie + KTP',
            file_path: doc.file_path,
            status: 'pending' as const,
            uploaded_at: doc.uploaded_at || now,
          }))

        await supabase
          .from('kyc_submission_documents')
          .insert(submissionDocs)

        // Re-fetch submissions with documents
        const { data: refreshed } = await supabase
          .from('kyc_submissions')
          .select('*, documents:kyc_submission_documents(*)')
          .eq('user_id', userId)
          .order('layer', { ascending: true })

        submissions = refreshed || []
      }

      // Also ensure user kyc_status is at least docs_submitted
      if (
        !userRes.data.kyc_status ||
        userRes.data.kyc_status === 'pending' ||
        userRes.data.kyc_status === 'docs_incomplete'
      ) {
        await supabase
          .from('users')
          .update({ kyc_status: 'docs_submitted', kyc_submitted_at: now })
          .eq('id', userId)
        userRes.data.kyc_status = 'docs_submitted'
        userRes.data.kyc_submitted_at = now
      }
    }

    return NextResponse.json({
      success: true,
      kyc_status: userRes.data.kyc_status,
      kyc_submitted_at: userRes.data.kyc_submitted_at,
      kyc_reviewed_at: userRes.data.kyc_reviewed_at,
      kyc_reviewer_notes: userRes.data.kyc_reviewer_notes,
      documents,
      submissions,
    })
  } catch (error) {
    console.error('KYC status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
