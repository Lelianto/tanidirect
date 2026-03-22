'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Users, ShoppingCart, Building2, Shield, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store'
import type { UserRole } from '@/types'
import { toast } from 'sonner'

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

type LoginMode = 'demo' | 'real'

export default function LoginPage() {
  const router = useRouter()
  const { switchRole, setUser } = useAuthStore()
  const [mode, setMode] = React.useState<LoginMode>('demo')
  const [noHp, setNoHp] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  function handleDemoLogin(role: UserRole, href: string) {
    switchRole(role)
    router.push(href)
  }

  async function handleRealLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!noHp) {
      toast.error('Nomor HP wajib diisi')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ no_hp: noHp, password: password || noHp }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Login gagal')
        return
      }

      // Set user in store
      if (data.user) {
        setUser(data.user)

        // Store session tokens
        if (data.session?.access_token) {
          localStorage.setItem('sb-access-token', data.session.access_token)
          localStorage.setItem('sb-refresh-token', data.session.refresh_token || '')
        }

        // Store SOP agreements
        if (data.sopAgreements?.length > 0) {
          useAuthStore.getState().agreeSOP()
        }

        toast.success(`Selamat datang, ${data.user.nama_lengkap}!`)

        // Navigate based on role
        const routes: Record<string, string> = {
          petani: '/petani/dashboard',
          ketua_poktan: '/poktan/dashboard',
          supplier: '/supplier/dashboard',
          admin: '/admin/dashboard',
        }
        router.push(routes[data.user.role] || '/')
      }
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
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
            taninesia
          </h1>
          <p className="text-sm text-muted-foreground">
            Marketplace Pertanian B2B
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg border bg-muted/50 p-1">
          <button
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              mode === 'real' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
            onClick={() => setMode('real')}
          >
            Login
          </button>
          <button
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              mode === 'demo' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
            onClick={() => setMode('demo')}
          >
            Demo Mode
          </button>
        </div>

        {mode === 'real' ? (
          /* Real Login Form */
          <Card>
            <CardContent className="p-4 space-y-4">
              <form onSubmit={handleRealLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nomor HP</Label>
                  <Input
                    placeholder="08xxxxxxxxxx"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Default password = nomor HP
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Masuk...' : (
                    <>
                      <LogIn className="size-4 mr-1" />
                      Masuk
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Demo Role Selection */
          <div className="space-y-3">
            <p className="text-sm font-medium text-center text-muted-foreground">
              Pilih role untuk masuk demo
            </p>
            {ROLES.map(({ role, label, desc, icon, href, color }) => (
              <Card
                key={role}
                className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                onClick={() => handleDemoLogin(role, href)}
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
        )}

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <Link href="/register" className="text-tani-green font-medium hover:underline">
              Daftar sekarang
            </Link>
          </p>
          {mode === 'demo' && (
            <p className="text-[11px] text-muted-foreground">
              Data yang ditampilkan adalah dummy untuk keperluan demo
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
