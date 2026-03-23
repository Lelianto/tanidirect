'use client'

import { useState, useEffect } from 'react'
import type { KomoditasConfig } from '@/types'

let cache: KomoditasConfig[] | null = null

export function useKomoditasConfig() {
  const [list, setList] = useState<KomoditasConfig[]>(cache || [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    async function fetch_() {
      try {
        const res = await fetch('/api/admin/komoditas-config')
        const data = await res.json()
        if (data.success) {
          cache = data.komoditas_config
          setList(data.komoditas_config)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  // Just the nama list for dropdowns
  const namaList = list.map((k) => k.nama)

  return { list, namaList, loading }
}
