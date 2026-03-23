import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  dummyUsers, dummyPoktan, dummyTransaksi,
  dummyAnggotaPoktan, dummyQAInspeksi, dummySuppliers,
} from '@/lib/dummy'

// ==========================================
// Mock Supabase — enhanced for settlement APIs
// ==========================================

// Mutable store for inserts and updates during tests
let insertedRecords: Record<string, any[]> = {}
let updatedRecords: Record<string, { filter: Record<string, any>; data: any }[]> = {}
let transactionStore: Record<string, any> = {}

function createMockSupabase() {
  const tables: Record<string, any[]> = {
    users: dummyUsers,
    poktan: dummyPoktan,
    transaksi: dummyTransaksi.map(t => ({
      ...t,
      ...(transactionStore[t.id] || {}),
    })),
    anggota_poktan: dummyAnggotaPoktan,
    qa_inspeksi: dummyQAInspeksi,
    supplier: dummySuppliers,
    kontribusi_petani: [],
    notifikasi: [],
    pencairan_poktan: insertedRecords['pencairan_poktan'] || [],
    rekening: [
      { id: 'rek-01', user_id: 'u-ketua-01', metode: 'bank', provider: 'BRI', nomor: '1234567890', atas_nama: 'SURYA WIJAYA', is_primary: true },
    ],
  }

  function createQueryBuilder(tableName: string) {
    let data = [...(tables[tableName] || [])]
    let filters: Record<string, any> = {}
    let inFilters: Record<string, any[]> = {}

    const builder: any = {
      select: () => builder,
      eq: (field: string, value: any) => {
        filters[field] = value
        data = data.filter((item: any) => item[field] === value)
        return builder
      },
      neq: (field: string, value: any) => {
        data = data.filter((item: any) => item[field] !== value)
        return builder
      },
      in: (field: string, values: any[]) => {
        inFilters[field] = values
        data = data.filter((item: any) => values.includes(item[field]))
        return builder
      },
      order: () => builder,
      limit: (n: number) => {
        data = data.slice(0, n)
        return builder
      },
      single: () => {
        const item = data[0] || null
        // For transaksi, add nested poktan/supplier
        if (tableName === 'transaksi' && item) {
          item.poktan = dummyPoktan.find(p => p.id === item.poktan_id) || null
          item.supplier = dummySuppliers.find(s => s.id === item.supplier_id) || null
        }
        if (tableName === 'poktan' && item) {
          // already has all fields
        }
        return { data: item, error: item ? null : { message: 'Not found' } }
      },
      insert: (d: any) => {
        const records = Array.isArray(d) ? d : [d]
        if (!insertedRecords[tableName]) insertedRecords[tableName] = []
        insertedRecords[tableName].push(...records)
        return {
          select: () => ({
            single: () => ({ data: { id: `mock-${Date.now()}`, ...records[0] }, error: null }),
            data: records,
            error: null,
          }),
          data: records,
          error: null,
        }
      },
      upsert: (_d: any, _opts?: any) => {
        return {
          select: () => ({
            single: () => ({ data: { id: 'rek-mock-01' }, error: null }),
          }),
          data: null,
          error: null,
        }
      },
      update: (d: any) => {
        if (!updatedRecords[tableName]) updatedRecords[tableName] = []
        updatedRecords[tableName].push({ filter: { ...filters }, data: d })
        // Also apply to transactionStore if transaksi
        if (tableName === 'transaksi' && filters['id']) {
          transactionStore[filters['id']] = { ...(transactionStore[filters['id']] || {}), ...d }
        }
        return { eq: (f: string, v: any) => {
          if (!updatedRecords[tableName]) updatedRecords[tableName] = []
          updatedRecords[tableName][updatedRecords[tableName].length - 1].filter[f] = v
          if (tableName === 'transaksi') {
            transactionStore[v] = { ...(transactionStore[v] || {}), ...d }
          }
          return { data: null, error: null }
        }, data: null, error: null }
      },
      delete: () => builder,
    }

    // Make builder thenable
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

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => createMockSupabase(),
}))

