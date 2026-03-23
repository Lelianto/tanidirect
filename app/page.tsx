'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Leaf,
  ArrowRight,
  Users,
  Building2,
  TrendingUp,
  ShieldCheck,
  Search,
  Handshake,
  Truck,
  CreditCard,
  CheckCircle2,
  Star,
  BarChart3,
  Sprout,
  ChevronRight,
  Quote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/* ─── animation hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    el.querySelectorAll('.reveal').forEach((c) => obs.observe(c))
    return () => obs.disconnect()
  }, [])
  return ref
}

/* ─── data ─── */
const STATS = [
  { value: '2,400+', label: 'Petani Terdaftar', icon: Users },
  { value: '180+', label: 'Supplier Aktif', icon: Building2 },
  { value: 'Rp 12M+', label: 'Volume Transaksi', icon: TrendingUp },
  { value: '99.2%', label: 'Tingkat Kepuasan', icon: Star },
]

const STEPS = [
  {
    step: '01',
    title: 'Registrasi & Verifikasi',
    desc: 'Poktan dan Supplier mendaftar, lalu melengkapi verifikasi identitas (KTP, Surat BPP, rekening) secara digital — cepat dan aman.',
    icon: Users,
    color: 'bg-tani-green',
  },
  {
    step: '02',
    title: 'Listing & Pre-Order',
    desc: 'Supplier membuat pre-order kebutuhan komoditas. Sistem AI mencocokkan dengan Poktan terdekat yang memiliki stok siap kirim.',
    icon: Search,
    color: 'bg-tani-blue',
  },
  {
    step: '03',
    title: 'QA & Konfirmasi',
    desc: 'Kualitas produk diverifikasi dengan dokumentasi lengkap. Kedua pihak menyepakati harga dan volume secara transparan.',
    icon: Handshake,
    color: 'bg-tani-amber',
  },
  {
    step: '04',
    title: 'Pengiriman & Pembayaran',
    desc: 'Pengiriman dilacak real-time. Pembayaran diamankan via escrow — dana diteruskan ke Poktan setelah barang diterima.',
    icon: Truck,
    color: 'bg-tani-green-dark',
  },
]

const ADVANTAGES = [
  {
    title: 'Transparansi Harga',
    desc: 'Harga pasar real-time dan transparan. Petani tahu nilai sesungguhnya dari hasil panen mereka.',
    icon: BarChart3,
    accent: 'text-tani-green',
    bg: 'bg-tani-green/8',
  },
  {
    title: 'QA Terintegrasi',
    desc: 'Quality Assurance dengan bantuan AI Groq memastikan standar kualitas konsisten untuk setiap batch produk.',
    icon: ShieldCheck,
    accent: 'text-tani-blue',
    bg: 'bg-tani-blue/8',
  },
  {
    title: 'Logistik Terkelola',
    desc: 'Dari lahan ke gudang supplier — tracking GPS, estimasi pengiriman, dan notifikasi otomatis.',
    icon: Truck,
    accent: 'text-tani-amber',
    bg: 'bg-tani-amber/8',
  },
  {
    title: 'Pembayaran Aman',
    desc: 'Sistem escrow melindungi kedua belah pihak. Dana diteruskan setelah barang diterima dan diverifikasi.',
    icon: CreditCard,
    accent: 'text-tani-green-dark',
    bg: 'bg-tani-green-dark/8',
  },
]

const TESTIMONIALS = [
  {
    name: 'Pak Bambang',
    role: 'Ketua Poktan Makmur Jaya, Karawang',
    text: 'Lewat Taninesia, kami langsung terhubung ke supplier besar. Prosesnya mudah, transparan, dan harga yang kami terima jauh lebih baik.',
    rating: 5,
  },
  {
    name: 'Ibu Ratna',
    role: 'Procurement Manager, PT Segar Nusantara',
    text: 'Sebagai supplier, kami mendapatkan produk dengan kualitas terjamin dan dokumentasi QA yang lengkap. Proses procurement jadi jauh lebih efisien.',
    rating: 5,
  },
  {
    name: 'Mas Eko',
    role: 'Petani Anggota Poktan Sumber Rejeki, Malang',
    text: 'Setelah bergabung di Taninesia, pendapatan saya meningkat hampir 40%. Proses penjualan transparan dan pembayaran selalu tepat waktu.',
    rating: 5,
  },
]

