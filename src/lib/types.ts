export type UserRole = "elaborador" | "revisor" | "aprobador" | "validador"

export type DocumentStatus =
  | "pendiente"
  | "en_revision"
  | "aprobado"
  | "rechazado"
  | "en_desarrollo"
  | "documento_enviado"
  | "en_validacion"
  | "validacion_completada"

export type DocumentType = "procedimiento" | "instructivo" | "manual" | "politica" | "formato" | "norma"

export type ActionType =
  | "solicitud_creada"
  | "enviado_revision"
  | "aprobado"
  | "rechazado"
  | "cambio_tipo"
  | "cambio_aceptado"
  | "documento_creado"
  | "documento_enviado"
  | "enviado_validacion"
  | "validacion_aprobada"

export interface User {
  id: string
  name: string
  role: UserRole
}

export interface Validator {
  id: string
  name: string
  selected?: boolean
}

export interface DocumentRequest {
  id: string
  numero: string
  tipo: DocumentType
  tipoOriginal?: DocumentType
  elaboradorId: string
  elaboradorName: string
  status: DocumentStatus
  fechaCreacion: string
  fechaActualizacion: string
  comentarios?: string
  historial: HistoryEntry[]
  // Campos del documento
  objetivo?: string
  alcance?: string
  desarrollo?: string
  // Validadores asignados
  validadores?: string[]
  // Comentarios del revisor
  comentariosRevisor?: string
}

export interface HistoryEntry {
  id: string
  accion: ActionType
  usuario: string
  fecha: string
  detalles?: string
  tipoAnterior?: DocumentType
  tipoNuevo?: DocumentType
}

export interface AppState {
  user: User | null
  requests: DocumentRequest[]
}

export type AppAction =
  | { type: "SET_USER"; payload: User | null }
  | {
      type: "CREATE_REQUEST"
      payload: Omit<DocumentRequest, "id" | "numero" | "fechaCreacion" | "fechaActualizacion" | "historial">
    }
  | { type: "UPDATE_REQUEST"; payload: { id: string; updates: Partial<DocumentRequest> } }
  | { type: "ADD_HISTORY"; payload: { requestId: string; entry: Omit<HistoryEntry, "id"> } }
  | { type: "LOAD_STATE"; payload: AppState }
