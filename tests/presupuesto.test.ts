import { describe, it, expect } from 'vitest'
import { calcularTotalesPresupuesto } from '../shared/calculo'

describe('Cálculo de Totales de Presupuesto (calcularTotalesPresupuesto)', () => {
  it('calcula correctamente presupuesto con ventanas e ítems libres sin descuento', () => {
    const ventanas = [
      { precio_neto_total: 150000 },
      { precio_neto_total: 80000 }
    ]
    const itemsLibres = [
      { cantidad: 1, precio_unitario_neto: 25000 }, // Instalación
      { cantidad: 1, precio_unitario_neto: 10000 }  // Flete
    ]

    const totales = calcularTotalesPresupuesto(ventanas, itemsLibres, 'monto', 0)

    expect(totales.subtotal_ventanas).toBe(230000)
    expect(totales.subtotal_items_libres).toBe(35000)
    expect(totales.subtotal_neto).toBe(265000)
    expect(totales.descuento_neto).toBe(0)
    expect(totales.neto).toBe(265000)
    // IVA 19% de 265000 = 50350
    expect(totales.iva).toBe(50350)
    // Total = 265000 + 50350 = 315350
    expect(totales.total).toBe(315350)
  })

  it('aplica descuento porcentual correctamente e impacta en IVA', () => {
    const ventanas = [{ precio_neto_total: 100000 }]
    const itemsLibres = []

    // 10% de descuento sobre 100.000 neto = 10.000
    const totales = calcularTotalesPresupuesto(ventanas, itemsLibres, 'porcentaje', 10)

    expect(totales.subtotal_neto).toBe(100000)
    expect(totales.descuento_neto).toBe(10000)
    expect(totales.neto).toBe(90000)
    // IVA 19% de 90.000 = 17100
    expect(totales.iva).toBe(17100)
    expect(totales.total).toBe(107100)
  })

  it('aplica descuento fijo en monto sin dejar el neto negativo', () => {
    const ventanas = [{ precio_neto_total: 50000 }]
    const itemsLibres = []

    // Descuento de $80.000 cuando el subtotal es $50.000 debe toparse en $50.000
    const totales = calcularTotalesPresupuesto(ventanas, itemsLibres, 'monto', 80000)

    expect(totales.subtotal_neto).toBe(50000)
    expect(totales.descuento_neto).toBe(50000)
    expect(totales.neto).toBe(0)
    expect(totales.iva).toBe(0)
    expect(totales.total).toBe(0)
  })

  it('presupuesto solo con ítems libres sin ventanas es válido', () => {
    const ventanas = []
    const itemsLibres = [
      { cantidad: 2, precio_unitario_neto: 15000 }
    ]

    const totales = calcularTotalesPresupuesto(ventanas, itemsLibres, 'monto', 0)

    expect(totales.subtotal_ventanas).toBe(0)
    expect(totales.subtotal_items_libres).toBe(30000)
    expect(totales.neto).toBe(30000)
    expect(totales.iva).toBe(5700)
    expect(totales.total).toBe(35700)
  })
})
