import type {
  ParametrosCalculoVentana,
  ResultadoCalculoVentana,
  DesglosePerfilCalculado,
  DesgloseAccesorioCalculado,
  DesgloseItemManualCalculado
} from '../tipos/calculo'
import { evaluarExpresionLargo } from './evaluador'

/**
 * Motor de dominio puro para el cálculo de una ventana.
 * Sin dependencias de UI ni de Supabase.
 */
export function calcularVentana(params: ParametrosCalculoVentana): ResultadoCalculoVentana {
  const errores: string[] = []

  const {
    ancho_vano,
    alto_vano,
    cantidad,
    tipologia,
    formula,
    vidrio,
    color,
    marco_madera,
    perfiles_catalogo = [],
    accesorios_catalogo = [],
    merma_vidrieria_defecto = 0,
    merma_vidrio_defecto = 0,
    mano_obra_fijo_defecto = 0,
    mano_obra_m2_defecto = 0,
    margen_comercial_defecto = 0,
    margen_comercial_override,
    ajustes_perfiles = {},
    items_manuales = []
  } = params

  const perfilesMap = new Map((perfiles_catalogo || []).map(p => [p.id, p]))
  const accesoriosMap = new Map((accesorios_catalogo || []).map(a => [a.id, a]))

  // 1. Validaciones básicas
  if (!ancho_vano || ancho_vano <= 0) {
    errores.push('El ancho del vano debe ser mayor a 0 cm')
  }
  if (!alto_vano || alto_vano <= 0) {
    errores.push('El alto del vano debe ser mayor a 0 cm')
  }
  if (!cantidad || cantidad < 1) {
    errores.push('La cantidad de ventanas debe ser al menos 1')
  }

  // 2. Marco de madera y vano útil
  const espesor_marco_cm = marco_madera ? Number(marco_madera.espesor_cm) : 0
  const ancho_util = ancho_vano - (2 * espesor_marco_cm)
  const alto_util = alto_vano - (2 * espesor_marco_cm)

  if (marco_madera && (ancho_util <= 0 || alto_util <= 0)) {
    errores.push(
      `El espesor del marco de madera (${espesor_marco_cm} cm por lado) excede el tamaño del vano (${ancho_vano} x ${alto_vano} cm)`
    )
  }

  // Cálculo de marco de madera
  let marcoMaderaCalculado: ResultadoCalculoVentana['marco_madera'] = undefined
  let costoMarcoMadera = 0

  if (marco_madera && ancho_util > 0 && alto_util > 0) {
    // Perímetro del vano exterior en metros
    const metros_unitario = (2 * (ancho_vano + alto_vano)) / 100
    const merma_pct = merma_vidrieria_defecto ?? 0
    const metros_con_merma_unitario = metros_unitario * (1 + merma_pct / 100)
    const metros_totales = Number((metros_con_merma_unitario * cantidad).toFixed(2))
    costoMarcoMadera = Math.round(metros_totales * marco_madera.precio_metro)

    marcoMaderaCalculado = {
      marco_id: marco_madera.id,
      nombre: marco_madera.nombre,
      ancho_pulgadas: Number(marco_madera.ancho_pulgadas),
      espesor_cm: espesor_marco_cm,
      metros_unitario: Number(metros_con_merma_unitario.toFixed(2)),
      metros_totales,
      precio_metro: marco_madera.precio_metro,
      costo_neto: costoMarcoMadera
    }
  }

  // 3. Despiece de perfiles
  const perfilesCalculados: DesglosePerfilCalculado[] = []
  let costoPerfilesTotal = 0
  let metrosPerfilesTotal = 0

  if (formula?.perfiles_formula && ancho_util > 0 && alto_util > 0) {
    for (const item of formula.perfiles_formula) {
      let largo_cm = 0
      try {
        largo_cm = evaluarExpresionLargo(item.formula_largo, ancho_util, alto_util)
      } catch (err: any) {
        errores.push(`Perfil "${item.perfil_nombre || item.perfil_id}": ${err.message}`)
        continue
      }

      if (largo_cm <= 0) {
        errores.push(`Perfil "${item.perfil_nombre || item.perfil_id}": largo resultante es menor o igual a cero (${largo_cm} cm)`)
        continue
      }

      const override = ajustes_perfiles[item.perfil_id]
      const cantidad_piezas = override?.cantidad_piezas_override ?? item.cantidad
      const metros_brutos_unitario = (largo_cm / 100) * cantidad_piezas

      // Resolver datos del perfil desde catálogo
      const perfilObj = perfilesMap.get(item.perfil_id)
      const merma_pct = perfilObj?.merma ?? merma_vidrieria_defecto ?? 0
      let metros_con_merma_unitario = metros_brutos_unitario * (1 + merma_pct / 100)

      if (override?.metros_override != null) {
        metros_con_merma_unitario = override.metros_override
      }

      const metros_totales = Number((metros_con_merma_unitario * cantidad).toFixed(3))
      const precio_metro = perfilObj?.precio_metro ?? 0
      const largo_barra_m = perfilObj?.largo_barra_m ?? 5.99
      const barras_estimadas = Math.ceil(metros_totales / largo_barra_m)
      const costo_neto = Math.round(metros_totales * precio_metro)

      perfilesCalculados.push({
        perfil_id: item.perfil_id,
        codigo: perfilObj?.codigo || item.perfil_codigo || '',
        nombre: perfilObj?.nombre || item.perfil_nombre || 'Perfil',
        formula_largo: item.formula_largo,
        largo_cm,
        cantidad_piezas,
        metros_brutos_unitario: Number(metros_brutos_unitario.toFixed(3)),
        merma_pct,
        metros_con_merma_unitario: Number(metros_con_merma_unitario.toFixed(3)),
        metros_totales,
        precio_metro,
        costo_neto,
        largo_barra_m,
        barras_estimadas
      })

      costoPerfilesTotal += costo_neto
      metrosPerfilesTotal += metros_totales
    }
  }

  // 4. Recargo de color
  let recargoColorNeto = 0
  const tipo_recargo = color?.tipo_recargo || 'ninguno'
  const valor_recargo = color ? Number(color.valor_recargo) : 0

  if (color && tipo_recargo !== 'ninguno') {
    if (tipo_recargo === 'porcentaje') {
      recargoColorNeto = Math.round(costoPerfilesTotal * (valor_recargo / 100))
    } else if (tipo_recargo === 'monto_metro') {
      recargoColorNeto = Math.round(metrosPerfilesTotal * valor_recargo)
    }
  }

  // 5. Vidrio
  const descuento_ancho = formula ? Number(formula.descuento_vidrio_ancho || 0) : 0
  const descuento_alto = formula ? Number(formula.descuento_vidrio_alto || 0) : 0

  const ancho_vidrio_cm = Number((ancho_util - descuento_ancho).toFixed(1))
  const alto_vidrio_cm = Number((alto_util - descuento_alto).toFixed(1))

  if (ancho_util > 0 && alto_util > 0 && (ancho_vidrio_cm <= 0 || alto_vidrio_cm <= 0)) {
    errores.push(
      `Los descuentos de vidrio (${descuento_ancho} x ${descuento_alto} cm) superan el vano útil (${ancho_util} x ${alto_util} cm)`
    )
  }

  const m2_vidrio_unitario = ancho_vidrio_cm > 0 && alto_vidrio_cm > 0
    ? Number(((ancho_vidrio_cm * alto_vidrio_cm) / 10000).toFixed(4))
    : 0

  const merma_vidrio_pct = merma_vidrio_defecto ?? 0
  const m2_vidrio_total = Number((m2_vidrio_unitario * cantidad * (1 + merma_vidrio_pct / 100)).toFixed(3))
  const costoVidrioNeto = Math.round(m2_vidrio_total * (vidrio?.precio_m2 || 0))

  // 6. Accesorios de la fórmula
  const accesoriosCalculados: DesgloseAccesorioCalculado[] = []
  let costoAccesoriosTotal = 0

  if (formula?.accesorios_formula) {
    for (const item of formula.accesorios_formula) {
      const accObj = accesoriosMap.get(item.accesorio_id)
      const precio_unitario = accObj?.precio_unitario ?? 0
      const cantidad_total = item.cantidad_fija * cantidad
      const costo_neto = Math.round(cantidad_total * precio_unitario)

      accesoriosCalculados.push({
        accesorio_id: item.accesorio_id,
        nombre: accObj?.nombre || item.accesorio_nombre || 'Accesorio',
        cantidad_unitaria: item.cantidad_fija,
        cantidad_total,
        precio_unitario,
        costo_neto
      })

      costoAccesoriosTotal += costo_neto
    }
  }

  // 7. Ítems manuales adicionales
  const itemsManualesCalculados: DesgloseItemManualCalculado[] = []
  let costoItemsManualesTotal = 0

  for (const item of items_manuales) {
    const costo_neto = Math.round(item.cantidad * item.precio_unitario_neto)
    itemsManualesCalculados.push({
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: item.cantidad,
      precio_unitario_neto: item.precio_unitario_neto,
      costo_neto,
      stock_item_id: item.stock_item_id
    })
    costoItemsManualesTotal += costo_neto
  }

  // 8. Mano de obra
  const mano_obra_fijo = tipologia?.mano_obra_fijo ?? mano_obra_fijo_defecto ?? 0
  const mano_obra_m2_tarifa = tipologia?.mano_obra_m2 ?? mano_obra_m2_defecto ?? 0
  const mano_obra_unitario = Math.round(mano_obra_fijo + (m2_vidrio_unitario * mano_obra_m2_tarifa))
  const costoManoObraTotal = Math.round(mano_obra_unitario * cantidad)

  // 9. Totales y margen comercial
  const costoMaterialesTotal =
    costoPerfilesTotal +
    recargoColorNeto +
    costoVidrioNeto +
    costoAccesoriosTotal +
    costoMarcoMadera +
    costoItemsManualesTotal

  const costoTotal = costoMaterialesTotal + costoManoObraTotal
  const margen_pct = margen_comercial_override ?? margen_comercial_defecto ?? 0
  const precioNetoTotal = Math.round(costoTotal * (1 + margen_pct / 100))
  const precioNetoUnitario = Math.round(precioNetoTotal / cantidad)
  const gananciaNeta = precioNetoTotal - costoTotal

  return {
    valido: errores.length === 0,
    errores,
    dimensiones: {
      ancho_vano,
      alto_vano,
      cantidad,
      espesor_marco_cm,
      ancho_util: Math.max(0, ancho_util),
      alto_util: Math.max(0, alto_util),
      ancho_vidrio_cm: Math.max(0, ancho_vidrio_cm),
      alto_vidrio_cm: Math.max(0, alto_vidrio_cm),
      m2_vidrio_unitario,
      m2_vidrio_total
    },
    perfiles: perfilesCalculados,
    vidrio: {
      vidrio_id: vidrio?.id || '',
      nombre: vidrio?.nombre || '',
      espesor_mm: vidrio?.espesor_mm || 0,
      m2_unitario: m2_vidrio_unitario,
      m2_total: m2_vidrio_total,
      precio_m2: vidrio?.precio_m2 || 0,
      merma_pct: merma_vidrio_pct,
      costo_neto: costoVidrioNeto
    },
    color: {
      color_id: color?.id,
      nombre: color?.nombre || 'Estándar',
      tipo_recargo,
      valor_recargo,
      recargo_neto: recargoColorNeto
    },
    accesorios: accesoriosCalculados,
    marco_madera: marcoMaderaCalculado,
    items_manuales: itemsManualesCalculados,
    mano_obra: {
      fijo_unitario: mano_obra_fijo,
      m2_unitario: mano_obra_m2_tarifa,
      costo_unitario: mano_obra_unitario,
      costo_neto: costoManoObraTotal
    },
    totales: {
      costo_perfiles: costoPerfilesTotal,
      recargo_color: recargoColorNeto,
      costo_vidrio: costoVidrioNeto,
      costo_accesorios: costoAccesoriosTotal,
      costo_marco_madera: costoMarcoMadera,
      costo_items_manuales: costoItemsManualesTotal,
      costo_materiales: costoMaterialesTotal,
      costo_mano_obra: costoManoObraTotal,
      costo_total: costoTotal,
      margen_pct,
      ganancia_neta: gananciaNeta,
      precio_neto_total: precioNetoTotal,
      precio_neto_unitario: precioNetoUnitario
    }
  }
}
