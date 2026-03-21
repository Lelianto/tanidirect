'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardCheck, ShoppingCart, Truck,
  BarChart3, History, User,
} from 'lucide-react'
import { useAuthStore } from '@/store'
import type { UserRole } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  qa: ClipboardCheck,
  preorder: ShoppingCart,
  logistik: Truck,
  harga: BarChart3,
  riwayat: History,
  profil: User,
  transaksi: ShoppingCart,
}

interface NavItem {
  label: string
  href: string
  icon: string
}

const BOTTOM_NAV: Record<UserRole, NavItem[]> = {
  ketua_poktan: [
    { label: 'Dashboard', href: '/poktan/dashboard', icon: 'dashboard' },
    { label: 'QA', href: '/poktan/qa', icon: 'qa' },
    { label: 'Pre-Order', href: '/poktan/pre-order', icon: 'preorder' },
    { label: 'Logistik', href: '/poktan/logistik', icon: 'logistik' },
    { label: 'Profil', href: '/poktan/profil', icon: 'profil' },
  ],
  supplier: [
    { label: 'Dashboard', href: '/supplier/dashboard', icon: 'dashboard' },
    { label: 'Pre-Order', href: '/supplier/pre-order', icon: 'preorder' },
    { label: 'Harga', href: '/supplier/harga', icon: 'harga' },
    { label: 'Profil', href: '/supplier/profil', icon: 'profil' },
  ],
  petani: [
    { label: 'Dashboard', href: '/petani/dashboard', icon: 'dashboard' },
    { label: 'Riwayat', href: '/petani/riwayat', icon: 'riwayat' },
    { label: 'Profil', href: '/petani/profil', icon: 'profil' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Transaksi', href: '/admin/transaksi', icon: 'transaksi' },
    { label: 'Profil', href: '/admin/profil', icon: 'profil' },
  ],
}

export function BottomNav() {
  const pathname = usePathname()
  const role = useAuthStore((s) => s.role)

  if (!role) return null
  const items = BOTTOM_NAV[role] || []

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-colors ${
                isActive ? 'text-tani-green' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-tani-green mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
