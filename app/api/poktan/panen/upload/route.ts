import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTOS = 3

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const userId = formData.get('user_id') as string | null

    if (!userId || files.length === 0) {
      return NextResponse.json({ error: 'user_id dan minimal 1 file wajib diisi' }, { status: 400 })
    }

    if (files.length > MAX_PHOTOS) {
      return NextResponse.json({ error: `Maksimal ${MAX_PHOTOS} foto` }, { status: 400 })
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File "${file.name}" melebihi 5MB` }, { status: 400 })
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `File "${file.name}" harus JPG, PNG, atau WebP` }, { status: 400 })
      }
    }

    const supabase = createServiceClient()
    const uploadedUrls: string[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `foto-panen/${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

      const arrayBuffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('platform-assets')
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        return NextResponse.json({ error: 'Gagal upload: ' + uploadError.message }, { status: 500 })
      }

      uploadedUrls.push(filePath)
    }

    return NextResponse.json({ success: true, foto_urls: uploadedUrls })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
