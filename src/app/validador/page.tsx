"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppContext } from "../../lib/store"
import { RequestsTable } from "../../components/requests-table"
import { StatusTabs } from "../../components/status-tabs"
import { Button } from "../../components/ui/button"
import { Eye } from "lucide-react"

export default function ValidadorPage() {
  const { state, dispatch } = useAppContext()
  const [activeTab, setActiveTab] = useState<"historial" | "pendiente">("historial")
  const router = useRouter()

  const currentUserId = state.user?.id
  const allRequests = state.requests.filter(
    (req) => req.status === "pendiente" && req.validadores?.includes(currentUserId || ""),
  )
  const historialRequests = state.requests.filter((req) =>
    req.historial.some(
      (h) =>
        h.usuario === state.user?.name &&
        (h.accion === "validacion_aprobada" || h.accion === "rechazado" || h.accion === "enviado_revision"),
    ),
  )
  const pendienteRequests = allRequests.filter(
    (req) =>
      !req.historial.some(
        (h) =>
          h.usuario === state.user?.name &&
          (h.accion === "validacion_aprobada" || h.accion === "rechazado" || h.accion === "enviado_revision"),
      ),
  )

  const displayedRequests = activeTab === "historial" ? historialRequests : pendienteRequests
  
  const handleVisualizarPrevia = (request: any) => {
    router.push(`/validador/previa/${request.id}`)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Solicitudes</h1>

      <StatusTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historialCount={historialRequests.length}
        pendienteCount={pendienteRequests.length}
      />

      <RequestsTable
        data={displayedRequests}
        showActions={true}
        isHistorial={activeTab === "historial"}
        customActions={
          activeTab === "pendiente"
            ? (request) => (
                <Button
                  size="sm"
                  className="bg-[#00363B] hover:bg-[#00363B]/90 text-white text-sm"
                  onClick={() => handleVisualizarPrevia(request)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Previa
                </Button>
              )
            : undefined
        }
      />
    </div>
  )
}
