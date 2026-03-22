'use client'

import { useState } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { SOP_SECTIONS } from '@/lib/constants/sop-content'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronDown, ScrollText } from 'lucide-react'

export default function SOPPage() {
  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Peraturan & SOP Platform" />

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ScrollText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold font-[family-name:var(--font-heading)]">
            Peraturan & SOP Platform
          </h2>
        </div>

        {SOP_SECTIONS.map((section) => (
          <Card key={section.id} className="shadow-sm">
            <CardContent className="p-0">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <h3 className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                  {section.title}
                </h3>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    openSections.includes(section.id) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openSections.includes(section.id) && (
                <div className="px-4 pb-4 space-y-3">
                  {'content' in section &&
                    section.content &&
                    section.content.map((block, i) => (
                      <div key={i}>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">
                          {block.subtitle}
                        </h4>
                        <ul className="list-disc list-inside space-y-0.5">
                          {block.items.map((item, j) => (
                            <li key={j} className="text-sm text-gray-600">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  {'tableHeaders' in section &&
                    section.tableHeaders &&
                    section.tableRows && (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {section.tableHeaders.map((h, i) => (
                                <TableHead key={i} className="text-xs">
                                  {h}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.tableRows.map((row, i) => (
                              <TableRow key={i}>
                                {row.map((cell, j) => (
                                  <TableCell key={j} className="text-xs">
                                    {cell}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
