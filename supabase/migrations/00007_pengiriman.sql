-- =============================================================
-- Pengiriman (Checkpoint-based Logistics Tracking)
-- Clean approach: new tables, leave legacy logistik untouched
-- =============================================================

-- Status enum for pengiriman
CREATE TYPE public.status_pengiriman AS ENUM (
  'disiapkan',
  'dijemput',
  'dalam_perjalanan',
  'tiba_di_tujuan',
  'diterima'
);

-- =============================================================
-- Main pengiriman table (one per transaksi)
-- =============================================================
CREATE TABLE public.pengiriman (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id      UUID NOT NULL REFERENCES public.transaksi(id) ON DELETE CASCADE,
  poktan_id         UUID NOT NULL REFERENCES public.poktan(id),
  supplier_id       UUID NOT NULL REFERENCES public.supplier(id),

  -- Pengirim info (manual, WhatsApp-style)
  pengirim_nama     TEXT,
  pengirim_telepon  TEXT,
  kendaraan_info    TEXT,           -- e.g. "Pickup L300 B 1234 XY"

  -- Route (text-based, no GPS)
  alamat_asal       TEXT NOT NULL,
  alamat_tujuan     TEXT NOT NULL,

  -- Denormalized current status (synced from latest event)
  current_status    status_pengiriman NOT NULL DEFAULT 'disiapkan',

  -- Denormalized timestamps per status milestone
  disiapkan_at      TIMESTAMPTZ DEFAULT NOW(),
  dijemput_at       TIMESTAMPTZ,
  dalam_perjalanan_at TIMESTAMPTZ,
  tiba_di_tujuan_at TIMESTAMPTZ,
  diterima_at       TIMESTAMPTZ,

  catatan_alamat    TEXT,           -- delivery notes, landmark, etc.
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_pengiriman_transaksi UNIQUE (transaksi_id)
);

