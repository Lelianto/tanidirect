'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store'
import { formatRupiah } from '@/lib/utils/currency'
import { toast } from 'sonner'
import {
  CheckCircle, XCircle, Clock, Loader2, Wallet,
  AlertCircle, Users,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  diproses: { label: 'Diproses', color: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3 w-3" /> },
  berhasil: { label: 'Berhasil', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
  gagal: { label: 'Gagal', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
}

export default function AdminPencairanPoktanPage() {
  const adminUser = useAuthStore((s) => s.user)
  const [pencairanList, setPencairanList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pencairan-poktan')
      if (res.ok) {
        const data = await res.json()
        setPencairanList(data.pencairan || [])
      }
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleAction(action: 'berhasil' | 'gagal') {
    if (!selected || !adminUser) return
    if (action === 'gagal' && !catatan.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/pencairan-poktan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pencairan_id: selected.id,
          action,
          admin_id: adminUser.id,
          catatan: catatan || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal memproses')
      }
      toast.success(action === 'berhasil' ? 'Pencairan disetujui' : 'Pencairan ditolak')
      setApproveDialogOpen(false)
      setRejectDialogOpen(false)
      setSelected(null)
      setCatatan('')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memproses')
    } finally {
      setProcessing(false)
    }
  }

  const pendingCount = pencairanList.filter((p) => p.status === 'diproses').length
  const totalApproved = pencairanList
    .filter((p) => p.status === 'berhasil')
    .reduce((sum, p) => sum + Number(p.jumlah_diterima), 0)

  return (
    <>
      <TopBar title="Pencairan Poktan" />
      <div className="p-4 lg:p-6 space-y-4 max-w-4xl">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Perlu Diproses</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-tani-green" />
                <span className="text-xs text-muted-foreground">Total Dicairkan</span>
              </div>
              <p className="text-2xl font-bold text-tani-green">{formatRupiah(totalApproved)}</p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pencairanList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">Belum ada pencairan poktan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pencairanList.map((p) => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.diproses
              return (
                <Card key={p.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{p.poktan?.nama_poktan || 'Poktan'}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{p.id.slice(0, 8)}</p>
                      </div>
                      <Badge className={`${cfg.color} text-[10px] px-2 py-0.5 gap-1`}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Jumlah</p>
                        <p className="font-bold text-tani-green">{formatRupiah(p.jumlah)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Diterima</p>
                        <p className="font-medium">{formatRupiah(p.jumlah_diterima)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Biaya Admin</p>
                        <p className="font-medium">{formatRupiah(p.biaya_admin)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tanggal</p>
                        <p className="font-medium">
                          {new Date(p.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {p.catatan && (
                      <div className={`rounded-lg p-3 ${p.status === 'gagal' ? 'bg-red-50' : 'bg-green-50'}`}>
                        <p className="text-xs text-muted-foreground mb-0.5">Catatan:</p>
                        <p className="text-xs">{p.catatan}</p>
                      </div>
                    )}

                    {p.status === 'diproses' && (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white"
                          onClick={() => { setSelected(p); setCatatan(''); setApproveDialogOpen(true) }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Setujui
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => { setSelected(p); setCatatan(''); setRejectDialogOpen(true) }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={(v: boolean) => setApproveDialogOpen(v)}>
        <DialogContent className="max-w-[calc(100%-4rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setujui Pencairan</DialogTitle>
            <DialogDescription>
              Pastikan dana sudah ditransfer ke rekening poktan.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Jumlah Diterima</p>
                <p className="text-xl font-bold text-tani-green">{formatRupiah(selected.jumlah_diterima)}</p>
                <p className="text-xs text-muted-foreground mt-1">{selected.poktan?.nama_poktan}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Catatan (opsional)</Label>
                <Textarea
                  placeholder="Catatan pencairan..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button
              className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white"
              onClick={() => handleAction('berhasil')}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(v: boolean) => setRejectDialogOpen(v)}>
        <DialogContent className="max-w-[calc(100%-4rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Pencairan</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan pencairan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Alasan Penolakan *</Label>
              <Textarea
                placeholder="Contoh: Rekening tidak valid, data tidak sesuai..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => handleAction('gagal')}
              disabled={processing || !catatan.trim()}
            >
              {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Tolak Pencairan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
