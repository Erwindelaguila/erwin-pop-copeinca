"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAppContext, getTypeLabel } from "@/lib/store"
import { RequestsTable } from "@/components/requests-table"
import { validators } from "@/lib/validators"
import { FileText, Users, MessageSquare, ExternalLink } from "lucide-react"

export default function RevisorTareaPage() {
  const { state, dispatch } = useAppContext()
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [comments, setComments] = useState("")
  const [selectedValidators, setSelectedValidators] = useState<string[]>([])

  // Documentos en tareas del revisor
  const documentTasks = state.requests.filter((req) => req.status === "en_validacion" && !req.validadores?.length)

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

  const generatePDFBlob = (document: any) => {
    // Crear contenido HTML para PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${document.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #00363B; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #00363B; margin-bottom: 10px; }
            .subtitle { font-size: 18px; color: #666; }
            .section { margin: 30px 0; }
            .section-title { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #00363B; margin-bottom: 15px; border-left: 4px solid #00363B; padding-left: 15px; }
            .content { color: #333; text-align: justify; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${document.numero}</div>
            <div class="subtitle">${getTypeLabel(document.tipo).toUpperCase()}</div>
          </div>
          
          <div class="section">
            <div class="section-title">OBJETIVO</div>
            <div class="content">${document.objetivo || "No especificado"}</div>
          </div>
          
          <div class="section">
            <div class="section-title">ALCANCE</div>
            <div class="content">${document.alcance || "No especificado"}</div>
          </div>
          
          <div class="section">
            <div class="section-title">DESARROLLO</div>
            <div class="content">${document.desarrollo || "No especificado"}</div>
          </div>
          
          <div class="footer">
            <p>Documento generado el ${new Date(document.fechaCreacion).toLocaleDateString("es-ES")}</p>
            <p>Última actualización: ${new Date(document.fechaActualizacion).toLocaleDateString("es-ES")}</p>
          </div>
        </body>
      </html>
    `

    return new Blob([htmlContent], { type: "text/html" })
  }

  const handleViewPDF = () => {
    if (!selectedRequest) return

    // Crear blob y abrir en visor nativo del browser
    const blob = generatePDFBlob(selectedRequest)
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
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

    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: selectedRequest.id,
        updates: {
          comentariosRevisor: comments,
        },
      },
    })

    toast.success("Cambios guardados. Los comentarios han sido guardados")
  }

  const handleApprove = () => {
    if (!selectedRequest || !state.user) return

    if (selectedValidators.length === 0) {
      // Sin validadores - va directo al aprobador
      dispatch({
        type: "UPDATE_REQUEST",
        payload: {
          id: selectedRequest.id,
          updates: {
            status: "validacion_completada",
            comentariosRevisor: comments,
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
            detalles: "Documento aprobado sin validadores - enviado al aprobador",
          },
        },
      })

      toast.success("Documento aprobado. Documento enviado directamente al aprobador")
    } else {
      // Con validadores - enviar a todos los seleccionados
      dispatch({
        type: "UPDATE_REQUEST",
        payload: {
          id: selectedRequest.id,
          updates: {
            status: "pendiente",
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
        onReview={(request) => setSelectedRequest(request)}
        showActions={true}
        isHistorial={false}
      />

      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <FileText className="h-6 w-6 mr-2 text-[#00363B]" />
                Revisión de Documento: {getTypeLabel(selectedRequest.tipo).toUpperCase()}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#00363B] to-[#004d54] text-white p-4 rounded-lg">
                <p className="text-lg font-semibold">
                  <span className="opacity-90">Documento:</span> {selectedRequest.numero}
                </p>
              </div>

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
                        <p className="text-gray-700 leading-relaxed">{selectedRequest.objetivo || "No especificado"}</p>
                      </div>

                      <div className="border-l-4 border-[#00363B] pl-4">
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">ALCANCE</h4>
                        <p className="text-gray-700 leading-relaxed">{selectedRequest.alcance || "No especificado"}</p>
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
                      <Label className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Comentarios</Label>
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
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">Seleccionar Validador:</Label>
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
                                    <th className="text-left py-3 px-4 text-sm font-medium">Nombre del Validador</th>
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
                                        <td className="py-3 px-4 font-medium">{validator?.name}</td>
                                        <td className="py-3 px-4 text-gray-600">Validador</td>
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
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={resetForm} className="px-6 bg-transparent">
                  Cancelar
                </Button>
                <div className="flex space-x-3">
                  <Button onClick={handleReject} variant="destructive" className="px-6">
                    Rechazar
                  </Button>
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 px-6">
                    Guardar
                  </Button>
                  <Button onClick={handleApprove} className="bg-[#00363B] hover:bg-[#00363B]/90 px-6">
                    Aprobar
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
