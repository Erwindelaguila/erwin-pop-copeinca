"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/lib/store"

export function Navbar() {
  const { state, dispatch } = useAppContext()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    dispatch({ type: "SET_USER", payload: null })
    router.push("/")
  }

  if (!state.user) return null

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-[#00363B] text-white px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Image src="/logo-copeinca-write.png" alt="Copeinca" width={120} height={40} className="h-8 w-auto" />

        <div className="flex space-x-2 justify-center">
          <Link href={`/${state.user.role}`}>
            <Button
              variant="ghost"
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isActive(`/${state.user.role}`)
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              Solicitudes
            </Button>
          </Link>
          <Link href={`/${state.user.role}/tarea`}>
            <Button
              variant="ghost"
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isActive(`/${state.user.role}/tarea`)
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              Tarea
            </Button>
          </Link>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-white hover:text-gray-200 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
