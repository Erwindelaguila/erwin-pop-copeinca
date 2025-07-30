"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { useAppContext, PROFESSIONAL_USERS } from "../lib/store"
import type { UserRole } from "../lib/types"

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("")
  const [selectedUser, setSelectedUser] = useState<string>("")
  const { dispatch } = useAppContext()
  const router = useRouter()

  const getUserOptionsForRole = (role: UserRole) => {
    switch (role) {
      case "elaborador":
        return [{ id: PROFESSIONAL_USERS.elaborador.id, name: PROFESSIONAL_USERS.elaborador.name }]
      case "revisor":
        return [{ id: PROFESSIONAL_USERS.revisor.id, name: PROFESSIONAL_USERS.revisor.name }]
      case "aprobador":
        return [{ id: PROFESSIONAL_USERS.aprobador.id, name: PROFESSIONAL_USERS.aprobador.name }]
      case "validador":
        return [
          { id: PROFESSIONAL_USERS.validador1.id, name: PROFESSIONAL_USERS.validador1.name },
          { id: PROFESSIONAL_USERS.validador2.id, name: PROFESSIONAL_USERS.validador2.name },
        ]
      default:
        return []
    }
  }

  const handleLogin = () => {
    if (!selectedRole || !selectedUser) return

    const userOptions = getUserOptionsForRole(selectedRole)
    const selectedUserData = userOptions.find((u) => u.id === selectedUser)

    if (!selectedUserData) return

    const user = {
      id: selectedUser,
      name: selectedUserData.name,
      role: selectedRole,
    }

    dispatch({ type: "SET_USER", payload: user })
    router.push(`/${selectedRole}`)
  }

  const userOptions = selectedRole ? getUserOptionsForRole(selectedRole) : []
  const needsUserSelection = selectedRole !== ""

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
                setSelectedUser("") 
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
                  <SelectValue placeholder={`Seleccione el usuario ${selectedRole}`} />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((user) => (
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
            disabled={!selectedRole || !selectedUser}
            className="w-full bg-[#00363B] hover:bg-[#00363B]/90 text-white"
          >
            Ingresar al Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
