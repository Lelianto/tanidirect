import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  dummyUsers, dummyPoktan, dummyPreOrders, dummyTransaksi,
  dummyKontribusi, dummyKredit, dummyQAInspeksi, dummyHargaHistoris,
  dummyDisputes, dummyAnggotaPoktan,
} from '@/lib/dummy'

// Mock Supabase - returns dummy data sesuai query
function createMockSupabase() {
  const tables: Record<string, any[]> = {
    users: dummyUsers,
    poktan: dummyPoktan,
    pre_order: dummyPreOrders,
    transaksi: dummyTransaksi,
    kontribusi_petani: dummyKontribusi,
    kredit: dummyKredit,
    qa_inspeksi: dummyQAInspeksi,
    harga_historis: dummyHargaHistoris,
    disputes: dummyDisputes,
    anggota_poktan: dummyAnggotaPoktan,
    prediksi_harga: [],
    anomali_log: [],
    ai_cache: [],
    dispute_evidence: dummyDisputes.flatMap(d => d.bukti.map(b => ({ ...b, dispute_id: d.id }))),
    dispute_timeline: dummyDisputes.flatMap(d => d.timeline.map(t => ({ ...t, dispute_id: d.id }))),
  }

  function createQueryBuilder(tableName: string) {
    let data = [...(tables[tableName] || [])]
    let isSingle = false
    let insertData: any = null

    const builder: any = {
      select: () => builder,
      eq: (field: string, value: any) => {
        data = data.filter((item: any) => item[field] === value)
        return builder
      },
      neq: (field: string, value: any) => {
        data = data.filter((item: any) => item[field] !== value)
        return builder
      },
      gt: () => builder,
      gte: (field: string, value: any) => {
        data = data.filter((item: any) => item[field] >= value)
        return builder
      },
      order: () => builder,
      limit: (n: number) => {
        data = data.slice(0, n)
        return builder
      },
      single: () => {
        isSingle = true
        return { data: data[0] || null, error: data[0] ? null : { message: 'Not found' } }
      },
      insert: (d: any) => {
        insertData = d
        return { select: () => ({ data: insertData, error: null }) }
      },
      upsert: () => {
        return { data: null, error: null }
      },
      delete: () => builder,
      then: undefined, // Make it awaitable
    }

    // Make builder thenable (awaitable)
    Object.defineProperty(builder, 'then', {
      value: (resolve: any) => resolve({ data, error: null }),
      configurable: true,
    })

    return builder
  }

  return {
    from: (table: string) => createQueryBuilder(table),
  }
}

// Mock Groq - always throw to trigger fallback
vi.mock('@/lib/groq/helpers', () => ({
  queryGroqJSON: vi.fn().mockRejectedValue(new Error('AI unavailable')),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => createMockSupabase(),
}))

