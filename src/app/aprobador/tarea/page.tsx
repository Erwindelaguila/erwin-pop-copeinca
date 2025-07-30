"use client"

import { useAppContext } from "@/lib/store"
import { RequestsTable } from "@/components/requests-table"
import { Button } from "@/components/ui/button"
import type { DocumentRequest } from "@/lib/types"

export default function AprobadorTareaPage() {
  const { state } = useAppContext()

  const pendingTasks = state.requests.filter(
    (req) => req.status === "validacion_completada" || req.status === "pendiente"
  )

  // Acciones de aprobar/rechazar para el aprobador
  const { dispatch } = useAppContext();
  const handleApprove = (request: DocumentRequest) => {
    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: request.id,
        updates: { status: "aprobado" },
      },
    });
    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: request.id,
        entry: {
          accion: "aprobado",
          usuario: state.user?.name || "Aprobador",
          fecha: new Date().toISOString(),
          detalles: "Documento aprobado por el aprobador",
        },
      },
    });
  };
  const handleReject = (request: DocumentRequest) => {
    dispatch({
      type: "UPDATE_REQUEST",
      payload: {
        id: request.id,
        updates: { status: "rechazado" },
      },
    });
    dispatch({
      type: "ADD_HISTORY",
      payload: {
        requestId: request.id,
        entry: {
          accion: "rechazado",
          usuario: state.user?.name || "Aprobador",
          fecha: new Date().toISOString(),
          detalles: "Documento rechazado por el aprobador",
        },
      },
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Tareas Pendientes</h1>
      <RequestsTable
        data={pendingTasks}
        showActions={true}
        isHistorial={false}
        customActions={() => null}
        onReview={(request) => null}
      />
      {/* Acciones fijas para aprobar/rechazar */}
      <div className="hidden">Aprobar y Rechazar solo en drawer/modal si lo deseas</div>
    </div>
  );
}
