export interface Usuario {
  id: string
  auth_uid: string
  vidrieria_id: string
  nombre: string | null
  activo: boolean
  created_at?: string
  // Datos adicionales para UI
  correo?: string | null
}
