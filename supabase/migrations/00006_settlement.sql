-- =============================================================
-- Settlement System — Escrow release, kontribusi petani, poktan withdrawal
-- =============================================================

-- Add settlement columns to transaksi
ALTER TABLE public.transaksi
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS settled_by UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_transaksi_settled ON public.transaksi(settled_at)
  WHERE settled_at IS NOT NULL;

-- =============================================================
-- Pencairan Poktan — Withdrawal requests for poktan fee QA
-- =============================================================

CREATE TABLE public.pencairan_poktan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poktan_id       UUID NOT NULL REFERENCES public.poktan(id),
  jumlah          DECIMAL(15,2) NOT NULL,
  biaya_admin     DECIMAL(15,2) NOT NULL DEFAULT 2500,
  jumlah_diterima DECIMAL(15,2) NOT NULL,
  rekening_id     UUID NOT NULL REFERENCES public.rekening(id),
  status          status_pencairan DEFAULT 'diproses',
  catatan         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  selesai_at      TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.pencairan_poktan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pencairan_poktan_select_own" ON public.pencairan_poktan
  FOR SELECT USING (
    poktan_id IN (
      SELECT id FROM public.poktan WHERE ketua_id = auth.uid()
    )
  );

CREATE POLICY "pencairan_poktan_insert_own" ON public.pencairan_poktan
  FOR INSERT WITH CHECK (
    poktan_id IN (
      SELECT id FROM public.poktan WHERE ketua_id = auth.uid()
    )
  );

CREATE POLICY "pencairan_poktan_admin" ON public.pencairan_poktan
  FOR ALL USING (public.is_admin());

-- Indexes
CREATE INDEX idx_pencairan_poktan_poktan ON public.pencairan_poktan(poktan_id);
CREATE INDEX idx_pencairan_poktan_status ON public.pencairan_poktan(status);
CREATE INDEX idx_pencairan_poktan_created ON public.pencairan_poktan(created_at DESC);
