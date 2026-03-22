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

    if (!['ktp', 'selfie'].includes(docType)) {
      return NextResponse.json(
        { error: 'doc_type harus "ktp" atau "selfie"' },
        { status: 400 }
      )
    }

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

    // Check if both KTP and selfie are uploaded
    const { data: docs } = await supabase
      .from('kyc_documents')
      .select('doc_type')
      .eq('user_id', userId)

    const uploadedTypes = (docs || []).map((d) => d.doc_type)
    const allDocsUploaded = uploadedTypes.includes('ktp') && uploadedTypes.includes('selfie')

    if (allDocsUploaded) {
      // Update user kyc_status to docs_submitted
      await supabase
        .from('users')
        .update({
          kyc_status: 'docs_submitted',
          kyc_submitted_at: new Date().toISOString(),
        })
        .eq('id', userId)

      // Insert notification for admin
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          judul: 'Dokumen KYC Baru',
          pesan: `User ${userId} telah mengirimkan dokumen KYC untuk direview.`,
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
        notes: 'Semua dokumen KYC telah diupload (KTP + Selfie)',
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
