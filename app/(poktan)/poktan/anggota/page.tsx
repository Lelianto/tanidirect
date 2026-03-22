'use client'

import { useState, useEffect } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { useAuthStore } from '@/store'
import { Users, Sprout, Map, UserPlus, Search, Phone } from 'lucide-react'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function AnggotaPoktanPage() {
  const user = useAuthStore((s) => s.user)

  const [poktan, setPoktan] = useState<any>(null)
  const [anggota, setAnggota] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch(`/api/poktan/anggota?user_id=${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success) {
          setPoktan(data.poktan)
          setAnggota(data.anggota || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchHp, setSearchHp] = useState('')

  const totalLahan = anggota.reduce((sum, a) => sum + (a.lahan_ha || 0), 0)
  const allKomoditas = [...new Set(anggota.flatMap((a) => a.komoditas))]

  return (
    <>
      <TopBar title="Anggota Poktan" />
      <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Total Anggota"
            value={String(anggota.length)}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Total Lahan"
            value={`${totalLahan.toFixed(1)} ha`}
            icon={<Map className="h-5 w-5" />}
          />
          <StatCard
            title="Komoditas"
            value={String(allKomoditas.length)}
            icon={<Sprout className="h-5 w-5" />}
          />
        </div>

        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold font-[family-name:var(--font-heading)]">
            Daftar Anggota
          </h2>
          <Dialog open={dialogOpen} onOpenChange={(v: boolean) => setDialogOpen(v)}>
            <DialogTrigger
              render={
                <Button size="sm" className="bg-tani-green hover:bg-tani-green/90 text-white" />
              }
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Tambah Anggota
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Anggota Baru</DialogTitle>
                <DialogDescription>
                  Cari petani berdasarkan nomor handphone untuk ditambahkan ke poktan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nomor HP Petani</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="08xxxxxxxxxx"
                        value={searchHp}
                        onChange={(e) => setSearchHp(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button size="sm" variant="outline">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {searchHp.length >= 10 && (
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Petani tidak ditemukan. Pastikan nomor HP sudah terdaftar.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => { setDialogOpen(false); setSearchHp('') }}
                >
                  Batal
                </Button>
                <Button
                  className="bg-tani-green hover:bg-tani-green/90 text-white"
                  disabled
                >
                  Tambahkan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mobile: Cards */}
        <div className="space-y-3 lg:hidden">
          {anggota.map((a) => {
            const nama = a.petani?.nama_lengkap || 'Petani'
            return (
              <Card key={a.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-tani-green/10 text-tani-green text-sm font-semibold">
                        {getInitials(nama)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{nama}</p>
                          <p className="text-xs text-muted-foreground">
                            Lahan: {a.lahan_ha ?? '-'} ha
                          </p>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {a.komoditas.map((k: string) => (
                          <Badge
                            key={k}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-tani-green/10 text-tani-green hover:bg-tani-green/10"
                          >
                            {k}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {anggota.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada anggota terdaftar
            </p>
          )}
        </div>

        {/* Desktop: Table */}
        <Card className="shadow-sm hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Petani</TableHead>
                <TableHead>Lahan (ha)</TableHead>
                <TableHead>Komoditas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anggota.map((a) => {
                const nama = a.petani?.nama_lengkap || 'Petani'
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-tani-green/10 text-tani-green text-xs font-semibold">
                            {getInitials(nama)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{nama}</p>
                          <p className="text-xs text-muted-foreground">{a.petani?.no_hp}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{a.lahan_ha ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {a.komoditas.map((k: string) => (
                          <Badge
                            key={k}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-tani-green/10 text-tani-green hover:bg-tani-green/10"
                          >
                            {k}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                  </TableRow>
                )
              })}
              {anggota.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada anggota terdaftar
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  )
}
