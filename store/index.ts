import { create } from 'zustand'
import type { User, UserRole } from '@/types'
import { DEMO_USERS } from '@/lib/dummy'

interface AuthState {
  user: User | null
  role: UserRole | null
  hasAgreedSOP: boolean
  setUser: (user: User) => void
  switchRole: (role: UserRole) => void
  agreeSOP: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  hasAgreedSOP: false,
  setUser: (user) => set({ user, role: user.role, hasAgreedSOP: false }),
  switchRole: (role) => {
    const user = DEMO_USERS[role]
    set({ user, role, hasAgreedSOP: false })
  },
  agreeSOP: () => set({ hasAgreedSOP: true }),
  logout: () => set({ user: null, role: null, hasAgreedSOP: false }),
}))
