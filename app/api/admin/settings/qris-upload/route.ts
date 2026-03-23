import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const adminId = formData.get('admin_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File wajib diisi' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Ukuran file maksimum 2MB' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus JPG, PNG, atau WebP' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const ext = file.name.split('.').pop() || 'png'
    const filePath = `platform/qris_${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('platform-assets')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('QRIS upload error:', uploadError)
      return NextResponse.json({ error: 'Gagal upload: ' + uploadError.message }, { status: 500 })
    }

    // Update platform_config
    const { error: dbError } = await supabase
      .from('platform_config')
      .update({
        value: { image_path: filePath, merchant_name: 'Taninesia' },
        updated_at: new Date().toISOString(),
        updated_by: adminId || null,
      })
      .eq('key', 'qris')

    if (dbError) {
      return NextResponse.json({ error: 'Gagal update config: ' + dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, filePath })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
