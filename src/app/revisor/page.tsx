"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAppContext } from "@/lib/store"
import type { DocumentType } from "@/lib/types"
import { RequestsTable } from "@/components/requests-table"
import { StatusTabs } from "@/components/status-tabs"
import { FileText, CheckCircle, XCircle } from "lucide-react"

export default function RevisorPage() {
  const { state, dispatch } = useAppContext()
  // toast de sonner
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<DocumentType | "">("")
  const [activeTab, setActiveTab] = useState<"historial" | "pendiente">("historial")

  const allRequests = state.requests
  const historialRequests = allRequests.filter(
    (req) => req.status !== "en_revision" && req.status !== "documento_enviado",
  )

  // Pendiente: solicitudes iniciales (tipo) + documentos enviados (contenido)
  const pendienteRequests = allRequests.filter(
    (req) => req.status === "en_revision" || req.status === "documento_enviado",
  )

  const displayedRequests = activeTab === "historial" ? historialRequests : pendienteRequests

  const handleReviewRequest = (request: any) => {
    setSelectedRequest(request)
    if (request.status === "en_revision") {
      // Es solicitud de tipo
      setSelectedType(request.tipo)
    }
  }

  const handleApproveType = () => {
    if (!selectedRequest || !state.user) return


    const isTypeChanged = selectedType !== selectedRequest.tipo

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "pendiente", // SIEMPRE va al elaborador
          ...(isTypeChanged && {
            tipoOriginal: selectedRequest.tipo,
            tipo: selectedType as DocumentType,
          }),
        },
      },
    })

    const entry: any = {
      accion: isTypeChanged ? "cambio_tipo" : "aprobado",
      usuario: state.user.name,
      fecha: new Date().toISOString(),
      detalles: isTypeChanged
        ? "Tipo de documento modificado por el revisor"
        : "Tipo de documento aprobado por el revisor",
    }
    if (isTypeChanged) {
      entry.tipoAnterior = selectedRequest.tipo
      entry.tipoNuevo = selectedType
    }
    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry,
      },
    })

    toast.success(
      isTypeChanged ? "Tipo modificado" : "Tipo aprobado",
      { description: "Enviado al elaborador para crear el documento" }
    )

    resetForm()
  }

  const handleAcceptDocument = () => {
    if (!selectedRequest || !state.user) return

    // Mover documento a tareas del revisor
    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "en_validacion", // Temporal para que aparezca en tareas
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
          detalles: "Documento aceptado para revisión detallada",
        },
      },
    })

    toast.success(
      "Documento aceptado",
      { description: "El documento ha sido enviado a sus tareas para revisión" }
    )

    resetForm()
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
          detalles: "Rechazado por el revisor",
        },
      },
    })

    toast.error(
      "La solicitud ha sido rechazada",
      { description: "Rechazado" }
    )

    resetForm()
  }

  const resetForm = () => {
    setSelectedRequest(null)
    setSelectedType("")
  }

  const isTypeRequest = selectedRequest?.status === "en_revision"
  const isDocumentRequest = selectedRequest?.status === "documento_enviado"

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
        onReview={activeTab === "pendiente" ? handleReviewRequest : undefined}
        showActions={true}
        isHistorial={activeTab === "historial"}
      />

      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={resetForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold">
                {isTypeRequest ? "Validar Tipo de Documento" : "Revisión de Documento"}
              </DialogTitle>
            </DialogHeader>
            {isTypeRequest && (
              <div className="bg-gradient-to-r from-[#00363B] to-[#004d54] text-white p-4 rounded-lg text-center mb-2">
                <p className="text-lg font-medium">{selectedRequest.numero}</p>
                <p className="text-sm opacity-90 mt-1">El elaborador creó una nueva solicitud</p>
              </div>
            )}

            <div className="space-y-6">
              {isTypeRequest ? (
                // Modal para validar tipo
                <div className="space-y-4">
                  <Select value={selectedType} onValueChange={(value: DocumentType) => setSelectedType(value)}>
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Tipo de documento (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="procedimiento">Procedimiento</SelectItem>
                      <SelectItem value="instructivo">Instructivo</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="politica">Política</SelectItem>
                      <SelectItem value="formato">Formato</SelectItem>
                      <SelectItem value="norma">Norma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                // Vista previa del documento
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">OBJETIVO</h4>
                      <p className="text-gray-700 text-sm">{selectedRequest.objetivo || "No especificado"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">ALCANCE</h4>
                      <p className="text-gray-700 text-sm">{selectedRequest.alcance || "No especificado"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">DESARROLLO</h4>
                      <p className="text-gray-700 text-sm">{selectedRequest.desarrollo || "No especificado"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={resetForm} className="px-6 bg-transparent">
                  Cancelar
                </Button>
                <div className="flex space-x-3">
                  <Button onClick={handleReject} variant="destructive" className="px-6">
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                  {isTypeRequest ? (
                    <Button onClick={handleApproveType} className="bg-[#00363B] hover:bg-[#00363B]/90 px-6">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {selectedType !== selectedRequest.tipo ? "Cambiar y Aprobar" : "Aprobar"}
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleAcceptDocument} className="bg-[#00363B] hover:bg-[#00363B]/90 px-6">
                        Aceptar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
