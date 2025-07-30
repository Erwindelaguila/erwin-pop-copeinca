"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAppContext, getTypeLabel } from "@/lib/store"
import { RequestsTable } from "@/components/requests-table"
import { Save, Send, FileText, MessageSquare, User, Clock } from "lucide-react"

export default function ElaboradorTareaPage() {
  const { state, dispatch } = useAppContext()
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [formData, setFormData] = useState({
    objetivo: "",
    alcance: "",
    desarrollo: "",
  })

  const pendingTasks = state.requests.filter(
    (req) => req.elaboradorId === state.user?.id && req.status === "en_desarrollo",
  )

  const handleCreateDocument = (request: any) => {
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

    // Verificar si viene de validación (envío directo al aprobador)
    const isFromValidation =
      selectedRequest.historial?.some((h: { accion: string }) => h.accion === "validacion_aprobada") || false

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          objetivo: formData.objetivo,
          alcance: formData.alcance,
          desarrollo: formData.desarrollo,
          status: isFromValidation ? "validacion_completada" : "documento_enviado", // Si viene de validación va al aprobador, sino al revisor
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
          detalles: isFromValidation
            ? "Documento revisado y enviado al aprobador para aprobación final"
            : "Documento completado y enviado al revisor para vista previa",
        },
      },
    })

    toast.success(
      isFromValidation
        ? "El documento ha sido revisado y enviado al aprobador para aprobación final"
        : "El documento ha sido enviado al revisor para vista previa",
    )

    setSelectedRequest(null)
    setFormData({ objetivo: "", alcance: "", desarrollo: "" })
  }

  const handleCloseDrawer = () => {
    setSelectedRequest(null)
    setFormData({ objetivo: "", alcance: "", desarrollo: "" })
  }

  // Determinar si es revisión o creación
  const isRevision = (request: any) => {
    if (!request || !request.historial) return false

    console.log("🔍 DEBUG isRevision para:", request.numero)
    console.log("📋 Historial:", request.historial)

    // CREAR DOCUMENTO: Cuando el elaborador nunca ha enviado un documento
    const hasDocumentSent = request.historial.some((h: any) => h.accion === "documento_enviado")
    console.log("📤 El elaborador ya envió documento:", hasDocumentSent)

    // Si el elaborador NUNCA ha enviado un documento = CREAR
    if (!hasDocumentSent) {
      console.log("🎯 RESULTADO: CREAR (elaborador nunca envió documento)")
      return false
    }

    // REVISAR DOCUMENTO: Cuando el elaborador ya envió un documento y se lo devolvieron
    // - Si viene del validador (después de haber enviado)
    const hasValidation = request.historial.some((h: any) => h.accion === "validacion_aprobada")
    if (hasValidation && hasDocumentSent) {
      console.log("🎯 RESULTADO: REVISAR (viene del validador)")
      return true
    }

    // - Si fue rechazado (después de haber enviado)
    const wasRejected = request.historial.some((h: any) => h.accion === "rechazado")
    if (wasRejected && hasDocumentSent) {
      console.log("🎯 RESULTADO: REVISAR (fue rechazado)")
      return true
    }

    // - Si viene del revisor después de documento_enviado (flujo 2)
    const hasRevisorApproval = request.historial.some((h: any) => h.accion === "aprobado")
    if (hasRevisorApproval && hasDocumentSent) {
      console.log("🎯 RESULTADO: REVISAR (revisor después de envío)")
      return true
    }

    console.log("🎯 RESULTADO: CREAR (por defecto)")
    return false
  }

  // Obtener comentarios del revisor y validador
  const getComments = (request: any) => {
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
      const validationEntry = request.historial.find((h: any) => h.accion === "validacion_aprobada")
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
            className="bg-[#00363B] hover:bg-[#00363B]/90"
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
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#00363B] text-white">
                    <span className="opacity-90">Documento:</span>
                    <span className="ml-2 font-semibold">{selectedRequest.numero}</span>
                  </div>
                </div>
              )}
            </DrawerHeader>

            {/* Scrollable content area, takes all available space above footer */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8">
              <div className="flex flex-col gap-8">
                <Tabs defaultValue="documento" className="w-full">
                  <TabsList
                    className={`grid w-full ${selectedRequest && isRevision(selectedRequest) ? "grid-cols-2" : "grid-cols-1"} h-12 bg-gray-100 rounded-lg p-1`}
                  >
                    <TabsTrigger
                      value="documento"
                      className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Documento</span>
                    </TabsTrigger>
                    {selectedRequest && isRevision(selectedRequest) && (
                      <TabsTrigger
                        value="comentarios"
                        className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Comentarios</span>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="documento" className="space-y-6 mt-6">
                    {/* Objetivo */}
                    <div className="flex flex-col gap-2 flex-1">
                      <Label className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center">
                        <div className="w-1 h-4 bg-[#00363B] rounded mr-2"></div>
                        OBJETIVO
                      </Label>
                      <Textarea
                        value={formData.objetivo}
                        onChange={(e) => setFormData((prev) => ({ ...prev, objetivo: e.target.value }))}
                        placeholder="Describe el objetivo principal del documento..."
                        className="resize-y min-h-[120px] max-h-[320px] bg-white border-gray-300 focus:border-[#00363B] focus:ring-[#00363B] transition-colors text-base"
                      />
                    </div>

                    {/* Alcance */}
                    <div className="flex flex-col gap-2 flex-1">
                      <Label className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center">
                        <div className="w-1 h-4 bg-[#00363B] rounded mr-2"></div>
                        ALCANCE
                      </Label>
                      <Textarea
                        value={formData.alcance}
                        onChange={(e) => setFormData((prev) => ({ ...prev, alcance: e.target.value }))}
                        placeholder="Define el alcance y límites del documento..."
                        className="resize-y min-h-[120px] max-h-[320px] bg-white border-gray-300 focus:border-[#00363B] focus:ring-[#00363B] transition-colors text-base"
                      />
                    </div>

                    {/* Desarrollo */}
                    <div className="flex flex-col gap-2 flex-[2]">
                      <Label className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center">
                        <div className="w-1 h-4 bg-[#00363B] rounded mr-2"></div>
                        DESARROLLO
                      </Label>
                      <Textarea
                        value={formData.desarrollo}
                        onChange={(e) => setFormData((prev) => ({ ...prev, desarrollo: e.target.value }))}
                        placeholder="Desarrolla el contenido principal del documento..."
                        className="resize-y min-h-[240px] max-h-[600px] bg-white border-gray-300 focus:border-[#00363B] focus:ring-[#00363B] transition-colors text-base"
                      />
                    </div>
                  </TabsContent>

                  {selectedRequest && isRevision(selectedRequest) && (
                    <TabsContent value="comentarios" className="space-y-6 mt-6">
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
                    </TabsContent>
                  )}
                </Tabs>
              </div>

              {/* Invisible spacer for mobile keyboard, allows scrolling to bottom */}
              <div className="h-8 sm:h-0 pointer-events-none select-none" aria-hidden="true"></div>
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
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-6 shadow-sm">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                  <Button
                    onClick={handleSaveAndSend}
                    className="bg-[#00363B] hover:bg-[#00363B]/90 text-white px-6 shadow-sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {selectedRequest && isRevision(selectedRequest) ? "Revisar y Enviar" : "Guardar y Enviar"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
