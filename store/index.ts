import { create } from 'zustand'
import type { User, UserRole } from '@/types'
import { DEMO_USERS } from '@/lib/dummy'

interface AuthState {
  user: User | null
  role: UserRole | null
  setUser: (user: User) => void
  switchRole: (role: UserRole) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  setUser: (user) => set({ user, role: user.role }),
  switchRole: (role) => {
    const user = DEMO_USERS[role]
    set({ user, role })
  },
  logout: () => set({ user: null, role: null }),
}))
