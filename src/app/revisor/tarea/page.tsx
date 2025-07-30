"use client"

import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "../../../components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Textarea } from "../../../components/ui/textarea"
import { Label } from "../../../components/ui/label"
import { Checkbox } from "../../../components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { toast } from "sonner"
import { useAppContext, getTypeLabel } from "../../../lib/store"
import { RequestsTable } from "../../../components/requests-table"
import { validators } from "../../../lib/validators"
import { FileText, Users, MessageSquare, ExternalLink } from "lucide-react"
import jsPDF from "jspdf"

export default function RevisorTareaPage() {
  const { state, dispatch } = useAppContext()
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [comments, setComments] = useState("")
  const [selectedValidators, setSelectedValidators] = useState<string[]>([])

  // Cuando se selecciona una solicitud, cargar comentarios y validadores existentes
  const handleOpenRequest = (request: any) => {
    setSelectedRequest(request)
    setComments(request.comentariosRevisor || "")
    setSelectedValidators(request.validadores || [])
  }

  // Documentos en tareas del revisor
  const documentTasks = state.requests.filter((req) => req.status === "en_validacion")

  const handleAddValidator = (validatorId: string) => {
    if (validatorId && !selectedValidators.includes(validatorId)) {
      setSelectedValidators((prev) => [...prev, validatorId])
    }
  }

  const handleRemoveValidator = (validatorId: string) => {
    setSelectedValidators((prev) => prev.filter((id) => id !== validatorId))
  }

  const handleValidatorToggle = (validatorId: string, checked: boolean) => {
    if (checked) {
      setSelectedValidators((prev) => [...prev, validatorId])
    } else {
      setSelectedValidators((prev) => prev.filter((id) => id !== validatorId))
    }
  }

  // Generar PDF real usando jsPDF, soportando saltos de página y todas las secciones
  const handleViewPDF = () => {
    if (!selectedRequest) return

    const doc = new jsPDF()
    const margin = 15
    const maxWidth = 180
    const lineHeight = 7
    const pageHeight = doc.internal.pageSize.getHeight()
    let y = margin

    // Helper para salto de página
    const checkAddPage = (linesCount = 1) => {
      if (y + linesCount * lineHeight > pageHeight - 20) {
        doc.addPage()
        y = margin
      }
    }

    // Título principal
    doc.setFontSize(18)
    doc.setTextColor("#00363B")
    doc.text(`Documento: ${selectedRequest.numero}`, margin, y)
    y += 10

    doc.setFontSize(14)
    doc.setTextColor("#666666")
    doc.text(getTypeLabel(selectedRequest.tipo).toUpperCase(), margin, y)
    y += 15

    // Sección genérica con salto de página
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

    // Footer (solo en la última página)
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
          comentariosRevisor: comments,
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
          detalles: comments || "Documento rechazado por el revisor",
        },
      },
    })

    toast.error("Documento rechazado. El documento ha sido enviado de vuelta al elaborador")
    resetForm()
  }

  const handleSave = () => {
    if (!selectedRequest || !state.user) return

    // Actualizar el request en el estado global
    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          comentariosRevisor: comments,
          validadores: selectedValidators,
        },
      },
    })

    // Actualizar el objeto local para reflejar los cambios inmediatamente
    setSelectedRequest((prev: any) =>
      prev ? { ...prev, comentariosRevisor: comments, validadores: selectedValidators } : prev
    )

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: selectedRequest.id,
        entry: {
          accion: "documento_creado",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Cambios guardados en revisión",
        },
      },
    })

    toast.success("Cambios guardados. Los comentarios y validadores han sido guardados")
  }

  const handleApprove = () => {
    if (!selectedRequest || !state.user) return

    if (selectedValidators.length === 0) {
      // Sin validadores - va al elaborador con botones Aprobar/Rechazar directos
      dispatch({
        type: "UPDATE_REQUEST",
        payload: {
          id: selectedRequest.id,
          updates: {
            status: "pendiente", // Va al elaborador
            comentariosRevisor: comments || "",
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
            detalles: "Documento aprobado por el revisor - enviado al elaborador para aceptación final",
          },
        },
      })

      toast.success("Documento aprobado y enviado al elaborador para aceptación final")
    } else {
      // Con validadores - enviar SOLO a validadores, NO al elaborador
      dispatch({
        type: "UPDATE_REQUEST",
        payload: {
          id: selectedRequest.id,
          updates: {
            status: "pendiente", // Va a validadores solamente, NO al elaborador
            comentariosRevisor: comments,
            validadores: selectedValidators,
          },
        },
      })

      const validatorNames = selectedValidators.map((id) => validators.find((v) => v.id === id)?.name).join(", ")

      dispatch({
        type: "ADD_HISTORY",
        payload: {
          requestId: selectedRequest.id,
          entry: {
            accion: "enviado_validacion",
            usuario: state.user.name,
            fecha: new Date().toISOString(),
            detalles: `Documento enviado a validación a: ${validatorNames}`,
          },
        },
      })

      toast.success(`Documento enviado a validación. El documento ha sido enviado a ${validatorNames}`)
    }

    resetForm()
  }

  const handleDelegate = () => {
    if (!selectedRequest || !state.user) return

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          status: "documento_enviado", // Vuelve a pendiente para que aparezca en solicitudes
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
    setSelectedValidators([])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Tareas Pendientes</h1>

      <RequestsTable
        data={documentTasks}
        onReview={handleOpenRequest}
        showActions={true}
        isHistorial={false}
        customActions={(request) => (
          <Button
            size="sm"
            className="bg-[#00363B] hover:bg-[#00363B]/90 text-sm"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenRequest(request)
            }}
          >
            Revisar Documento
          </Button>
        )}
      />

      {selectedRequest && (
        <Drawer open={!!selectedRequest} onOpenChange={resetForm}>
          <DrawerContent className="fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none p-0 bg-white z-50 flex flex-col">
            <div className="flex flex-col flex-1 min-h-0">
              <DrawerHeader className="border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
                <div className="flex items-center">
                  <DrawerTitle className="text-xl font-semibold text-gray-900">
                    {selectedRequest && `Revisión de Documento: ${getTypeLabel(selectedRequest.tipo).toUpperCase()}`}
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
                        value="validadores"
                        className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
                      >
                        <Users className="h-4 w-4" />
                        <span>Validadores</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="documento" className="space-y-6 mt-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="space-y-6">
                          <div className="border-l-4 border-[#00363B] pl-4">
                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">OBJETIVO</h4>
                            <p className="text-gray-700 leading-relaxed">
                              {selectedRequest.objetivo || "No especificado"}
                            </p>
                          </div>
                          <div className="border-l-4 border-[#00363B] pl-4">
                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">ALCANCE</h4>
                            <p className="text-gray-700 leading-relaxed">
                              {selectedRequest.alcance || "No especificado"}
                            </p>
                          </div>
                          <div className="border-l-4 border-[#00363B] pl-4">
                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">DESARROLLO</h4>
                            <p className="text-gray-700 leading-relaxed">
                              {selectedRequest.desarrollo || "No especificado"}
                            </p>
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
                            Comentarios
                          </Label>
                        </div>
                        <Textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Agregar comentarios sobre la revisión..."
                          rows={4}
                          className="bg-gray-50 border-gray-200 focus:border-[#00363B] focus:ring-[#00363B]"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="validadores" className="space-y-6 mt-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="space-y-6">
                          <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-[#00363B]" />
                            <h3 className="text-lg font-semibold text-gray-800">Agregar Validador</h3>
                          </div>

                          <div className="flex-1">
                            <Label className="text-sm font-medium text-gray-600 mb-2 block">
                              Seleccionar Validador:
                            </Label>
                            <Select value="" onValueChange={handleAddValidator}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un validador para agregar" />
                              </SelectTrigger>
                              <SelectContent>
                                {validators
                                  .filter((validator) => !selectedValidators.includes(validator.id))
                                  .map((validator) => (
                                    <SelectItem key={validator.id} value={validator.id}>
                                      {validator.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedValidators.length > 0 && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-3">Validadores Agregados:</h4>
                                <div className="bg-white border rounded-lg">
                                  <table className="w-full">
                                    <thead className="bg-[#00363B] text-white">
                                      <tr>
                                        <th className="text-left py-3 px-4 text-sm font-medium">
                                          Nombre del Validador
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-medium">Rol</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium">Seleccionar</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium">Acciones</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedValidators.map((validatorId) => {
                                        const validator = validators.find((v) => v.id === validatorId)
                                        return (
                                          <tr key={validatorId} className="border-t">
                                            <td className="py-3 px-4 font-medium text-sm">{validator?.name}</td>
                                            <td className="py-3 px-4 text-gray-600 text-sm">Validador</td>
                                            <td className="py-3 px-4 text-center">
                                              <Checkbox
                                                checked={true}
                                                onCheckedChange={(checked) =>
                                                  handleValidatorToggle(validatorId, checked as boolean)
                                                }
                                                className="data-[state=checked]:bg-[#00363B] data-[state=checked]:border-[#00363B]"
                                              />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRemoveValidator(validatorId)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
                                              >
                                                Remover
                                              </Button>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                {/* Add margin-bottom to last content block for better scroll */}
                <div style={{ marginBottom: 128 }}></div>
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
                    <Button
                      onClick={handleDelegate}
                      variant="outline"
                      className="px-6 border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                    >
                      Delegar
                    </Button>
                    <Button onClick={handleReject} variant="destructive" className="px-6">
                      Rechazar
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 px-6 text-white">
                      Guardar
                    </Button>
                    <Button onClick={handleApprove} className="bg-[#00363B] hover:bg-[#00363B]/90 px-6 text-white">
                      Aprobar
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
