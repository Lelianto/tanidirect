import { create } from 'zustand'
import type { User, UserRole } from '@/types'

const DEMO_USERS: Record<string, User> = {
  ketua_poktan: {
    id: 'demo-ketua-01',
    role: 'ketua_poktan',
    nama_lengkap: 'Pak Surya (Demo)',
    no_hp: '081200000001',
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Lembang',
    is_verified: true,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  petani: {
    id: 'demo-petani-01',
    role: 'petani',
    nama_lengkap: 'Ahmad (Demo)',
    no_hp: '081200000002',
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Lembang',
    is_verified: true,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  supplier: {
    id: 'demo-supplier-01',
    role: 'supplier',
    nama_lengkap: 'Budi (Demo)',
    no_hp: '081200000003',
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Lembang',
    is_verified: true,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  admin: {
    id: 'demo-admin-01',
    role: 'admin',
    nama_lengkap: 'Admin (Demo)',
    no_hp: '081200000004',
    provinsi: 'DKI Jakarta',
    kabupaten: 'Jakarta Pusat',
    kecamatan: 'Menteng',
    is_verified: true,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
}

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
    // Demo mode: use dummy users
    const user = DEMO_USERS[role]
    set({ user, role, hasAgreedSOP: false })
  },
  agreeSOP: () => set({ hasAgreedSOP: true }),
  logout: () => {
    // Clear stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sb-access-token')
      localStorage.removeItem('sb-refresh-token')
    }
    set({ user: null, role: null, hasAgreedSOP: false })
  },
}))
