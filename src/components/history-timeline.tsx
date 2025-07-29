"use client"

import { Clock, User, FileText, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { HistoryEntry } from "@/lib/types"
import { getActionLabel, getTypeLabel } from "@/lib/store"

interface HistoryTimelineProps {
  history: HistoryEntry[]
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "solicitud_creada":
        return <FileText className="h-4 w-4" />
      case "enviado_revision":
        return <RefreshCw className="h-4 w-4" />
      case "aprobado":
        return <CheckCircle className="h-4 w-4" />
      case "rechazado":
        return <XCircle className="h-4 w-4" />
      case "cambio_tipo":
        return <RefreshCw className="h-4 w-4" />
      case "cambio_aceptado":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "solicitud_creada":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "enviado_revision":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "aprobado":
        return "bg-green-100 text-green-800 border-green-200"
      case "rechazado":
        return "bg-red-100 text-red-800 border-red-200"
      case "cambio_tipo":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "cambio_aceptado":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Historial de Acciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${getActionColor(entry.accion)}`}>{getActionIcon(entry.accion)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <Badge className={getActionColor(entry.accion)}>{getActionLabel(entry.accion)}</Badge>
                  <span className="text-sm text-gray-500">{new Date(entry.fecha).toLocaleString("es-ES")}</span>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-600">
                  <User className="h-3 w-3 mr-1" />
                  {entry.usuario}
                </div>
                {entry.detalles && <p className="mt-1 text-sm text-gray-700">{entry.detalles}</p>}
                {entry.tipoAnterior && entry.tipoNuevo && (
                  <p className="mt-1 text-sm text-gray-700">
                    Cambio de tipo: {getTypeLabel(entry.tipoAnterior)} → {getTypeLabel(entry.tipoNuevo)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
