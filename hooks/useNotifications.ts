'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'

export interface Notification {
  id: string
  user_id: string
  judul: string
  pesan: string
  tipe: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refetch: () => Promise<void>
}

const POLL_INTERVAL = 30_000 // 30 seconds fallback

export function useNotifications(): UseNotificationsReturn {
  const user = useAuthStore((s) => s.user)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const prevIdsRef = useRef<Set<string>>(new Set())
  const initialFetchDone = useRef(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/notif?user_id=${user.id}`)
      if (!res.ok) return
      const data = await res.json()
      const list: Notification[] = data.notifications || []

      // Detect new notifications (after initial fetch)
      if (initialFetchDone.current) {
        const prevIds = prevIdsRef.current
        const newOnes = list.filter((n) => !prevIds.has(n.id) && !n.is_read)
        for (const n of newOnes) {
          toast(n.judul, { description: n.pesan })
        }
      }

      prevIdsRef.current = new Set(list.map((n) => n.id))
      initialFetchDone.current = true
      setNotifications(list)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [user])

  // Initial fetch + polling
  useEffect(() => {
    if (!user) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!user) return

    let supabase: ReturnType<typeof createBrowserClient>
    try {
      supabase = createBrowserClient()
    } catch {
      return // env vars not set
    }

    const channel = supabase
      .channel(`notifikasi:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifikasi',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev])
          prevIdsRef.current.add(newNotif.id)
          toast(newNotif.judul, { description: newNotif.pesan })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifikasi',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n)),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    )
    await fetch('/api/notif', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: id }),
    })
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await fetch('/api/notif', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true, user_id: user.id }),
    })
  }, [user])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications }
}
