"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAppContext, getTypeLabel } from "@/lib/store"
import { RequestsTable } from "@/components/requests-table"
import { StatusTabs } from "@/components/status-tabs"

export default function ValidadorPage() {
  const { state, dispatch } = useAppContext()
  // toast de sonner
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"historial" | "pendiente">("historial")

  // Filtrar documentos asignados a este validador específico
  const currentUserId = state.user?.id
  const allRequests = state.requests.filter(
    (req) => req.status === "pendiente" && req.validadores?.includes(currentUserId || ""),
  )

  // Historial: documentos que ya procesó este validador
  const historialRequests = state.requests.filter((req) =>
    req.historial.some(
      (h) =>
        h.usuario === state.user?.name &&
        (h.accion === "validacion_aprobada" || h.accion === "rechazado" || h.accion === "enviado_revision"),
    ),
  )

  // Pendiente: documentos nuevos asignados a este validador
  const pendienteRequests = allRequests.filter(
    (req) =>
      !req.historial.some(
        (h) =>
          h.usuario === state.user?.name &&
          (h.accion === "validacion_aprobada" || h.accion === "rechazado" || h.accion === "enviado_revision"),
      ),
  )

  const displayedRequests = activeTab === "historial" ? historialRequests : pendienteRequests

  const handleAcceptForValidation = (request: any) => {
    setSelectedRequest(request)
  }

  const handleAccept = (request: any) => {
    if (!request || !state.user) return

    // Mover a tareas del validador
    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: request.id,
        updates: {
          status: "en_validacion", // Ahora va a tareas
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: request.id,
        entry: {
          accion: "enviado_revision",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Documento aceptado para validación",
        },
      },
    })

    toast("El documento ha sido aceptado y enviado a tareas")
  }

  const handleReject = (request: any) => {
    if (!request || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: request.id,
        updates: {
          status: "rechazado",
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: request.id,
        entry: {
          accion: "rechazado",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Documento rechazado por el validador",
        },
      },
    })

    toast("El documento ha sido rechazado")
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
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#00363B] hover:bg-[#00363B]/90" onClick={() => handleAccept(request)}>
                    Aprobar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(request)}>
                    Rechazar
                  </Button>
                </div>
              )
            : undefined
        }
      />

    </div>
  )
}
