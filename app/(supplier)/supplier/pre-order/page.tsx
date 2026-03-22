'use client'

import { useState } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { KomoditasCard } from '@/components/shared/KomoditasCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store'
import { getSupplierByUserId, getPreOrdersBySupplierId } from '@/lib/dummy'
import { formatRupiah, formatKg } from '@/lib/utils/currency'
import { KOMODITAS } from '@/lib/constants/komoditas'
import { PROVINSI } from '@/lib/constants/wilayah'
import { Plus, Package } from 'lucide-react'
import Link from 'next/link'
import type { StatusPreOrder } from '@/types'

const TAB_MAP: { value: string; label: string; statuses: StatusPreOrder[] }[] = [
  { value: 'mencari', label: 'Mencari Poktan', statuses: ['open'] },
  { value: 'matched', label: 'Matched', statuses: ['matched'] },
  { value: 'proses', label: 'Dalam Proses', statuses: ['confirmed'] },
  { value: 'selesai', label: 'Selesai', statuses: ['fulfilled'] },
  { value: 'batal', label: 'Dibatalkan', statuses: ['cancelled'] },
]

export default function SupplierPreOrderPage() {
  const user = useAuthStore((s) => s.user)
  const supplier = user ? getSupplierByUserId(user.id) : null
  const preOrders = supplier ? getPreOrdersBySupplierId(supplier.id) : []

  const [dialogOpen, setDialogOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [form, setForm] = useState({
    komoditas: '',
    grade: '' as string,
    volume_kg: '',
    harga_penawaran_per_kg: '',
    tanggal_dibutuhkan: '',
    wilayah_tujuan: '',
    catatan_spesifikasi: '',
    catatan_kualitas: '',
  })

  const volume = Number(form.volume_kg) || 0
  const harga = Number(form.harga_penawaran_per_kg) || 0
  const totalNilai = volume * harga
  const komisi = totalNilai * 0.02
  const deposit = totalNilai * 0.1

  function handleFormChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setShowPreview(false)
  }

  function handlePreview() {
    setShowPreview(true)
  }

  function handleSubmit() {
    setDialogOpen(false)
    setShowPreview(false)
    setForm({
      komoditas: '',
      grade: '',
      volume_kg: '',
      harga_penawaran_per_kg: '',
      tanggal_dibutuhkan: '',
      wilayah_tujuan: '',
      catatan_spesifikasi: '',
      catatan_kualitas: '',
    })
  }

  return (
    <>
      <TopBar title="Pre-Order Saya" />
      <div className="p-4 lg:p-6 space-y-4 max-w-4xl">
        {/* Create button */}
        <Dialog open={dialogOpen} onOpenChange={(v: boolean) => setDialogOpen(v)}>
          <DialogTrigger render={<Button className="w-full bg-tani-green hover:bg-tani-green/90 text-white h-12 text-base font-semibold shadow-sm" />}>
              <Plus className="h-5 w-5 mr-2" />
              Buat Pre-Order Baru
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-4rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Buat Pre-Order Baru</DialogTitle>
              <DialogDescription>
                Tentukan kebutuhan komoditas Anda. Platform akan mencarikan poktan terbaik.
              </DialogDescription>
            </DialogHeader>

            {!showPreview ? (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Komoditas</Label>
                  <Select value={form.komoditas} onValueChange={(v: string | null) => handleFormChange('komoditas', v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih komoditas" />
                    </SelectTrigger>
                    <SelectContent>
                      {KOMODITAS.map((k) => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Select value={form.grade} onValueChange={(v: string | null) => handleFormChange('grade', v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Premium</SelectItem>
                      <SelectItem value="B">B - Standar</SelectItem>
                      <SelectItem value="C">C - Ekonomi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Volume (kg)</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={form.volume_kg}
                      onChange={(e) => handleFormChange('volume_kg', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Harga/kg (Rp)</Label>
                    <Input
                      type="number"
                      placeholder="12000"
                      value={form.harga_penawaran_per_kg}
                      onChange={(e) => handleFormChange('harga_penawaran_per_kg', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Dibutuhkan</Label>
                  <Input
                    type="date"
                    value={form.tanggal_dibutuhkan}
                    onChange={(e) => handleFormChange('tanggal_dibutuhkan', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Wilayah Tujuan</Label>
                  <Select value={form.wilayah_tujuan} onValueChange={(v: string | null) => handleFormChange('wilayah_tujuan', v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih provinsi tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINSI.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Catatan Spesifikasi</Label>
                  <Textarea
                    placeholder="Contoh: Ukuran sedang-besar, warna merah merata..."
                    value={form.catatan_spesifikasi}
                    onChange={(e) => handleFormChange('catatan_spesifikasi', e.target.value)}
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Catatan Kualitas untuk QA</Label>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Opsional</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground -mt-1">
                    AI akan mengubah catatan ini menjadi tahap pengecekan tambahan di form QA
                  </p>
                  <Textarea
                    placeholder="Contoh: Buah harus firm saat ditekan, tangkai masih hijau segar..."
                    value={form.catatan_kualitas}
                    onChange={(e) => handleFormChange('catatan_kualitas', e.target.value)}
                    rows={2}
                  />
                </div>

                {totalNilai > 0 && (
                  <Card className="bg-muted/50 shadow-none border-dashed">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Nilai</span>
                        <span className="font-semibold">{formatRupiah(totalNilai)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Komisi Platform (2%)</span>
                        <span>{formatRupiah(komisi)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estimasi Deposit (10%)</span>
                        <span className="font-semibold text-tani-amber">{formatRupiah(deposit)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <DialogFooter>
                  <Button
                    className="w-full bg-tani-green hover:bg-tani-green/90"
                    disabled={!form.komoditas || !form.grade || !form.volume_kg || !form.harga_penawaran_per_kg || !form.tanggal_dibutuhkan || !form.wilayah_tujuan}
                    onClick={handlePreview}
                  >
                    Preview Pre-Order
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Ringkasan Pre-Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                      <span className="text-muted-foreground">Komoditas</span>
                      <span className="font-medium">{form.komoditas}</span>
                      <span className="text-muted-foreground">Grade</span>
                      <span className="font-medium">{form.grade}</span>
                      <span className="text-muted-foreground">Volume</span>
                      <span className="font-medium">{formatKg(volume)}</span>
                      <span className="text-muted-foreground">Harga/kg</span>
                      <span className="font-medium">{formatRupiah(harga)}</span>
                      <span className="text-muted-foreground">Tanggal</span>
                      <span className="font-medium">{form.tanggal_dibutuhkan}</span>
                      <span className="text-muted-foreground">Tujuan</span>
                      <span className="font-medium">{form.wilayah_tujuan}</span>
                    </div>
                    {form.catatan_spesifikasi && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Catatan Spesifikasi</p>
                          <p className="text-sm">{form.catatan_spesifikasi}</p>
                        </div>
                      </>
                    )}
                    {form.catatan_kualitas && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Catatan Kualitas untuk QA</p>
                          <p className="text-sm">{form.catatan_kualitas}</p>
                          <p className="text-[10px] text-tani-blue mt-1">
                            AI akan memproses catatan ini menjadi tahap QA setelah pre-order dibuat
                          </p>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Nilai</span>
                        <span className="font-bold text-base">{formatRupiah(totalNilai)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Komisi Platform (2%)</span>
                        <span>{formatRupiah(komisi)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-tani-amber">
                        <span>Deposit Diperlukan (10%)</span>
                        <span>{formatRupiah(deposit)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
                    Edit
                  </Button>
                  <Button className="flex-1 bg-tani-green hover:bg-tani-green/90" onClick={handleSubmit}>
                    Kirim Pre-Order
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Tabs */}
        <Tabs defaultValue="mencari" className="w-full">
          <TabsList className="w-full overflow-x-auto flex justify-start h-auto p-1 bg-muted/50">
            {TAB_MAP.map((tab) => {
              const count = preOrders.filter((po) => tab.statuses.includes(po.status)).length
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs px-3 py-1.5 whitespace-nowrap data-[state=active]:bg-white"
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 bg-tani-green/10 text-tani-green text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {TAB_MAP.map((tab) => {
            const filtered = preOrders.filter((po) => tab.statuses.includes(po.status))
            return (
              <TabsContent key={tab.value} value={tab.value} className="space-y-3 mt-3">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Package className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">Belum ada pre-order</p>
                    <p className="text-xs">Pre-order dengan status &quot;{tab.label}&quot; akan muncul di sini</p>
                  </div>
                ) : (
                  filtered.map((po) => (
                    <Link key={po.id} href={`/supplier/pre-order/${po.id}`}>
                      <KomoditasCard
                        komoditas={po.komoditas}
                        grade={po.grade}
                        volume_kg={po.volume_kg}
                        harga_per_kg={po.harga_penawaran_per_kg}
                        status={po.status}
                        tanggal={po.tanggal_dibutuhkan}
                        onClick={() => {}}
                      />
                    </Link>
                  ))
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </>
  )
}
