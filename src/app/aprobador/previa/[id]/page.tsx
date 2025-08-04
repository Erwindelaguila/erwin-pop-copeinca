"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "../../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { ArrowLeft, FileText, Calendar, User, Eye, Users, MessageSquare } from "lucide-react"
import { toast } from "sonner"

import type { DocumentRequest } from "../../../../lib/types"
import { useAppContext, getTypeLabel, getStatusLabel, getActionLabel, PROFESSIONAL_USERS } from "../../../../lib/store"

export default function AprobadorPreviaPage() {
  const router = useRouter()
  const params = useParams()
  const { state, dispatch } = useAppContext()
  const [document, setDocument] = useState<DocumentRequest | null>(null)

  useEffect(() => {
    if (params.id) {
      const foundDoc = state.requests.find((req: DocumentRequest) => req.id === params.id)
      setDocument(foundDoc || null)
    }
  }, [params.id, state.requests])

  const handleReservar = () => {
    if (!document || !state.user) return

    // Mover documento a tareas del aprobador
    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: document.id,
        updates: {
          status: "en_aprobacion", // ← NUEVO STATUS para tareas del aprobador
        },
      },
    })

    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: document.id,
        entry: {
          accion: "enviado_revision",
          usuario: state.user.name,
          fecha: new Date().toISOString(),
          detalles: "Documento reservado para aprobación final",
        },
      },
    })

    toast.success("Documento reservado", {
      description: "El documento ha been enviado a sus tareas para aprobación final",
    })
    router.push("/aprobador")
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Documento no encontrado</h2>
          <p className="text-gray-600 mb-4">El documento que buscas no existe o no tienes permisos para verlo.</p>
          <Button onClick={() => router.push("/aprobador")} className="bg-[#1e40af] hover:bg-[#1a237e]">
            Volver a Solicitudes
          </Button>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Documento no encontrado</h2>
          <p className="text-gray-600 mb-4">El documento que buscas no existe o no tienes permisos para verlo.</p>
          <Button onClick={() => router.push("/aprobador")} className="bg-[#00363B] hover:bg-[#00363B]/90">
            Volver a Solicitudes
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enviado_aprobacion": 
        return "bg-cyan-100 text-cyan-800 border-cyan-200"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getComments = () => {
    const comments = []

   
    if (document.comentariosRevisor) {
      comments.push({
        type: "revisor",
        author: PROFESSIONAL_USERS.revisor.name,
        content: document.comentariosRevisor,
        timestamp: document.fechaActualizacion,
      })
    }

    // Comentarios de validadores
    if (document.historial) {
      const validationEntries = document.historial.filter((h) => h.accion === "validacion_aprobada" && h.detalles)
      validationEntries.forEach((entry) => {
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
    <div className="min-h-screen bg-gray-50">
 
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/aprobador")}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-[#1e40af]" />
                <h1 className="text-xl font-semibold text-gray-900">Vista Previa - Aprobación Final</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={handleReservar} className="bg-[#1e40af] hover:bg-[#1a237e] text-white">
                Reservar
              </Button>
            </div>
          </div>
        </div>
      </div>

     
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
    
          <Card className="border-l-4 border-l-[#1e40af]">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#1a237e] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">{document.numero}</CardTitle>
                  <p className="text-white/90 mt-1">{getTypeLabel(document.tipo)}</p>
                </div>
                <Badge className={getStatusColor(document.status)}>{getStatusLabel(document.status)}</Badge>
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
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Creado:</span>
                  <span className="font-medium">{new Date(document.fechaCreacion).toLocaleDateString("es-ES")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Actualizado:</span>
                  <span className="font-medium">
                    {new Date(document.fechaActualizacion).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

   
          {document.validadores && document.validadores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-[#1e40af]" />
                  Validadores que Participaron
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {document.validadores.map((validatorId: string) => {
                    const validator =
                      validatorId === "4" ? PROFESSIONAL_USERS.validador1 : PROFESSIONAL_USERS.validador2
                    return (
                      <div key={validatorId} className="bg-[#e3e7fa] rounded-lg p-4 border border-[#bfc8e6]">
                        <p className="font-medium text-[#1e40af]">{validator.name}</p>
                        <p className="text-sm text-[#1a237e]">Validador Técnico</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

  
          <div className="space-y-6">
 
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <div className="w-1 h-6 bg-[#1e40af] rounded mr-3"></div>
                  OBJETIVO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {document.objetivo || "No especificado"}
                  </p>
                </div>
              </CardContent>
            </Card>


            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <div className="w-1 h-6 bg-[#1e40af] rounded mr-3"></div>
                  ALCANCE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {document.alcance || "No especificado"}
                  </p>
                </div>
              </CardContent>
            </Card>

       
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <div className="w-1 h-6 bg-[#1e40af] rounded mr-3"></div>
                  DESARROLLO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {document.desarrollo || "No especificado"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>


          {getComments().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MessageSquare className="h-5 w-5 mr-2 text-[#1e40af]" />
                  Comentarios del Proceso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getComments().map((comment, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        comment.type === "revisor" ? "bg-blue-50 border-blue-200" : "bg-[#e3e7fa] border-[#bfc8e6]"
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
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-[#1e40af]" />
                Historial del Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {document.historial.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="w-2 h-2 bg-[#1e40af] rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{entry.usuario}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(entry.fecha).toLocaleDateString("es-ES")} -{" "}
                          {new Date(entry.fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">{getActionLabel(entry.accion)}:</span> {entry.detalles}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