-- =============================================================
-- Event log (source of truth, append-only)
-- =============================================================
CREATE TABLE public.pengiriman_event (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengiriman_id   UUID NOT NULL REFERENCES public.pengiriman(id) ON DELETE CASCADE,
  status          status_pengiriman NOT NULL,
  catatan         TEXT,
  foto_url        TEXT,
  lokasi_teks     TEXT,            -- manual location text
  created_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- RLS Policies
-- =============================================================
ALTER TABLE public.pengiriman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengiriman_event ENABLE ROW LEVEL SECURITY;

-- Pengiriman: poktan can see own
CREATE POLICY "pengiriman_poktan_select" ON public.pengiriman
  FOR SELECT USING (poktan_id IN (SELECT id FROM public.poktan WHERE ketua_id = auth.uid()));

-- Pengiriman: supplier can see own
CREATE POLICY "pengiriman_supplier_select" ON public.pengiriman
  FOR SELECT USING (supplier_id IN (SELECT id FROM public.supplier WHERE user_id = auth.uid()));

-- Pengiriman: admin full access
CREATE POLICY "pengiriman_admin" ON public.pengiriman
  FOR ALL USING (public.is_admin());

-- Pengiriman: poktan can update own (for pengirim info)
CREATE POLICY "pengiriman_poktan_update" ON public.pengiriman
  FOR UPDATE USING (poktan_id IN (SELECT id FROM public.poktan WHERE ketua_id = auth.uid()));

-- Events: anyone who can see the pengiriman can see events
CREATE POLICY "pengiriman_event_select_poktan" ON public.pengiriman_event
  FOR SELECT USING (
    pengiriman_id IN (
      SELECT id FROM public.pengiriman WHERE poktan_id IN (
        SELECT id FROM public.poktan WHERE ketua_id = auth.uid()
      )
    )
  );

CREATE POLICY "pengiriman_event_select_supplier" ON public.pengiriman_event
  FOR SELECT USING (
    pengiriman_id IN (
      SELECT id FROM public.pengiriman WHERE supplier_id IN (
        SELECT id FROM public.supplier WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "pengiriman_event_admin" ON public.pengiriman_event
  FOR ALL USING (public.is_admin());

-- Events: poktan can insert
CREATE POLICY "pengiriman_event_poktan_insert" ON public.pengiriman_event
  FOR INSERT WITH CHECK (
    pengiriman_id IN (
      SELECT id FROM public.pengiriman WHERE poktan_id IN (
        SELECT id FROM public.poktan WHERE ketua_id = auth.uid()
      )
    )
  );

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX idx_pengiriman_transaksi ON public.pengiriman(transaksi_id);
CREATE INDEX idx_pengiriman_poktan ON public.pengiriman(poktan_id);
CREATE INDEX idx_pengiriman_supplier ON public.pengiriman(supplier_id);
CREATE INDEX idx_pengiriman_status ON public.pengiriman(current_status);
CREATE INDEX idx_pengiriman_created ON public.pengiriman(created_at DESC);

CREATE INDEX idx_pengiriman_event_pengiriman ON public.pengiriman_event(pengiriman_id);
CREATE INDEX idx_pengiriman_event_created ON public.pengiriman_event(created_at DESC);

-- =============================================================
-- Trigger: sync current_status + milestone timestamps from events
-- =============================================================
CREATE OR REPLACE FUNCTION public.sync_pengiriman_status()
RETURNS TRIGGER AS $$
DECLARE
  _current_idx INT;
  _new_idx INT;
  _status_arr TEXT[] := ARRAY['disiapkan','dijemput','dalam_perjalanan','tiba_di_tujuan','diterima'];
BEGIN
  -- Forward-only guard at DB level
  SELECT array_position(_status_arr, current_status::text)
    INTO _current_idx
    FROM public.pengiriman WHERE id = NEW.pengiriman_id;

  _new_idx := array_position(_status_arr, NEW.status::text);

  IF _new_idx IS NULL OR _new_idx <= COALESCE(_current_idx, 0) THEN
    RAISE EXCEPTION 'Status pengiriman tidak bisa mundur: % -> %',
      _status_arr[_current_idx], NEW.status;
  END IF;

  -- Update current_status + milestone timestamps
  UPDATE public.pengiriman
  SET
    current_status = NEW.status,
    updated_at = NOW(),
    disiapkan_at = CASE WHEN NEW.status = 'disiapkan' THEN NEW.created_at ELSE disiapkan_at END,
    dijemput_at = CASE WHEN NEW.status = 'dijemput' THEN NEW.created_at ELSE dijemput_at END,
    dalam_perjalanan_at = CASE WHEN NEW.status = 'dalam_perjalanan' THEN NEW.created_at ELSE dalam_perjalanan_at END,
    tiba_di_tujuan_at = CASE WHEN NEW.status = 'tiba_di_tujuan' THEN NEW.created_at ELSE tiba_di_tujuan_at END,
    diterima_at = CASE WHEN NEW.status = 'diterima' THEN NEW.created_at ELSE diterima_at END
  WHERE id = NEW.pengiriman_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_pengiriman_status
  AFTER INSERT ON public.pengiriman_event
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_pengiriman_status();

-- =============================================================
-- Trigger: auto-create pengiriman when transaksi → dalam_pengiriman
-- =============================================================
CREATE OR REPLACE FUNCTION public.auto_create_pengiriman()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'dalam_pengiriman' AND OLD.status != 'dalam_pengiriman' THEN
    INSERT INTO public.pengiriman (transaksi_id, poktan_id, supplier_id, alamat_asal, alamat_tujuan)
    SELECT
      NEW.id,
      NEW.poktan_id,
      NEW.supplier_id,
      COALESCE(p.kabupaten || ', ' || p.provinsi, 'Alamat asal'),
      COALESCE(po.wilayah_tujuan, 'Alamat tujuan')
    FROM public.poktan p
    LEFT JOIN public.pre_order po ON po.id = NEW.pre_order_id
    WHERE p.id = NEW.poktan_id
    ON CONFLICT (transaksi_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_create_pengiriman
  AFTER UPDATE ON public.transaksi
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_pengiriman();
