'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ClipboardCheck, ShoppingCart, Truck,
  BarChart3, CreditCard, ShieldAlert, Building2, LogOut, Leaf,
  History, User, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store'
import { useState } from 'react'
import type { UserRole } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  users: Users,
  qa: ClipboardCheck,
  preorder: ShoppingCart,
  logistik: Truck,
  harga: BarChart3,
  kredit: CreditCard,
  compliance: ShieldAlert,
  supplier: Building2,
  riwayat: History,
  profil: User,
  transaksi: ShoppingCart,
  poktan: Users,
}

interface NavItem {
  label: string
  href: string
  icon: string
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  ketua_poktan: [
    { label: 'Dashboard', href: '/poktan/dashboard', icon: 'dashboard' },
    { label: 'Anggota', href: '/poktan/anggota', icon: 'users' },
    { label: 'QA Inspeksi', href: '/poktan/qa', icon: 'qa' },
    { label: 'Permintaan Supplier', href: '/poktan/pre-order', icon: 'preorder' },
    { label: 'Logistik', href: '/poktan/logistik', icon: 'logistik' },
  ],
  supplier: [
    { label: 'Dashboard', href: '/supplier/dashboard', icon: 'dashboard' },
    { label: 'Pre-Order', href: '/supplier/pre-order', icon: 'preorder' },
    { label: 'Review QA', href: '/supplier/qa', icon: 'qa' },
    { label: 'Transaksi', href: '/supplier/transaksi', icon: 'transaksi' },
    { label: 'Prediksi Harga', href: '/supplier/harga', icon: 'harga' },
  ],
  petani: [
    { label: 'Dashboard', href: '/petani/dashboard', icon: 'dashboard' },
    { label: 'Riwayat', href: '/petani/riwayat', icon: 'riwayat' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Poktan', href: '/admin/poktan', icon: 'poktan' },
    { label: 'Supplier', href: '/admin/supplier', icon: 'supplier' },
    { label: 'Transaksi', href: '/admin/transaksi', icon: 'transaksi' },
    { label: 'Compliance', href: '/admin/compliance', icon: 'compliance' },
    { label: 'Kredit', href: '/admin/kredit', icon: 'kredit' },
  ],
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, role, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  if (!role) return null
  const items = NAV_ITEMS[role] || []

  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white border-r border-border z-50 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 h-14 px-4 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-tani-green text-white">
          <Leaf className="h-4 w-4" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg font-[family-name:var(--font-heading)] text-tani-green">
            TaniDirect
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-tani-green/10 text-tani-green'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-border p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-2 py-1">
            <p className="text-sm font-medium truncate">{user.nama_lengkap}</p>
            <p className="text-xs text-muted-foreground capitalize">{role?.replace('_', ' ')}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-red-600"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Keluar</span>}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  )
}
