"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { toast } from "sonner"
import { useAppContext, getTypeLabel } from "../../lib/store"
import type { DocumentType, DocumentRequest, HistoryEntry } from "../../lib/types"
import { RequestsTable } from "../../components/requests-table"
import { StatusTabs } from "../../components/status-tabs"
import { CheckCircle, XCircle, ArrowRight, Eye } from "lucide-react"
import { useRouter } from "next/navigation"


const isTypeValidationFlow = (request: DocumentRequest) => {
  return (
    request.tipoOriginal &&
    !request.historial.some(
      (h: HistoryEntry) => h.usuario === request.elaboradorName && (h.accion === "tarea_creada" || h.accion === "rechazado"),
    )
  )
}

export default function ElaboradorPage() {
  const { state, dispatch } = useAppContext()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null)
  const [selectedType, setSelectedType] = useState<DocumentType | "">("")
  const [activeTab, setActiveTab] = useState<"historial" | "pendiente">("historial")

  const userRequests = state.requests.filter((req) => req.elaboradorId === state.user?.id)
  const historialRequests = userRequests.filter((req) => req.status !== "pendiente")


  const pendienteRequests = userRequests.filter((req) => {
    if (req.status !== "pendiente") return false

  
    if (req.tipoOriginal) return true


    const hasRevisorApproval = req.historial.some((h: HistoryEntry) => h.accion === "aprobado")
    const hasValidators = req.validadores && req.validadores.length > 0

    if (hasRevisorApproval && !hasValidators) {
      return true
    }

  
    const hasValidation = req.historial.some((h: HistoryEntry) => h.accion === "validacion_aprobada")
    if (hasValidation) {
      return true
    }


    if (req.liberadoDeTarea) {
      return true
    }

    return false
  })

  const displayedRequests = activeTab === "historial" ? historialRequests : pendienteRequests

  const router = useRouter()

  const handleCreateRequest = () => {
    if (!state.user || !selectedType) return

    const newRequest = {
      tipo: selectedType,
      elaboradorId: state.user.id,
      elaboradorName: state.user.name,
      status: "en_revision" as const,
    }

    dispatch({
      type: "CREATE_REQUEST",
      payload: newRequest,
    })

    toast.success("La solicitud ha sido creada y enviada a revisión")
    setSelectedType("")
    setIsCreateOpen(false)
  }

  const handleAcceptChange = () => {
    if (!selectedRequest || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "en_desarrollo", 
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry: {
          accion: "tarea_creada",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: selectedRequest.tipoOriginal
            ? "Cambio de tipo aceptado - tarea creada"
            : "Solicitud aceptada - tarea creada",
        },
      },
    })

    toast.success(selectedRequest.tipoOriginal ? "Cambio de tipo aceptado" : "Solicitud aceptada")
    setSelectedRequest(null)
  }

  const handleRejectChange = () => {
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
          detalles: selectedRequest.tipoOriginal ? "Cambio de tipo rechazado" : "Solicitud rechazado",
        },
      },
    })

    toast.error(selectedRequest.tipoOriginal ? "Cambio de tipo rechazado" : "Solicitud rechazada")
    setSelectedRequest(null)
  }


  const handleAcceptChangeDirect = (request: DocumentRequest) => {
    if (!request || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: request.id,
        updates: {
          status: "enviado_aprobacion", 
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: request.id,
        entry: {
          accion: "documento_enviado",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Documento aceptado y enviado al aprobador para aprobación final",
        },
      },
    })

    toast.success("Documento aceptado y enviado al aprobador")
  }

  const handleRejectChangeDirect = (request: DocumentRequest) => {
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
          detalles: "Documento rechazado por el elaborador",
        },
      },
    })

    toast.error("Documento rechazado")
  }

  const handleVisualizarPrevia = (request: DocumentRequest) => {
    router.push(`/elaborador/previa/${request.id}`)
  }

  const isDocumentApprovedFlow = (request: DocumentRequest) => {

    if (request.tipoOriginal) {
      const hasElaboradorResponse = request.historial.some(
        (h: HistoryEntry) => h.usuario === state.user?.name && (h.accion === "tarea_creada" || h.accion === "rechazado"),
      )
      if (hasElaboradorResponse) {
        return true
      }
    }


    const hasValidation = request.historial.some((h: HistoryEntry) => h.accion === "validacion_aprobada")
    if (hasValidation) {
      return true
    }

    const hasRevisorApproval = request.historial.some((h: HistoryEntry) => h.accion === "aprobado")
    const hasDocumentSent = request.historial.some((h: HistoryEntry) => h.accion === "documento_enviado")
    if (hasRevisorApproval && hasDocumentSent) {
      return true
    }

    if (request.liberadoDeTarea) {
      return true
    }

    return false
  }

  const shouldShowVisualizarPrevia = (request: DocumentRequest) => {

    const hasRevisorComments = request.comentariosRevisor
    const hasValidation = request.historial.some((h: HistoryEntry) => h.accion === "validacion_aprobada")
    const hasRevisorApproval = request.historial.some((h: HistoryEntry) => h.accion === "aprobado")
    const hasDocumentSent = request.historial.some((h: HistoryEntry) => h.accion === "documento_enviado")

    if (request.liberadoDeTarea) {
      return true
    }

    return hasRevisorComments || hasValidation || (hasRevisorApproval && hasDocumentSent)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Solicitudes</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00363B] hover:bg-[#00363B]/90">
              <Plus className="h-4 w-4 mr-2" />
              Crear Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Solicitud</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Select value={selectedType} onValueChange={(value: DocumentType) => setSelectedType(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="procedimiento">Procedimiento</SelectItem>
                    <SelectItem value="instructivo">Instructivo</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="formato">Formato</SelectItem>
                    <SelectItem value="norma">Norma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateRequest}
                  disabled={!selectedType}
                  className="bg-[#00363B] hover:bg-[#00363B]/90"
                >
                  Crear Solicitud
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
            ? (request) => {

                if (isTypeValidationFlow(request)) {
                  return (
                    <Button
                      size="sm"
                      className="bg-[#00363B] hover:bg-[#00363B]/90"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Revisar
                    </Button>
                  )
                }

            
                if (isDocumentApprovedFlow(request)) {
  
                  if (shouldShowVisualizarPrevia(request)) {
                    return (
                      <Button
                        size="sm"
                        className="bg-[#00363B] hover:bg-[#00363B]/90"
                        onClick={() => handleVisualizarPrevia(request)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar Previa
                      </Button>
                    )
                  } else {
                    // Botones directos para casos simples
                    return (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-[#00363B] hover:bg-[#00363B]/90"
                          onClick={() => handleAcceptChangeDirect(request)}
                        >
                          Aceptar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectChangeDirect(request)}>
                          Rechazar
                        </Button>
                      </div>
                    )
                  }
                }

                return undefined
              }
            : undefined
        }
      />


      {selectedRequest && isTypeValidationFlow(selectedRequest) && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold">
                {selectedRequest.tipoOriginal ? "Cambio de Tipo Solicitado" : "Solicitud Aprobada"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="rounded-xl bg-gradient-to-r from-[#174449] to-[#20575e] text-white text-center px-4 py-3 mb-2">
                <div className="text-lg font-bold tracking-wide">{selectedRequest.numero}</div>
                <div className="text-sm mt-0.5 font-normal">
                  {selectedRequest.tipoOriginal
                    ? "El revisor ha sugerido un cambio de tipo"
                    : "El revisor ha aprobado la solicitud"}
                </div>
              </div>

              {selectedRequest.tipoOriginal ? (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tipo Original</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {getTypeLabel(selectedRequest.tipoOriginal)}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 mx-4" />
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tipo Sugerido</p>
                    <p className="text-lg font-semibold text-green-600">{getTypeLabel(selectedRequest.tipo)}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tipo de Documento</p>
                  <p className="text-lg font-semibold text-green-600">{getTypeLabel(selectedRequest.tipo)}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setSelectedRequest(null)} className="px-6">
                  Cancelar
                </Button>
                <div className="flex space-x-3">
                  <Button onClick={handleRejectChange} variant="destructive" className="px-6">
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button onClick={handleAcceptChange} className="bg-[#00363B] hover:bg-[#00363B]/90 px-6">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aceptar
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