// ==========================================
// TEST: Matching Endpoint (Fallback)
// ==========================================
describe('AI Matching - Fallback dengan data dummy', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('@/app/api/ai/matching/route')
    POST = mod.POST
  })

  it('should return ranked poktan for Tomat pre-order (po-01)', async () => {
    const req = new Request('http://localhost/api/ai/matching', {
      method: 'POST',
      body: JSON.stringify({ preOrderId: 'po-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ranking).toBeDefined()
    expect(json.ranking.length).toBeGreaterThan(0)
    expect(json.rekomendasiUtama).toBeDefined()

    // Poktan Mekar Tani & Maju Jaya punya Tomat
    const poktanNames = json.ranking.map((r: any) => r.namaPoktan)
    expect(poktanNames).toContain('Poktan Mekar Tani')

    // Each ranking has required fields
    json.ranking.forEach((r: any) => {
      expect(r).toHaveProperty('poktanId')
      expect(r).toHaveProperty('namaPoktan')
      expect(r).toHaveProperty('skorKesesuaian')
      expect(r).toHaveProperty('alasan')
      expect(r.skorKesesuaian).toBeGreaterThanOrEqual(0)
      expect(r.skorKesesuaian).toBeLessThanOrEqual(100)
    })
  })

  it('should return Mekar Tani as top match for Jawa Barat PO', async () => {
    // po-01 is from Jawa Barat, and Mekar Tani is in Jawa Barat with highest QA
    const req = new Request('http://localhost/api/ai/matching', {
      method: 'POST',
      body: JSON.stringify({ preOrderId: 'po-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(json.ranking[0].namaPoktan).toBe('Poktan Mekar Tani')
    // Mekar Tani should have higher score because same province + higher QA
    expect(json.ranking[0].skorKesesuaian).toBeGreaterThan(70)
  })

  it('should return 404 for invalid pre-order', async () => {
    const req = new Request('http://localhost/api/ai/matching', {
      method: 'POST',
      body: JSON.stringify({ preOrderId: 'po-nonexistent' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('should flag low QA risk for poktan with skor_qa < 70', async () => {
    // po-01 for Tomat — Maju Jaya has skor_qa 65
    const req = new Request('http://localhost/api/ai/matching', {
      method: 'POST',
      body: JSON.stringify({ preOrderId: 'po-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    const majuJaya = json.ranking.find((r: any) => r.namaPoktan === 'Poktan Maju Jaya')
    if (majuJaya) {
      expect(majuJaya.catatanRisiko).toContain('Skor QA di bawah rata-rata')
    }
  })
})

// ==========================================
// TEST: Credit Score Endpoint (Fallback)
// ==========================================
describe('AI Credit Score - Fallback dengan data dummy', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('@/app/api/ai/credit-score/route')
    POST = mod.POST
  })

  it('should score petani u-petani-01 (active, verified, multiple tx)', async () => {
    const req = new Request('http://localhost/api/ai/credit-score', {
      method: 'POST',
      body: JSON.stringify({ petaniId: 'u-petani-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.skor).toBeGreaterThanOrEqual(50)
    expect(json.kategori).toBeDefined()
    expect(json.batasKreditRp).toBeGreaterThan(0)
    expect(Array.isArray(json.faktorPositif)).toBe(true)
    expect(Array.isArray(json.faktorRisiko)).toBe(true)
    expect(json.rekomendasi).toBeDefined()
  })

  it('should give higher score to verified petani with many transactions', async () => {
    // u-petani-01: verified, 3 kontribusi, has kredit aktif
    const req = new Request('http://localhost/api/ai/credit-score', {
      method: 'POST',
      body: JSON.stringify({ petaniId: 'u-petani-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    // Should get bonus for: verified (+5), 3+ tx (+15), high pendapatan (+10)
    expect(json.skor).toBeGreaterThanOrEqual(70)
    expect(json.faktorPositif.length).toBeGreaterThan(0)
  })

  it('should give lower score to unverified petani with few transactions', async () => {
    // u-petani-05: unverified, 2 kontribusi
    const req = new Request('http://localhost/api/ai/credit-score', {
      method: 'POST',
      body: JSON.stringify({ petaniId: 'u-petani-05' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(json.faktorRisiko.length).toBeGreaterThan(0)
  })

  it('should return 404 for non-existent petani', async () => {
    const req = new Request('http://localhost/api/ai/credit-score', {
      method: 'POST',
      body: JSON.stringify({ petaniId: 'u-nonexistent' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('should return correct response shape', async () => {
    const req = new Request('http://localhost/api/ai/credit-score', {
      method: 'POST',
      body: JSON.stringify({ petaniId: 'u-petani-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(typeof json.skor).toBe('number')
    expect(['Sangat Baik', 'Baik', 'Cukup', 'Perlu Perhatian']).toContain(json.kategori)
    expect(typeof json.batasKreditRp).toBe('number')
    expect(typeof json.rekomendasi).toBe('string')
  })
})

// ==========================================
// TEST: Price Prediction Endpoint (Fallback)
// ==========================================
describe('AI Price Prediction - Fallback dengan data dummy', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('@/app/api/ai/price-prediction/route')
    POST = mod.POST
  })

  it('should predict price for Tomat in Jawa Barat', async () => {
    const req = new Request('http://localhost/api/ai/price-prediction', {
      method: 'POST',
      body: JSON.stringify({ komoditas: 'Tomat', wilayah: 'Jawa Barat' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.tren).toBeDefined()
    expect(['naik', 'turun', 'stabil']).toContain(json.tren)
    expect(json.estimasi_2_minggu).toBeDefined()
    expect(json.estimasi_2_minggu.min).toBeLessThan(json.estimasi_2_minggu.max)
    expect(json.estimasi_4_minggu).toBeDefined()
    expect(json.faktor_penentu).toBeDefined()
    expect(json.faktor_penentu.length).toBeGreaterThan(0)
    expect(json.catatan_penting).toBeDefined()
    expect(json.valid_hingga).toBeDefined()
  })

  it('should return 404 for unknown commodity/region', async () => {
    const req = new Request('http://localhost/api/ai/price-prediction', {
      method: 'POST',
      body: JSON.stringify({ komoditas: 'Durian', wilayah: 'Kalimantan' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('should have valid_hingga 7 days from now', async () => {
    const req = new Request('http://localhost/api/ai/price-prediction', {
      method: 'POST',
      body: JSON.stringify({ komoditas: 'Tomat', wilayah: 'Jawa Barat' }),
    })
    const res = await POST(req)
    const json = await res.json()

    const validDate = new Date(json.valid_hingga)
    const now = new Date()
    const diffDays = (validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThan(5)
    expect(diffDays).toBeLessThan(8)
  })
})

// ==========================================
// TEST: Anomaly Detection Endpoint (Fallback)
// ==========================================
describe('AI Anomaly Detection - Fallback dengan data dummy', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('@/app/api/ai/anomaly/route')
    POST = mod.POST
  })

  it('should detect anomaly for poktan pk-03 (low QA score)', async () => {
    // pk-03 Maju Jaya has skor_qa 65 < 70
    const req = new Request('http://localhost/api/ai/anomaly', {
      method: 'POST',
      body: JSON.stringify({ poktanId: 'pk-03' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.poktanId).toBe('pk-03')
    expect(json.namaPoktan).toBe('Poktan Maju Jaya')
    expect(json.totalAnomalies).toBeGreaterThan(0)
    expect(json.anomalies.length).toBeGreaterThan(0)

    // Should have QA anomaly
    const qaAnomaly = json.anomalies.find((a: any) => a.kategori === 'A04')
    expect(qaAnomaly).toBeDefined()
    expect(qaAnomaly.deskripsi).toContain('65')
  })

  it('should return low risk for poktan pk-01 (good QA score)', async () => {
    // pk-01 Mekar Tani has skor_qa 87.5
    const req = new Request('http://localhost/api/ai/anomaly', {
      method: 'POST',
      body: JSON.stringify({ poktanId: 'pk-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.namaPoktan).toBe('Poktan Mekar Tani')
    // High QA score, no QA anomaly expected
    const qaAnomaly = json.anomalies.find((a: any) => a.kategori === 'A04')
    expect(qaAnomaly).toBeUndefined()
  })

  it('should return correct response shape', async () => {
    const req = new Request('http://localhost/api/ai/anomaly', {
      method: 'POST',
      body: JSON.stringify({ poktanId: 'pk-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(typeof json.totalAnomalies).toBe('number')
    expect(Array.isArray(json.anomalies)).toBe(true)
    expect(['rendah', 'sedang', 'tinggi']).toContain(json.overallRisk)
    expect(typeof json.rekomendasi).toBe('string')
  })

  it('should return 404 for non-existent poktan', async () => {
    const req = new Request('http://localhost/api/ai/anomaly', {
      method: 'POST',
      body: JSON.stringify({ poktanId: 'pk-nonexistent' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})

// ==========================================
// TEST: Dispute Recommendation Endpoint (Fallback)
// ==========================================
describe('AI Dispute Recommendation - Fallback dengan data dummy', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('@/app/api/ai/dispute-recommendation/route')
    POST = mod.POST
  })

  it('should recommend for kualitas dispute dsp-01', async () => {
    const req = new Request('http://localhost/api/ai/dispute-recommendation', {
      method: 'POST',
      body: JSON.stringify({ disputeId: 'dsp-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(['kompensasi', 'tolak', 'mediasi', 'eskalasi']).toContain(json.rekomendasiResolusi)
    expect(typeof json.kompensasiSaran).toBe('number')
    expect(typeof json.alasan).toBe('string')
    expect(Array.isArray(json.preseden)).toBe(true)
    expect(['tinggi', 'sedang', 'rendah']).toContain(json.tingkatKepercayaan)
  })

  it('should return 404 for non-existent dispute', async () => {
    const req = new Request('http://localhost/api/ai/dispute-recommendation', {
      method: 'POST',
      body: JSON.stringify({ disputeId: 'dsp-nonexistent' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('should recommend mediasi by default (fallback)', async () => {
    // dsp-02 is keterlambatan (not kualitas), so fallback → mediasi
    const req = new Request('http://localhost/api/ai/dispute-recommendation', {
      method: 'POST',
      body: JSON.stringify({ disputeId: 'dsp-02' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(json.rekomendasiResolusi).toBe('mediasi')
    expect(json.tingkatKepercayaan).toBe('rendah')
  })
})

// ==========================================
// TEST: Dashboard Insight Endpoint (Fallback)
// ==========================================
describe('AI Dashboard Insight - Fallback dengan data dummy', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('@/app/api/ai/dashboard-insight/route')
    POST = mod.POST
  })

  it('should return insight with correct shape', async () => {
    const req = new Request('http://localhost/api/ai/dashboard-insight', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(typeof json.ringkasan).toBe('string')
    expect(json.ringkasan.length).toBeGreaterThan(0)
    expect(Array.isArray(json.insights)).toBe(true)
    expect(Array.isArray(json.peringatan)).toBe(true)
    expect(Array.isArray(json.rekomendasiAksi)).toBe(true)
  })
})

// ==========================================
// TEST: JSON Parsing Logic (same as in helpers.ts)
// ==========================================
describe('JSON parsing from AI response', () => {
  function extractJSON(content: string) {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/) || content.match(/(\[[\s\S]*\])/)
    if (!jsonMatch) return null
    const jsonStr = jsonMatch[1] || jsonMatch[0]
    return JSON.parse(jsonStr)
  }

  it('should parse JSON from markdown code block', () => {
    const response = '```json\n{"skor": 85, "kategori": "Baik"}\n```'
    const result = extractJSON(response)
    expect(result.skor).toBe(85)
    expect(result.kategori).toBe('Baik')
  })

  it('should parse raw JSON object', () => {
    const response = '{"tren": "naik", "estimasi": 12000}'
    const result = extractJSON(response)
    expect(result.tren).toBe('naik')
  })

  it('should parse JSON from code block with array', () => {
    const response = '```json\n[{"parameter": "test", "kriteria": "ok"}]\n```'
    const result = extractJSON(response)
    expect(Array.isArray(result)).toBe(true)
    expect(result[0].parameter).toBe('test')
  })

  it('should handle JSON with surrounding text', () => {
    const response = 'Berikut analisis:\n{"skor": 90}\nSemoga membantu.'
    const result = extractJSON(response)
    expect(result.skor).toBe(90)
  })

  it('should return null for no JSON', () => {
    const response = 'Tidak ada data yang bisa dianalisis.'
    const result = extractJSON(response)
    expect(result).toBeNull()
  })
})
