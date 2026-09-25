import type { ResultadoCalculoVentana } from './calculo'

export type EstadoPresupuesto = 'borrador' | 'enviado' | 'aceptado' | 'rechazado'
export type TipoDescuentoPresupuesto = 'porcentaje' | 'monto'

export interface Cliente {
  id: string
  vidrieria_id: string
  nombre: string
  telefono?: string | null
  correo?: string | null
  direccion?: string | null
  created_at?: string
}

export interface PresupuestoVentana {
  id?: string
  presupuesto_id?: string
  vidrieria_id?: string
  posicion: number
  linea_id?: string | null
  tipologia_id?: string | null
  vidrio_id?: string | null
  color_id?: string | null
  marco_madera_id?: string | null
  ancho_vano: number
  alto_vano: number
  cantidad: number
  margen_pct: number
  observacion?: string | null
  costo_materiales: number
  costo_mano_obra: number
  costo_total: number
  precio_neto_unitario: number
  precio_neto_total: number
  calculo_snapshot: ResultadoCalculoVentana
  created_at?: string
}

export interface PresupuestoItemLibre {
  id?: string
  presupuesto_id?: string
  vidrieria_id?: string
  posicion: number
  descripcion: string
  cantidad: number
  precio_unitario_neto: number
  total_neto: number
  created_at?: string
}

export interface Presupuesto {
  id: string
  vidrieria_id: string
  numero: number
  cliente_id?: string | null
  cliente_nombre: string
  cliente_telefono?: string | null
  cliente_correo?: string | null
  cliente_direccion?: string | null
  fecha: string
  validez_dias: number
  observaciones?: string | null
  descuento_tipo: TipoDescuentoPresupuesto
  descuento_valor: number
  subtotal_neto: number
  descuento_neto: number
  neto: number
  iva: number
  total: number
  estado: EstadoPresupuesto
  created_by?: string
  created_at?: string
  updated_at?: string
  // Relaciones
  ventanas?: PresupuestoVentana[]
  items_libres?: PresupuestoItemLibre[]
}

export interface TotalesPresupuestoCalculados {
  subtotal_ventanas: number
  subtotal_items_libres: number
  subtotal_neto: number
  descuento_neto: number
  neto: number
  iva: number
  total: number
}
