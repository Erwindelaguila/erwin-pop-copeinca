"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { AppState, AppAction, DocumentRequest, HistoryEntry } from "@/lib/types"

const initialState: AppState = {
  user: null,
  requests: [],
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload }
    case "CREATE_REQUEST": {
      const newRequest: DocumentRequest = {
        ...action.payload,
        id: generateId(),
        numero: generateDocumentNumber(),
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        historial: [
          {
            id: generateId(),
            accion: "solicitud_creada",
            usuario: action.payload.elaboradorName,
            fecha: new Date().toISOString(),
            detalles: "Solicitud creada y enviada al revisor",
          },
        ],
      }
      return { ...state, requests: [...state.requests, newRequest] }
    }
    case "UPDATE_REQUEST": {
      return {
        ...state,
        requests: state.requests.map((req) =>
          req.id === action.payload.id
            ? {
                ...req,
                ...action.payload.updates,
                fechaActualizacion: new Date().toISOString(),
              }
            : req,
        ),
      }
    }
    case "ADD_HISTORY": {
      const historyEntry: HistoryEntry = {
        ...action.payload.entry,
        id: generateId(),
      }
      return {
        ...state,
        requests: state.requests.map((req) =>
          req.id === action.payload.requestId ? { ...req, historial: [...req.historial, historyEntry] } : req,
        ),
      }
    }
    case "LOAD_STATE":
      return action.payload
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    const savedState = localStorage.getItem("copeinca-app-state")
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        dispatch({ type: "LOAD_STATE", payload: parsedState })
      } catch (error) {
        console.error("Error loading state:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("copeinca-app-state", JSON.stringify(state))
  }, [state])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider")
  }
  return context
}

// Utility functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function generateDocumentNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  return `DOC-${timestamp}`
}

export function getStatusLabel(status: string): string {
  const labels = {
    pendiente: "Pendiente",
    en_revision: "En Revisión",
    en_desarrollo: "En Desarrollo",
    documento_enviado: "Documento Enviado",
    en_validacion: "En Validación",
    validacion_completada: "Validación Completada",
    aprobado: "Aprobado",
    rechazado: "Rechazado",
    tarea_creada: "Tarea Creada",
  }
  return labels[status as keyof typeof labels] || status
}

export function getTypeLabel(type: string): string {
  const labels = {
    procedimiento: "Procedimiento",
    instructivo: "Instructivo",
    manual: "Manual",
    politica: "Política",
    formato: "Formato",
    norma: "Norma",
  }
  return labels[type as keyof typeof labels] || type
}

export function getActionLabel(action: string): string {
  const labels = {
    solicitud_creada: "Solicitud Creada",
    enviado_revision: "Enviado a Revisión",
    aprobado: "Aprobado",
    rechazado: "Rechazado",
    cambio_tipo: "Cambio de Tipo",
    cambio_aceptado: "Cambio Aceptado",
    documento_creado: "Documento Creado",
    documento_enviado: "Documento Enviado",
    enviado_validacion: "Enviado a Validación",
    validacion_aprobada: "Validación Aprobada",
    tarea_creada: "Tarea Creada",
    documento_verificado: "Documento Verificado",
  }
  return labels[action as keyof typeof labels] || action
}
