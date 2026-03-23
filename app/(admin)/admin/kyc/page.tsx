'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { formatTanggal } from '@/lib/utils/date'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import type { KYCSubmission } from '@/types'
import {
  ShieldCheck, FileText, Clock, CheckCircle2, XCircle, AlertTriangle,
  ImageIcon, Loader2, Eye, History, ZoomIn, ZoomOut, X,
} from 'lucide-react'

interface KYCQueueItem {
  id: string
  user_id: string
  user_nama: string
  user_role: string
  user_email?: string
  kyc_status: string
  kyc_submitted_at: string
  kyc_reviewer_notes?: string
  docs: { doc_type: string; file_path: string; status: string }[]
  days_waiting: number
}

interface KYCReviewedItem {
  id: string
  user_id: string
  user_nama: string
  user_role: string
  kyc_status: string
  kyc_submitted_at: string
  kyc_reviewed_at: string
  kyc_reviewer_notes?: string
  docs: { doc_type: string; file_path: string; status: string }[]
}

const DOC_LABELS: Record<string, string> = {
  ktp: 'Foto KTP',
  selfie: 'Selfie + KTP',
  surat_bpp: 'Surat Rekomendasi BPP',
  rekening: 'Foto Buku Rekening',
}

export default function AdminKYCPage() {
  const adminUser = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState('antrian')
  const [selectedItem, setSelectedItem] = useState<KYCQueueItem | null>(null)
  const [catatan, setCatatan] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<'approve' | 'reject' | 'revision' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [docImages, setDocImages] = useState<Record<string, string>>({})
  const [loadingImages, setLoadingImages] = useState(false)

  const [zoomImage, setZoomImage] = useState<{ src: string; label: string } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  const [queueItems, setQueueItems] = useState<KYCQueueItem[]>([])
  const [reviewedItems, setReviewedItems] = useState<KYCReviewedItem[]>([])
  const [selectedReviewed, setSelectedReviewed] = useState<KYCReviewedItem | null>(null)
  const [reviewedDocImages, setReviewedDocImages] = useState<Record<string, string>>({})
  const [loadingReviewedImages, setLoadingReviewedImages] = useState(false)
  const [auditLog, setAuditLog] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/kyc/queue')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setQueueItems(data.queue || [])
      })
      .catch(() => {})

    fetch('/api/admin/kyc/reviewed')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReviewedItems(data.reviewed || [])
      })
      .catch(() => {})

    fetch('/api/admin/kyc/audit')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAuditLog(data.logs || [])
      })
      .catch(() => {})
  }, [])

  const pendingCount = queueItems.filter((i) => i.kyc_status === 'docs_submitted').length
  const urgentCount = queueItems.filter((i) => i.days_waiting > 3).length

  const loadSignedUrls = useCallback(async (item: KYCQueueItem) => {
    setLoadingImages(true)
    const images: Record<string, string> = {}

    for (const doc of item.docs) {
      try {
        const res = await fetch(`/api/kyc/signed-url?path=${encodeURIComponent(doc.file_path)}`)
        if (res.ok) {
          const { signedUrl } = await res.json()
          images[doc.doc_type] = signedUrl
        }
      } catch {
        // Signed URL failed — will show placeholder
      }
    }

    setDocImages(images)
    setLoadingImages(false)
  }, [])

  function handleSelectItem(item: KYCQueueItem) {
    setSelectedItem(item)
    setCatatan('')
    setConfirmDialog(null)
    loadSignedUrls(item)
  }

  const loadReviewedSignedUrls = useCallback(async (item: KYCReviewedItem) => {
    setLoadingReviewedImages(true)
    const images: Record<string, string> = {}
    for (const doc of item.docs) {
      try {
        const res = await fetch(`/api/kyc/signed-url?path=${encodeURIComponent(doc.file_path)}`)
        if (res.ok) {
          const { signedUrl } = await res.json()
          images[doc.doc_type] = signedUrl
        }
      } catch {
        // ignore
      }
    }
    setReviewedDocImages(images)
    setLoadingReviewedImages(false)
  }, [])

  function handleSelectReviewed(item: KYCReviewedItem) {
    setSelectedReviewed(item)
    loadReviewedSignedUrls(item)
  }

  async function handleAction(action: 'approve' | 'reject' | 'revision') {
    if (!selectedItem) return
    if ((action === 'reject' || action === 'revision') && !catatan) {
      toast.error('Catatan wajib diisi untuk reject dan revision')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/kyc/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedItem.user_id,
          action,
          notes: catatan || undefined,
          adminId: adminUser?.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal submit review')
      }

      const actionLabel = action === 'approve' ? 'disetujui' : action === 'reject' ? 'ditolak' : 'diminta revisi'
      toast.success(`KYC ${selectedItem.user_nama} telah ${actionLabel}`)

      // Hapus item dari antrian setelah approve/reject, refresh untuk revision
      if (action === 'approve' || action === 'reject') {
        setQueueItems((prev) => prev.filter((i) => i.id !== selectedItem.id))
      }
      setSelectedItem(null)
      setConfirmDialog(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="KYC Review" />

      <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
        {/* StatCards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Antrian Review"
            value={String(queueItems.length)}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            title="Menunggu > 3 Hari"
            value={String(urgentCount)}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatCard
            title="Sudah Direview"
            value={String(reviewedItems.length)}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            title="Ditolak"
            value={String(reviewedItems.filter((r) => r.kyc_status === 'layer1_failed').length)}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="antrian" className="text-xs sm:text-sm">
              Antrian Review
              {queueItems.length > 0 && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-tani-amber text-[10px] font-bold text-white">
                  {queueItems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="riwayat" className="text-xs sm:text-sm">
              Riwayat
              {reviewedItems.length > 0 && (
                <span className="ml-1.5 text-[10px] font-bold text-muted-foreground">
                  ({reviewedItems.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm">
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Tab: Antrian Review */}
          <TabsContent value="antrian" className="mt-4">
            {queueItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada submission yang menunggu review</p>
              </div>
            ) : (
            <div className="grid lg:grid-cols-5 gap-4">
              {/* Left — Queue list */}
              <div className="lg:col-span-2 space-y-3">
                {queueItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`shadow-sm cursor-pointer transition-all hover:shadow-md ${
                        selectedItem?.id === item.id ? 'ring-2 ring-tani-green' : ''
                      }`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                              {item.user_nama}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <StatusBadge status={item.user_role} />
                              <span className="text-xs text-muted-foreground">
                                {formatTanggal(item.kyc_submitted_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {item.days_waiting > 3 && (
                              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                URGENT
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {item.days_waiting}h
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {item.docs.map((d) => (
                            <span
                              key={d.doc_type}
                              className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                            >
                              {d.doc_type.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {/* Right — Detail panel */}
              <div className="lg:col-span-3">
                {selectedItem ? (
                  <Card className="shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      {/* User info */}
                      <div>
                        <h3 className="font-semibold text-base font-[family-name:var(--font-heading)]">
                          {selectedItem.user_nama}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={selectedItem.user_role} />
                          <span className="text-xs text-muted-foreground">
                            Diajukan: {formatTanggal(selectedItem.kyc_submitted_at)}
                          </span>
                          {selectedItem.days_waiting > 3 && (
                            <span className="text-xs font-bold text-red-600">
                              {selectedItem.days_waiting} hari menunggu
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Document Images */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Dokumen</p>
                        {loadingImages ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {['ktp', 'selfie'].map((docType) => {
                              const label = docType === 'ktp' ? 'Foto KTP' : 'Selfie + KTP'
                              return (
                                <div key={docType} className="space-y-1">
                                  <p className="text-xs font-medium capitalize">{label}</p>
                                  <div
                                    className="aspect-[4/3] bg-gray-100 rounded-lg border overflow-hidden flex items-center justify-center cursor-pointer group relative"
                                    onClick={() => docImages[docType] && setZoomImage({ src: docImages[docType], label })}
                                  >
                                    {docImages[docType] ? (
                                      <>
                                        <img
                                          src={docImages[docType]}
                                          alt={docType}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-center text-muted-foreground">
                                        <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                                        <p className="text-[10px]">Foto {docType.toUpperCase()}</p>
                                        <p className="text-[9px]">(demo — tidak ada file)</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Reviewer notes from previous revision */}
                      {selectedItem.kyc_reviewer_notes && (
                        <div className="p-2 bg-amber-50 rounded text-xs text-amber-800">
                          <strong>Catatan sebelumnya:</strong> {selectedItem.kyc_reviewer_notes}
                        </div>
                      )}

                      {/* Reviewer catatan input */}
                      <div className="space-y-2">
                        <Label htmlFor="catatan">Catatan Reviewer</Label>
                        <Textarea
                          id="catatan"
                          placeholder="Tuliskan catatan review... (wajib untuk reject & revision)"
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          rows={3}
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAction('approve')}
                          disabled={submitting}
                        >
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            if (!catatan) {
                              toast.error('Catatan wajib diisi untuk minta revisi')
                              return
                            }
                            handleAction('revision')
                          }}
                          disabled={submitting}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Revisi
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (!catatan) {
                              toast.error('Catatan wajib diisi untuk menolak')
                              return
                            }
                            setConfirmDialog('reject')
                          }}
                          disabled={submitting}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Eye className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Pilih submission dari daftar untuk mereview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </TabsContent>

          {/* Tab: Riwayat */}
          <TabsContent value="riwayat" className="mt-4">
            {reviewedItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada akun yang sudah direview</p>
              </div>
            ) : (
            <div className="grid lg:grid-cols-5 gap-4">
              {/* Left — Reviewed list */}
              <div className="lg:col-span-2 space-y-3">
                {reviewedItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`shadow-sm cursor-pointer transition-all hover:shadow-md ${
                        selectedReviewed?.id === item.id ? 'ring-2 ring-tani-green' : ''
                      }`}
                      onClick={() => handleSelectReviewed(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                              {item.user_nama}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <StatusBadge status={item.user_role} />
                              <span className="text-xs text-muted-foreground">
                                {formatTanggal(item.kyc_reviewed_at)}
                              </span>
                            </div>
                          </div>
                          <StatusBadge status={
                            item.kyc_status === 'layer1_failed' ? 'rejected' : 'approved'
                          } />
                        </div>
                        <div className="flex gap-1">
                          {item.docs.map((d) => (
                            <span
                              key={d.doc_type}
                              className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                            >
                              {d.doc_type.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {/* Right — Detail panel */}
              <div className="lg:col-span-3">
                {selectedReviewed ? (
                  <Card className="shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      {/* User info */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-base font-[family-name:var(--font-heading)]">
                            {selectedReviewed.user_nama}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={selectedReviewed.user_role} />
                            <span className="text-xs text-muted-foreground">
                              Diajukan: {formatTanggal(selectedReviewed.kyc_submitted_at)}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={
                          selectedReviewed.kyc_status === 'layer1_failed' ? 'rejected' : 'approved'
                        } />
                      </div>

                      {/* Review info */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Status KYC</span>
                          <span className="font-medium">{selectedReviewed.kyc_status}</span>
                        </div>
                        {selectedReviewed.kyc_reviewed_at && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Tanggal Review</span>
                            <span className="font-medium">{formatTanggal(selectedReviewed.kyc_reviewed_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Reviewer notes */}
                      {selectedReviewed.kyc_reviewer_notes && (
                        <div className="p-2 bg-amber-50 rounded text-xs text-amber-800">
                          <strong>Catatan Reviewer:</strong> {selectedReviewed.kyc_reviewer_notes}
                        </div>
                      )}

                      {/* Document Images */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Dokumen</p>
                        {loadingReviewedImages ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {selectedReviewed.docs.map((doc) => {
                              const label = DOC_LABELS[doc.doc_type] || doc.doc_type.toUpperCase()
                              return (
                                <div key={doc.doc_type} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium">{label}</p>
                                    <StatusBadge status={doc.status} />
                                  </div>
                                  <div
                                    className="aspect-[4/3] bg-gray-100 rounded-lg border overflow-hidden flex items-center justify-center cursor-pointer group relative"
                                    onClick={() => reviewedDocImages[doc.doc_type] && setZoomImage({ src: reviewedDocImages[doc.doc_type], label })}
                                  >
                                    {reviewedDocImages[doc.doc_type] ? (
                                      <>
                                        <img
                                          src={reviewedDocImages[doc.doc_type]}
                                          alt={doc.doc_type}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-center text-muted-foreground">
                                        <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                                        <p className="text-[10px]">{label}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Eye className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Pilih akun dari daftar untuk melihat detail</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </TabsContent>

          {/* Tab: Audit Log */}
          <TabsContent value="audit" className="mt-4">
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left px-4 py-2 font-medium text-xs">Tanggal</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Nama User</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Role</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Action</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Admin</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((log) => (
                        <tr key={log.id} className="border-b last:border-0">
                          <td className="px-4 py-2 text-xs text-muted-foreground">
                            {formatTanggal(log.created_at)}
                          </td>
                          <td className="px-4 py-2 text-xs font-medium">{log.user_nama}</td>
                          <td className="px-4 py-2">
                            <StatusBadge status={log.user_role} />
                          </td>
                          <td className="px-4 py-2">
                            <StatusBadge status={
                              log.action === 'kyc_approve' ? 'approved'
                              : log.action === 'kyc_reject' ? 'rejected'
                              : log.action === 'kyc_revision' ? 'revisi'
                              : log.action
                            } />
                          </td>
                          <td className="px-4 py-2 text-xs">{log.admin_nama}</td>
                          <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                            {log.notes}
                          </td>
                        </tr>
                      ))}
                      {auditLog.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                            Belum ada audit log
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Reject Dialog */}
      <Dialog open={confirmDialog === 'reject'} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-700">Konfirmasi Penolakan</DialogTitle>
            <DialogDescription>
              Yakin ingin menolak KYC {selectedItem?.user_nama}? Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleAction('reject')}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Ya, Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Zoom Dialog */}
      <Dialog open={!!zoomImage} onOpenChange={() => { setZoomImage(null); setZoomLevel(1) }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-black/95 border-0">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
            <DialogTitle className="text-white text-sm font-medium">
              {zoomImage?.label}
            </DialogTitle>
            <DialogDescription className="sr-only">Zoom gambar dokumen KYC</DialogDescription>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white text-xs min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={() => setZoomLevel((z) => Math.min(4, z + 0.25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={() => { setZoomImage(null); setZoomLevel(1) }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="w-full h-full overflow-auto flex items-center justify-center cursor-grab active:cursor-grabbing">
            {zoomImage && (
              <img
                src={zoomImage.src}
                alt={zoomImage.label}
                className="transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                draggable={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
