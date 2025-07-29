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

  const handleAccept = () => {
    if (!selectedRequest || !state.user) return

    // Mover a tareas del validador
    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "en_validacion", // Ahora va a tareas
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry: {
          accion: "enviado_revision",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Documento aceptado para validación",
        },
      },
    })

    toast("El documento ha sido aceptado y enviado a tareas")

    setSelectedRequest(null)
  }

  const handleReject = () => {
    if (!selectedRequest || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "rechazado",
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry: {
          accion: "rechazado",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Documento rechazado por el validador",
        },
      },
    })

    toast("El documento ha sido rechazado")

    setSelectedRequest(null)
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
        onReview={activeTab === "pendiente" ? handleAcceptForValidation : undefined}
        showActions={true}
        isHistorial={activeTab === "historial"}
      />

      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vista Previa - {getTypeLabel(selectedRequest.tipo).toUpperCase()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-gray-50 p-3 rounded">
                <p>
                  <span className="font-medium">Documento:</span> {selectedRequest.numero}
                </p>
              </div>

              {/* Vista previa del documento */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="border-l-4 border-[#00363B] pl-4">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">OBJETIVO</h4>
                  <p className="text-gray-700">{selectedRequest.objetivo || "No especificado"}</p>
                </div>
                <div className="border-l-4 border-[#00363B] pl-4">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">ALCANCE</h4>
                  <p className="text-gray-700">{selectedRequest.alcance || "No especificado"}</p>
                </div>
                <div className="border-l-4 border-[#00363B] pl-4">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">DESARROLLO</h4>
                  <p className="text-gray-700">{selectedRequest.desarrollo || "No especificado"}</p>
                </div>
              </div>

              {selectedRequest.comentariosRevisor && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-600 mb-2">Comentarios del Revisor</h4>
                  <p className="text-gray-800">{selectedRequest.comentariosRevisor}</p>
                </div>
              )}

              <div className="flex justify-between space-x-2">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Cancelar
                </Button>
                <div className="flex space-x-2">
                  <Button onClick={handleReject} variant="destructive">
                    Rechazar
                  </Button>
                  <Button onClick={handleAccept} className="bg-[#00363B] hover:bg-[#00363B]/90">
                    Aceptar para Validación
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
