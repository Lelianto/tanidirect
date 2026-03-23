import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const results: Record<string, number> = {}

    // 1. Delete expired ai_cache
    const { data: expiredCache } = await supabase
      .from('ai_cache')
      .select('id')
      .lt('expires_at', new Date().toISOString())

    if (expiredCache && expiredCache.length > 0) {
      await supabase
        .from('ai_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
      results.ai_cache_deleted = expiredCache.length
    } else {
      results.ai_cache_deleted = 0
    }

    // 2. Delete read notifications older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: oldNotifs } = await supabase
      .from('notifikasi')
      .select('id')
      .eq('is_read', true)
      .lt('created_at', thirtyDaysAgo)

    if (oldNotifs && oldNotifs.length > 0) {
      await supabase
        .from('notifikasi')
        .delete()
        .eq('is_read', true)
        .lt('created_at', thirtyDaysAgo)
      results.notifikasi_deleted = oldNotifs.length
    } else {
      results.notifikasi_deleted = 0
    }

    return NextResponse.json({
      success: true,
      cleanup: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron cleanup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
