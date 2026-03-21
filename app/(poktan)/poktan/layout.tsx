'use client'

import { AppShell } from '@/components/shared/AppShell'

export default function PoktanLayout({ children }: { children: React.ReactNode }) {
  return <AppShell requiredRole="ketua_poktan">{children}</AppShell>
}
