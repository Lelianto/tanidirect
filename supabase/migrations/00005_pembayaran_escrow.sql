-- =============================================================
-- Pembayaran Escrow — Payment tracking for pre-order deposits
-- =============================================================

CREATE TYPE status_pembayaran AS ENUM (
  'menunggu_pembayaran',  -- Supplier belum bayar
  'menunggu_verifikasi',  -- Bukti sudah diupload, menunggu admin verifikasi
  'terverifikasi',        -- Admin sudah verifikasi valid
  'ditolak',              -- Admin menolak (bukti tidak valid)
  'refunded'              -- Dana dikembalikan (pre-order dibatalkan)
);

CREATE TYPE jenis_pembayaran AS ENUM (
  'deposit',  -- 10% dari total nilai
  'full'      -- 100% dari total nilai
);

CREATE TABLE public.pembayaran_escrow (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_order_id      UUID NOT NULL REFERENCES public.pre_order(id) ON DELETE CASCADE,
  supplier_id       UUID NOT NULL REFERENCES public.supplier(id),
  jenis_pembayaran  jenis_pembayaran NOT NULL,
  jumlah            DECIMAL(15,2) NOT NULL,
  total_nilai_po    DECIMAL(15,2) NOT NULL,
  metode_transfer   TEXT,              -- 'bank' atau 'qris'
  bukti_transfer_url TEXT,
  catatan_supplier  TEXT,
  status            status_pembayaran DEFAULT 'menunggu_pembayaran',
  admin_id          UUID REFERENCES public.users(id),
  admin_catatan     TEXT,
  verified_at       TIMESTAMPTZ,
  rejected_at       TIMESTAMPTZ,
  refunded_at       TIMESTAMPTZ,
  refund_catatan    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.pembayaran_escrow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pembayaran_select_supplier" ON public.pembayaran_escrow
  FOR SELECT USING (supplier_id IN (SELECT public.my_supplier_ids()));

CREATE POLICY "pembayaran_manage_supplier" ON public.pembayaran_escrow
  FOR ALL USING (supplier_id IN (SELECT public.my_supplier_ids()));

CREATE POLICY "pembayaran_admin" ON public.pembayaran_escrow
  FOR ALL USING (public.is_admin());

-- Indexes
CREATE INDEX idx_pembayaran_preorder ON public.pembayaran_escrow(pre_order_id);
CREATE INDEX idx_pembayaran_supplier ON public.pembayaran_escrow(supplier_id);
CREATE INDEX idx_pembayaran_status ON public.pembayaran_escrow(status);
CREATE INDEX idx_pembayaran_created ON public.pembayaran_escrow(created_at DESC);

-- Trigger: auto-update updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pembayaran_escrow
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
