"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAppContext, getTypeLabel } from "@/lib/store"
import { RequestsTable } from "@/components/requests-table"
import { FileText, MessageSquare, ExternalLink, CheckCircle, XCircle } from "lucide-react"

export default function ValidadorTareaPage() {
  const { state, dispatch } = useAppContext()
  // toast de sonner
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [comments, setComments] = useState("")

  // Documentos asignados específicamente adame  este validador en sus tareas
  const currentUserId = state.user?.id
  const validationTasks = state.requests.filter(
    (req) =>
      req.status === "en_validacion" &&
      req.validadores?.includes(currentUserId || "") &&
      !req.historial.some((h) => h.usuario === state.user?.name && h.accion === "validacion_aprobada"),
  )

  const generatePDFBlob = (document: any) => {
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
          status: "pendiente", // Vuelve al elaborador como vista previa
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

    // Verificar si todos los validadores han aprobado
    const allValidators = selectedRequest.validadores || []
    const approvedValidators = selectedRequest.historial
      .filter((h: { accion: string }) => h.accion === "validacion_aprobada")
      .map((h: { usuario: string }) => h.usuario)

    // Agregar el validador actual
    approvedValidators.push(state.user.name)

    interface HistorialEntry {
      accion: string
      usuario: string
      fecha: string
      detalles: string
    }

    interface Request {
      id: string
      status: string
      validadores?: string[]
      historial: HistorialEntry[]
      numero?: string
      tipo?: string
      objetivo?: string
      alcance?: string
      desarrollo?: string
      fechaCreacion?: string
      fechaActualizacion?: string
      comentariosRevisor?: string
    }

    const allApproved: boolean = (allValidators as string[]).every((validatorId: string) => {
      const validatorName: string = validatorId === "1" ? "Erwin del Aguila" : "Ivan Sanchez"
      return approvedValidators.includes(validatorName)
    })

    if (allApproved) {
      // Todos han aprobado - vuelve al elaborador como vista previa
      dispatch({
        type: "UPDATE_REQUEST",
        payload: {
          id: selectedRequest.id,
          updates: {
            status: "pendiente", // Vista previa al elaborador
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
            detalles: "Validación completada por todos los validadores - enviado al elaborador para vista previa",
          },
        },
      })

      toast.success("Validación completada. Todos los validadores han aprobado. Documento enviado al elaborador como vista previa")
    } else {
      // Aún faltan validadores
      toast.success("Validación registrada. Su validación ha sido registrada. Esperando otros validadores")
    }

    resetForm()
  }

  const resetForm = () => {
    setSelectedRequest(null)
    setComments("")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Tareas de Validación</h1>

      <RequestsTable
        data={validationTasks}
        onReview={(request) => setSelectedRequest(request)}
        showActions={true}
        isHistorial={false}
      />

      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center text-xl font-semibold">
                <FileText className="h-6 w-6 mr-2 text-[#00363B]" />
                Validación de Documento: {getTypeLabel(selectedRequest.tipo).toUpperCase()}
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

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={resetForm} className="px-6 bg-transparent">
                  Cancelar
                </Button>
                <div className="flex space-x-3">
                  <Button onClick={handleReject} variant="destructive" className="px-6">
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button onClick={handleApprove} className="bg-[#00363B] hover:bg-[#00363B]/90 px-6">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprobar Validación
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
