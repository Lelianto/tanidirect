import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = formData.get('user_id') as string
    const docType = formData.get('doc_type') as string
    const file = formData.get('file') as File | null

    if (!userId || !docType || !file) {
      return NextResponse.json(
        { error: 'user_id, doc_type, dan file wajib diisi' },
        { status: 400 }
      )
    }

    const validDocTypes = ['ktp', 'selfie', 'surat_bpp', 'rekening']
    if (!validDocTypes.includes(docType)) {
      return NextResponse.json(
        { error: `doc_type harus salah satu dari: ${validDocTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const layer = parseInt(formData.get('layer') as string || '1', 10)

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file maksimum 5MB' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file harus JPG, PNG, atau WebP' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Generate file path
    const ext = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const filePath = `${userId}/${docType}_${timestamp}.${ext}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Gagal mengupload file: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Upsert record in kyc_documents
    const { error: dbError } = await supabase
      .from('kyc_documents')
      .upsert(
        {
          user_id: userId,
          doc_type: docType,
          file_path: filePath,
          status: 'uploaded',
          uploaded_at: new Date().toISOString(),
          reviewed_at: null,
          reviewer_notes: null,
        },
        { onConflict: 'user_id,doc_type' }
      )

    if (dbError) {
      console.error('Database upsert error:', dbError)
      return NextResponse.json(
        { error: 'Gagal menyimpan data dokumen: ' + dbError.message },
        { status: 500 }
      )
    }

    // Check if all docs for this layer are uploaded
    const LAYER_DOC_TYPES: Record<number, string[]> = {
      1: ['ktp', 'selfie'],
      2: ['surat_bpp', 'rekening'],
    }

    const DOC_LABELS: Record<string, string> = {
      ktp: 'Foto KTP',
      selfie: 'Selfie + KTP',
      surat_bpp: 'Surat Rekomendasi BPP',
      rekening: 'Foto Buku Rekening',
    }

    const requiredDocs = LAYER_DOC_TYPES[layer] || LAYER_DOC_TYPES[1]

    const { data: docs } = await supabase
      .from('kyc_documents')
      .select('doc_type')
      .eq('user_id', userId)

    const uploadedTypes = (docs || []).map((d) => d.doc_type)
    const allDocsUploaded = requiredDocs.every((dt) => uploadedTypes.includes(dt))

    if (allDocsUploaded) {
      const now = new Date().toISOString()

      // Update user kyc_status to docs_submitted (only for layer 1, or if not yet set)
      if (layer === 1) {
        await supabase
          .from('users')
          .update({
            kyc_status: 'docs_submitted',
            kyc_submitted_at: now,
          })
          .eq('id', userId)
      }

      // Fetch user profile for kyc_submissions & notifications
      const { data: userProfile } = await supabase
        .from('users')
        .select('role, nama_lengkap')
        .eq('id', userId)
        .single()

      // Create/update kyc_submissions for the current layer
      const { data: submission } = await supabase
        .from('kyc_submissions')
        .upsert(
          {
            user_id: userId,
            user_role: userProfile?.role || 'petani',
            layer,
            status: 'pending',
            submitted_at: now,
          },
          { onConflict: 'user_id,layer' }
        )
        .select('id')
        .single()

      // Create submission documents linked to the submission
      if (submission) {
        const { data: kycDocs } = await supabase
          .from('kyc_documents')
          .select('doc_type, file_path')
          .eq('user_id', userId)
          .in('doc_type', requiredDocs)

        if (kycDocs && kycDocs.length > 0) {
          // Delete old submission documents and re-insert
          await supabase
            .from('kyc_submission_documents')
            .delete()
            .eq('submission_id', submission.id)

          const submissionDocs = kycDocs.map((doc) => ({
            submission_id: submission.id,
            nama: DOC_LABELS[doc.doc_type] || doc.doc_type,
            file_path: doc.file_path,
            status: 'pending' as const,
            uploaded_at: now,
          }))

          await supabase
            .from('kyc_submission_documents')
            .insert(submissionDocs)
        }
      }

      // Insert notification for admin
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          judul: `Dokumen KYC Layer ${layer} Baru`,
          pesan: `${userProfile?.nama_lengkap || 'User'} telah mengirimkan dokumen KYC Layer ${layer} untuk direview.`,
          tipe: 'kyc_review',
          link: '/admin/kyc',
          is_read: false,
        }))

        await supabase.from('notifikasi').insert(notifications)
      }

      // Insert audit log
      await supabase.from('kyc_audit_log').insert({
        user_id: userId,
        action: 'docs_submitted',
        notes: `Dokumen KYC Layer ${layer} telah diupload (${requiredDocs.join(', ')})`,
      })
    }

    return NextResponse.json({
      success: true,
      allDocsUploaded,
      filePath,
    })
  } catch (error) {
    console.error('KYC upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
