'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { SOPAgreementModal } from './SOPAgreementModal'
import { useAuthStore } from '@/store'
import type { UserRole } from '@/types'

interface AppShellProps {
  children: React.ReactNode
  requiredRole: UserRole
}

export function AppShell({ children, requiredRole }: AppShellProps) {
  const router = useRouter()
  const { user, role, hasAgreedSOP } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Wait for Zustand persist to hydrate from localStorage
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    // If already hydrated (e.g. navigating between pages), set immediately
    if (useAuthStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  useEffect(() => {
    if (hydrated && (!user || role !== requiredRole)) {
      router.replace('/login')
    }
  }, [hydrated, user, role, requiredRole, router])

  if (!hydrated || !user || role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-3 border-muted border-t-tani-green animate-spin" />
      </div>
    )
  }

  const showSOPModal = role !== 'admin' && !hasAgreedSOP

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-60 transition-all duration-200">
        <main className="pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
      <SOPAgreementModal open={showSOPModal} />
    </div>
  )
}
