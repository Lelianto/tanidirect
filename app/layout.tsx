import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "TaniDirect — Marketplace Pertanian B2B",
  description: "Platform B2B yang menghubungkan Kelompok Tani langsung ke Supplier besar, memotong rantai tengkulak.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
