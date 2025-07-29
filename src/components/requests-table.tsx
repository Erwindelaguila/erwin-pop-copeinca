"use client"

import { useState } from "react"
import { Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DocumentRequest } from "@/lib/types"
import { getStatusLabel, getTypeLabel } from "@/lib/store"

interface RequestsTableProps {
  data: DocumentRequest[]
  onReview?: (request: DocumentRequest) => void
  showActions?: boolean
  isHistorial?: boolean
  customActions?: (request: DocumentRequest) => React.ReactNode
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50]

export function RequestsTable({ data, onReview, showActions = true, isHistorial = false, customActions }: RequestsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const filteredData = data.filter(
    (item) =>
      item.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTypeLabel(item.tipo).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "en_revision":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "en_desarrollo":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "documento_enviado":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "en_validacion":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "validacion_completada":
        return "bg-cyan-100 text-cyan-800 border-cyan-200"
      case "aprobado":
        return "bg-green-100 text-green-800 border-green-200"
      case "rechazado":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getButtonText = (item: DocumentRequest) => {
    // Si el documento está en pendiente y viene de validación, mostrar 'Aprobar'
    if (item.status === "pendiente" && Array.isArray(item.historial) && item.historial.some((h: any) => h.accion === "validacion_aprobada")) {
      return "Aprobar"
    }
    // Si está en validación y tiene validadores, mostrar Aprobar
    if (item.status === "en_validacion" && item.validadores?.length) {
      return "Aprobar"
    }
    switch (item.status) {
      case "en_revision":
        return "Validar Tipo"
      case "documento_enviado":
        return "Vista Previa"
      case "en_desarrollo":
        return "Crear Documento"
      case "en_validacion":
        return "Revisar Documento"
      case "validacion_completada":
        return "Aprobar Final"
      case "pendiente":
        // Si viene de validación, mostrar Aprobar
        if (Array.isArray(item.historial) && item.historial.some((h: any) => h.accion === "validacion_aprobada")) {
          return "Aprobar"
        }
        // Si viene de cambio de tipo, mostrar Aprobar
        if (item.tipoOriginal) {
          return "Aprobar"
        }
        // Si viene de aprobado, mostrar Aprobar
        if (Array.isArray(item.historial) && item.historial.some((h: any) => h.accion === "aprobado")) {
          return "Aprobar"
        }
        return "Revisar"
      default:
        return "Revisar"
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex items-center justify-end mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar solicitud..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#00363B] text-white">
              <tr>
                <th className="text-left py-4 px-6 font-medium">N° SOLICITUD</th>
                <th className="text-left py-4 px-6 font-medium">TIPO DE DOCUMENTO</th>
                <th className="text-left py-4 px-6 font-medium">FECHA DE CREACIÓN</th>
                <th className="text-left py-4 px-6 font-medium">ÚLTIMA ACTUALIZACIÓN</th>
                <th className="text-left py-4 px-6 font-medium">ESTADO</th>
                {showActions && !isHistorial && <th className="text-left py-4 px-6 font-medium">ACCIONES</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <tr key={item.id} className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <td className="py-4 px-6 font-mono text-sm">{item.numero}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      {getTypeLabel(item.tipo)}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {new Date(item.fechaCreacion).toLocaleDateString("es-ES")}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {new Date(item.fechaActualizacion).toLocaleDateString("es-ES")}
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={getStatusColor(item.status)}>{getStatusLabel(item.status)}</Badge>
                  </td>
                  {showActions && !isHistorial && (
                    <td className="py-4 px-6">
                      {customActions && customActions(item) !== undefined && customActions(item) !== null
                        ? customActions(item)
                        : onReview && (
                            <Button size="sm" onClick={() => onReview(item)} className="bg-[#00363B] hover:bg-[#00363B]/90">
                              {getButtonText(item)}
                            </Button>
                          )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">
            Viendo la página: {currentPage} con {paginatedData.length} de {filteredData.length} solicitudes.
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Tam. pág:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-500">
                {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
