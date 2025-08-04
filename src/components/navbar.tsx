"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "./ui/button"
import { useAppContext } from "../lib/store"

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
    <nav className="bg-white text-indigo-900 px-6 py-4 shadow">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Image src="/logo-protecso.png" alt="PROTECSO" width={280} height={64} className="h-16 w-auto" />

        <div className="flex space-x-2 justify-center">
          <Link href={`/${state.user.role}`}>
            <Button
              variant="ghost"
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isActive(`/${state.user.role}`)
                  ? "bg-blue-900 text-white shadow-md"
                  : "text-blue-900 hover:text-white hover:bg-blue-900"
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
                  ? "bg-blue-900 text-white shadow-md"
                  : "text-blue-900 hover:text-white hover:bg-blue-900"
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
          className="text-blue-900 hover:text-white hover:bg-blue-900"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
