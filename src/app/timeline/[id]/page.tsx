"use client"
import type { DocumentRequest } from "../../../lib/types"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { ArrowLeft, FileText, User, CheckCircle, Clock, Download, Edit, Eye, Users, ThumbsUp } from "lucide-react"
import { useAppContext, getTypeLabel, getStatusLabel, PROFESSIONAL_USERS } from "../../../lib/store"
import jsPDF from "jspdf"

export default function TimelinePage() {
  const router = useRouter()
  const params = useParams()
  const { state } = useAppContext()
  const [document, setDocument] = useState<DocumentRequest | null>(null)

  useEffect(() => {
    if (params.id) {
      const foundDoc = state.requests.find((req: DocumentRequest) => req.id === params.id)
      setDocument(foundDoc || null)
    }
  }, [params.id, state.requests])

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Documento no encontrado</h2>
          <p className="text-gray-600 mb-4">El documento que buscas no existe o no tienes permisos para verlo.</p>
          <Button onClick={() => router.back()} className="bg-[#00363B] hover:bg-[#00363B]/90">
            Volver
          </Button>
        </div>
      </div>
    )
  }


  const getTimelineStages = () => {
    const historial = document.historial || []
    const status = document.status


    const stages = [
      {
        id: "elaboracion",
        title: "Elaboración",
        description: "Solicitud creada",
        icon: Edit,
        user: document.elaboradorName,
        role: "Elaborador",
      },
      {
        id: "revision",
        title: "Revisión",
        description: "Validación de tipo",
        icon: Eye,
        user: PROFESSIONAL_USERS.revisor.name,
        role: "Revisor",
      },
      {
        id: "desarrollo",
        title: "Desarrollo",
        description: "Creación del documento",
        icon: FileText,
        user: document.elaboradorName,
        role: "Elaborador",
      },
      {
        id: "validacion",
        title: "Validación",
        description: "Revisión técnica",
        icon: Users,
        user: "Validadores",
        role: "Validador",
      },
      {
        id: "aprobacion",
        title: "Aprobación",
        description: "Aprobación final",
        icon: ThumbsUp,
        user: PROFESSIONAL_USERS.aprobador.name,
        role: "Aprobador",
      },
    ]

   
    const stageStates = {
      elaboracion: "completed", 
      revision: "pending",
      desarrollo: "pending",
      validacion: "pending",
      aprobacion: "pending",
    }

  
    


    const hasRevisionActions = historial.some(
      (h: { accion: string }) => h.accion === "aprobado" || h.accion === "cambio_tipo" || h.accion === "enviado_revision",
    )
    if (hasRevisionActions || status !== "en_revision") {
      stageStates.revision = "completed"
    } else if (status === "en_revision") {
      stageStates.revision = "current"
    }

    const hasDocumentSent = historial.some((h: { accion: string }) => h.accion === "documento_enviado")
    const isInDevelopment = status === "en_desarrollo"
    if (hasDocumentSent) {
      stageStates.desarrollo = "completed"
    } else if (isInDevelopment) {
      stageStates.desarrollo = "current"
    }

    const hasValidation = historial.some(
      (h: { accion: string }) => h.accion === "validacion_aprobada" || h.accion === "enviado_validacion",
    )
    const isInValidation = status === "en_validacion" || (status === "pendiente" && document.validadores)
    if (hasValidation || status === "enviado_aprobacion") {
      stageStates.validacion = "completed"
    } else if (isInValidation) {
      stageStates.validacion = "current"
    }

    const hasAprobadorApproval = historial.some(
      (h: { accion: string; usuario?: string }) => h.accion === "aprobado" && h.usuario === PROFESSIONAL_USERS.aprobador.name,
    )
    if (status === "enviado_aprobacion") {
      stageStates.aprobacion = "current"
    } else if (status === "aprobado" || hasAprobadorApproval) {
      stageStates.aprobacion = "completed"
    } else if (status === "rechazado") {
      stageStates.aprobacion = "rejected"
    }

    const hasValidators = document.validadores && document.validadores.length > 0
    let filteredStages = stages
    if (!hasValidators && !hasValidation) {
      filteredStages = stages.filter((stage) => stage.id !== "validacion")

      if (stageStates.desarrollo === "completed" && stageStates.validacion === "pending") {
        if (status === "enviado_aprobacion") {
          stageStates.aprobacion = "current"
        } else if (status === "aprobado" || hasAprobadorApproval) {
          stageStates.aprobacion = "completed"
        }
      }
    }

    return { stages: filteredStages, states: stageStates }
  }

  const { stages, states } = getTimelineStages()

  const getStageIcon = (stage: string, IconComponent: React.ElementType) => {
    const iconProps = { className: "h-5 w-5" }
    switch (stage) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-white" />
      case "current":
        return <Clock className="h-5 w-5 text-white animate-pulse" />
      default:
        return <IconComponent {...iconProps} className="h-5 w-5 text-white opacity-60" />
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "completed":
        return "bg-green-600 shadow-lg"
      case "current":
        return "bg-blue-600 shadow-lg animate-pulse"
      case "rejected":
        return "bg-red-600 shadow-lg"
      default:
        return "bg-gray-400"
    }
  }

  const getConnectorColor = (prevStage: string, nextStage: string) => {
    if (prevStage === "completed") {
      return nextStage === "completed" ? "bg-green-600" : "bg-gradient-to-r from-green-600 to-gray-300"
    }
    return "bg-gray-300"
  }

  const getStageDate = (stageId: string) => {
    const historial = document.historial || []

    switch (stageId) {
      case "elaboracion":
        return document.fechaCreacion
      case "revision": {
        const revisionEntry = historial.find((h: { accion: string }) => h.accion === "aprobado" || h.accion === "cambio_tipo")
        return revisionEntry?.fecha
      }
      case "desarrollo": {
        const desarrolloEntry = historial.find((h: { accion: string }) => h.accion === "documento_enviado")
        return desarrolloEntry?.fecha
      }
      case "validacion": {
        const validacionEntry = historial.find((h: { accion: string }) => h.accion === "validacion_aprobada")
        return validacionEntry?.fecha
      }
      case "aprobacion": {
        const aprobacionEntry = historial.find(
          (h: { accion: string; usuario?: string }) => h.accion === "aprobado" && h.usuario === PROFESSIONAL_USERS.aprobador.name,
        )
        return aprobacionEntry?.fecha
      }
      default:
        return null
    }
  }

  const handleViewPDF = () => {
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
    doc.text(`Documento: ${document.numero}`, margin, y)
    y += 10

    doc.setFontSize(14)
    doc.setTextColor("#666666")
    doc.text(getTypeLabel(document.tipo).toUpperCase(), margin, y)
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

    printSection("OBJETIVO", document.objetivo || "")
    printSection("ALCANCE", document.alcance || "")
    printSection("DESARROLLO", document.desarrollo || "")

    doc.setFontSize(10)
    doc.setTextColor("#666666")
    doc.text(
      `Documento generado el ${new Date(document.fechaCreacion).toLocaleDateString("es-ES")}`,
      margin,
      pageHeight - 20,
    )

    doc.save(`${document.numero || "documento"}.pdf`)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-[#00363B]" />
                <h1 className="text-xl font-semibold text-gray-900">Seguimiento del Proceso</h1>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
         
          <Card className="border-l-4 border-l-[#00363B]">
            <CardHeader className="bg-[#00363B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">{document.numero}</CardTitle>
                  <p className="text-white/90 mt-1">{getTypeLabel(document.tipo)}</p>
                </div>
                <Badge className="bg-white/20 text-white border-white/30">{getStatusLabel(document.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Elaborador:</span>
                  <span className="font-medium">{document.elaboradorName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Creado:</span>
                  <span className="font-medium">{new Date(document.fechaCreacion).toLocaleDateString("es-ES")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Actualizado:</span>
                  <span className="font-medium">
                    {new Date(document.fechaActualizacion).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

       
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Progreso del Proceso</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
           
              <div className="relative">
                <div className="flex items-start justify-between mb-12">
                  {stages.map((stage) => {
                    const stageState = states[stage.id as keyof typeof states]
                    const stageDate = getStageDate(stage.id)
                    const IconComponent = stage.icon

                    return (
                      <div key={stage.id} className="flex flex-col items-center relative z-10 flex-1">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center ${getStageColor(stageState)} border-4 border-white`}
                        >
                          {getStageIcon(stageState, IconComponent)}
                        </div>
                        <div className="mt-4 text-center max-w-32">
                          <h3 className="text-sm font-bold text-gray-900 mb-1">{stage.title}</h3>
                          <p className="text-xs text-gray-600 mb-2">{stage.description}</p>
                          <div className="bg-gray-50 rounded-lg p-2 mb-2">
                            <p className="text-xs font-medium text-gray-800">{stage.user}</p>
                            <p className="text-xs text-gray-500">{stage.role}</p>
                          </div>
                          {stageDate && (
                            <p className="text-xs text-gray-500">{new Date(stageDate).toLocaleDateString("es-ES")}</p>
                          )}
                          <div className="mt-2">
                            {stageState === "completed" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Completado
                              </span>
                            )}
                            {stageState === "current" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                En progreso
                              </span>
                            )}
                            {stageState === "pending" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Pendiente
                              </span>
                            )}
                            {stageState === "rejected" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Rechazado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

        
                <div className="absolute top-8 left-0 right-0 flex items-center justify-between px-8">
                  {stages.slice(0, -1).map((stage, index) => {
                    const currentState = states[stage.id as keyof typeof states]
                    const nextStage = stages[index + 1]
                    const nextState = states[nextStage.id as keyof typeof states]

                    return (
                      <div
                        key={`connector-${index}`}
                        className={`h-2 flex-1 mx-8 rounded-full ${getConnectorColor(currentState, nextState)}`}
                      ></div>
                    )
                  })}
                </div>
              </div>

         
              {document.validadores && document.validadores.length > 0 && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Validadores Asignados
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {document.validadores.map((validatorId: string) => {
                    const validator =
                      validatorId === "4" ? PROFESSIONAL_USERS.validador1 : PROFESSIONAL_USERS.validador2
                    return (
                      <div key={validatorId} className="bg-white rounded-lg p-3 border">
                        <p className="font-medium text-gray-900">{validator.name}</p>
                        <p className="text-sm text-gray-600">Validador Técnico</p>
                      </div>
                    )
                  })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

   
          <Tabs defaultValue="documento" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="documento" className="data-[state=active]:bg-white">
                Contenido del Documento
              </TabsTrigger>
              <TabsTrigger value="comentarios" className="data-[state=active]:bg-white">
                Historial de Comentarios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documento" className="space-y-6 mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="border-l-4 border-[#00363B] pl-4">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">OBJETIVO</h4>
                      <p className="text-gray-700 leading-relaxed">{document.objetivo || "No especificado"}</p>
                    </div>
                    <div className="border-l-4 border-[#00363B] pl-4">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">ALCANCE</h4>
                      <p className="text-gray-700 leading-relaxed">{document.alcance || "No especificado"}</p>
                    </div>
                    <div className="border-l-4 border-[#00363B] pl-4">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">DESARROLLO</h4>
                      <p className="text-gray-700 leading-relaxed">{document.desarrollo || "No especificado"}</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                    <Button onClick={handleViewPDF} className="bg-[#00363B] hover:bg-[#00363B]/90">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comentarios" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Comentarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
           
                    {document.comentariosRevisor && (
                      <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">{PROFESSIONAL_USERS.revisor.name}</span>
                            <span className="text-sm text-blue-700">Revisor</span>
                          </div>
                        </div>
                        <p className="text-blue-800 leading-relaxed">{document.comentariosRevisor}</p>
                      </div>
                    )}

            
                    {document.historial
                      ?.filter((h: { accion: string; detalles?: string }) => h.accion === "validacion_aprobada" && h.detalles)
                      .map((entry: { id: string; usuario: string; fecha: string; detalles?: string }) => (
                        <div key={entry.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-900">{entry.usuario}</span>
                              <span className="text-sm text-green-700">Validador</span>
                            </div>
                            <span className="text-sm text-green-600">
                              {new Date(entry.fecha).toLocaleDateString("es-ES")}
                            </span>
                          </div>
                          <p className="text-green-800 leading-relaxed">{entry.detalles}</p>
                        </div>
                      ))}

                    {!document.comentariosRevisor &&
                      !document.historial?.some((h: { accion: string; detalles?: string }) => h.accion === "validacion_aprobada" && h.detalles) && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No hay comentarios disponibles</p>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
