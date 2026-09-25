export type EstadoOT = 'pendiente' | 'en_produccion' | 'lista_instalar' | 'instalada' | 'cancelada'

export interface OrdenTrabajo {
  id: string
  vidrieria_id: string
  presupuesto_id: string
  numero: number
  estado: EstadoOT
  fecha_creacion: string
  fecha_entrega?: string | null
  observaciones?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string

  // Relaciones opcionales cargadas
  presupuesto?: any
}

export interface PiezaCorte {
  id: string
  ventana_idx: number // Índice o posición en el presupuesto (ej: 1 para Ventana 1)
  ventana_ref: string // ej: "V1 (150×120 cm)"
  perfil_id: string
  perfil_codigo: string
  perfil_nombre: string
  formula_largo: string
  largo_cm: number
  cortado?: boolean // Para checklist de taller
}

export interface BarraCorte {
  numero: number
  largo_barra_cm: number
  piezas: PiezaCorte[]
  espacio_usado_cm: number
  sobrante_cm: number
  aprovechamiento_pct: number
}

export interface ListadoCortesPerfil {
  perfil_id: string
  codigo: string
  nombre: string
  largo_barra_cm: number
  piezas: PiezaCorte[]
  total_piezas: number
  barras: BarraCorte[]
  total_barras: number
  desperdicio_total_cm: number
  desperdicio_pct: number
  metros_lineales_piezas: number
  metros_lineales_barras: number
}

export type CategoriaMaterial = 'perfil' | 'vidrio' | 'accesorio' | 'marco_madera'

export interface MaterialConsolidado {
  categoria: CategoriaMaterial
  id_referencia?: string
  nombre: string
  detalle?: string
  unidad: 'barras' | 'm2' | 'unidades' | 'metros'
  cantidad_total: number
  costo_estimado_unitario?: number
  costo_estimado_total?: number
}

export interface ListadoCortesCompleto {
  perfiles: ListadoCortesPerfil[]
  materiales: MaterialConsolidado[]
}