/* ─── page ─── */
export default function LandingPage() {
  const wrapperRef = useReveal()

  return (
    <div ref={wrapperRef} className="min-h-screen bg-[#FAFAF7] text-foreground overflow-x-hidden">
      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-d1 { transition-delay: 0.1s; }
        .reveal-d2 { transition-delay: 0.2s; }
        .reveal-d3 { transition-delay: 0.3s; }
        .reveal-d4 { transition-delay: 0.4s; }
        .grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
        }
        .terrace-lines {
          background-image:
            repeating-linear-gradient(
              170deg,
              transparent,
              transparent 60px,
              rgba(22,163,74,0.04) 60px,
              rgba(22,163,74,0.04) 62px
            );
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .float-slow { animation: float 6s ease-in-out infinite; }
        .float-med { animation: float 4.5s ease-in-out infinite 0.5s; }
      `}</style>

      {/* ══════ NAVBAR ══════ */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#FAFAF7]/80 border-b border-tani-green/10">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-tani-green text-white transition-transform group-hover:scale-105">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-tani-green-dark">
              taninesia
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
            <a href="#cara-kerja" className="hover:text-tani-green transition-colors">Cara Kerja</a>
            <a href="#keunggulan" className="hover:text-tani-green transition-colors">Keunggulan</a>
            <a href="#testimoni" className="hover:text-tani-green transition-colors">Testimoni</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-tani-green" nativeButton={false} render={<Link href="/login" />}>
              Masuk
            </Button>
            <Button size="sm" className="bg-tani-green hover:bg-tani-green-dark text-white" nativeButton={false} render={<Link href="/register" />}>
              Daftar
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 grain terrace-lines">
        {/* decorative blobs */}
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-tani-green/6 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-24 w-80 h-80 rounded-full bg-tani-blue/6 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h1 className="reveal reveal-d1 font-heading text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-foreground">
              Dari <span className="text-tani-green">Lahan</span> Langsung
              <br />
              ke <span className="text-tani-green">Supplier</span>
            </h1>

            <p className="reveal reveal-d2 mt-6 text-lg md:text-xl text-foreground/60 max-w-xl leading-relaxed">
              Taninesia menghubungkan Kelompok Tani langsung ke pembeli korporat.
              Rantai pasok lebih pendek, harga lebih adil, kualitas terjamin.
            </p>

            <div className="reveal reveal-d3 mt-10 flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-tani-green hover:bg-tani-green-dark text-white h-12 px-7 text-base rounded-xl shadow-lg shadow-tani-green/20"
                nativeButton={false} render={<Link href="/register" />}
              >
                Daftar Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-7 text-base rounded-xl border-foreground/15 bg-transparent text-foreground hover:border-tani-green/30 hover:bg-tani-green/5"
                nativeButton={false} render={<Link href="/login" />}
              >
                Masuk ke Dashboard
              </Button>
            </div>
          </div>

          {/* floating decorative cards */}
          <div className="hidden lg:block absolute right-0 top-8 w-80">
            <div className="float-slow relative">
              <div className="bg-white rounded-2xl p-5 shadow-xl shadow-black/5 ring-1 ring-black/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-tani-green/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-tani-green" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">QA Approved</p>
                    <p className="text-xs text-muted-foreground">Beras Organik — Grade A</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-tani-green/10 text-tani-green px-2 py-0.5 rounded-full">5 Ton</span>
                  <span className="text-xs bg-tani-blue/10 text-tani-blue px-2 py-0.5 rounded-full">Karawang</span>
                </div>
              </div>
            </div>
            <div className="float-med relative mt-4 ml-12">
              <div className="bg-white rounded-2xl p-5 shadow-xl shadow-black/5 ring-1 ring-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tani-amber/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-tani-amber" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">+38% Pendapatan</p>
                    <p className="text-xs text-muted-foreground">rata-rata peningkatan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ STATS ══════ */}
      <section className="relative -mt-1 bg-tani-green-dark">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STATS.map((s, i) => (
              <div key={s.label} className={`reveal reveal-d${i + 1} text-center`}>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 text-white/80 mb-3">
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-3xl md:text-4xl font-heading font-bold text-white tracking-tight">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-white/60 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CARA KERJA ══════ */}
      <section id="cara-kerja" className="py-20 md:py-28 grain">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="reveal text-sm font-semibold text-tani-green tracking-wide uppercase mb-3">
              Cara Kerja
            </p>
            <h2 className="reveal reveal-d1 font-heading text-3xl md:text-4xl font-bold tracking-tight">
              Empat Langkah Menuju
              <br />
              <span className="text-tani-green">Transaksi yang Adil</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <Card
                key={s.step}
                className={`reveal reveal-d${i + 1} group relative bg-white hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-1`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${s.color} text-white`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <span className="font-heading text-2xl font-bold text-tani-green/30 group-hover:text-tani-green/50 transition-colors">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="font-heading text-base font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ KEUNGGULAN ══════ */}
      <section id="keunggulan" className="py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* left text */}
            <div>
              <p className="reveal text-sm font-semibold text-tani-green tracking-wide uppercase mb-3">
                Mengapa Taninesia
              </p>
              <h2 className="reveal reveal-d1 font-heading text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Dibangun untuk
                <br />
                <span className="text-tani-green">Ekosistem Pertanian</span> Indonesia
              </h2>
              <p className="reveal reveal-d2 text-foreground/60 leading-relaxed mb-8">
                Kami memahami kompleksitas rantai pasok pertanian Indonesia.
                Taninesia hadir dengan teknologi yang tepat guna — sederhana
                untuk petani, powerful untuk supplier.
              </p>
              <div className="reveal reveal-d3">
                <Button
                  size="lg"
                  className="bg-tani-green hover:bg-tani-green-dark text-white h-12 px-7 text-base rounded-xl"
                  nativeButton={false} render={<Link href="/register" />}
                >
                  Mulai Sekarang
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* right cards grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {ADVANTAGES.map((a, i) => (
                <div
                  key={a.title}
                  className={`reveal reveal-d${i + 1} group rounded-2xl p-5 ${a.bg} ring-1 ring-black/[0.03] hover:ring-black/[0.06] transition-all duration-300`}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm mb-4`}>
                    <a.icon className={`w-5 h-5 ${a.accent}`} />
                  </div>
                  <h3 className="font-heading text-base font-semibold mb-1.5">{a.title}</h3>
                  <p className="text-sm text-foreground/55 leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ TESTIMONI ══════ */}
      <section id="testimoni" className="py-20 md:py-28 grain terrace-lines">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="reveal text-sm font-semibold text-tani-green tracking-wide uppercase mb-3">
              Testimoni
            </p>
            <h2 className="reveal reveal-d1 font-heading text-3xl md:text-4xl font-bold tracking-tight">
              Dipercaya oleh <span className="text-tani-green">Ribuan</span> Pelaku Pertanian
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card
                key={t.name}
                className={`reveal reveal-d${i + 1} bg-white hover:shadow-lg hover:shadow-black/5 transition-all duration-300`}
              >
                <CardContent className="p-6">
                  <Quote className="w-8 h-8 text-tani-green/20 mb-4" />
                  <p className="text-sm text-foreground/70 leading-relaxed mb-6">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-tani-amber text-tani-amber" />
                    ))}
                  </div>
                  <p className="font-heading text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA ══════ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="reveal relative rounded-3xl bg-tani-green-dark overflow-hidden">
            {/* pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                  radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
              }} />
            </div>

            <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
                Siap Terhubung Langsung?
              </h2>
              <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
                Bergabung bersama ribuan Kelompok Tani dan Supplier yang sudah
                merasakan manfaat transaksi langsung di Taninesia.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  className="!bg-white !text-tani-green-dark hover:!bg-white/90 h-12 px-8 text-base rounded-xl font-semibold shadow-lg"
                  nativeButton={false} render={<Link href="/register" />}
                >
                  Daftar Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base rounded-xl border-white/25 bg-transparent text-white hover:bg-white/10 hover:border-white/40"
                  nativeButton={false} render={<Link href="/login" />}
                >
                  Masuk Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-foreground/5 bg-[#FAFAF7]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-tani-green text-white">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="font-heading text-lg font-bold text-tani-green-dark">taninesia</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-foreground/50">
              <a href="#cara-kerja" className="hover:text-tani-green transition-colors">Cara Kerja</a>
              <a href="#keunggulan" className="hover:text-tani-green transition-colors">Keunggulan</a>
              <a href="#testimoni" className="hover:text-tani-green transition-colors">Testimoni</a>
              <Link href="/login" className="hover:text-tani-green transition-colors">Masuk</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-foreground/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-foreground/40">
            <p>&copy; 2026 Taninesia. Marketplace Pertanian B2B Indonesia.</p>
            <p>Menghubungkan petani ke pasar yang lebih adil.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
