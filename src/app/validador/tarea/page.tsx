"use client"

import jsPDF from "jspdf"
import type { DocumentRequest } from "../../../lib/types"
import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "../../../components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Textarea } from "../../../components/ui/textarea"
import { Label } from "../../../components/ui/label"
import { toast } from "sonner"
import { useAppContext, getTypeLabel } from "../../../lib/store"
import { RequestsTable } from "../../../components/requests-table"
import { FileText, MessageSquare, ExternalLink } from "lucide-react"

export default function ValidadorTareaPage() {
  const { state, dispatch } = useAppContext()
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null)
  const [comments, setComments] = useState("")

  const currentUserId = state.user?.id

  const validationTasks = state.requests.filter(
    (req) =>
      req.status === "en_validacion" &&
      req.validadores?.includes(currentUserId || "") &&
      !req.historial.some((h) => h.usuario === state.user?.name && h.accion === "validacion_aprobada"),
  )

  // Cuando se selecciona una solicitud, cargar comentarios existentes
  const handleOpenRequest = (request: DocumentRequest) => {
    setSelectedRequest(request)
    // Buscar comentarios previos del validador en el historial
    const validatorComment =
      request.historial.filter((h) => h.usuario === state.user?.name && h.accion === "documento_creado").pop()
        ?.detalles || ""
    setComments(validatorComment)
  }

  const handleViewPDF = () => {
    if (!selectedRequest) return

    const doc = new jsPDF()
    const margin = 15
    const maxWidth = 180
    const lineHeight = 7
    const pageHeight = doc.internal.pageSize.getHeight()
    let y = margin

    const checkAddPage = (linesCount = 1) => {
      if (y + linesCount * lineHeight > pageHeight - 20) {
        doc.addPage()
        y = margin
      }
    }

    doc.setFontSize(18)
    doc.setTextColor("#00363B")
    doc.text(`Documento: ${selectedRequest.numero}`, margin, y)
    y += 10

    doc.setFontSize(14)
    doc.setTextColor("#666666")
    doc.text(getTypeLabel(selectedRequest.tipo).toUpperCase(), margin, y)
    y += 15

    const printSection = (title: string, text: string) => {
      doc.setFontSize(12)
      doc.setTextColor("#00363B")
      checkAddPage()
      doc.text(title, margin, y)
      y += lineHeight

      doc.setFontSize(11)
      doc.setTextColor("#333333")
      const lines = doc.splitTextToSize(text || "No especificado", maxWidth)
      for (let i = 0; i < lines.length; i++) {
        checkAddPage()
        doc.text(lines[i], margin, y)
        y += lineHeight
      }
      y += 5
    }

    printSection("OBJETIVO", selectedRequest.objetivo || "")
    printSection("ALCANCE", selectedRequest.alcance || "")
    printSection("DESARROLLO", selectedRequest.desarrollo || "")

    doc.setFontSize(10)
    doc.setTextColor("#666666")
    doc.text(
      `Documento generado el ${selectedRequest.fechaCreacion ? new Date(selectedRequest.fechaCreacion).toLocaleDateString("es-ES") : ""}`,
      margin,
      pageHeight - 20,
    )
    doc.text(
      `Última actualización: ${selectedRequest.fechaActualizacion ? new Date(selectedRequest.fechaActualizacion).toLocaleDateString("es-ES") : ""}`,
      margin,
      pageHeight - 14,
    )

    doc.save(`${selectedRequest.numero || "documento"}.pdf`)
  }

  const handleReject = () => {
    if (!selectedRequest || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "pendiente",
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
          detalles: comments || "Documento rechazado por el validador",
        },
      },
    })

    toast.error("Documento rechazado. El documento ha sido rechazado y enviado como vista previa al elaborador")
    resetForm()
  }

  const handleApprove = () => {
    if (!selectedRequest || !state.user) return

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry: {
          accion: "validacion_aprobada",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: comments || "Documento validado correctamente",
        },
      },
    })

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "pendiente",
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry: {
          accion: "enviado_revision",
          usuario: "Sistema",
          fecha: new Date().toISOString(),
          detalles: "Validación completada - enviado al elaborador para revisión final",
        },
      },
    })

    toast.success("Validación completada. Documento enviado al elaborador para revisión final")
    resetForm()
  }

  const handleSave = () => {
    if (!selectedRequest || !state.user) return


    setSelectedRequest((prev: DocumentRequest | null) => (prev ? { ...prev, comentariosValidador: comments } : prev))

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry: {
          accion: "documento_creado",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: comments || "Comentarios de validación guardados temporalmente",
        },
      },
    })

    toast.success("Cambios guardados. Los comentarios han sido guardados temporalmente")
  }

  const handleDelegate = () => {
    if (!selectedRequest || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "pendiente", 
          liberadoDeTarea: true, 
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
    resetForm()
  }

  const resetForm = () => {
    setSelectedRequest(null)
    setComments("")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Tareas de Validación</h1>

      <RequestsTable data={validationTasks} onReview={handleOpenRequest} showActions={true} isHistorial={false} />

      {selectedRequest && (
        <Drawer open={!!selectedRequest} onOpenChange={resetForm}>
          <DrawerContent className="fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none p-0 bg-white z-50 flex flex-col">
            <div className="flex flex-col flex-1 min-h-0">
              <DrawerHeader className="border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
                <div className="flex items-center">
                  <DrawerTitle className="text-xl font-semibold text-gray-900">
                    {selectedRequest && `Validación de Documento: ${getTypeLabel(selectedRequest.tipo).toUpperCase()}`}
                  </DrawerTitle>
                </div>
                {selectedRequest && (
                  <div className="mt-3">
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#00363B] text-white">
                      <span className="opacity-90">Documento:</span>
                      <span className="ml-2 font-semibold">{selectedRequest.numero}</span>
                    </div>
                    <div className="mt-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Solo Lectura - Validación Técnica
                      </div>
                    </div>
                  </div>
                )}
              </DrawerHeader>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4 sm:p-8 flex flex-col gap-8">
                  <Tabs defaultValue="documento" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 rounded-lg p-1">
                      <TabsTrigger
                        value="documento"
                        className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Documento</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="comentarios"
                        className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Comentarios</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="documento" className="space-y-6 mt-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="space-y-6">
                          <div className="border-l-4 border-[#00363B] pl-4">
                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">OBJETIVO</h4>
                            <div className="bg-gray-100 rounded-lg p-4 min-h-[100px]">
                              <p className="text-gray-700 leading-relaxed">
                                {selectedRequest.objetivo || "No especificado"}
                              </p>
                            </div>
                          </div>

                          <div className="border-l-4 border-[#00363B] pl-4">
                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">ALCANCE</h4>
                            <div className="bg-gray-100 rounded-lg p-4 min-h-[100px]">
                              <p className="text-gray-700 leading-relaxed">
                                {selectedRequest.alcance || "No especificado"}
                              </p>
                            </div>
                          </div>

                          <div className="border-l-4 border-[#00363B] pl-4">
                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">DESARROLLO</h4>
                            <div className="bg-gray-100 rounded-lg p-4 min-h-[200px]">
                              <p className="text-gray-700 leading-relaxed">
                                {selectedRequest.desarrollo || "No especificado"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            onClick={handleViewPDF}
                            className="flex items-center space-x-2 hover:bg-gray-50 bg-transparent"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Ver en PDF</span>
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="comentarios" className="space-y-6 mt-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="space-y-4">
                          {selectedRequest.comentariosRevisor && (
                            <div className="border rounded-lg p-4 bg-blue-50">
                              <h4 className="font-medium text-gray-600 mb-2">Comentarios del Revisor</h4>
                              <p className="text-gray-800">{selectedRequest.comentariosRevisor}</p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                              Sus Comentarios de Validación
                            </Label>
                            <Textarea
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              placeholder="Agregar comentarios sobre la validación..."
                              rows={4}
                              className="bg-gray-50 border-gray-200 focus:border-[#00363B] focus:ring-[#00363B]"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                <div style={{ marginBottom: 128 }}></div>
              </div>

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
                    <Button
                      onClick={handleDelegate}
                      variant="outline"
                      className="px-6 border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                    >
                      Liberar
                    </Button>

                    <Button onClick={handleReject} variant="destructive" className="px-6">
                      No Conforme
                    </Button>

                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 px-6 text-white">
                      Guardar
                    </Button>

                    <Button onClick={handleApprove} className="bg-[#00363B] hover:bg-[#00363B]/90 px-6 text-white">
                      Conforme
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
