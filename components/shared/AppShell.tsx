'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useAuthStore } from '@/store'
import type { UserRole } from '@/types'

interface AppShellProps {
  children: React.ReactNode
  requiredRole: UserRole
}

export function AppShell({ children, requiredRole }: AppShellProps) {
  const router = useRouter()
  const { user, role } = useAuthStore()

  useEffect(() => {
    if (!user || role !== requiredRole) {
      router.replace('/login')
    }
  }, [user, role, requiredRole, router])

  if (!user || role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-3 border-muted border-t-tani-green animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-60 transition-all duration-200">
        <main className="pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
