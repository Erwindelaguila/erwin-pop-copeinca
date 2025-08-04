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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-6">
          {/* Logo o branding removido por solicitud del usuario */}
          <CardTitle className="text-2xl font-bold text-blue-800">Sistema de Gestión de Documentos</CardTitle>
          <p className="text-slate-600 text-lg">Selecciona tu rol para acceder al sistema</p>
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold shadow-lg transition-all duration-200"
          >
            Ingresar al Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
