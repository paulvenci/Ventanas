import { describe, it, expect } from 'vitest'
import {
  optimizarCortesPerfil,
  generarListadoCortesYMateriales
} from '../shared/calculo/cortes'
import type { PiezaCorte, PresupuestoVentana, ResultadoCalculoVentana } from '../shared/tipos'

describe('Motor de Optimización de Cortes (FFD) y Materiales', () => {
  it('empaqueta piezas que caben en una sola barra de 599 cm', () => {
    const piezas: PiezaCorte[] = [
      { id: '1', ventana_idx: 1, ventana_ref: 'V1', perfil_id: 'p1', perfil_codigo: 'JAM', perfil_nombre: 'Jamba', formula_largo: 'alto', largo_cm: 120 },
      { id: '2', ventana_idx: 1, ventana_ref: 'V1', perfil_id: 'p1', perfil_codigo: 'JAM', perfil_nombre: 'Jamba', formula_largo: 'alto', largo_cm: 120 },
      { id: '3', ventana_idx: 1, ventana_ref: 'V1', perfil_id: 'p1', perfil_codigo: 'JAM', perfil_nombre: 'Jamba', formula_largo: 'alto', largo_cm: 150 }
    ]

    const resultado = optimizarCortesPerfil('p1', 'JAM', 'Jamba', piezas, {
      largo_barra_cm: 599,
      kerf_cm: 0.5
    })

    // 150 + 120 + 120 = 390 cm + (2 kerfs * 0.5 = 1.0 cm) = 391.0 cm
    expect(resultado.total_barras).toBe(1)
    expect(resultado.barras[0].piezas).toHaveLength(3)
    expect(resultado.barras[0].espacio_usado_cm).toBe(391.0)
    expect(resultado.barras[0].sobrante_cm).toBe(208.0)
    // 390 / 599 * 100 = 65.11%
    expect(resultado.barras[0].aprovechamiento_pct).toBe(65.11)
  })

  it('abre barras adicionales cuando la suma excede los 599 cm y prioriza piezas más largas', () => {
    const piezas: PiezaCorte[] = [
      { id: '1', ventana_idx: 1, ventana_ref: 'V1', perfil_id: 'p1', perfil_codigo: 'RIEL', perfil_nombre: 'Riel', formula_largo: 'ancho', largo_cm: 400 },
      { id: '2', ventana_idx: 1, ventana_ref: 'V1', perfil_id: 'p1', perfil_codigo: 'RIEL', perfil_nombre: 'Riel', formula_largo: 'ancho', largo_cm: 300 },
      { id: '3', ventana_idx: 1, ventana_ref: 'V1', perfil_id: 'p1', perfil_codigo: 'RIEL', perfil_nombre: 'Riel', formula_largo: 'ancho', largo_cm: 150 }
    ]

    const resultado = optimizarCortesPerfil('p1', 'RIEL', 'Riel', piezas, {
      largo_barra_cm: 599,
      kerf_cm: 0.5
    })

    // Pieza 400 entra en barra 1. Pieza 300 no cabe en barra 1 (400 + 0.5 + 300 = 700.5 > 599) -> entra en barra 2.
    // Pieza 150 cabe en barra 1 (400 + 0.5 + 150 = 550.5 <= 599).
    expect(resultado.total_barras).toBe(2)
    expect(resultado.barras[0].piezas.map(p => p.largo_cm)).toEqual([400, 150])
    expect(resultado.barras[1].piezas.map(p => p.largo_cm)).toEqual([300])
  })

  it('lanza un error claro si una pieza supera el largo máximo de la barra', () => {
    const piezas: PiezaCorte[] = [
      { id: '1', ventana_idx: 1, ventana_ref: 'V1', perfil_id: 'p1', perfil_codigo: 'JAM', perfil_nombre: 'Jamba', formula_largo: 'alto', largo_cm: 650 }
    ]

    expect(() => {
      optimizarCortesPerfil('p1', 'JAM', 'Jamba', piezas, { largo_barra_cm: 599 })
    }).toThrowError(/excede el largo máximo/)
  })

  it('consolida cortes y lista de materiales desde ventanas y snapshots', () => {
    const snapshotSimulado: ResultadoCalculoVentana = {
      valido: true,
      errores: [],
      dimensiones: {
        ancho_vano: 150,
        alto_vano: 120,
        cantidad: 2,
        espesor_marco_cm: 0,
        ancho_util: 150,
        alto_util: 120,
        ancho_vidrio_cm: 70,
        alto_vidrio_cm: 115,
        m2_vidrio_unitario: 0.805,
        m2_vidrio_total: 1.61
      },
      perfiles: [
        {
          perfil_id: 'perf-jamba',
          codigo: 'JB-20',
          nombre: 'Jamba L20',
          formula_largo: 'alto',
          largo_cm: 120,
          cantidad_piezas: 2, // 2 piezas por ventana
          metros_brutos_unitario: 2.4,
          merma_pct: 5,
          metros_con_merma_unitario: 2.52,
          metros_totales: 5.04,
          precio_metro: 3000,
          costo_neto: 15120,
          largo_barra_m: 5.99,
          barras_estimadas: 1
        }
      ],
      vidrio: {
        vidrio_id: 'vid-4mm',
        nombre: '4mm Incoloro',
        espesor_mm: 4,
        m2_unitario: 0.805,
        m2_total: 1.61,
        precio_m2: 12000,
        merma_pct: 0,
        costo_neto: 19320
      },
      color: {
        nombre: 'Mate',
        tipo_recargo: 'ninguno',
        valor_recargo: 0,
        recargo_neto: 0
      },
      accesorios: [
        {
          accesorio_id: 'acc-rodamiento',
          nombre: 'Rodamiento L20 Simple',
          cantidad_unitaria: 2,
          cantidad_total: 4, // 2 ventanas * 2
          precio_unitario: 1500,
          costo_neto: 6000
        }
      ],
      marco_madera: {
        marco_id: 'marco-pino',
        nombre: 'Pino 3"',
        ancho_pulgadas: 3,
        espesor_cm: 2,
        metros_unitario: 5.4,
        metros_totales: 10.8,
        precio_metro: 2500,
        costo_neto: 27000
      },
      items_manuales: [],
      mano_obra: {
        fijo_unitario: 10000,
        m2_unitario: 5000,
        costo_unitario: 14025,
        costo_neto: 28050
      },
      totales: {
        costo_perfiles: 15120,
        recargo_color: 0,
        costo_vidrio: 19320,
        costo_accesorios: 6000,
        costo_marco_madera: 27000,
        costo_items_manuales: 0,
        costo_materiales: 67440,
        costo_mano_obra: 28050,
        costo_total: 95490,
        margen_pct: 30,
        ganancia_neta: 28647,
        precio_neto_total: 124137,
        precio_neto_unitario: 62069
      }
    }

    const ventanas: PresupuestoVentana[] = [
      {
        id: 'v1',
        presupuesto_id: 'pres-1',
        vidrieria_id: 'vid-1',
        posicion: 1,
        ancho_vano: 150,
        alto_vano: 120,
        cantidad: 2, // 2 ventanas -> 4 jambas de 120cm
        margen_pct: 30,
        costo_materiales: 67440,
        costo_mano_obra: 28050,
        costo_total: 95490,
        precio_neto_unitario: 62069,
        precio_neto_total: 124137,
        calculo_snapshot: snapshotSimulado,
        created_at: new Date().toISOString()
      }
    ]

    const resultado = generarListadoCortesYMateriales(ventanas)

    // Perfiles: 4 piezas de 120 cm -> caben en 1 barra de 599 cm (4 * 120 = 480 + 1.5 = 481.5 cm)
    expect(resultado.perfiles).toHaveLength(1)
    expect(resultado.perfiles[0].total_piezas).toBe(4)
    expect(resultado.perfiles[0].total_barras).toBe(1)

    // Consolidado de materiales
    const matPerfiles = resultado.materiales.find(m => m.categoria === 'perfil')
    const matVidrio = resultado.materiales.find(m => m.categoria === 'vidrio')
    const matAcc = resultado.materiales.find(m => m.categoria === 'accesorio')
    const matMarco = resultado.materiales.find(m => m.categoria === 'marco_madera')

    expect(matPerfiles?.cantidad_total).toBe(1)
    expect(matPerfiles?.unidad).toBe('barras')

    expect(matVidrio?.cantidad_total).toBe(1.61)
    expect(matVidrio?.unidad).toBe('m2')

    expect(matAcc?.cantidad_total).toBe(4)
    expect(matAcc?.unidad).toBe('unidades')

    expect(matMarco?.cantidad_total).toBe(10.8)
    expect(matMarco?.unidad).toBe('metros')
  })
})
