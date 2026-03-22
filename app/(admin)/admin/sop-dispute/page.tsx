'use client'

import { useState } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SOP_SECTIONS } from '@/lib/constants/sop-content'
import { BookOpen, Scale } from 'lucide-react'

export default function AdminSOPDisputePage() {
  const [activeTab, setActiveTab] = useState('s01')

  const disputeSection = SOP_SECTIONS.find((s) => s.id === 'dispute-resolution')
  const kompensasiSection = SOP_SECTIONS.find((s) => s.id === 'kompensasi-penalti')
  const eskalasi = SOP_SECTIONS.find((s) => s.id === 'matriks-eskalasi')

  const scenarios = disputeSection?.content ?? []

  const tabMap: Record<string, number> = {
    s01: 0,
    s02: 1,
    s03: 2,
    s04: 3,
    s05: 4,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="SOP Dispute Resolution" />

      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-tani-green" />
          <h2 className="text-lg font-bold font-[family-name:var(--font-heading)]">
            Panduan Penyelesaian Sengketa
          </h2>
        </div>

        {/* Scenario Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="s01" className="text-xs sm:text-sm">S-01 Kualitas</TabsTrigger>
            <TabsTrigger value="s02" className="text-xs sm:text-sm">S-02 Keterlambatan</TabsTrigger>
            <TabsTrigger value="s03" className="text-xs sm:text-sm">S-03 Volume</TabsTrigger>
            <TabsTrigger value="s04" className="text-xs sm:text-sm">S-04 Pembayaran</TabsTrigger>
            <TabsTrigger value="s05" className="text-xs sm:text-sm">S-05 Pembatalan</TabsTrigger>
          </TabsList>

          {Object.entries(tabMap).map(([tab, idx]) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {scenarios[idx] && (
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm font-[family-name:var(--font-heading)] mb-3">
                      {scenarios[idx].subtitle}
                    </h3>
                    <ul className="space-y-2">
                      {scenarios[idx].items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Scale className="h-4 w-4 text-tani-green mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Kompensasi & Penalti Table */}
        {kompensasiSection && 'tableHeaders' in kompensasiSection && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm font-[family-name:var(--font-heading)] mb-3">
                {kompensasiSection.title}
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {kompensasiSection.tableHeaders?.map((header, i) => (
                        <TableHead key={i} className="text-xs">{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kompensasiSection.tableRows?.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="text-xs">{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matriks Eskalasi Table */}
        {eskalasi && 'tableHeaders' in eskalasi && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm font-[family-name:var(--font-heading)] mb-3">
                {eskalasi.title}
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {eskalasi.tableHeaders?.map((header, i) => (
                        <TableHead key={i} className="text-xs">{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eskalasi.tableRows?.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="text-xs">{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
