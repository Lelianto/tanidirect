'use client'

import { AppShell } from '@/components/shared/AppShell'

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <AppShell requiredRole="supplier">{children}</AppShell>
}
