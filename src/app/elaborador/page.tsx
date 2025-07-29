"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAppContext, getTypeLabel } from "@/lib/store"
import type { DocumentType } from "@/lib/types"
import { RequestsTable } from "@/components/requests-table"
import { StatusTabs } from "@/components/status-tabs"
import { FileText, CheckCircle, XCircle, ArrowRight } from "lucide-react"

export default function ElaboradorPage() {
  const { state, dispatch } = useAppContext()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<DocumentType | "">("")
  const [activeTab, setActiveTab] = useState<"historial" | "pendiente">("historial")

  const userRequests = state.requests.filter((req) => req.elaboradorId === state.user?.id)
  const historialRequests = userRequests.filter((req) => req.status !== "pendiente")

  // Pendiente: solicitudes que vuelven del revisor/validador para aceptar
  const pendienteRequests = userRequests.filter(
    (req) =>
      req.status === "pendiente" &&
      (req.tipoOriginal || req.historial.some((h: { accion: string }) => h.accion === "validacion_aprobada" || h.accion === "aprobado")),
  )

  const displayedRequests = activeTab === "historial" ? historialRequests : pendienteRequests

  const handleCreateRequest = () => {
    if (!state.user || !selectedType) return

    dispatch({
      type: "CREATE_REQUEST",
      payload: {
        tipo: selectedType,
        elaboradorId: state.user.id,
        elaboradorName: state.user.name,
        status: "en_revision",
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: "", // Se asignará automáticamente
        entry: {
          accion: "solicitud_creada",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Solicitud creada y enviada al revisor",
        },
      },
    })

    toast.success("La solicitud ha sido creada y enviada a revisión")

    setSelectedType("")
    setIsCreateOpen(false)
  }

  const handleAcceptChange = () => {
    if (!selectedRequest || !state.user) return

    // Verificar si viene de validación
    const isFromValidation = selectedRequest.historial.some((h: { accion: string }) => h.accion === "validacion_aprobada")

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "en_desarrollo", // Va a desarrollo/tareas
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry: {
          accion: "cambio_aceptado",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: isFromValidation
            ? "Validación aceptada - documento listo para envío final"
            : selectedRequest.tipoOriginal
              ? "Cambio de tipo aceptado"
              : "Solicitud aceptada para desarrollo",
        },
      },
    })

    toast.success(
      isFromValidation ? "Validación aceptada" : "Solicitud aceptada"
    )

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
          detalles: "Solicitud rechazada por el elaborador",
        },
      },
    })

    toast.error("La solicitud ha sido rechazada")

    setSelectedRequest(null)
  }

  const getModalTitle = (request: any) => {
    const isFromValidation = request.historial.some((h: { accion: string }) => h.accion === "validacion_aprobada")
    if (isFromValidation) {
      return "Validación Completada"
    }
    return request.tipoOriginal ? "Cambio de Tipo Solicitado" : "Solicitud Aprobada"
  }

  const getModalDescription = (request: any) => {
    const isFromValidation = request.historial.some((h: { accion: string }) => h.accion === "validacion_aprobada")
    if (isFromValidation) {
      return "El documento ha sido validado y está listo para envío final"
    }
    return request.tipoOriginal ? "El revisor ha sugerido un cambio de tipo" : "Su solicitud ha sido aprobada"
  }

  // Acciones directas para aprobar/rechazar desde la tabla cuando viene de validación
  const handleAcceptChangeDirect = (request: any) => {
    if (!request || !state.user) return;
    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: request.id,
        updates: {
          status: "en_desarrollo",
        },
      },
    });
    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: request.id,
        entry: {
          accion: "cambio_aceptado",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Validación aceptada - documento listo para envío final",
        },
      },
    });
    toast.success("Validación aceptada");
  };

  const handleRejectChangeDirect = (request: any) => {
    if (!request || !state.user) return;
    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: request.id,
        updates: {
          status: "rechazado",
        },
      },
    });
    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: request.id,
        entry: {
          accion: "rechazado",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Solicitud rechazada por el elaborador tras validación",
        },
      },
    });
    toast.error("La solicitud ha sido rechazada");
  };

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
                    <SelectItem value="politica">Política</SelectItem>
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
                // Si viene de validación de tipo, mostrar Aprobar/Rechazar
                if (
                  request.status === "pendiente" &&
                  Array.isArray(request.historial) &&
                  request.historial.some((h) => h.accion === "validacion_aprobada")
                ) {
                  return (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-[#00363B] hover:bg-[#00363B]/90" onClick={() => handleAcceptChangeDirect(request)}>
                        Aprobar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectChangeDirect(request)}>
                        Rechazar
                      </Button>
                    </div>
                  );
                }
                // Si viene de validación de documento (aprobado) o cambio de tipo, mostrar Revisar
                if (
                  request.status === "pendiente" &&
                  (request.tipoOriginal || (Array.isArray(request.historial) && request.historial.some((h) => h.accion === "aprobado")))
                ) {
                  return (
                    <Button size="sm" className="bg-[#00363B] hover:bg-[#00363B]/90" onClick={() => setSelectedRequest(request)}>
                      Revisar
                    </Button>
                  );
                }
                return undefined;
              }
            : undefined
        }
      />

      {/* Modal de aceptación solo para otros casos, no cuando viene de validación de tipo */}
      {selectedRequest && !(selectedRequest.status === "pendiente" && Array.isArray(selectedRequest.historial) && selectedRequest.historial.some((h: any) => h.accion === "validacion_aprobada")) && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold">
                {getModalTitle(selectedRequest)}
              </DialogTitle>
            </DialogHeader>
            {/* Contenido del modal */}
            <div className="space-y-6">
              {/* Cabecera institucional arriba del bloque visual */}
              <div className="rounded-xl bg-gradient-to-r from-[#174449] to-[#20575e] text-white text-center px-4 py-3 mb-2">
                <div className="text-lg font-bold tracking-wide">{selectedRequest.numero}</div>
                <div className="text-sm mt-0.5 font-normal">
                  {selectedRequest.tipoOriginal
                    ? "El revisor ha sugerido un cambio de tipo"
                    : "Su solicitud ha sido aprobada"}
                </div>
              </div>
              {/* Visualización diferenciada según si hay cambio de tipo */}
              {selectedRequest.tipoOriginal ? (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tipo Original</p>
                    <p className="text-lg font-semibold text-orange-600">{getTypeLabel(selectedRequest.tipoOriginal)}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 mx-4" />
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tipo Sugerido</p>
                    <p className="text-lg font-semibold text-green-600">{getTypeLabel(selectedRequest.tipo)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center bg-green-50 rounded-lg p-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-green-800">{getTypeLabel(selectedRequest.tipo)}</p>
                  <p className="text-sm text-green-600 mt-1">Listo para desarrollo</p>
                </div>
              )}
              {/* Si viene de validación de documento (aprobado) o cambio de tipo, mostrar botones de acción */}
              {selectedRequest.status === "pendiente" && (selectedRequest.tipoOriginal || (Array.isArray(selectedRequest.historial) && selectedRequest.historial.some((h: any) => h.accion === "aprobado"))) ? (
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <Button variant="outline" onClick={() => setSelectedRequest(null)} className="px-6">
                    Cancelar
                  </Button>
                  <div className="flex space-x-3">
                    <Button onClick={handleAcceptChange} className="bg-[#00363B] hover:bg-[#00363B]/90 px-6 text-white">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprobar
                    </Button>
                    <Button onClick={handleRejectChange} variant="destructive" className="px-6">
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ) : (
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
                      Aprobar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
