import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppProvider } from "../lib/store"
import { Navbar } from "../components/navbar" 
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Protecso - Sistema de Gestión de Documentos",
  description: "Sistema de gestión de documentos para Protecso",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AppProvider>
          <Navbar />
          <main className="min-h-screen bg-gray-50">{children}</main>
          <Toaster richColors position="top-right" />
        </AppProvider>
      </body>
    </html>
  )
}
