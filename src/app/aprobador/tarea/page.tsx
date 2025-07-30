"use client"

import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "../../../components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Textarea } from "../../../components/ui/textarea"
import { Label } from "../../../components/ui/label"
import { toast } from "sonner"
import { useAppContext, getTypeLabel } from "../../../lib/store"
import { RequestsTable } from "../../../components/requests-table"
import { FileText, MessageSquare, ExternalLink, Users, User, Calendar } from "lucide-react"
import jsPDF from "jspdf"

export default function AprobadorTareaPage() {
  const { state, dispatch } = useAppContext()
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [comments, setComments] = useState("")

  const pendingTasks = state.requests.filter((req) => req.status === "en_aprobacion")

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

    printSection("OBJETIVO", selectedRequest.objetivo)
    printSection("ALCANCE", selectedRequest.alcance)
    printSection("DESARROLLO", selectedRequest.desarrollo)

    doc.setFontSize(10)
    doc.setTextColor("#666666")
    doc.text(
      `Documento generado el ${new Date(selectedRequest.fechaCreacion).toLocaleDateString("es-ES")}`,
      margin,
      pageHeight - 20,
    )

    doc.save(`${selectedRequest.numero || "documento"}.pdf`)
  }



  const handleApprove = () => {
    if (!selectedRequest || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "aprobado",
          comentariosValidador: comments,
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry: {
          accion: "aprobado",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: comments || "Documento aprobado por el aprobador - Proceso completado",
        },
      },
    })

    toast.success("Documento aprobado", {
      description: "El proceso ha sido completado exitosamente",
    })
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
          comentariosValidador: comments,
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
          detalles: comments || "Documento rechazado por el aprobador",
        },
      },
    })

    toast.error("Documento rechazado", {
      description: "El documento ha sido rechazado",
    })
    resetForm()
  }

  const handleSave = () => {
    if (!selectedRequest || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          comentariosValidador: comments,
        },
      },
    })

    toast.success("Cambios guardados")
  }

  const handleDelegate = () => {
    if (!selectedRequest || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "enviado_aprobacion", 
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
          detalles: "Tarea delegada - devuelta a solicitudes pendientes",
        },
      },
    })

    toast.success("Tarea delegada", {
      description: "La tarea ha sido devuelta a solicitudes pendientes",
    })
    resetForm()
  }

  const resetForm = () => {
    setSelectedRequest(null)
    setComments("")
  }

  const getComments = (request: any) => {
    const comments = []

    if (request.comentariosRevisor) {
      comments.push({
        type: "revisor",
        author: "Sidny Paredes",
        content: request.comentariosRevisor,
        timestamp: request.fechaActualizacion,
      })
    }

    if (request.historial) {
      const validationEntries = request.historial.filter((h: any) => h.accion === "validacion_aprobada" && h.detalles)
      validationEntries.forEach((entry: any) => {
        comments.push({
          type: "validador",
          author: entry.usuario,
          content: entry.detalles,
          timestamp: entry.fecha,
        })
      })
    }

    return comments
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Tareas Pendientes</h1>

      <RequestsTable
        data={pendingTasks}
        showActions={true}
        isHistorial={false}
        customActions={(request) => (
          <Button
            size="sm"
            className="bg-[#00363B] hover:bg-[#00363B]/90 text-sm"
            onClick={() => setSelectedRequest(request)}
          >
            Revisar para Aprobación
          </Button>
        )}
        onReview={() => null}
      />

      {selectedRequest && (
        <Drawer open={!!selectedRequest} onOpenChange={resetForm}>
          <DrawerContent className="fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none p-0 bg-white z-50 flex flex-col">
            <div className="flex flex-col flex-1 min-h-0">
              <DrawerHeader className="border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
                <div className="flex items-center">
                  <DrawerTitle className="text-xl font-semibold text-gray-900">
                    {selectedRequest && `Aprobación Final: ${getTypeLabel(selectedRequest.tipo).toUpperCase()}`}
                  </DrawerTitle>
                </div>
                {selectedRequest && (
                  <div className="mt-3">
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#00363B] text-white">
                      <span className="opacity-90">Documento:</span>
                      <span className="ml-2 font-semibold">{selectedRequest.numero}</span>
                    </div>
                    <div className="mt-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Solo Lectura - Aprobación Final
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
                        value="proceso"
                        className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Proceso</span>
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

                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center space-x-2 mb-4">
                          <MessageSquare className="h-5 w-5 text-[#00363B]" />
                          <Label className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                            Comentarios de Aprobación
                          </Label>
                        </div>
                        <Textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Agregar comentarios sobre la aprobación final..."
                          rows={4}
                          className="bg-gray-50 border-gray-200 focus:border-[#00363B] focus:ring-[#00363B]"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="proceso" className="space-y-6 mt-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        {/* Validadores si existen */}
                        {selectedRequest.validadores && selectedRequest.validadores.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-4">
                              <Users className="h-5 w-5 text-[#00363B]" />
                              <h3 className="text-lg font-semibold text-gray-800">Validadores que Participaron</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedRequest.validadores.map((validatorId: string) => {
                                const validator = validatorId === "4" ? "Erwin del Aguila" : "Ivan Sanchez"
                                return (
                                  <div key={validatorId} className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <p className="font-medium text-green-900">{validator}</p>
                                    <p className="text-sm text-green-700">Validador Técnico</p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center space-x-2 mb-4">
                            <MessageSquare className="h-5 w-5 text-[#00363B]" />
                            <h3 className="text-lg font-semibold text-gray-800">Comentarios del Proceso</h3>
                          </div>

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
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(comment.timestamp).toLocaleDateString("es-ES")}</span>
                                </div>
                              </div>
                              <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                            </div>
                          ))}

                          {getComments(selectedRequest).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p>No hay comentarios del proceso</p>
                            </div>
                          )}
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
                      Rechazar
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 px-6 text-white">
                      Guardar
                    </Button>
                    <Button onClick={handleApprove} className="bg-[#00363B] hover:bg-[#00363B]/90 px-6 text-white">
                      Aprobar Final
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
