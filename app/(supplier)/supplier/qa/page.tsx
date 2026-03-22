'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store'
import { formatKg } from '@/lib/utils/currency'
import { toast } from 'sonner'
import {
  ClipboardCheck, CheckCircle, XCircle, AlertTriangle,
  Clock, MessageSquare, ShieldCheck, ShieldX, Loader2,
} from 'lucide-react'

type Tab = 'review' | 'riwayat'

export default function SupplierQAReviewPage() {
  const user = useAuthStore((s) => s.user)
  const [supplier, setSupplier] = useState<any>(null)
  const [allQA, setAllQA] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('review')
  const [disputeFor, setDisputeFor] = useState<string | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())
  const [reviewActions, setReviewActions] = useState<Record<string, { action: 'approved' | 'disputed'; catatan?: string }>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    async function fetchSupplier() {
      try {
        const res = await fetch(`/api/supplier/dashboard?user_id=${user!.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) setSupplier(data.supplier || null)
        }
      } catch {
        // fallback
      }
    }
    fetchSupplier()
  }, [user?.id])

  useEffect(() => {
    if (!supplier?.id) return
    async function fetchQA() {
      try {
        const res = await fetch(`/api/supplier/qa?supplier_id=${supplier.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) setAllQA(data.inspections || [])
        }
      } catch {
        // fallback
      }
    }
    fetchQA()
  }, [supplier?.id])

  if (!supplier) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Data supplier tidak ditemukan</p>
      </div>
    )
  }

  const pendingReview = allQA.filter(
    (qa: any) => qa.status === 'perlu_tinjauan' && qa.supplier_review_status === 'pending' && !reviewedIds.has(qa.id)
  )
  const riwayat = [
    ...allQA.filter((qa: any) => qa.supplier_review_status !== 'pending' || reviewedIds.has(qa.id)),
  ]

  async function handleApprove(qaId: string) {
    if (!supplier) return
    setSubmittingId(qaId)
    try {
      const res = await fetch('/api/supplier/qa-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qa_id: qaId,
          action: 'approved',
          supplier_id: supplier.id,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal menyetujui QA')
      }
      setReviewedIds((prev) => new Set([...prev, qaId]))
      setReviewActions((prev) => ({ ...prev, [qaId]: { action: 'approved' } }))
      toast.success('Inspeksi QA disetujui')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSubmittingId(null)
    }
  }

  async function handleDispute(qaId: string) {
    if (!disputeReason.trim() || !supplier) return
    setSubmittingId(qaId)
    try {
      const res = await fetch('/api/supplier/qa-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qa_id: qaId,
          action: 'disputed',
          catatan: disputeReason,
          supplier_id: supplier.id,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal mengirim dispute')
      }
      setReviewedIds((prev) => new Set([...prev, qaId]))
      setReviewActions((prev) => ({ ...prev, [qaId]: { action: 'disputed', catatan: disputeReason } }))
      setDisputeFor(null)
      setDisputeReason('')
      toast.success('Dispute berhasil dikirim')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSubmittingId(null)
    }
  }

  function getTransaction(txId: string) {
    return allQA.find((qa: any) => qa.transaksi_id === txId)?.transaksi || null
  }

  function getPoktan(poktanId: string) {
    const qa = allQA.find((q: any) => q.poktan_id === poktanId)
    return qa?.poktan || null
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <ClipboardCheck className="h-5 w-5 text-tani-green" />
          <div>
            <h1 className="text-sm font-semibold">Review QA</h1>
            <p className="text-[11px] text-muted-foreground">Tinjau hasil inspeksi kualitas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1">
          {([
            { id: 'review' as const, label: 'Perlu Review', count: pendingReview.length },
            { id: 'riwayat' as const, label: 'Riwayat Review', count: riwayat.length },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-tani-green text-tani-green'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge
                  variant="secondary"
                  className={`ml-1.5 text-[10px] px-1.5 py-0 ${
                    activeTab === tab.id && tab.id === 'review' ? 'bg-tani-green/10 text-tani-green' : ''
                  }`}
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {activeTab === 'review' && (
          <>
            {pendingReview.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Tidak ada inspeksi yang perlu ditinjau</p>
                </CardContent>
              </Card>
            ) : (
              pendingReview.map((qa) => {
                const tx = getTransaction(qa.transaksi_id)
                const pk = qa.poktan_id ? getPoktan(qa.poktan_id) : null
                const isDisputeOpen = disputeFor === qa.id

                return (
                  <Card key={qa.id} className="shadow-sm">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-semibold">{qa.komoditas}</CardTitle>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {pk?.nama_poktan || '-'} &middot; {formatKg(qa.volume_inspeksi_kg || 0)}
                          </p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5">
                          <Clock className="h-3 w-3 mr-0.5" />
                          Menunggu Review
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      {/* Grade & Score */}
                      <div className="flex gap-3">
                        <div className="flex-1 p-3 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Grade Hasil</p>
                          <p className="text-sm font-bold">{qa.grade_hasil || '-'}</p>
                        </div>
                        <div className="flex-1 p-3 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Skor Kualitas</p>
                          <p className="text-sm font-bold">{qa.skor_kualitas ?? '-'}/100</p>
                        </div>
                        <div className="flex-1 p-3 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Rekomendasi Sistem</p>
                          <p className="text-sm font-bold">{qa.grade_rekomendasi_sistem || '-'}</p>
                        </div>
                      </div>

                      {/* Override warning */}
                      {qa.grade_override_reason && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 mb-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Inspektor memilih grade berbeda dari rekomendasi
                          </div>
                          <p className="text-[11px] text-amber-600">
                            Alasan: {qa.grade_override_reason}
                          </p>
                        </div>
                      )}

                      {/* Inspector notes */}
                      {qa.catatan_inspektor && (
                        <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 mb-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Catatan Inspektor
                          </div>
                          <p className="text-[11px] text-blue-600">{qa.catatan_inspektor}</p>
                        </div>
                      )}

                      {/* Photo checklist */}
                      {qa.foto_urls.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Dokumentasi Foto ({qa.foto_urls.length})</p>
                          <div className="flex gap-2">
                            {qa.foto_urls.map((url: string, i: number) => (
                              <div key={i} className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                                Foto {i + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isDisputeOpen ? (
                        <div className="flex gap-2 pt-1">
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleApprove(qa.id)}
                            disabled={submittingId === qa.id}
                          >
                            {submittingId === qa.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                            Terima
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDisputeFor(qa.id)}
                            disabled={submittingId === qa.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Dispute
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-semibold text-red-700">Alasan Dispute</p>
                          <Textarea
                            placeholder="Jelaskan alasan Anda tidak setuju dengan hasil inspeksi..."
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            rows={3}
                            className="text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setDisputeFor(null)
                                setDisputeReason('')
                              }}
                            >
                              Batal
                            </Button>
                            <Button
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                              disabled={!disputeReason.trim() || submittingId === qa.id}
                              onClick={() => handleDispute(qa.id)}
                            >
                              {submittingId === qa.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                              Kirim Dispute
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </>
        )}

        {activeTab === 'riwayat' && (
          <>
            {riwayat.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="p-8 text-center">
                  <ClipboardCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Belum ada riwayat review</p>
                </CardContent>
              </Card>
            ) : (
              riwayat.map((qa) => {
                const pk = qa.poktan_id ? getPoktan(qa.poktan_id) : null
                const action = reviewActions[qa.id]
                const reviewStatus = action?.action || qa.supplier_review_status
                const isApproved = reviewStatus === 'approved'
                const isDisputed = reviewStatus === 'disputed'

                return (
                  <Card key={qa.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold">{qa.komoditas}</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {pk?.nama_poktan || '-'} &middot; {formatKg(qa.volume_inspeksi_kg || 0)}
                          </p>
                        </div>
                        {isApproved && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5">
                            <ShieldCheck className="h-3 w-3 mr-0.5" />
                            Disetujui
                          </Badge>
                        )}
                        {isDisputed && (
                          <Badge className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5">
                            <ShieldX className="h-3 w-3 mr-0.5" />
                            Sengketa
                          </Badge>
                        )}
                        {!isApproved && !isDisputed && (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                            {qa.status === 'lulus' ? 'Lulus' : qa.status === 'gagal' ? 'Gagal' : qa.status}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-3 mt-3">
                        <div className="flex-1 p-2 rounded bg-muted/50">
                          <p className="text-[10px] text-muted-foreground">Grade</p>
                          <p className="text-xs font-semibold">{qa.grade_hasil || '-'}</p>
                        </div>
                        <div className="flex-1 p-2 rounded bg-muted/50">
                          <p className="text-[10px] text-muted-foreground">Skor</p>
                          <p className="text-xs font-semibold">{qa.skor_kualitas ?? '-'}/100</p>
                        </div>
                      </div>

                      {action?.catatan && (
                        <div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
                          <p className="text-[10px] text-red-600">Alasan dispute: {action.catatan}</p>
                        </div>
                      )}
                      {qa.supplier_review_catatan && !action?.catatan && (
                        <div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
                          <p className="text-[10px] text-red-600">Alasan dispute: {qa.supplier_review_catatan}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}
