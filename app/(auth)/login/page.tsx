'use client'

import { useRouter } from 'next/navigation'
import { Leaf, Users, ShoppingCart, Building2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store'
import type { UserRole } from '@/types'

const ROLES: { role: UserRole; label: string; desc: string; icon: React.ReactNode; href: string; color: string }[] = [
  {
    role: 'ketua_poktan',
    label: 'Ketua Poktan',
    desc: 'QA officer, agregator, operator digital',
    icon: <Users className="h-6 w-6" />,
    href: '/poktan/dashboard',
    color: 'bg-tani-green text-white hover:bg-tani-green-dark',
  },
  {
    role: 'supplier',
    label: 'Supplier',
    desc: 'Pembeli korporat, distributor, restoran',
    icon: <Building2 className="h-6 w-6" />,
    href: '/supplier/dashboard',
    color: 'bg-tani-blue text-white hover:bg-tani-blue/90',
  },
  {
    role: 'petani',
    label: 'Petani',
    desc: 'Produsen anggota kelompok tani',
    icon: <ShoppingCart className="h-6 w-6" />,
    href: '/petani/dashboard',
    color: 'bg-tani-amber text-white hover:bg-tani-amber/90',
  },
  {
    role: 'admin',
    label: 'Admin',
    desc: 'Operator platform, compliance',
    icon: <Shield className="h-6 w-6" />,
    href: '/admin/dashboard',
    color: 'bg-slate-800 text-white hover:bg-slate-900',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const switchRole = useAuthStore((s) => s.switchRole)

  function handleLogin(role: UserRole, href: string) {
    switchRole(role)
    router.push(href)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-tani-green/5 to-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-tani-green text-white mx-auto">
            <Leaf className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-tani-green">
            TaniDirect
          </h1>
          <p className="text-sm text-muted-foreground">
            Marketplace Pertanian B2B — Demo Mode
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-center text-muted-foreground">
            Pilih role untuk masuk demo
          </p>
          {ROLES.map(({ role, label, desc, icon, href, color }) => (
            <Card
              key={role}
              className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
              onClick={() => handleLogin(role, href)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${color}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Button size="sm" className={color}>
                    Masuk
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-[11px] text-center text-muted-foreground">
          Data yang ditampilkan adalah dummy untuk keperluan demo
        </p>
      </div>
    </div>
  )
}
