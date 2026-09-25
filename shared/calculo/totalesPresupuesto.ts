import type {
  PresupuestoVentana,
  PresupuestoItemLibre,
  TipoDescuentoPresupuesto,
  TotalesPresupuestoCalculados
} from '../tipos/presupuesto'

/**
 * Función pura para calcular subtotales, descuentos, IVA (19%) y total
 * de un presupuesto comercial según la especificación chilena.
 */
export function calcularTotalesPresupuesto(
  ventanas: Array<Pick<PresupuestoVentana, 'precio_neto_total'>> = [],
  itemsLibres: Array<Pick<PresupuestoItemLibre, 'cantidad' | 'precio_unitario_neto'>> = [],
  descuentoTipo: TipoDescuentoPresupuesto = 'monto',
  descuentoValor: number = 0
): TotalesPresupuestoCalculados {
  // 1. Subtotal de ventanas
  const subtotal_ventanas = ventanas.reduce((acc, v) => acc + (Number(v.precio_neto_total) || 0), 0)

  // 2. Subtotal de ítems libres
  const subtotal_items_libres = itemsLibres.reduce((acc, it) => {
    const cant = Number(it.cantidad) || 0
    const precio = Number(it.precio_unitario_neto) || 0
    return acc + Math.round(cant * precio)
  }, 0)

  // 3. Subtotal general neto
  const subtotal_neto = subtotal_ventanas + subtotal_items_libres

  // 4. Descuento neto
  let descuento_neto = 0
  const valorLimpio = Math.max(0, Number(descuentoValor) || 0)

  if (descuentoTipo === 'porcentaje') {
    descuento_neto = Math.round(subtotal_neto * (valorLimpio / 100))
  } else {
    // Monto fijo: no puede superar el subtotal
    descuento_neto = Math.min(subtotal_neto, Math.round(valorLimpio))
  }

  // 5. Neto imponible
  const neto = Math.max(0, subtotal_neto - descuento_neto)

  // 6. IVA (19%)
  const iva = Math.round(neto * 0.19)

  // 7. Total general
  const total = neto + iva

  return {
    subtotal_ventanas,
    subtotal_items_libres,
    subtotal_neto,
    descuento_neto,
    neto,
    iva,
    total
  }
}
