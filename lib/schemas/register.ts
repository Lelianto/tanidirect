import { z } from 'zod'

// Step 1: Pilih role
export const roleSchema = z.object({
  role: z.enum(['petani', 'ketua_poktan', 'supplier'], {
    message: 'Pilih role untuk mendaftar',
  }),
})

// Step 2: Data diri
export const dataDiriSchema = z.object({
  nama_lengkap: z
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  no_hp: z
    .string()
    .min(10, 'Nomor HP minimal 10 digit')
    .max(15, 'Nomor HP maksimal 15 digit')
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Format nomor HP tidak valid'),
  no_ktp: z
    .string()
    .length(16, 'NIK harus 16 digit')
    .regex(/^\d+$/, 'NIK hanya berisi angka')
    .optional()
    .or(z.literal('')),
})

// Step 3: Wilayah
export const wilayahSchema = z.object({
  provinsi: z.string().min(1, 'Provinsi wajib dipilih'),
  kabupaten: z.string().min(1, 'Kabupaten/Kota wajib dipilih'),
  kecamatan: z.string().optional().or(z.literal('')),
  desa: z.string().optional().or(z.literal('')),
  alamat: z.string().optional().or(z.literal('')),
})

// Step 4a: Data Poktan (ketua_poktan)
export const poktanSchema = z.object({
  nama_poktan: z.string().min(3, 'Nama poktan minimal 3 karakter'),
  kode_poktan: z
    .string()
    .min(3, 'Kode poktan minimal 3 karakter')
    .max(20, 'Kode poktan maksimal 20 karakter'),
  poktan_desa: z.string().min(1, 'Desa poktan wajib diisi'),
  poktan_kecamatan: z.string().min(1, 'Kecamatan poktan wajib diisi'),
  poktan_kabupaten: z.string().min(1, 'Kabupaten poktan wajib diisi'),
  poktan_provinsi: z.string().min(1, 'Provinsi poktan wajib diisi'),
  komoditas_utama: z
    .array(z.string())
    .min(1, 'Pilih minimal 1 komoditas utama'),
  jumlah_anggota: z.coerce.number().int().min(1, 'Jumlah anggota minimal 1').optional(),
  tanggal_sertifikasi: z.date().optional().nullable(),
})

// Step 4b: Data Petani
export const petaniSchema = z.object({
  lahan_ha: z.coerce.number().min(0, 'Luas lahan tidak boleh negatif').optional(),
  komoditas: z
    .array(z.string())
    .min(1, 'Pilih minimal 1 komoditas'),
  tanggal_bergabung: z.date({ error: 'Tanggal bergabung wajib diisi' }),
})

// Step 4c: Data Supplier
export const supplierSchema = z.object({
  nama_perusahaan: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
  npwp: z
    .string()
    .regex(/^(\d{2}\.?\d{3}\.?\d{3}\.?\d{1}-?\d{3}\.?\d{3})?$/, 'Format NPWP tidak valid')
    .optional()
    .or(z.literal('')),
  jenis_usaha: z.string().optional().or(z.literal('')),
  wilayah_operasi: z
    .array(z.string())
    .min(1, 'Pilih minimal 1 wilayah operasi'),
  kapasitas_bulanan_ton: z.coerce.number().min(0).optional(),
})

// Step 5: Rekening (optional, shared)
export const rekeningSchema = z
  .object({
    skip: z.boolean().optional(),
    metode: z.enum(['bank', 'ewallet']).optional(),
    provider: z.string().optional().or(z.literal('')),
    nomor: z.string().optional().or(z.literal('')),
    atas_nama: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.skip) return true
      if (!data.metode) return true
      return data.provider && data.nomor && data.atas_nama
    },
    { message: 'Lengkapi semua data rekening atau lewati', path: ['provider'] }
  )

// Types
export type RoleFormData = z.infer<typeof roleSchema>
export type DataDiriFormData = z.infer<typeof dataDiriSchema>
export type WilayahFormData = z.infer<typeof wilayahSchema>
export type PoktanFormData = z.infer<typeof poktanSchema>
export type PetaniFormData = z.infer<typeof petaniSchema>
export type SupplierFormData = z.infer<typeof supplierSchema>
export type RekeningFormData = z.infer<typeof rekeningSchema>
