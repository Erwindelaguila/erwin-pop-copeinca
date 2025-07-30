"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { toast } from "sonner"
import { useAppContext } from "../../lib/store"
import type { DocumentType } from "../../lib/types"
import { RequestsTable } from "../../components/requests-table"
import { StatusTabs } from "../../components/status-tabs"
import { CheckCircle, XCircle, Eye } from "lucide-react"

export default function RevisorPage() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<DocumentType | "">("")
  const [activeTab, setActiveTab] = useState<"historial" | "pendiente">("historial")

  const allRequests = state.requests
  const historialRequests = allRequests.filter(
    (req) => req.status !== "en_revision" && req.status !== "documento_enviado",
  )


  const pendienteRequests = allRequests.filter(
    (req) => req.status === "en_revision" || req.status === "documento_enviado",
  )

  const displayedRequests = activeTab === "historial" ? historialRequests : pendienteRequests

  const handleReviewRequest = (request: any) => {
    setSelectedRequest(request)
    if (request.status === "en_revision") {

      setSelectedType(request.tipo)
    }
  }

  const handleApproveType = () => {
    if (!selectedRequest || !state.user) return

    const isTypeChanged = selectedType !== selectedRequest.tipo

    if (isTypeChanged) {

      dispatch({
        type: "UPDATE_REQUEST",
        payload: {
          id: selectedRequest.id,
          updates: {
            status: "pendiente", 
            tipoOriginal: selectedRequest.tipo,
            tipo: selectedType as DocumentType,
          },
        },
      })

      const entry = {
        accion: "cambio_tipo" as const,
        usuario: state.user.name,
        fecha: new Date().toISOString(),
        detalles: "Tipo de documento modificado por el revisor",
        tipoAnterior: selectedRequest.tipo,
        tipoNuevo: selectedType === "" ? undefined : selectedType,
      }

      dispatch({
        type: "ADD_HISTORY",
        payload: {
          requestId: selectedRequest.id,
          entry,
        },
      })

      toast.success("Tipo modificado", {
        description: "Enviado al elaborador para aceptar el cambio",
      })
    } else {
   
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
            accion: "aprobado" as const,
            usuario: state.user.name,
            fecha: new Date().toISOString(),
            detalles: "Tipo de documento aprobado - enviado a tareas del elaborador",
          },
        },
      })

      toast.success("Tipo aprobado", {
        description: "Enviado directo a tareas del elaborador",
      })
    }

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

    toast.error("La solicitud ha sido rechazada", { description: "Rechazado" })
    resetForm()
  }

  const resetForm = () => {
    setSelectedRequest(null)
    setSelectedType("")
  }

  const isTypeRequest = selectedRequest?.status === "en_revision"


  const handleVisualizarPrevia = (request: any) => {
    router.push(`/revisor/previa/${request.id}`)
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

        onReview={(request: any) => {
          if (request.status === "en_revision") handleReviewRequest(request)
        }}

        customActions={(request: any) =>
          request.status === "documento_enviado" ? (
            <Button
              size="sm"
              className="bg-[#00363B] hover:bg-[#00363B]/90 text-white"
              onClick={() => handleVisualizarPrevia(request)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Previa
            </Button>
          ) : undefined
        }
      />

      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={resetForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold">Validar Tipo de Documento</DialogTitle>
            </DialogHeader>

            <div className="bg-gradient-to-r from-[#00363B] to-[#004d54] text-white p-4 rounded-lg text-center mb-2">
              <p className="text-lg font-medium">{selectedRequest.numero}</p>
              <p className="text-sm opacity-90 mt-1">El elaborador creó una nueva solicitud</p>
            </div>

            <div className="space-y-6">

              <div className="space-y-4">
                <Select value={selectedType} onValueChange={(value: DocumentType) => setSelectedType(value)}>
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Tipo de documento (opcional)" />
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

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={resetForm} className="px-6 bg-transparent">
                  Cancelar
                </Button>
                <div className="flex space-x-3">
                  <Button onClick={handleReject} variant="destructive" className="px-6">
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button onClick={handleApproveType} className="bg-[#00363B] hover:bg-[#00363B]/90 px-6">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {selectedType !== selectedRequest.tipo ? "Cambiar y Aprobar" : "Aprobar"}
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
