'use client'

import { useState, useEffect } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuthStore } from '@/store'
import {
  dummyPoktan, dummyTransaksi, dummyQAInspeksi, dummySuppliers,
  getPoktanByKetuaId,
} from '@/lib/dummy'
import { formatRupiah, formatKg } from '@/lib/utils/currency'
import { formatTanggalSingkat } from '@/lib/utils/date'
import { GRADE_COLORS } from '@/lib/constants/komoditas'
import { getAllDraftIds, loadDraft } from '@/lib/data/qa-forms'
import { timeAgo } from '@/lib/utils/date'
import {
  ClipboardCheck, CheckCircle, FileEdit,
} from 'lucide-react'
import Link from 'next/link'
import type { Transaksi } from '@/types'

export default function QAInspeksiPage() {
  const user = useAuthStore((s) => s.user)
  const poktan = user ? getPoktanByKetuaId(user.id) : dummyPoktan[0]

  const poktanTransaksi = dummyTransaksi.filter((t) => t.poktan_id === poktan?.id)
  const qaMap = new Map(dummyQAInspeksi.map((qa) => [qa.transaksi_id, qa]))

  // Transaksi that need QA: have no QA or QA is pending
  const perluQA = poktanTransaksi.filter((t) => {
    const qa = qaMap.get(t.id)
    return !qa || qa.status === 'pending'
  })

  // Completed QA
  const riwayatQA = dummyQAInspeksi.filter(
    (qa) => qa.poktan_id === poktan?.id && qa.status !== 'pending'
  )

  // Draft tracking
  const [draftTxIds, setDraftTxIds] = useState<Set<string>>(new Set())
  const [draftTimestamps, setDraftTimestamps] = useState<Record<string, string>>({})

  useEffect(() => {
    const ids = getAllDraftIds()
    setDraftTxIds(new Set(ids))
    const timestamps: Record<string, string> = {}
    for (const id of ids) {
      const draft = loadDraft(id)
      if (draft) timestamps[id] = draft.updated_at
    }
    setDraftTimestamps(timestamps)
  }, [])

  function getSupplierName(supplierId: string) {
    const supplier = dummySuppliers.find((s) => s.id === supplierId)
    return supplier?.nama_perusahaan || '-'
  }

  function renderTxCard(tx: Transaksi) {
    const existingQA = qaMap.get(tx.id)
    const hasDraft = draftTxIds.has(tx.id)
    const draftTime = draftTimestamps[tx.id]

    return (
      <Card key={tx.id} className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{tx.komoditas}</h3>
                <Badge
                  className={`${GRADE_COLORS[tx.grade] || 'bg-slate-100 text-slate-700'} text-[10px] px-1.5 py-0`}
                >
                  Grade {tx.grade}
                </Badge>
                {existingQA && <StatusBadge status={existingQA.status} />}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatKg(tx.volume_estimasi_kg)}</span>
                <span className="text-foreground font-medium">
                  {formatRupiah(tx.harga_per_kg)}/kg
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Supplier: {getSupplierName(tx.supplier_id)}
              </p>
              {hasDraft && draftTime && (
                <div className="flex items-center gap-1 text-[10px] text-tani-amber">
                  <FileEdit className="h-3 w-3" />
                  Draft tersimpan &middot; {timeAgo(draftTime)}
                </div>
              )}
            </div>
            <Link href={`/poktan/qa/${tx.id}`}>
              <Button
                size="sm"
                className={`shrink-0 ${
                  hasDraft
                    ? 'bg-tani-amber hover:bg-tani-amber/90 text-white'
                    : 'bg-tani-green hover:bg-tani-green/90 text-white'
                }`}
              >
                {hasDraft ? 'Lanjutkan Draft' : 'Mulai Inspeksi'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <TopBar title="QA Inspeksi" />
      <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
        <Tabs defaultValue={0}>
          <TabsList className="w-full">
            <TabsTrigger value={0}>
              <ClipboardCheck className="h-4 w-4" />
              Perlu QA ({perluQA.length})
            </TabsTrigger>
            <TabsTrigger value={1}>
              <CheckCircle className="h-4 w-4" />
              Riwayat QA
            </TabsTrigger>
          </TabsList>

          {/* Tab: Perlu QA */}
          <TabsContent value={0}>
            <div className="space-y-3 mt-4">
              {perluQA.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tidak ada transaksi yang perlu inspeksi QA
                </p>
              ) : (
                perluQA.map((tx) => renderTxCard(tx))
              )}
            </div>
          </TabsContent>

          {/* Tab: Riwayat QA */}
          <TabsContent value={1}>
            <div className="space-y-3 mt-4">
              {riwayatQA.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada riwayat inspeksi QA
                </p>
              ) : (
                riwayatQA.map((qa) => {
                  const tx = dummyTransaksi.find((t) => t.id === qa.transaksi_id)
                  return (
                    <Card key={qa.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm">{qa.komoditas}</h3>
                              {qa.grade_hasil && (
                                <Badge
                                  className={`${GRADE_COLORS[qa.grade_hasil] || 'bg-slate-100 text-slate-700'} text-[10px] px-1.5 py-0`}
                                >
                                  Grade {qa.grade_hasil}
                                </Badge>
                              )}
                              <StatusBadge status={qa.status} />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>Volume: {formatKg(qa.volume_inspeksi_kg || 0)}</span>
                              <span>Skor: {qa.skor_kualitas ?? '-'}/100</span>
                            </div>
                            {qa.penyimpangan_persen !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Deviasi: {qa.penyimpangan_persen.toFixed(1)}%
                              </p>
                            )}
                            {qa.catatan_inspektor && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {qa.catatan_inspektor}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                              {formatTanggalSingkat(qa.created_at)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">Fee QA</p>
                            <p className="text-sm font-semibold text-tani-green">
                              {formatRupiah(qa.fee_dibayar)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
