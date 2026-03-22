'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface WilayahOption {
  id: string
  name: string
  d?: string // district id for villages
}

interface WilayahValue {
  provinsi: string
  kabupaten: string
  kecamatan: string
  desa: string
}

interface WilayahSelectorProps {
  value: WilayahValue
  onChange: (value: WilayahValue) => void
  showDesa?: boolean
  errors?: Partial<Record<keyof WilayahValue, string>>
}

function WilayahSelector({ value, onChange, showDesa = false, errors }: WilayahSelectorProps) {
  const [provinces, setProvinces] = React.useState<WilayahOption[]>([])
  const [regencies, setRegencies] = React.useState<WilayahOption[]>([])
  const [districts, setDistricts] = React.useState<WilayahOption[]>([])
  const [villages, setVillages] = React.useState<WilayahOption[]>([])
  const [loading, setLoading] = React.useState({ prov: true, reg: false, dist: false, vil: false })

  // Selected IDs for cascading
  const [provId, setProvId] = React.useState('')
  const [regId, setRegId] = React.useState('')
  const [distId, setDistId] = React.useState('')

  // Track if initial resolve has been done
  const resolvedRef = React.useRef(false)

  // Load provinces on mount
  React.useEffect(() => {
    fetch('/data/wilayah/provinces.json')
      .then((r) => r.json())
      .then((data: WilayahOption[]) => {
        setProvinces(data)
        setLoading((l) => ({ ...l, prov: false }))

        // Auto-resolve province ID from pre-filled name
        if (!resolvedRef.current && value.provinsi) {
          const match = data.find((p) => p.name === value.provinsi)
          if (match) setProvId(match.id)
        }
      })
      .catch(() => setLoading((l) => ({ ...l, prov: false })))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load regencies when province changes
  React.useEffect(() => {
    if (!provId) {
      setRegencies([])
      return
    }
    setLoading((l) => ({ ...l, reg: true }))
    fetch(`/data/wilayah/regencies/${provId}.json`)
      .then((r) => r.json())
      .then((data: WilayahOption[]) => {
        setRegencies(data)
        setLoading((l) => ({ ...l, reg: false }))

        // Auto-resolve regency ID from pre-filled name
        if (!resolvedRef.current && value.kabupaten) {
          const match = data.find((r) => r.name === value.kabupaten)
          if (match) setRegId(match.id)
        }
      })
      .catch(() => setLoading((l) => ({ ...l, reg: false })))
  }, [provId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load districts when regency changes
  React.useEffect(() => {
    if (!regId) {
      setDistricts([])
      return
    }
    setLoading((l) => ({ ...l, dist: true }))
    fetch(`/data/wilayah/districts/${regId}.json`)
      .then((r) => r.json())
      .then((data: WilayahOption[]) => {
        setDistricts(data)
        setLoading((l) => ({ ...l, dist: false }))

        // Auto-resolve district ID from pre-filled name
        if (!resolvedRef.current && value.kecamatan) {
          const match = data.find((d) => d.name === value.kecamatan)
          if (match) {
            setDistId(match.id)
            resolvedRef.current = true // done resolving
          }
        } else if (!resolvedRef.current && !value.kecamatan) {
          resolvedRef.current = true
        }
      })
      .catch(() => setLoading((l) => ({ ...l, dist: false })))
  }, [regId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load villages when regency changes (villages are grouped by regency)
  React.useEffect(() => {
    if (!regId || !showDesa) {
      setVillages([])
      return
    }
    setLoading((l) => ({ ...l, vil: true }))
    fetch(`/data/wilayah/villages/${regId}.json`)
      .then((r) => r.json())
      .then((data: WilayahOption[]) => {
        setVillages(data)
        setLoading((l) => ({ ...l, vil: false }))
      })
      .catch(() => setLoading((l) => ({ ...l, vil: false })))
  }, [regId, showDesa])

  // Filtered villages by district
  const filteredVillages = React.useMemo(() => {
    if (!distId) return []
    return villages.filter((v) => v.d === distId)
  }, [villages, distId])

  function handleProvinceChange(id: string | null) {
    if (!id) return
    const prov = provinces.find((p) => p.id === id)
    setProvId(id)
    setRegId('')
    setDistId('')
    onChange({
      provinsi: prov?.name ?? '',
      kabupaten: '',
      kecamatan: '',
      desa: '',
    })
  }

  function handleRegencyChange(id: string | null) {
    if (!id) return
    const reg = regencies.find((r) => r.id === id)
    setRegId(id)
    setDistId('')
    onChange({
      ...value,
      kabupaten: reg?.name ?? '',
      kecamatan: '',
      desa: '',
    })
  }

  function handleDistrictChange(id: string | null) {
    if (!id) return
    const dist = districts.find((d) => d.id === id)
    setDistId(id)
    onChange({
      ...value,
      kecamatan: dist?.name ?? '',
      desa: '',
    })
  }

  function handleVillageChange(id: string | null) {
    if (!id) return
    const vil = filteredVillages.find((v) => v.id === id)
    onChange({
      ...value,
      desa: vil?.name ?? '',
    })
  }

  return (
    <div className="space-y-3">
      {/* Provinsi */}
      <div className="space-y-1.5">
        <Label>
          Provinsi <span className="text-destructive">*</span>
        </Label>
        <Select value={provId} onValueChange={handleProvinceChange}>
          <SelectTrigger
            className={`w-full ${errors?.provinsi ? 'border-destructive' : ''}`}
          >
            <SelectValue placeholder={loading.prov ? 'Memuat...' : 'Pilih provinsi'}>
              {provId ? provinces.find((p) => p.id === provId)?.name ?? provId : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.provinsi && (
          <p className="text-xs text-destructive">{errors.provinsi}</p>
        )}
      </div>

      {/* Kabupaten / Kota */}
      <div className="space-y-1.5">
        <Label>
          Kabupaten / Kota <span className="text-destructive">*</span>
        </Label>
        <Select
          value={regId}
          onValueChange={handleRegencyChange}
          disabled={!provId}
        >
          <SelectTrigger
            className={`w-full ${errors?.kabupaten ? 'border-destructive' : ''}`}
          >
            <SelectValue
              placeholder={
                loading.reg
                  ? 'Memuat...'
                  : !provId
                    ? 'Pilih provinsi dahulu'
                    : 'Pilih kabupaten/kota'
              }
            >
              {regId ? regencies.find((r) => r.id === regId)?.name ?? regId : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {regencies.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.kabupaten && (
          <p className="text-xs text-destructive">{errors.kabupaten}</p>
        )}
      </div>

      {/* Kecamatan */}
      <div className="space-y-1.5">
        <Label>Kecamatan</Label>
        <Select
          value={distId}
          onValueChange={handleDistrictChange}
          disabled={!regId}
        >
          <SelectTrigger
            className={`w-full ${errors?.kecamatan ? 'border-destructive' : ''}`}
          >
            <SelectValue
              placeholder={
                loading.dist
                  ? 'Memuat...'
                  : !regId
                    ? 'Pilih kabupaten dahulu'
                    : 'Pilih kecamatan'
              }
            >
              {distId ? districts.find((d) => d.id === distId)?.name ?? distId : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.kecamatan && (
          <p className="text-xs text-destructive">{errors.kecamatan}</p>
        )}
      </div>

      {/* Desa / Kelurahan */}
      {showDesa && (
        <div className="space-y-1.5">
          <Label>Desa / Kelurahan</Label>
          <Select
            value={filteredVillages.find((v) => v.name === value.desa)?.id ?? ''}
            onValueChange={handleVillageChange}
            disabled={!distId}
          >
            <SelectTrigger
              className={`w-full ${errors?.desa ? 'border-destructive' : ''}`}
            >
              <SelectValue
                placeholder={
                  loading.vil
                    ? 'Memuat...'
                    : !distId
                      ? 'Pilih kecamatan dahulu'
                      : 'Pilih desa/kelurahan'
                }
              >
                {value.desa || null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredVillages.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.desa && (
            <p className="text-xs text-destructive">{errors.desa}</p>
          )}
        </div>
      )}
    </div>
  )
}

export { WilayahSelector }
export type { WilayahValue }
