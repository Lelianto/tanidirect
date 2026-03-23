'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useNotifications, type Notification } from '@/hooks/useNotifications'
import {
  Bell, CheckCheck, FileCheck, ClipboardCheck, Scale,
  CreditCard, ShoppingCart, AlertTriangle, Loader2, ScrollText, Inbox, Wallet,
} from 'lucide-react'

const TIPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  kyc_review: { icon: FileCheck, color: 'text-blue-600 bg-blue-100', label: 'KYC' },
  qa_review: { icon: ClipboardCheck, color: 'text-green-600 bg-green-100', label: 'QA' },
  dispute: { icon: Scale, color: 'text-orange-600 bg-orange-100', label: 'Sengketa' },
  kredit: { icon: CreditCard, color: 'text-purple-600 bg-purple-100', label: 'Kredit' },
  pre_order: { icon: ShoppingCart, color: 'text-tani-green bg-tani-green/10', label: 'Pre-Order' },
  pembayaran: { icon: Wallet, color: 'text-amber-600 bg-amber-100', label: 'Pembayaran' },
  pencairan: { icon: CreditCard, color: 'text-emerald-600 bg-emerald-100', label: 'Pencairan' },
  sop: { icon: ScrollText, color: 'text-gray-600 bg-gray-100', label: 'SOP' },
  anomali: { icon: AlertTriangle, color: 'text-red-600 bg-red-100', label: 'Anomali' },
}

function getNotifConfig(tipe: string | null) {
  if (tipe && TIPE_CONFIG[tipe]) return TIPE_CONFIG[tipe]
  return { icon: Bell, color: 'text-gray-600 bg-gray-100', label: 'Lainnya' }
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins}m lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}j lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}h lalu`
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

type FilterTab = 'semua' | 'belum_dibaca'

function NotificationItem({
  notif,
  onRead,
  onNavigate,
}: {
  notif: Notification
  onRead: (id: string) => void
  onNavigate: (link: string) => void
}) {
  const config = getNotifConfig(notif.tipe)
  const Icon = config.icon

  function handleClick() {
    if (!notif.is_read) onRead(notif.id)
    if (notif.link) onNavigate(notif.link)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50 ${
        notif.is_read ? 'opacity-60' : ''
      }`}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm truncate ${notif.is_read ? 'font-normal' : 'font-semibold'}`}>
            {notif.judul}
          </p>
          {!notif.is_read && (
            <span className="w-2 h-2 rounded-full bg-tani-green shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notif.pesan}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {timeAgo(notif.created_at)}
        </p>
      </div>
    </button>
  )
}

export function NotificationPopover() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [filter, setFilter] = useState<FilterTab>('semua')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const filtered = filter === 'belum_dibaca'
    ? notifications.filter((n) => !n.is_read)
    : notifications

  // Group by tipe
  const grouped = new Map<string, Notification[]>()
  for (const n of filtered) {
    const key = n.tipe || 'lainnya'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(n)
  }

  function handleNavigate(link: string) {
    setOpen(false)
    router.push(link)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 max-h-[480px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifikasi</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-tani-green hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-border">
          <button
            onClick={() => setFilter('semua')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'semua'
                ? 'bg-tani-green text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('belum_dibaca')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'belum_dibaca'
                ? 'bg-tani-green text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Belum Dibaca {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2" />
              <p className="text-sm">
                {filter === 'belum_dibaca' ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi'}
              </p>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([tipe, items]) => (
              <div key={tipe}>
                <div className="px-4 py-1.5 bg-muted/50">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {getNotifConfig(tipe).label}
                  </span>
                </div>
                {items.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onRead={markAsRead}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
