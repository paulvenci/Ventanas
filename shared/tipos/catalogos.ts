export type TipoMaterial = 'aluminio' | 'pvc'
export type TipoRecargoColor = 'ninguno' | 'porcentaje' | 'monto_metro'
export type TipoBase = 'corredera' | 'batiente' | 'pano_fijo' | 'proyectante' | 'guillotina' | 'pivotante' | 'oscilobatiente' | 'otro'

export interface Linea {
  id: string
  vidrieria_id: string
  tipo_material: TipoMaterial
  nombre: string
  activo: boolean
  created_at?: string
}

export interface Perfil {
  id: string
  vidrieria_id: string
  linea_id: string
  codigo: string
  nombre: string
  precio_metro: number
  stock_metros: number
  largo_barra_m: number  // largo comercial aprovechable de la tira (ej. 5.99 m)
  merma: number | null   // null → usa merma de la vidriería
  activo: boolean
  created_at?: string
  // Virtual (join)
  linea?: Linea
}

export interface Vidrio {
  id: string
  vidrieria_id: string
  nombre: string
  espesor_mm: number     // ej. 4, 6, 8 para "Incoloro 4mm"
  precio_m2: number
  stock_m2: number
  activo: boolean
  created_at?: string
}

export interface Color {
  id: string
  vidrieria_id: string
  linea_id: string | null  // null = aplica a todas las líneas
  nombre: string
  tipo_recargo: TipoRecargoColor
  valor_recargo: number
  activo: boolean
  created_at?: string
  // Virtual (join)
  linea?: Linea
}

export interface Accesorio {
  id: string
  vidrieria_id: string
  nombre: string
  precio_unitario: number
  stock_unidades: number
  activo: boolean
  created_at?: string
}

export interface MarcoMadera {
  id: string
  vidrieria_id: string
  nombre: string
  precio_metro: number
  stock_metros: number
  espesor_cm: number     // espacio que ocupa hacia adentro del vano en cada costado
  ancho_pulgadas: number // ancho de la tabla en pulgadas (ej. 1, 1.5, 2)
  activo: boolean
  created_at?: string
}

export interface Tipologia {
  id: string
  vidrieria_id: string
  nombre: string
  tipo_base: TipoBase    // categoría base para filtrar/agrupar
  mano_obra_fijo: number | null   // $ neto fijo por ventana; null → usa el de la vidriería
  mano_obra_m2: number | null     // $ neto por m² de vidrio; null → usa el de la vidriería
  activo: boolean
  created_at?: string
}

/**
 * Ítem de perfil dentro de la fórmula de una tipología.
 *
 * formula_largo: expresión en cm en función de 'ancho' y 'alto' del vano.
 * El motor de cálculo evalúa la expresión, divide por 100 para pasar a metros
 * y multiplica por cantidad para obtener metros lineales por pieza.
 *
 * Ejemplos reales (Corredera AL20 4mm):
 *   Jamba:         formula_largo = "alto",         cantidad = 2
 *   Riel Superior: formula_largo = "ancho - 1.2",  cantidad = 1
 *   Riel Inferior: formula_largo = "ancho - 1.2",  cantidad = 1
 *   Piernas:       formula_largo = "alto - 2.8",   cantidad = 2
 *   Traslapos:     formula_largo = "alto - 2.8",   cantidad = 2
 *   Zócalos:       formula_largo = "ancho / 2",    cantidad = 2
 *   Cabezal:       formula_largo = "ancho / 2",    cantidad = 2
 */
export interface ItemPerfilFormula {
  perfil_id: string
  perfil_nombre?: string   // desnormalizado para mostrar en UI sin join adicional
  perfil_codigo?: string
  formula_largo: string    // expresión aritmética con 'ancho' y 'alto' en cm
  cantidad: number         // número de piezas de ese perfil
}

/**
 * Ítem de accesorio dentro de la fórmula de una tipología.
 * La cantidad es fija por ventana (independiente del tamaño).
 */
export interface ItemAccesorioFormula {
  accesorio_id: string
  accesorio_nombre?: string
  cantidad_fija: number
}

/**
 * Fórmula completa para una combinación (tipología + línea).
 *
 * Flujo de cálculo (Etapa 03):
 * 1. Para cada ítem en perfiles_formula:
 *    largo_cm = eval(formula_largo, { ancho, alto })
 *    metros_brutos = (largo_cm / 100) * cantidad
 *    merma_pct = perfil.merma ?? vidrieria.merma_defecto ?? 0
 *    metros_con_merma = metros_brutos * (1 + merma_pct / 100)
 *    costo = metros_con_merma * perfil.precio_metro
 * 2. Vidrio:
 *    ancho_vidrio = ancho_util - descuento_vidrio_ancho
 *    alto_vidrio  = alto_util  - descuento_vidrio_alto
 *    m2 = (ancho_vidrio * alto_vidrio) / 10000
 * 3. Accesorios: precio_unitario * cantidad_fija
 */
export interface FormulaTipologia {
  id: string
  vidrieria_id: string
  tipologia_id: string
  linea_id: string
  descuento_vidrio_ancho: number  // cm a restar al ancho útil para el paño de vidrio
  descuento_vidrio_alto: number   // cm a restar al alto útil para el paño de vidrio
  perfiles_formula: ItemPerfilFormula[]
  accesorios_formula: ItemAccesorioFormula[]
  created_at?: string
}
