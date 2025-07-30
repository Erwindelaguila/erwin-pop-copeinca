"use client"

import type React from "react"

import { useState } from "react"
import { Search, Eye, History } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import type { DocumentRequest } from "../lib/types"
import { getStatusLabel, getTypeLabel } from "../lib/store"
import { useRouter } from "next/navigation"

interface RequestsTableProps {
  data: DocumentRequest[]
  onReview?: (request: DocumentRequest) => void
  showActions?: boolean
  isHistorial?: boolean
  customActions?: (request: DocumentRequest) => React.ReactNode
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50]

export function RequestsTable({
  data,
  onReview,
  showActions = true,
  isHistorial = false,
  customActions,
}: RequestsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const router = useRouter()

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
        return "bg-amber-50 text-amber-700 border-amber-200 font-medium"
      case "en_revision":
        return "bg-orange-50 text-orange-700 border-orange-200 font-medium"
      case "en_desarrollo":
        return "bg-blue-50 text-blue-700 border-blue-200 font-medium"
      case "documento_enviado":
        return "bg-purple-50 text-purple-700 border-purple-200 font-medium"
      case "en_validacion":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 font-medium"
      case "enviado_aprobacion":
        return "bg-cyan-50 text-cyan-700 border-cyan-200 font-medium"
      case "aprobado":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
      case "rechazado":
        return "bg-red-50 text-red-700 border-red-200 font-medium"
      case "aceptado":
        return "bg-green-50 text-green-700 border-green-200 font-medium"
      case "documento_aceptado":
        return "bg-teal-50 text-teal-700 border-teal-200 font-medium"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 font-medium"
    }
  }

  const getButtonText = (item: DocumentRequest) => {
    switch (item.status) {
      case "en_revision":
        return "Validar Tipo"
      case "documento_enviado":
        return "Visualizar Previa"
      case "en_desarrollo":
        return "Crear Documento"
      case "en_validacion":
        return "Revisar Documento"
      case "enviado_aprobacion":
        return "Aprobar Final"
      default:
        return "Revisar"
    }
  }

  const handleViewTimeline = (request: DocumentRequest) => {
    router.push(`/timeline/${request.id}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6">
        <div className="flex items-center justify-end mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar solicitud..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 focus:border-[#00363B] focus:ring-[#00363B]/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#00363B] to-[#004d54] text-white">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-sm tracking-wide">#</th>
                <th className="text-left py-4 px-6 font-semibold text-sm tracking-wide">N° SOLICITUD</th>
                <th className="text-left py-4 px-6 font-semibold text-sm tracking-wide">TIPO DE DOCUMENTO</th>
                <th className="text-left py-4 px-6 font-semibold text-sm tracking-wide">CREADO POR</th>
                <th className="text-left py-4 px-6 font-semibold text-sm tracking-wide">FECHA DE CREACIÓN</th>
                <th className="text-left py-4 px-6 font-semibold text-sm tracking-wide">ÚLTIMA ACTUALIZACIÓN</th>
                <th className="text-left py-4 px-6 font-semibold text-sm tracking-wide">ESTADO</th>
                {/* Solo mostrar Seguimiento en historial */}
                {isHistorial && (
                  <th className="text-left py-4 px-6 font-semibold text-sm tracking-wide">SEGUIMIENTO</th>
                )}
                {showActions && !isHistorial && (
                  <th className="text-left py-4 px-6 font-semibold text-sm tracking-wide">ACCIONES</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-25"
                  }`}
                >
                  <td className="py-4 px-6 text-sm font-semibold text-gray-900">{startIndex + index + 1}</td>
                  <td className="py-4 px-6 font-mono text-sm font-medium text-[#00363B]">{item.numero}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-[#00363B] rounded-full mr-3"></div>
                      <span className="font-medium text-gray-900 text-sm">{getTypeLabel(item.tipo)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-gray-700">{item.elaboradorName}</td>
                  <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                    {new Date(item.fechaCreacion).toLocaleDateString("es-ES")}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                    {new Date(item.fechaActualizacion).toLocaleDateString("es-ES")}
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={`${getStatusColor(item.status)} px-3 py-1 text-xs`}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </td>
                  {/* Solo mostrar Seguimiento en historial */}
                  {isHistorial && (
                    <td className="py-4 px-6">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewTimeline(item)}
                        className="text-[#00363B] hover:text-white hover:bg-[#00363B] transition-all duration-200 font-medium text-sm"
                        title="Ver seguimiento del proceso"
                      >
                        <History className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </td>
                  )}
                  {showActions && !isHistorial && (
                    <td className="py-4 px-6">
                      {customActions && customActions(item) !== undefined && customActions(item) !== null
                        ? customActions(item)
                        : onReview && (
                            <Button
                              size="sm"
                              onClick={() => onReview(item)}
                              className="bg-[#00363B] hover:bg-[#004d54] text-white font-medium transition-all duration-200 text-sm"
                            >
                              {item.status === "documento_enviado" && <Eye className="h-4 w-4 mr-2" />}
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

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600 font-medium">
            Mostrando {paginatedData.length} de {filteredData.length} solicitudes
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 font-medium">Elementos por página:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-20 border-gray-200">
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
                className="border-gray-200 hover:bg-[#00363B] hover:text-white hover:border-[#00363B] text-sm"
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600 font-medium px-3">
                {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="border-gray-200 hover:bg-[#00363B] hover:text-white hover:border-[#00363B] text-sm"
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
