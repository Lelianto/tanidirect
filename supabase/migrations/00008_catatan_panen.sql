-- ======================== CATATAN PANEN ========================

CREATE TYPE status_panen AS ENUM ('draft', 'tersedia', 'terjual', 'expired');

CREATE TABLE public.catatan_panen (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poktan_id         UUID NOT NULL REFERENCES public.poktan(id),
  pencatat_id       UUID NOT NULL REFERENCES public.users(id),
  komoditas         TEXT NOT NULL,
  grade             komoditas_grade NOT NULL DEFAULT 'B',
  volume_panen_kg   DECIMAL(10,2) NOT NULL,
  volume_terjual_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  tanggal_panen     DATE NOT NULL,
  harga_per_kg      DECIMAL(12,2),
  foto_urls         TEXT[] NOT NULL DEFAULT '{}',
  catatan           TEXT,
  status            status_panen NOT NULL DEFAULT 'draft',
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.kontribusi_panen (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catatan_panen_id UUID NOT NULL REFERENCES public.catatan_panen(id) ON DELETE CASCADE,
  petani_id        UUID NOT NULL REFERENCES public.users(id),
  volume_kg        DECIMAL(10,2) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Add link from katalog_komoditas to catatan_panen
ALTER TABLE public.katalog_komoditas ADD COLUMN catatan_panen_id UUID UNIQUE REFERENCES public.catatan_panen(id);

-- RLS
ALTER TABLE public.catatan_panen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kontribusi_panen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catatan_panen_select_poktan" ON public.catatan_panen
  FOR SELECT USING (poktan_id IN (SELECT id FROM public.poktan WHERE ketua_id = auth.uid()));
CREATE POLICY "catatan_panen_insert_poktan" ON public.catatan_panen
  FOR INSERT WITH CHECK (poktan_id IN (SELECT id FROM public.poktan WHERE ketua_id = auth.uid()));
CREATE POLICY "catatan_panen_update_poktan" ON public.catatan_panen
  FOR UPDATE USING (poktan_id IN (SELECT id FROM public.poktan WHERE ketua_id = auth.uid()));
CREATE POLICY "catatan_panen_delete_poktan" ON public.catatan_panen
  FOR DELETE USING (poktan_id IN (SELECT id FROM public.poktan WHERE ketua_id = auth.uid()));
CREATE POLICY "catatan_panen_admin" ON public.catatan_panen
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "kontribusi_panen_select_poktan" ON public.kontribusi_panen
  FOR SELECT USING (catatan_panen_id IN (SELECT id FROM public.catatan_panen WHERE poktan_id IN (SELECT id FROM public.poktan WHERE ketua_id = auth.uid())));
CREATE POLICY "kontribusi_panen_manage_poktan" ON public.kontribusi_panen
  FOR ALL USING (catatan_panen_id IN (SELECT id FROM public.catatan_panen WHERE poktan_id IN (SELECT id FROM public.poktan WHERE ketua_id = auth.uid())));
CREATE POLICY "kontribusi_panen_admin" ON public.kontribusi_panen
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX idx_catatan_panen_poktan ON public.catatan_panen(poktan_id);
CREATE INDEX idx_catatan_panen_status ON public.catatan_panen(status);
CREATE INDEX idx_catatan_panen_komoditas ON public.catatan_panen(komoditas);

-- Updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.catatan_panen
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
