"use client"

import { useState } from "react"
import { useAppContext } from "@/lib/store"
import { RequestsTable } from "@/components/requests-table"
import { StatusTabs } from "@/components/status-tabs"

export default function AprobadorPage() {
  const { state } = useAppContext()
  const [activeTab, setActiveTab] = useState<"historial" | "pendiente">("historial")

  // Documentos que llegan al aprobador desde validación
  const allRequests = state.requests.filter(
    (req) =>
      req.status === "validacion_completada" ||
      (req.historial && req.historial.some((h) => h.accion === "validacion_aprobada")),
  )

  const historialRequests = allRequests.filter((req) => req.status !== "validacion_completada")
  const pendienteRequests = allRequests.filter((req) => req.status === "validacion_completada")

  const displayedRequests = activeTab === "historial" ? historialRequests : pendienteRequests

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Solicitudes</h1>

      <StatusTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historialCount={historialRequests.length}
        pendienteCount={pendienteRequests.length}
      />

      <RequestsTable
        data={displayedRequests}
        onReview={activeTab === "pendiente" ? (request) => console.log("Revisar:", request) : undefined}
        showActions={true}
        isHistorial={activeTab === "historial"}
      />
    </div>
  )
}
