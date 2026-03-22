'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Leaf,
  Users,
  Building2,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { WilayahSelector, type WilayahValue } from '@/components/register/WilayahSelector'
import { StepIndicator } from '@/components/register/StepIndicator'
import { useAuthStore } from '@/store'
import { KOMODITAS } from '@/lib/constants/komoditas'
import { PROVINSI } from '@/lib/constants/wilayah'
import {
  roleSchema,
  dataDiriSchema,
  wilayahSchema,
  poktanSchema,
  petaniSchema,
  supplierSchema,
} from '@/lib/schemas/register'
import type { UserRole } from '@/types'
import { toast } from 'sonner'

// ============ ROLE CONFIG ============
const ROLE_OPTIONS: {
  role: Exclude<UserRole, 'admin'>
  label: string
  desc: string
  icon: React.ReactNode
  color: string
  bgLight: string
}[] = [
  {
    role: 'petani',
    label: 'Petani',
    desc: 'Produsen anggota kelompok tani',
    icon: <ShoppingCart className="h-5 w-5" />,
    color: 'bg-tani-amber text-white',
    bgLight: 'bg-tani-amber/10 border-tani-amber/30',
  },
  {
    role: 'ketua_poktan',
    label: 'Ketua Poktan',
    desc: 'QA officer, agregator, operator digital',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-tani-green text-white',
    bgLight: 'bg-tani-green/10 border-tani-green/30',
  },
  {
    role: 'supplier',
    label: 'Supplier',
    desc: 'Pembeli korporat, distributor, restoran',
    icon: <Building2 className="h-5 w-5" />,
    color: 'bg-tani-blue text-white',
    bgLight: 'bg-tani-blue/10 border-tani-blue/30',
  },
]

const STEPS_BY_ROLE: Record<string, { label: string }[]> = {
  petani: [
    { label: 'Role' },
    { label: 'Data Diri' },
    { label: 'Wilayah' },
    { label: 'Tani' },
    { label: 'Rekening' },
    { label: 'Selesai' },
  ],
  ketua_poktan: [
    { label: 'Role' },
    { label: 'Data Diri' },
    { label: 'Wilayah' },
    { label: 'Poktan' },
    { label: 'Rekening' },
    { label: 'Selesai' },
  ],
  supplier: [
    { label: 'Role' },
    { label: 'Data Diri' },
    { label: 'Wilayah' },
    { label: 'Perusahaan' },
    { label: 'Rekening' },
    { label: 'Selesai' },
  ],
}

const BANK_PROVIDERS = ['BRI', 'BCA', 'BNI', 'Mandiri', 'BSI', 'BTN', 'CIMB Niaga', 'Danamon']
const EWALLET_PROVIDERS = ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja']
const JENIS_USAHA = ['Distributor', 'Restoran & Katering', 'Retail Modern', 'Eksportir', 'Industri Pengolahan', 'Lainnya']

