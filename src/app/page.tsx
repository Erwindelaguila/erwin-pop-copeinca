"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppContext } from "@/lib/store"
import type { UserRole } from "@/lib/types"

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("")
  const [selectedUser, setSelectedUser] = useState<string>("")
  const { dispatch } = useAppContext()
  const router = useRouter()

  const getValidatorOptions = () => [
    { id: "1", name: "Erwin del Aguila" },
    { id: "2", name: "Ivan Sanchez" },
  ]

  const handleLogin = () => {
    if (!selectedRole) return

    // Solo validar usuario seleccionado si es validador
    if (selectedRole === "validador" && !selectedUser) return

    let user
    if (selectedRole === "validador") {
      const validatorData = getValidatorOptions().find((u) => u.id === selectedUser)
      if (!validatorData) return
      user = {
        id: selectedUser,
        name: validatorData.name,
        role: selectedRole,
      }
    } else {
      // Para otros roles, usar IDs fijos
      const roleUsers = {
        elaborador: { id: "1", name: "Juan Pérez" },
        revisor: { id: "2", name: "María García" },
        aprobador: { id: "3", name: "Carlos López" },
      }
      user = {
        ...roleUsers[selectedRole as keyof typeof roleUsers],
        role: selectedRole,
      }
    }

    dispatch({ type: "SET_USER", payload: user })
    router.push(`/${selectedRole}`)
  }

  const validatorOptions = getValidatorOptions()
  const needsUserSelection = selectedRole === "validador"

  return (
    <div className="min-h-screen bg-[#00363B] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image src="/logo-copeinca-write.png" alt="Copeinca" width={120} height={40} className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#00363B]">Sistema de Gestión de Documentos</CardTitle>
          <p className="text-[#4B5C6B]">Selecciona tu rol para acceder al sistema</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Select
              value={selectedRole}
              onValueChange={(value: UserRole) => {
                setSelectedRole(value)
                setSelectedUser("") // Reset user selection when role changes
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione su rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elaborador">Elaborador</SelectItem>
                <SelectItem value="revisor">Revisor</SelectItem>
                <SelectItem value="validador">Validador</SelectItem>
                <SelectItem value="aprobador">Aprobador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsUserSelection && (
            <div>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione el usuario validador" />
                </SelectTrigger>
                <SelectContent>
                  {validatorOptions.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={!selectedRole || (needsUserSelection && !selectedUser)}
            className="w-full bg-[#00363B] hover:bg-[#00363B]/90 text-white"
          >
            Ingresar al Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
