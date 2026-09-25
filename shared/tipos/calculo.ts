import type { Linea, Perfil, Vidrio, Color, Accesorio, MarcoMadera, Tipologia, FormulaTipologia, TipoRecargoColor } from './catalogos'

export interface ItemManualVentana {
  id?: string
  descripcion: string
  unidad: string
  cantidad: number
  precio_unitario_neto: number
  stock_item_id?: string
}

export interface AjustePerfilVentana {
  perfil_id: string
  metros_override?: number
  cantidad_piezas_override?: number
}

export interface ParametrosCalculoVentana {
  // Dimensiones exteriores del vano
  ancho_vano: number
  alto_vano: number
  cantidad: number

  // Catálogos seleccionados
  linea: Linea
  tipologia: Tipologia
  formula?: FormulaTipologia | null
  vidrio: Vidrio
  color?: Color | null
  marco_madera?: MarcoMadera | null

  // Catálogos completos para resolver precios y mermas individuales
  perfiles_catalogo?: Perfil[]
  accesorios_catalogo?: Accesorio[]

  // Parámetros por defecto de la vidriería
  merma_vidrieria_defecto?: number | null
  merma_vidrio_defecto?: number | null
  mano_obra_fijo_defecto?: number | null
  mano_obra_m2_defecto?: number | null
  margen_comercial_defecto?: number | null

  // Sobrescrituras para esta ventana
  margen_comercial_override?: number | null

  // Ajustes e ítems manuales
  ajustes_perfiles?: Record<string, AjustePerfilVentana>
  items_manuales?: ItemManualVentana[]
}

export interface DesglosePerfilCalculado {
  perfil_id: string
  codigo: string
  nombre: string
  formula_largo: string
  largo_cm: number
  cantidad_piezas: number
  metros_brutos_unitario: number
  merma_pct: number
  metros_con_merma_unitario: number
  metros_totales: number
  precio_metro: number
  costo_neto: number
  largo_barra_m: number
  barras_estimadas: number
}

export interface DesgloseAccesorioCalculado {
  accesorio_id: string
  nombre: string
  cantidad_unitaria: number
  cantidad_total: number
  precio_unitario: number
  costo_neto: number
}

export interface DesgloseItemManualCalculado {
  descripcion: string
  unidad: string
  cantidad: number
  precio_unitario_neto: number
  costo_neto: number
  stock_item_id?: string
}

export interface ResultadoCalculoVentana {
  valido: boolean
  errores: string[]

  dimensiones: {
    ancho_vano: number
    alto_vano: number
    cantidad: number
    espesor_marco_cm: number
    ancho_util: number
    alto_util: number
    ancho_vidrio_cm: number
    alto_vidrio_cm: number
    m2_vidrio_unitario: number
    m2_vidrio_total: number
  }

  perfiles: DesglosePerfilCalculado[]

  vidrio: {
    vidrio_id: string
    nombre: string
    espesor_mm: number
    m2_unitario: number
    m2_total: number
    precio_m2: number
    merma_pct: number
    costo_neto: number
  }

  color: {
    color_id?: string
    nombre: string
    tipo_recargo: TipoRecargoColor
    valor_recargo: number
    recargo_neto: number
  }

  accesorios: DesgloseAccesorioCalculado[]

  marco_madera?: {
    marco_id: string
    nombre: string
    ancho_pulgadas: number
    espesor_cm: number
    metros_unitario: number
    metros_totales: number
    precio_metro: number
    costo_neto: number
  }

  items_manuales: DesgloseItemManualCalculado[]

  mano_obra: {
    fijo_unitario: number
    m2_unitario: number
    costo_unitario: number
    costo_neto: number
  }

  totales: {
    costo_perfiles: number
    recargo_color: number
    costo_vidrio: number
    costo_accesorios: number
    costo_marco_madera: number
    costo_items_manuales: number
    costo_materiales: number
    costo_mano_obra: number
    costo_total: number
    margen_pct: number
    ganancia_neta: number
    precio_neto_total: number
    precio_neto_unitario: number
  }
}