// ==========================================
// TEST: Settlement API — POST /api/admin/settlement
// ==========================================
describe('Settlement API — POST', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    insertedRecords = {}
    updatedRecords = {}
    transactionStore = {}
    const mod = await import('@/app/api/admin/settlement/route')
    POST = mod.POST
  })

  it('should settle transaksi tx-03 (status selesai, poktan pk-01)', async () => {
    // tx-03: Wortel, 2950kg, 10000/kg, poktan pk-01, status selesai
    const req = new Request('http://localhost/api/admin/settlement', {
      method: 'POST',
      body: JSON.stringify({ transaksi_id: 'tx-03', admin_id: 'u-admin-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.settlement).toBeDefined()

    // Verify calculations
    // total_nilai = 2950 * 10000 = 29,500,000
    expect(json.settlement.total_nilai).toBe(29500000)

    // komisi_platform = 29,500,000 * 0.02 = 590,000
    expect(json.settlement.komisi_platform).toBe(590000)

    // fee_qa from qa-03: fee_dibayar = 295,000
    expect(json.settlement.fee_qa).toBe(295000)

    // dana_petani = 29,500,000 - 590,000 - 295,000 = 28,615,000
    expect(json.settlement.dana_petani).toBe(28615000)

    // 5 anggota poktan pk-01
    expect(json.settlement.jumlah_petani).toBe(5)
  })

  it('should create kontribusi_petani records proportionally', async () => {
    const req = new Request('http://localhost/api/admin/settlement', {
      method: 'POST',
      body: JSON.stringify({ transaksi_id: 'tx-03', admin_id: 'u-admin-01' }),
    })
    await POST(req)

    // Should insert kontribusi_petani for each anggota
    const kontribusi = insertedRecords['kontribusi_petani'] || []
    expect(kontribusi.length).toBe(5)

    // Check proportions: total lahan = 1.5 + 2.0 + 0.8 + 1.2 + 3.0 = 8.5
    // petani u-petani-01: 1.5/8.5 ≈ 17.6%
    // petani u-petani-03 (lahan 3.0): 3.0/8.5 ≈ 35.3% — should have the biggest share
    const petani03 = kontribusi.find((k: any) => k.petani_id === 'u-petani-03')
    const petani04 = kontribusi.find((k: any) => k.petani_id === 'u-petani-04')
    expect(petani03).toBeDefined()
    expect(petani04).toBeDefined()

    // petani-03 has 3.0ha, petani-04 has 0.8ha → petani-03 gets more
    expect(petani03.harga_diterima).toBeGreaterThan(petani04.harga_diterima)

    // All should have status_bayar = 'belum'
    kontribusi.forEach((k: any) => {
      expect(k.status_bayar).toBe('belum')
      expect(k.transaksi_id).toBe('tx-03')
    })
  })

  it('should send notifications to supplier and poktan ketua', async () => {
    const req = new Request('http://localhost/api/admin/settlement', {
      method: 'POST',
      body: JSON.stringify({ transaksi_id: 'tx-03', admin_id: 'u-admin-01' }),
    })
    await POST(req)

    const notifs = insertedRecords['notifikasi'] || []
    expect(notifs.length).toBeGreaterThanOrEqual(2)

    // Supplier sp-01 has user_id u-supplier-01
    const supplierNotif = notifs.find((n: any) => n.user_id === 'u-supplier-01')
    expect(supplierNotif).toBeDefined()
    expect(supplierNotif.tipe).toBe('settlement')

    // Poktan pk-01 ketua is u-ketua-01
    const poktanNotif = notifs.find((n: any) => n.user_id === 'u-ketua-01')
    expect(poktanNotif).toBeDefined()
    expect(poktanNotif.tipe).toBe('settlement')
  })

  it('should update transaksi with settled_at and settled_by', async () => {
    const req = new Request('http://localhost/api/admin/settlement', {
      method: 'POST',
      body: JSON.stringify({ transaksi_id: 'tx-03', admin_id: 'u-admin-01' }),
    })
    await POST(req)

    const updates = updatedRecords['transaksi'] || []
    expect(updates.length).toBeGreaterThanOrEqual(1)

    const txUpdate = updates[0]
    expect(txUpdate.data.settled_by).toBe('u-admin-01')
    expect(txUpdate.data.settled_at).toBeDefined()
    expect(txUpdate.data.komisi_platform).toBe(590000)
  })

  it('should reject if transaksi status is not selesai', async () => {
    // tx-01 status is 'dikonfirmasi'
    const req = new Request('http://localhost/api/admin/settlement', {
      method: 'POST',
      body: JSON.stringify({ transaksi_id: 'tx-01', admin_id: 'u-admin-01' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('selesai')
  })

  it('should reject if transaksi already settled', async () => {
    // Settle tx-03 first
    transactionStore['tx-03'] = { settled_at: new Date().toISOString() }

    const req = new Request('http://localhost/api/admin/settlement', {
      method: 'POST',
      body: JSON.stringify({ transaksi_id: 'tx-03', admin_id: 'u-admin-01' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('sudah di-settle')
  })

  it('should reject if transaksi not found', async () => {
    const req = new Request('http://localhost/api/admin/settlement', {
      method: 'POST',
      body: JSON.stringify({ transaksi_id: 'tx-nonexistent', admin_id: 'u-admin-01' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(404)
  })

  it('should return 400 if missing parameters', async () => {
    const req = new Request('http://localhost/api/admin/settlement', {
      method: 'POST',
      body: JSON.stringify({ transaksi_id: 'tx-03' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})

// ==========================================
// TEST: Settlement API — GET /api/admin/settlement
// ==========================================
describe('Settlement API — GET (breakdown)', () => {
  let GET: any

  beforeEach(async () => {
    vi.resetModules()
    insertedRecords = {}
    updatedRecords = {}
    transactionStore = {}
    const mod = await import('@/app/api/admin/settlement/route')
    GET = mod.GET
  })

  it('should return breakdown for tx-03', async () => {
    const req = new Request('http://localhost/api/admin/settlement?transaksi_id=tx-03')
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.breakdown).toBeDefined()

    // tx-03: 2950kg * 10000 = 29,500,000
    expect(json.breakdown.total_nilai).toBe(29500000)
    expect(json.breakdown.komisi_platform).toBe(590000)
    expect(json.breakdown.fee_qa).toBe(295000) // qa-03 fee_dibayar
    expect(json.breakdown.dana_petani).toBe(28615000)
  })

  it('should return 400 if no transaksi_id', async () => {
    const req = new Request('http://localhost/api/admin/settlement')
    const res = await GET(req)

    expect(res.status).toBe(400)
  })

  it('should return 404 for nonexistent transaksi', async () => {
    const req = new Request('http://localhost/api/admin/settlement?transaksi_id=tx-nonexistent')
    const res = await GET(req)

    expect(res.status).toBe(404)
  })
})

// ==========================================
// TEST: Poktan Cairkan API — POST /api/poktan/cairkan
// ==========================================
describe('Poktan Cairkan API — POST', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    insertedRecords = {}
    updatedRecords = {}
    transactionStore = {}
    const mod = await import('@/app/api/poktan/cairkan/route')
    POST = mod.POST
  })

  it('should create pencairan for poktan pk-01', async () => {
    // pk-01 has qa-03 (fee_dibayar=295000) + qa-04 (fee_dibayar=0) + qa-05 (fee_dibayar=0) = 295000 saldo
    const req = new Request('http://localhost/api/poktan/cairkan', {
      method: 'POST',
      body: JSON.stringify({
        poktan_id: 'pk-01',
        jumlah: 100000,
        rekening: { metode: 'bank', provider: 'BRI', nomor: '1234567890', atas_nama: 'SURYA WIJAYA' },
      }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.pencairan_id).toBeDefined()
    // jumlah_diterima = 100000 - 2500 = 97500
    expect(json.jumlah_diterima).toBe(97500)
    expect(json.status).toBe('diproses')
  })

  it('should send notifications to ketua and admins', async () => {
    const req = new Request('http://localhost/api/poktan/cairkan', {
      method: 'POST',
      body: JSON.stringify({
        poktan_id: 'pk-01',
        jumlah: 50000,
        rekening: { metode: 'bank', provider: 'BCA', nomor: '9876543210', atas_nama: 'SURYA WIJAYA' },
      }),
    })
    await POST(req)

    const notifs = insertedRecords['notifikasi'] || []
    // ketua u-ketua-01 notif
    const ketuaNotif = notifs.find((n: any) => n.user_id === 'u-ketua-01')
    expect(ketuaNotif).toBeDefined()
    expect(ketuaNotif.tipe).toBe('pencairan')

    // admin notifs (u-admin-01)
    const adminNotif = notifs.find((n: any) => n.user_id === 'u-admin-01')
    expect(adminNotif).toBeDefined()
    expect(adminNotif.pesan).toContain('Poktan Mekar Tani')
  })

  it('should reject if saldo insufficient', async () => {
    // pk-01 saldo = 295000, try to withdraw 500000
    const req = new Request('http://localhost/api/poktan/cairkan', {
      method: 'POST',
      body: JSON.stringify({
        poktan_id: 'pk-01',
        jumlah: 500000,
        rekening: { metode: 'bank', provider: 'BRI', nomor: '1234567890', atas_nama: 'SURYA WIJAYA' },
      }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Saldo tidak cukup')
  })

  it('should reject if jumlah <= biaya admin', async () => {
    const req = new Request('http://localhost/api/poktan/cairkan', {
      method: 'POST',
      body: JSON.stringify({
        poktan_id: 'pk-01',
        jumlah: 2000,
        rekening: { metode: 'bank', provider: 'BRI', nomor: '1234567890', atas_nama: 'SURYA WIJAYA' },
      }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('biaya admin')
  })

  it('should reject invalid rekening metode', async () => {
    const req = new Request('http://localhost/api/poktan/cairkan', {
      method: 'POST',
      body: JSON.stringify({
        poktan_id: 'pk-01',
        jumlah: 50000,
        rekening: { metode: 'crypto', provider: 'BTC', nomor: '0x123', atas_nama: 'Test' },
      }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('metode')
  })

  it('should reject missing required fields', async () => {
    const req = new Request('http://localhost/api/poktan/cairkan', {
      method: 'POST',
      body: JSON.stringify({ poktan_id: 'pk-01' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('should reject nonexistent poktan', async () => {
    const req = new Request('http://localhost/api/poktan/cairkan', {
      method: 'POST',
      body: JSON.stringify({
        poktan_id: 'pk-nonexistent',
        jumlah: 50000,
        rekening: { metode: 'bank', provider: 'BRI', nomor: '1234567890', atas_nama: 'Test' },
      }),
    })
    const res = await POST(req)

    expect(res.status).toBe(404)
  })
})

// ==========================================
// TEST: Poktan Cairkan API — GET
// ==========================================
describe('Poktan Cairkan API — GET', () => {
  let GET: any

  beforeEach(async () => {
    vi.resetModules()
    insertedRecords = {}
    updatedRecords = {}
    transactionStore = {}
    const mod = await import('@/app/api/poktan/cairkan/route')
    GET = mod.GET
  })

  it('should return saldo and pencairan list for pk-01', async () => {
    const req = new Request('http://localhost/api/poktan/cairkan?poktan_id=pk-01')
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(typeof json.saldo).toBe('number')
    expect(typeof json.total_fee).toBe('number')
    expect(Array.isArray(json.pencairan)).toBe(true)

    // pk-01: qa-03 fee_dibayar=295000, qa-04=0, qa-05=0 → total_fee=295000
    expect(json.total_fee).toBe(295000)
    // No prior withdrawals → saldo = total_fee
    expect(json.saldo).toBe(295000)
  })

  it('should return 400 if no poktan_id', async () => {
    const req = new Request('http://localhost/api/poktan/cairkan')
    const res = await GET(req)

    expect(res.status).toBe(400)
  })
})

// ==========================================
// TEST: Admin Pencairan Poktan API — PATCH
// ==========================================
describe('Admin Pencairan Poktan API — PATCH', () => {
  let PATCH: any

  beforeEach(async () => {
    vi.resetModules()
    // Seed a "diproses" pencairan
    insertedRecords = {
      pencairan_poktan: [{
        id: 'cp-01',
        poktan_id: 'pk-01',
        jumlah: 100000,
        biaya_admin: 2500,
        jumlah_diterima: 97500,
        status: 'diproses',
        created_at: '2026-03-23T10:00:00Z',
      }],
    }
    updatedRecords = {}
    transactionStore = {}
    const mod = await import('@/app/api/admin/pencairan-poktan/route')
    PATCH = mod.PATCH
  })

  it('should approve pencairan cp-01', async () => {
    const req = new Request('http://localhost/api/admin/pencairan-poktan', {
      method: 'PATCH',
      body: JSON.stringify({
        pencairan_id: 'cp-01',
        action: 'berhasil',
        admin_id: 'u-admin-01',
      }),
    })
    const res = await PATCH(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.message).toContain('berhasil')
  })

  it('should reject pencairan with catatan', async () => {
    const req = new Request('http://localhost/api/admin/pencairan-poktan', {
      method: 'PATCH',
      body: JSON.stringify({
        pencairan_id: 'cp-01',
        action: 'gagal',
        admin_id: 'u-admin-01',
        catatan: 'Rekening tidak valid',
      }),
    })
    const res = await PATCH(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toContain('ditolak')
  })

  it('should reject invalid action', async () => {
    const req = new Request('http://localhost/api/admin/pencairan-poktan', {
      method: 'PATCH',
      body: JSON.stringify({
        pencairan_id: 'cp-01',
        action: 'invalid',
        admin_id: 'u-admin-01',
      }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('berhasil')
  })

  it('should reject missing parameters', async () => {
    const req = new Request('http://localhost/api/admin/pencairan-poktan', {
      method: 'PATCH',
      body: JSON.stringify({ pencairan_id: 'cp-01' }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(400)
  })
})

// ==========================================
// TEST: Settlement Calculation Logic
// ==========================================
describe('Settlement calculation correctness', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    insertedRecords = {}
    updatedRecords = {}
    transactionStore = {}
    const mod = await import('@/app/api/admin/settlement/route')
    POST = mod.POST
  })

  it('should distribute dana_petani proportionally by lahan_ha', async () => {
    // tx-03: poktan pk-01, 5 anggota with lahan: 1.5, 2.0, 0.8, 1.2, 3.0 = 8.5 total
    const req = new Request('http://localhost/api/admin/settlement', {
      method: 'POST',
      body: JSON.stringify({ transaksi_id: 'tx-03', admin_id: 'u-admin-01' }),
    })
    await POST(req)

    const kontribusi = insertedRecords['kontribusi_petani'] || []
    const totalHargaDiterima = kontribusi.reduce((sum: number, k: any) => sum + k.harga_diterima, 0)
    const danaPetani = 28615000 // 29500000 - 590000 - 295000

    // Sum of all harga_diterima should equal dana_petani (within rounding)
    expect(Math.abs(totalHargaDiterima - danaPetani)).toBeLessThan(10)

    // Volume should sum to ~2950
    const totalVolume = kontribusi.reduce((sum: number, k: any) => sum + k.volume_kg, 0)
    expect(Math.abs(totalVolume - 2950)).toBeLessThan(1)
  })

  it('should settle tx-04 (Tomat, 3900kg, 11000/kg)', async () => {
    // tx-04: poktan pk-01, volume_aktual=3900, harga=11000
    const req = new Request('http://localhost/api/admin/settlement', {
      method: 'POST',
      body: JSON.stringify({ transaksi_id: 'tx-04', admin_id: 'u-admin-01' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    // total_nilai = 3900 * 11000 = 42,900,000
    expect(json.settlement.total_nilai).toBe(42900000)
    // komisi = 42900000 * 0.02 = 858,000
    expect(json.settlement.komisi_platform).toBe(858000)
    // fee_qa from qa-04: fee_dibayar = 0 (belum dibayar)
    expect(json.settlement.fee_qa).toBe(0)
    // dana_petani = 42900000 - 858000 - 0 = 42,042,000
    expect(json.settlement.dana_petani).toBe(42042000)
  })
})
