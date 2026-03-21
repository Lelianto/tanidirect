'use client'

import { AppShell } from '@/components/shared/AppShell'

export default function PetaniLayout({ children }: { children: React.ReactNode }) {
  return <AppShell requiredRole="petani">{children}</AppShell>
}
