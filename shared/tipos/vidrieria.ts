export interface Vidrieria {
  id: string
  nombre: string
  rut: string | null
  direccion: string | null
  telefono: string | null
  correo: string | null
  logo_url: string | null
  margen_defecto: number | null
  merma_defecto: number | null
  mano_obra_fijo_defecto: number | null
  mano_obra_m2_defecto: number | null
  created_at?: string
}
