'use client'

import { useState } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { dummyLogistik, dummyTransaksi } from '@/lib/dummy'
import { formatRupiah } from '@/lib/utils/currency'
import { formatWaktu, timeAgo } from '@/lib/utils/date'
import {
  Truck, MapPin, Phone, ChevronDown, ChevronUp,
  Navigation, Clock, Shield, Send,
} from 'lucide-react'
import type { Logistik, TierLogistik } from '@/types'

const TIER_CONFIG: Record<TierLogistik, { label: string; color: string }> = {
  first_mile: { label: 'First Mile', color: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  middle_mile: { label: 'Middle Mile', color: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  last_mile: { label: 'Last Mile', color: 'bg-teal-100 text-teal-800 hover:bg-teal-100' },
}

const STATUS_STEPS = ['menunggu_muat', 'dalam_perjalanan', 'tiba']

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.indexOf(status)
  return idx >= 0 ? idx : 0
}

function getStepLabel(step: string): string {
  const map: Record<string, string> = {
    menunggu_muat: 'Menunggu Muat',
    dalam_perjalanan: 'Dalam Perjalanan',
    tiba: 'Tiba di Tujuan',
  }
  return map[step] || step
}

export default function LogistikPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<Logistik | null>(null)
  const [posisiUpdate, setPosisiUpdate] = useState('')

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id)
  }

  function openUpdateDialog(shipment: Logistik) {
    setSelectedShipment(shipment)
    setPosisiUpdate('')
    setUpdateDialogOpen(true)
  }

  function closeUpdateDialog() {
    setUpdateDialogOpen(false)
    setSelectedShipment(null)
  }

  function getTransaksiInfo(transaksiId: string) {
    return dummyTransaksi.find((t) => t.id === transaksiId)
  }

  return (
    <>
      <TopBar title="Tracking Logistik" />
      <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
        {/* Header info */}
        <div>
          <p className="text-sm text-muted-foreground">
            {dummyLogistik.length} pengiriman aktif
          </p>
        </div>

        {/* Shipment List */}
        <div className="space-y-4">
          {dummyLogistik.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada pengiriman aktif
            </p>
          ) : (
            dummyLogistik.map((shipment) => {
              const tx = getTransaksiInfo(shipment.transaksi_id)
              const tierConfig = TIER_CONFIG[shipment.tier]
              const stepIndex = getStepIndex(shipment.status)
              const isExpanded = expandedId === shipment.id

              return (
                <Card key={shipment.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${tierConfig.color} text-xs font-medium`}>
                            <Truck className="h-3 w-3 mr-1" />
                            {tierConfig.label}
                          </Badge>
                          <StatusBadge status={shipment.status} />
                          {shipment.asuransi_kargo && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 hover:bg-green-50">
                              <Shield className="h-3 w-3 mr-0.5" />
                              Asuransi
                            </Badge>
                          )}
                        </div>

                        {tx && (
                          <p className="text-xs text-muted-foreground">
                            {tx.komoditas} — Grade {tx.grade}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-tani-green shrink-0" />
                      <span className="truncate">{shipment.titik_asal}</span>
                      <span className="text-muted-foreground shrink-0">→</span>
                      <MapPin className="h-4 w-4 text-tani-blue shrink-0" />
                      <span className="truncate">{shipment.titik_tujuan}</span>
                    </div>

                    {/* Transporter */}
                    {shipment.transporter_nama && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        <span>{shipment.transporter_nama}</span>
                        {shipment.kendaraan_plat && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {shipment.kendaraan_plat}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Progress bar (3 steps) */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        {STATUS_STEPS.map((s, i) => {
                          const isCompleted = i < stepIndex
                          const isCurrent = i === stepIndex
                          return (
                            <div key={s} className="flex items-center flex-1 gap-1">
                              <div
                                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                  isCompleted
                                    ? 'bg-emerald-600 text-white'
                                    : isCurrent
                                    ? 'bg-white text-emerald-700 border-[3px] border-emerald-600 shadow-sm'
                                    : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
                                }`}
                              >
                                {isCompleted ? '\u2713' : i + 1}
                              </div>
                              {i < STATUS_STEPS.length - 1 && (
                                <div
                                  className={`h-1.5 flex-1 rounded-full ${
                                    isCompleted ? 'bg-emerald-600' : 'bg-gray-200'
                                  }`}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-[11px]">
                        {STATUS_STEPS.map((s, i) => (
                          <span key={s} className={`text-center ${
                            i < stepIndex ? 'text-emerald-600 font-semibold'
                            : i === stepIndex ? 'text-emerald-700 font-semibold'
                            : 'text-gray-400'
                          }`}>
                            {getStepLabel(s)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Last update */}
                    {shipment.last_update_posisi && (
                      <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg p-2.5">
                        <Navigation className="h-3 w-3 text-tani-green shrink-0" />
                        <span className="font-medium">{shipment.last_update_posisi}</span>
                        {shipment.last_update_at && (
                          <span className="text-muted-foreground ml-auto flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3" />
                            {timeAgo(shipment.last_update_at)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(shipment.id)}
                      >
                        {isExpanded ? (
                          <><ChevronUp className="h-4 w-4 mr-1" /> Tutup Detail</>
                        ) : (
                          <><ChevronDown className="h-4 w-4 mr-1" /> Lihat Detail</>
                        )}
                      </Button>
                      {shipment.status === 'dalam_perjalanan' ? (
                        <Button
                          size="sm"
                          className="bg-tani-green hover:bg-tani-green/90 text-white"
                          onClick={() => openUpdateDialog(shipment)}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Update Posisi
                        </Button>
                      ) : (
                        <div />
                      )}
                    </div>

                    {/* Expandable detail */}
                    {isExpanded && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Transporter</p>
                            <p className="font-medium">{shipment.transporter_nama || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">No. HP</p>
                            {shipment.transporter_hp ? (
                              <a
                                href={`tel:${shipment.transporter_hp}`}
                                className="font-medium text-tani-blue flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" />
                                {shipment.transporter_hp}
                              </a>
                            ) : (
                              <p className="font-medium">-</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Plat Kendaraan</p>
                            <p className="font-medium">{shipment.kendaraan_plat || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Biaya Logistik</p>
                            <p className="font-medium">
                              {shipment.biaya_logistik ? formatRupiah(shipment.biaya_logistik) : '-'}
                            </p>
                          </div>
                          {shipment.estimasi_tiba && (
                            <div>
                              <p className="text-xs text-muted-foreground">Estimasi Tiba</p>
                              <p className="font-medium">{formatWaktu(shipment.estimasi_tiba)}</p>
                            </div>
                          )}
                          {shipment.aktual_tiba && (
                            <div>
                              <p className="text-xs text-muted-foreground">Aktual Tiba</p>
                              <p className="font-medium">{formatWaktu(shipment.aktual_tiba)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">Asuransi Kargo</p>
                            <p className="font-medium">
                              {shipment.asuransi_kargo ? 'Ya' : 'Tidak'}
                            </p>
                          </div>
                          {tx && (
                            <div>
                              <p className="text-xs text-muted-foreground">Transaksi</p>
                              <p className="font-medium">
                                {tx.komoditas} — {tx.volume_estimasi_kg} kg
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Dialog: Update Posisi */}
      <Dialog open={updateDialogOpen} onOpenChange={(open) => { if (!open) closeUpdateDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Posisi</DialogTitle>
            <DialogDescription>
              {selectedShipment && (
                <>
                  {selectedShipment.titik_asal} → {selectedShipment.titik_tujuan}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Posisi Saat Ini</Label>
              <Input
                placeholder="Contoh: Melewati Tol Cipularang KM 85"
                value={posisiUpdate}
                onChange={(e) => setPosisiUpdate(e.target.value)}
              />
            </div>
            {selectedShipment?.last_update_posisi && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p className="font-medium">Posisi terakhir:</p>
                <p>{selectedShipment.last_update_posisi}</p>
                {selectedShipment.last_update_at && (
                  <p className="mt-1">{timeAgo(selectedShipment.last_update_at)}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeUpdateDialog}>
              Batal
            </Button>
            <Button
              className="bg-tani-green hover:bg-tani-green/90 text-white"
              disabled={!posisiUpdate.trim()}
              onClick={closeUpdateDialog}
            >
              <Send className="h-4 w-4 mr-1" />
              Kirim Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
