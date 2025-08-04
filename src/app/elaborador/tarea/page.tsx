


"use client"
import { Save, Send, MessageSquare, User, Clock } from "lucide-react"
import { useState } from "react"
import type { DocumentRequest } from "../../../lib/types"
import type { HistoryEntry } from "../../../lib/types"
import { Button } from "../../../components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "../../../components/ui/drawer"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { toast } from "sonner"
import { useAppContext, getTypeLabel } from "../../../lib/store"
import { RequestsTable } from "../../../components/requests-table"

export default function ElaboradorTareaPage() {

  const { state, dispatch } = useAppContext()
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null)
  const [formData, setFormData] = useState<{
    objetivo: string
    alcance: string
    desarrollo: string
  }>({
    objetivo: "",
    alcance: "",
    desarrollo: "",
  })



  const pendingTasks = state.requests.filter(
    (req) => req.elaboradorId === state.user?.id && req.status === "en_desarrollo",
  )

  const handleCreateDocument = (request: DocumentRequest) => {
    setSelectedRequest(request)
    setFormData({
      objetivo: request.objetivo || "",
      alcance: request.alcance || "",
      desarrollo: request.desarrollo || "",
    })
  }

  const handleSave = () => {
    if (!selectedRequest || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          objetivo: formData.objetivo,
          alcance: formData.alcance,
          desarrollo: formData.desarrollo,
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry: {
          accion: "documento_creado",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Documento guardado en borrador",
        },
      },
    })

    toast.success("Los cambios han sido guardados como borrador")
  }

  const handleSaveAndSend = () => {
    if (!selectedRequest || !state.user) return

    // Si es revisión, enviar siempre al aprobador
    const revision = isRevision(selectedRequest)
    if (revision) {
      dispatch({
        type: "UPDATE_REQUEST",
        payload: {
          id: selectedRequest.id,
          updates: {
            objetivo: formData.objetivo,
            alcance: formData.alcance,
            desarrollo: formData.desarrollo,
            status: "enviado_aprobacion", // ← AQUÍ SÍ va al aprobador (cuando es revisión)
          },
        },
      })

      dispatch({
        type: "ADD_HISTORY",
        payload: {
          requestId: selectedRequest.id,
          entry: {
            accion: "documento_enviado",
            usuario: state.user.name,
            fecha: new Date().toISOString(),
            detalles: "Documento revisado y enviado al aprobador para aprobación final",
          },
        },
      })

      toast.success("El documento ha sido revisado y enviado al aprobador para aprobación final")
    } else {
      // Primera vez creando documento - va al REVISOR
      dispatch({
        type: "UPDATE_REQUEST",
        payload: {
          id: selectedRequest.id,
          updates: {
            objetivo: formData.objetivo,
            alcance: formData.alcance,
            desarrollo: formData.desarrollo,
            status: "documento_enviado", // ← AQUÍ va al revisor (primera vez)
          },
        },
      })

      dispatch({
        type: "ADD_HISTORY",
        payload: {
          requestId: selectedRequest.id,
          entry: {
            accion: "documento_enviado",
            usuario: state.user.name,
            fecha: new Date().toISOString(),
            detalles: "Documento completado y enviado al revisor para vista previa",
          },
        },
      })

      toast.success("El documento ha sido enviado al revisor para vista previa")
    }

    setSelectedRequest(null)
    setFormData({ objetivo: "", alcance: "", desarrollo: "" })
  }

  const handleLiberate = () => {
    if (!selectedRequest || !state.user) return

    // GUARDAR los cambios antes de liberar
    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          objetivo: formData.objetivo,
          alcance: formData.alcance,
          desarrollo: formData.desarrollo,
          status: "pendiente", // Vuelve a pendiente
          liberadoDeTarea: true, // ← NUEVA FLAG para indicar que fue liberado de tarea
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
          detalles: "Tarea liberada - cambios guardados y devuelta a solicitudes pendientes",
        },
      },
    })

    toast.success("Tarea liberada", {
      description: "Los cambios han sido guardados y la tarea devuelta a solicitudes pendientes",
    })
    handleCloseDrawer()
  }

  const handleCloseDrawer = () => {
    setSelectedRequest(null)
    setFormData({ objetivo: "", alcance: "", desarrollo: "" })
  }

  // Determinar si es revisión o creación
  const isRevision = (request: DocumentRequest | null) => {
    if (!request || !request.historial) return false

    // CREAR DOCUMENTO: Cuando el elaborador nunca ha enviado un documento
    const hasDocumentSent = request.historial.some((h: HistoryEntry) => h.accion === "documento_enviado")

    // Si el elaborador NUNCA ha enviado un documento = CREAR
    if (!hasDocumentSent) {
      return false
    }

    // REVISAR DOCUMENTO: Cuando el elaborador ya envió un documento y se lo devolvieron
    // - Si viene del validador (después de haber enviado)
    const hasValidation = request.historial.some((h: HistoryEntry) => h.accion === "validacion_aprobada")
    if (hasValidation && hasDocumentSent) {
      return true
    }

    // - Si fue rechazado (después de haber enviado)
    const wasRejected = request.historial.some((h: HistoryEntry) => h.accion === "rechazado")
    if (wasRejected && hasDocumentSent) {
      return true
    }

    // - Si viene del revisor después de documento_enviado (flujo 2)
    const hasRevisorApproval = request.historial.some((h: HistoryEntry) => h.accion === "aprobado")
    if (hasRevisorApproval && hasDocumentSent) {
      return true
    }

    return false
  }

  // Determinar si los campos deben estar bloqueados (solo lectura)
  const isReadOnly = (request: DocumentRequest | null) => {
    if (!request) return false

    // Si es revisión (viene del revisor/validador), bloquear campos
    return isRevision(request)
  }

  // Obtener comentarios del revisor y validador
  const getComments = (request: DocumentRequest | null) => {
    if (!request) return []
    const comments = []

    // Comentarios del revisor
    if (request.comentariosRevisor) {
      comments.push({
        type: "revisor",
        author: "Revisor",
        content: request.comentariosRevisor,
        timestamp: request.fechaActualizacion,
      })
    }

    // Comentarios del validador (buscar en historial)
    if (request.historial) {
      const validationEntry = request.historial.find((h: HistoryEntry) => h.accion === "validacion_aprobada")
      if (validationEntry && validationEntry.detalles) {
        comments.push({
          type: "validador",
          author: validationEntry.usuario,
          content: validationEntry.detalles,
          timestamp: validationEntry.fecha,
        })
      }
    }

    return comments
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Tareas Pendientes</h1>

      <RequestsTable
        data={pendingTasks}
        onReview={handleCreateDocument}
        showActions={true}
        isHistorial={false}
        customActions={(request) => (
          <Button
            size="sm"
            className="bg-[#1e40af] hover:bg-[#1a237e] text-white"
            onClick={() => handleCreateDocument(request)}
          >
            {isRevision(request) ? "Revisar Documento" : "Crear Documento"}
          </Button>
        )}
      />

      <Drawer open={!!selectedRequest} onOpenChange={handleCloseDrawer}>
        <DrawerContent className="fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none p-0 bg-white z-50 flex flex-col">
          <div className="flex flex-col flex-1 min-h-0">
            <DrawerHeader className="border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center">
                <DrawerTitle className="text-xl font-semibold text-gray-900">
                  {selectedRequest &&
                    `${isRevision(selectedRequest) ? "Revisar" : "Crear"} Documento: ${getTypeLabel(selectedRequest.tipo).toUpperCase()}`}
                </DrawerTitle>
              </div>
              {selectedRequest && (
                <div className="mt-3">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#1e40af] text-white">
                    <span className="opacity-90">Documento:</span>
                    <span className="ml-2 font-semibold">{selectedRequest.numero}</span>
                  </div>
                  {isReadOnly(selectedRequest) && (
                    <div className="mt-2">
             
                    </div>
                  )}
                </div>
              )}
            </DrawerHeader>

            {/* Scrollable content area, takes all available space above footer */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8">
              <div className="flex flex-col gap-8">
                {/* Objetivo */}
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center">
                    <div className="w-1 h-4 bg-[#1e40af] rounded mr-2"></div>
                    OBJETIVO
                  </Label>
                  <Textarea
                    value={formData.objetivo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, objetivo: e.target.value }))}
                    placeholder="Describe el objetivo principal del documento..."
                    className={`resize-y min-h-[120px] max-h-[320px] border-gray-300 focus:border-[#00363B] focus:ring-[#00363B] transition-colors text-base ${
                      isReadOnly(selectedRequest) ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                    }`}
                    readOnly={isReadOnly(selectedRequest)}
                  />
                </div>

                {/* Alcance */}
                <div className="flex flex-col gap-2 flex-1">
                  <Label className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center">
                    <div className="w-1 h-4 bg-[#1e40af] rounded mr-2"></div>
                    ALCANCE
                  </Label>
                  <Textarea
                    value={formData.alcance}
                    onChange={(e) => setFormData((prev) => ({ ...prev, alcance: e.target.value }))}
                    placeholder="Define el alcance y límites del documento..."
                    className={`resize-y min-h-[120px] max-h-[320px] border-gray-300 focus:border-[#00363B] focus:ring-[#00363B] transition-colors text-base ${
                      isReadOnly(selectedRequest) ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                    }`}
                    readOnly={isReadOnly(selectedRequest)}
                  />
                </div>

                {/* Desarrollo */}
                <div className="flex flex-col gap-2 flex-[2]">
                  <Label className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center">
                    <div className="w-1 h-4 bg-[#1e40af] rounded mr-2"></div>
                    DESARROLLO
                  </Label>
                  <Textarea
                    value={formData.desarrollo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, desarrollo: e.target.value }))}
                    placeholder="Desarrolla el contenido principal del documento..."
                    className={`resize-y min-h-[240px] max-h-[600px] border-gray-300 focus:border-[#00363B] focus:ring-[#00363B] transition-colors text-base ${
                      isReadOnly(selectedRequest) ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                    }`}
                    readOnly={isReadOnly(selectedRequest)}
                  />
                </div>

                {/* Comentarios solo si es revisión */}
                {selectedRequest && isRevision(selectedRequest) && (
                  <div className="space-y-6 mt-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center space-x-2 mb-6">
                        <MessageSquare className="h-5 w-5 text-[#00363B]" />
                        <h3 className="text-lg font-semibold text-gray-800">Comentarios del Proceso</h3>
                      </div>
                      <div className="space-y-4">
                        {getComments(selectedRequest).map((comment, index) => (
                          <div
                            key={index}
                            className={`border rounded-lg p-4 ${
                              comment.type === "revisor"
                                ? "bg-blue-50 border-blue-200"
                                : "bg-green-50 border-green-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-gray-800">
                                  {comment.author} ({comment.type === "revisor" ? "Revisor" : "Validador"})
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(comment.timestamp).toLocaleDateString("es-ES")}</span>
                              </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                          </div>
                        ))}
                        {getComments(selectedRequest).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No hay comentarios disponibles</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Invisible spacer for mobile keyboard, allows scrolling to bottom */}
              <div style={{ minHeight: 128 }} aria-hidden="true"></div>
            </div>

            {/* Footer con botones sticky */}
            <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-3 sticky bottom-0 left-0 right-0 z-20">
              <div className="flex justify-between items-center">
                <DrawerClose asChild>
                  <Button
                    variant="outline"
                    className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                  >
                    Cancelar
                  </Button>
                </DrawerClose>
                <div className="flex space-x-3">
                  {selectedRequest && isRevision(selectedRequest) && (
                    <Button
                      onClick={handleLiberate}
                      variant="outline"
                      className="px-6 border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                    >
                      Liberar
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 shadow-sm"
                    disabled={isReadOnly(selectedRequest)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                  <Button
                    onClick={handleSaveAndSend}
                    className="bg-[#1e40af] hover:bg-[#1a237e] text-white px-6 shadow-sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {selectedRequest && isRevision(selectedRequest) ? "Enviar al Aprobador" : "Guardar y Enviar"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
