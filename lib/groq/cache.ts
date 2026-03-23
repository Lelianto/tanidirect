import { createServiceClient } from '@/lib/supabase/server'

interface CacheEntry {
  response: unknown
}

export async function getCache(endpoint: string, cacheKey: string): Promise<unknown | null> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('ai_cache')
      .select('response')
      .eq('endpoint', endpoint)
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) return null
    return (data as CacheEntry).response
  } catch {
    return null
  }
}

export async function setCache(
  endpoint: string,
  cacheKey: string,
  response: unknown,
  ttlHours: number,
): Promise<void> {
  try {
    const supabase = createServiceClient()
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()

    await supabase
      .from('ai_cache')
      .upsert(
        {
          endpoint,
          cache_key: cacheKey,
          response,
          expires_at: expiresAt,
        },
        { onConflict: 'endpoint,cache_key' },
      )
  } catch (err) {
    console.error('setCache error:', err)
  }
}

export async function invalidateCache(endpoint: string, cacheKey?: string): Promise<void> {
  try {
    const supabase = createServiceClient()
    let query = supabase.from('ai_cache').delete().eq('endpoint', endpoint)
    if (cacheKey) {
      query = query.eq('cache_key', cacheKey)
    }
    await query
  } catch (err) {
    console.error('invalidateCache error:', err)
  }
}