// ============ MAIN COMPONENT ============
export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [step, setStep] = React.useState(0)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // ============ DUMMY PREFILL ============
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  // Form data
  const [role, setRole] = React.useState<Exclude<UserRole, 'admin'> | ''>('petani')
  const [dataDiri, setDataDiri] = React.useState({
    nama_lengkap: 'Budi Santoso',
    no_hp: '081234567890',
    no_ktp: '3201012345670001',
  })
  const [wilayah, setWilayah] = React.useState<WilayahValue>({
    provinsi: 'Jawa Barat',
    kabupaten: 'Kabupaten Bogor',
    kecamatan: 'Cibinong',
    desa: '',
  })
  const [alamat, setAlamat] = React.useState('Jl. Raya Cibinong No. 45, RT 03/RW 07')

  // Petani-specific
  const [lahanHa, setLahanHa] = React.useState('2.5')
  const [komoditasPetani, setKomoditasPetani] = React.useState<string[]>(['Beras', 'Jagung'])
  const [tglBergabung, setTglBergabung] = React.useState<Date | null>(tomorrow)

  // Poktan-specific
  const [namaPoktan, setNamaPoktan] = React.useState('Poktan Maju Bersama')
  const [kodePoktan, setKodePoktan] = React.useState('PMB-001')
  const [poktanWilayah, setPoktanWilayah] = React.useState<WilayahValue>({
    provinsi: 'Jawa Barat',
    kabupaten: 'Kabupaten Bogor',
    kecamatan: 'Cibinong',
    desa: 'Cibinong',
  })
  const [komoditasUtama, setKomoditasUtama] = React.useState<string[]>(['Beras', 'Cabai Merah', 'Bawang Merah'])
  const [jumlahAnggota, setJumlahAnggota] = React.useState('25')
  const [tglSertifikasi, setTglSertifikasi] = React.useState<Date | null>(null)

  // Supplier-specific
  const [namaPerusahaan, setNamaPerusahaan] = React.useState('PT Segar Nusantara')
  const [npwp, setNpwp] = React.useState('12.345.678.9-012.345')
  const [jenisUsaha, setJenisUsaha] = React.useState('Distributor')
  const [wilayahOperasi, setWilayahOperasi] = React.useState<string[]>(['Jawa Barat', 'DKI Jakarta', 'Banten'])
  const [kapasitasBulanan, setKapasitasBulanan] = React.useState('50')

  // Rekening
  const [skipRekening, setSkipRekening] = React.useState(false)
  const [metode, setMetode] = React.useState<'bank' | 'ewallet'>('bank')
  const [provider, setProvider] = React.useState('BRI')
  const [nomorRekening, setNomorRekening] = React.useState('0012345678901')
  const [atasNama, setAtasNama] = React.useState('Budi Santoso')

  const steps = role ? STEPS_BY_ROLE[role] : STEPS_BY_ROLE.petani

  // ============ VALIDATION ============
  function validateStep(): boolean {
    setErrors({})
    try {
      if (step === 0) {
        roleSchema.parse({ role })
      } else if (step === 1) {
        dataDiriSchema.parse(dataDiri)
      } else if (step === 2) {
        wilayahSchema.parse({ ...wilayah, alamat })
      } else if (step === 3) {
        if (role === 'petani') {
          petaniSchema.parse({
            lahan_ha: lahanHa ? Number(lahanHa) : undefined,
            komoditas: komoditasPetani,
            tanggal_bergabung: tglBergabung,
          })
        } else if (role === 'ketua_poktan') {
          poktanSchema.parse({
            nama_poktan: namaPoktan,
            kode_poktan: kodePoktan,
            poktan_desa: poktanWilayah.desa || poktanWilayah.kecamatan,
            poktan_kecamatan: poktanWilayah.kecamatan,
            poktan_kabupaten: poktanWilayah.kabupaten,
            poktan_provinsi: poktanWilayah.provinsi,
            komoditas_utama: komoditasUtama,
            jumlah_anggota: jumlahAnggota ? Number(jumlahAnggota) : undefined,
            tanggal_sertifikasi: tglSertifikasi,
          })
        } else if (role === 'supplier') {
          supplierSchema.parse({
            nama_perusahaan: namaPerusahaan,
            npwp,
            jenis_usaha: jenisUsaha,
            wilayah_operasi: wilayahOperasi,
            kapasitas_bulanan_ton: kapasitasBulanan ? Number(kapasitasBulanan) : undefined,
          })
        }
      }
      return true
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const zodErrors = (err as { errors: { path: (string | number)[]; message: string }[] }).errors
        const fieldErrors: Record<string, string> = {}
        for (const e of zodErrors) {
          const key = e.path.join('.')
          if (!fieldErrors[key]) fieldErrors[key] = e.message
        }
        setErrors(fieldErrors)
      }
      return false
    }
  }

  function handleNext() {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function handleBack() {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  function handleSubmit() {
    // Build user object for demo
    const now = new Date().toISOString()
    const id = `u-${role}-${Date.now()}`

    const user = {
      id,
      role: role as UserRole,
      nama_lengkap: dataDiri.nama_lengkap,
      no_hp: dataDiri.no_hp,
      no_ktp: dataDiri.no_ktp || undefined,
      provinsi: wilayah.provinsi,
      kabupaten: wilayah.kabupaten,
      kecamatan: wilayah.kecamatan || undefined,
      alamat: alamat || undefined,
      is_verified: false,
      is_active: true,
      rekening:
        !skipRekening && provider
          ? { metode, provider, nomor: nomorRekening, atas_nama: atasNama }
          : undefined,
      created_at: now,
      updated_at: now,
    }

    setUser(user)
    toast.success('Pendaftaran berhasil!')

    // Navigate to next step (success view)
    setStep(steps.length - 1)
  }

  // Redirect after success
  function goToDashboard() {
    const routes: Record<string, string> = {
      petani: '/petani/dashboard',
      ketua_poktan: '/poktan/dashboard',
      supplier: '/supplier/dashboard',
    }
    router.push(routes[role] ?? '/login')
  }

  // ============ KOMODITAS PICKER HELPER ============
  function KomoditasPicker({
    selected,
    onChange,
    error,
  }: {
    selected: string[]
    onChange: (v: string[]) => void
    error?: string
  }) {
    const [adding, setAdding] = React.useState(false)
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {selected.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-full bg-tani-green/10 text-tani-green px-2.5 py-0.5 text-xs font-medium"
            >
              {k}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s !== k))}
                className="hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="size-3" /> Tambah
            </button>
          )}
        </div>
        {adding && (
          <Select
            value=""
            onValueChange={(v) => {
              if (v && !selected.includes(v)) onChange([...selected, v])
              setAdding(false)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih komoditas" />
            </SelectTrigger>
            <SelectContent>
              {KOMODITAS.filter((k) => !selected.includes(k)).map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  // ============ WILAYAH OPERASI PICKER ============
  function WilayahOperasiPicker({
    selected,
    onChange,
    error,
  }: {
    selected: string[]
    onChange: (v: string[]) => void
    error?: string
  }) {
    const [adding, setAdding] = React.useState(false)
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {selected.map((w) => (
            <span
              key={w}
              className="inline-flex items-center gap-1 rounded-full bg-tani-blue/10 text-tani-blue px-2.5 py-0.5 text-xs font-medium"
            >
              {w}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s !== w))}
                className="hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="size-3" /> Tambah
            </button>
          )}
        </div>
        {adding && (
          <Select
            value=""
            onValueChange={(v) => {
              if (v && !selected.includes(v)) onChange([...selected, v])
              setAdding(false)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih provinsi" />
            </SelectTrigger>
            <SelectContent>
              {PROVINSI.filter((p) => !selected.includes(p)).map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  // ============ RENDER STEPS ============
  function renderStep() {
    // Step 0: Role selection
    if (step === 0) {
      return (
        <div className="space-y-3">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
              Daftar sebagai
            </h2>
            <p className="text-sm text-muted-foreground">
              Pilih peran Anda di platform TaniDirect
            </p>
          </div>
          {ROLE_OPTIONS.map((opt) => (
            <Card
              key={opt.role}
              className={`cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
                role === opt.role ? `border-2 ${opt.bgLight}` : ''
              }`}
              onClick={() => setRole(opt.role)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl ${opt.color}`}
                  >
                    {opt.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      role === opt.role
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {role === opt.role && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {errors.role && (
            <p className="text-xs text-destructive text-center">{errors.role}</p>
          )}
        </div>
      )
    }

    // Step 1: Data diri
    if (step === 1) {
      return (
        <div className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
              Data Diri
            </h2>
            <p className="text-sm text-muted-foreground">Informasi dasar akun Anda</p>
          </div>

          <div className="space-y-1.5">
            <Label>
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Masukkan nama lengkap"
              value={dataDiri.nama_lengkap}
              onChange={(e) =>
                setDataDiri((d) => ({ ...d, nama_lengkap: e.target.value }))
              }
              aria-invalid={!!errors.nama_lengkap}
            />
            {errors.nama_lengkap && (
              <p className="text-xs text-destructive">{errors.nama_lengkap}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Nomor HP <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="08xxxxxxxxxx"
              value={dataDiri.no_hp}
              onChange={(e) =>
                setDataDiri((d) => ({ ...d, no_hp: e.target.value }))
              }
              aria-invalid={!!errors.no_hp}
            />
            {errors.no_hp && (
              <p className="text-xs text-destructive">{errors.no_hp}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>NIK (KTP)</Label>
            <Input
              placeholder="16 digit NIK"
              maxLength={16}
              value={dataDiri.no_ktp}
              onChange={(e) =>
                setDataDiri((d) => ({ ...d, no_ktp: e.target.value }))
              }
              aria-invalid={!!errors.no_ktp}
            />
            {errors.no_ktp && (
              <p className="text-xs text-destructive">{errors.no_ktp}</p>
            )}
          </div>
        </div>
      )
    }

    // Step 2: Wilayah
    if (step === 2) {
      return (
        <div className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
              Lokasi
            </h2>
            <p className="text-sm text-muted-foreground">Alamat domisili Anda</p>
          </div>

          <WilayahSelector
            value={wilayah}
            onChange={setWilayah}
            errors={{
              provinsi: errors.provinsi,
              kabupaten: errors.kabupaten,
            }}
          />

          <div className="space-y-1.5">
            <Label>Alamat Lengkap</Label>
            <Textarea
              placeholder="RT/RW, nama jalan, nomor rumah..."
              rows={3}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
            />
          </div>
        </div>
      )
    }

    // Step 3: Role-specific
    if (step === 3) {
      if (role === 'petani') {
        return (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                Data Pertanian
              </h2>
              <p className="text-sm text-muted-foreground">
                Informasi lahan dan komoditas Anda
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Luas Lahan (Ha)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="Contoh: 1.5"
                value={lahanHa}
                onChange={(e) => setLahanHa(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Komoditas <span className="text-destructive">*</span>
              </Label>
              <KomoditasPicker
                selected={komoditasPetani}
                onChange={setKomoditasPetani}
                error={errors.komoditas}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Tanggal Bergabung <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                value={tglBergabung}
                onChange={setTglBergabung}
                placeholder="Pilih tanggal bergabung"
                disablePast
                error={!!errors.tanggal_bergabung}
              />
              {errors.tanggal_bergabung && (
                <p className="text-xs text-destructive">{errors.tanggal_bergabung}</p>
              )}
            </div>
          </div>
        )
      }

      if (role === 'ketua_poktan') {
        return (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                Data Kelompok Tani
              </h2>
              <p className="text-sm text-muted-foreground">
                Informasi poktan yang Anda pimpin
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>
                Nama Poktan <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Nama kelompok tani"
                value={namaPoktan}
                onChange={(e) => setNamaPoktan(e.target.value)}
                aria-invalid={!!errors.nama_poktan}
              />
              {errors.nama_poktan && (
                <p className="text-xs text-destructive">{errors.nama_poktan}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Kode Poktan <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Kode unik poktan"
                value={kodePoktan}
                onChange={(e) => setKodePoktan(e.target.value)}
                aria-invalid={!!errors.kode_poktan}
              />
              {errors.kode_poktan && (
                <p className="text-xs text-destructive">{errors.kode_poktan}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Lokasi Poktan <span className="text-destructive">*</span>
              </Label>
              <WilayahSelector
                value={poktanWilayah}
                onChange={setPoktanWilayah}
                showDesa
                errors={{
                  provinsi: errors.poktan_provinsi,
                  kabupaten: errors.poktan_kabupaten,
                  kecamatan: errors.poktan_kecamatan,
                  desa: errors.poktan_desa,
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Komoditas Utama <span className="text-destructive">*</span>
              </Label>
              <KomoditasPicker
                selected={komoditasUtama}
                onChange={setKomoditasUtama}
                error={errors.komoditas_utama}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Jumlah Anggota</Label>
              <Input
                type="number"
                min="1"
                placeholder="Jumlah anggota poktan"
                value={jumlahAnggota}
                onChange={(e) => setJumlahAnggota(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tanggal Sertifikasi QA</Label>
              <DatePicker
                value={tglSertifikasi}
                onChange={setTglSertifikasi}
                placeholder="Opsional - jika sudah tersertifikasi"
              />
              <p className="text-[11px] text-muted-foreground">
                Kosongkan jika belum tersertifikasi
              </p>
            </div>
          </div>
        )
      }

      if (role === 'supplier') {
        return (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                Data Perusahaan
              </h2>
              <p className="text-sm text-muted-foreground">
                Informasi badan usaha Anda
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>
                Nama Perusahaan <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="PT / CV / UD ..."
                value={namaPerusahaan}
                onChange={(e) => setNamaPerusahaan(e.target.value)}
                aria-invalid={!!errors.nama_perusahaan}
              />
              {errors.nama_perusahaan && (
                <p className="text-xs text-destructive">{errors.nama_perusahaan}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>NPWP</Label>
              <Input
                placeholder="XX.XXX.XXX.X-XXX.XXX"
                value={npwp}
                onChange={(e) => setNpwp(e.target.value)}
                aria-invalid={!!errors.npwp}
              />
              {errors.npwp && (
                <p className="text-xs text-destructive">{errors.npwp}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Jenis Usaha</Label>
              <Select value={jenisUsaha} onValueChange={(v) => setJenisUsaha(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jenis usaha" />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_USAHA.map((j) => (
                    <SelectItem key={j} value={j}>
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Wilayah Operasi <span className="text-destructive">*</span>
              </Label>
              <WilayahOperasiPicker
                selected={wilayahOperasi}
                onChange={setWilayahOperasi}
                error={errors.wilayah_operasi}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kapasitas Bulanan (Ton)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="Kapasitas pembelian per bulan"
                value={kapasitasBulanan}
                onChange={(e) => setKapasitasBulanan(e.target.value)}
              />
            </div>
          </div>
        )
      }
    }

    // Step 4: Rekening
    if (step === 4) {
      return (
        <div className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
              Rekening Pembayaran
            </h2>
            <p className="text-sm text-muted-foreground">
              Untuk menerima pembayaran (opsional)
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={skipRekening}
              onChange={(e) => setSkipRekening(e.target.checked)}
              className="rounded accent-primary"
            />
            <span className="text-sm">Lewati untuk sekarang</span>
          </label>

          {!skipRekening && (
            <>
              <div className="space-y-1.5">
                <Label>Metode</Label>
                <div className="flex gap-2">
                  <Button
                    variant={metode === 'bank' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setMetode('bank')
                      setProvider('')
                    }}
                  >
                    Bank
                  </Button>
                  <Button
                    variant={metode === 'ewallet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setMetode('ewallet')
                      setProvider('')
                    }}
                  >
                    E-Wallet
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Pilih ${metode === 'bank' ? 'bank' : 'e-wallet'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(metode === 'bank' ? BANK_PROVIDERS : EWALLET_PROVIDERS).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{metode === 'bank' ? 'Nomor Rekening' : 'Nomor HP'}</Label>
                <Input
                  placeholder={
                    metode === 'bank' ? 'Masukkan nomor rekening' : '08xxxxxxxxxx'
                  }
                  value={nomorRekening}
                  onChange={(e) => setNomorRekening(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Atas Nama</Label>
                <Input
                  placeholder="Nama pemilik rekening"
                  value={atasNama}
                  onChange={(e) => setAtasNama(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      )
    }

    // Step 5: Success
    if (step === steps.length - 1) {
      return (
        <div className="text-center space-y-4 py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tani-green/10 text-tani-green mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
              Pendaftaran Berhasil!
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selamat datang, <strong>{dataDiri.nama_lengkap}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Akun Anda sebagai{' '}
              <span className="font-semibold capitalize">
                {role === 'ketua_poktan' ? 'Ketua Poktan' : role}
              </span>{' '}
              telah dibuat. Anda bisa langsung masuk ke dashboard.
            </p>
          </div>
          <Button className="w-full" onClick={goToDashboard}>
            Masuk ke Dashboard
          </Button>
        </div>
      )
    }

    return null
  }

  const isLastFormStep = step === steps.length - 2
  const isSuccessStep = step === steps.length - 1

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-tani-green/5 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-tani-green text-white mx-auto">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-heading)] text-tani-green">
            TaniDirect
          </h1>
        </div>

        {/* Step indicator */}
        {role && !isSuccessStep && (
          <StepIndicator steps={steps} current={step} />
        )}

        {/* Form content */}
        <Card>
          <CardContent className="p-4">{renderStep()}</CardContent>
        </Card>

        {/* Navigation buttons */}
        {!isSuccessStep && (
          <div className="flex gap-3">
            {step > 0 ? (
              <Button variant="outline" className="flex-1" onClick={handleBack}>
                <ArrowLeft className="size-4 mr-1" />
                Kembali
              </Button>
            ) : (
              <Link
                href="/login"
                className="flex-1 inline-flex items-center justify-center h-8 rounded-lg border border-input bg-background px-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Sudah punya akun?
              </Link>
            )}
            {isLastFormStep ? (
              <Button className="flex-1" onClick={handleSubmit}>
                Daftar
                <CheckCircle2 className="size-4 ml-1" />
              </Button>
            ) : (
              <Button className="flex-1" onClick={handleNext} disabled={step === 0 && !role}>
                Lanjut
                <ArrowRight className="size-4 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Footer */}
        {!isSuccessStep && (
          <p className="text-[11px] text-center text-muted-foreground">
            Dengan mendaftar, Anda menyetujui ketentuan layanan TaniDirect
          </p>
        )}
      </div>
    </div>
  )
}
