"use client"

import { useAppContext } from "@/lib/store"
import { RequestsTable } from "@/components/requests-table"

export default function AprobadorTareaPage() {
  const { state } = useAppContext()

  const pendingTasks = state.requests.filter((req) => req.status === "validacion_completada")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Tareas Pendientes</h1>

      <RequestsTable data={pendingTasks} showActions={false} isHistorial={false} />
    </div>
  )
}
