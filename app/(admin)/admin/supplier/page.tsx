'use client'

import { useState, useMemo, useEffect } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRupiah } from '@/lib/utils/currency'
import {
  Building2, MoreVertical, Eye, CheckCircle, Star, MapPin, ShieldCheck, Package,
} from 'lucide-react'

export default function AdminSupplierPage() {
  const [filterVerified, setFilterVerified] = useState('all')
  const [allSuppliers, setAllSuppliers] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/supplier')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAllSuppliers(data.suppliers || [])
      })
      .catch(() => {})
  }, [])

  const suppliers = useMemo(() => {
    return allSuppliers.filter((s: any) => {
      if (filterVerified === 'all') return true
      if (filterVerified === 'verified') return s.is_verified
      return !s.is_verified
    })
  }, [allSuppliers, filterVerified])

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Manajemen Supplier" />

      <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Select value={filterVerified} onValueChange={(v: string | null) => setFilterVerified(v ?? "")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status verifikasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="verified">Terverifikasi</SelectItem>
              <SelectItem value="unverified">Belum Verifikasi</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {suppliers.length} supplier
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Perusahaan</TableHead>
                  <TableHead>Jenis Usaha</TableHead>
                  <TableHead>Wilayah</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">Verified</TableHead>
                  <TableHead className="text-center">Pre-Orders</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{s.nama_perusahaan}</p>
                        <p className="text-xs text-muted-foreground">
                          PIC: {s.user?.nama_lengkap || '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Deposit: {formatRupiah(s.deposit_escrow)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.jenis_usaha || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.wilayah_operasi.map((w: string) => (
                          <Badge key={w} variant="outline" className="text-[10px] px-1.5 py-0">
                            {w}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-tani-amber text-tani-amber" />
                        <span className="font-medium text-sm">{s.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {s.is_verified ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{s.total_preorder}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                            <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" /> Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="h-4 w-4 mr-2" /> Verifikasi
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {suppliers.map((s) => (
            <Card key={s.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-tani-blue shrink-0" />
                      <p className="font-semibold text-sm font-[family-name:var(--font-heading)] truncate">
                        {s.nama_perusahaan}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.jenis_usaha || '-'} &middot; PIC: {s.user?.nama_lengkap || '-'}
                    </p>
                  </div>
                  {s.is_verified ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs shrink-0">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
                      Pending
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {s.wilayah_operasi.map((w: string) => (
                    <Badge key={w} variant="outline" className="text-[10px] px-1.5 py-0">
                      <MapPin className="h-2.5 w-2.5 mr-0.5" />
                      {w}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-muted-foreground">Rating</p>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 fill-tani-amber text-tani-amber" />
                      <p className="font-bold">{s.rating}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-muted-foreground">Pre-Orders</p>
                    <p className="font-bold">{s.total_preorder}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-muted-foreground">Deposit</p>
                    <p className="font-bold text-[10px]">{formatRupiah(s.deposit_escrow)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <Eye className="h-3 w-3 mr-1" /> Detail
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verifikasi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {suppliers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tidak ada supplier ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
