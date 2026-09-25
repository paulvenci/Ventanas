import { describe, it, expect } from 'vitest'
import { evaluarExpresionLargo, calcularVentana } from '../shared/calculo'
import type {
  Linea,
  Tipologia,
  FormulaTipologia,
  Vidrio,
  Color,
  Perfil,
  Accesorio,
  MarcoMadera,
  ParametrosCalculoVentana
} from '../shared/tipos'

describe('Evaluador de Fórmulas de Corte (evaluarExpresionLargo)', () => {
  it('evalúa variables directas alto y ancho', () => {
    expect(evaluarExpresionLargo('alto', 150, 120)).toBe(120)
    expect(evaluarExpresionLargo('ancho', 150, 120)).toBe(150)
    expect(evaluarExpresionLargo('ALTO', 150, 120)).toBe(120)
  })

  it('evalúa restas y comas decimales', () => {
    expect(evaluarExpresionLargo('ancho - 1.2', 150, 120)).toBe(148.8)
    expect(evaluarExpresionLargo('alto - 2,8', 150, 120)).toBe(117.2)
  })

  it('evalúa divisiones para zócalos y cabezales', () => {
    expect(evaluarExpresionLargo('ancho / 2', 150, 120)).toBe(75)
    expect(evaluarExpresionLargo('(ancho - 1.2) / 2', 150, 120)).toBe(74.4)
  })

  it('rechaza expresiones con caracteres no matemáticos', () => {
    expect(() => evaluarExpresionLargo('ancho + alert("hack")', 150, 120)).toThrow()
    expect(() => evaluarExpresionLargo('process.exit()', 150, 120)).toThrow()
  })

  it('rechaza dimensiones cero o negativas', () => {
    expect(() => evaluarExpresionLargo('alto', 0, 120)).toThrow()
    expect(() => evaluarExpresionLargo('alto', 150, -5)).toThrow()
  })
})

describe('Motor de Cálculo de una Ventana (calcularVentana)', () => {
  const lineaAl20: Linea = {
    id: 'linea-al20',
    vidrieria_id: 'vid-1',
    tipo_material: 'aluminio',
    nombre: 'Línea 20',
    activo: true
  }

  const tipologiaCorredera: Tipologia = {
    id: 'tip-corr20',
    vidrieria_id: 'vid-1',
    nombre: 'Corredera Aluminio Línea 20 Vidrio 4mm',
    tipo_base: 'corredera',
    mano_obra_fijo: 15000,
    mano_obra_m2: 8000,
    activo: true
  }

  const perfilesCatalogo: Perfil[] = [
    { id: 'p-jamba', vidrieria_id: 'vid-1', linea_id: 'linea-al20', codigo: 'AL2001', nombre: 'Jamba', precio_metro: 3000, stock_metros: 100, largo_barra_m: 5.99, merma: 5, activo: true },
    { id: 'p-riel-sup', vidrieria_id: 'vid-1', linea_id: 'linea-al20', codigo: 'AL2002', nombre: 'Riel Superior', precio_metro: 3500, stock_metros: 100, largo_barra_m: 5.99, merma: 5, activo: true },
    { id: 'p-riel-inf', vidrieria_id: 'vid-1', linea_id: 'linea-al20', codigo: 'AL2003', nombre: 'Riel Inferior', precio_metro: 3800, stock_metros: 100, largo_barra_m: 5.99, merma: 5, activo: true },
    { id: 'p-pierna', vidrieria_id: 'vid-1', linea_id: 'linea-al20', codigo: 'AL2004', nombre: 'Pierna', precio_metro: 2800, stock_metros: 100, largo_barra_m: 5.99, merma: 5, activo: true },
    { id: 'p-traslapo', vidrieria_id: 'vid-1', linea_id: 'linea-al20', codigo: 'AL2005', nombre: 'Traslapo', precio_metro: 2900, stock_metros: 100, largo_barra_m: 5.99, merma: 5, activo: true },
    { id: 'p-zocalo', vidrieria_id: 'vid-1', linea_id: 'linea-al20', codigo: 'AL2006', nombre: 'Zócalo', precio_metro: 3200, stock_metros: 100, largo_barra_m: 5.99, merma: 5, activo: true },
    { id: 'p-cabezal', vidrieria_id: 'vid-1', linea_id: 'linea-al20', codigo: 'AL2007', nombre: 'Cabezal', precio_metro: 3100, stock_metros: 100, largo_barra_m: 5.99, merma: 5, activo: true }
  ]

  const formulaReal: FormulaTipologia = {
    id: 'form-corr20',
    vidrieria_id: 'vid-1',
    tipologia_id: 'tip-corr20',
    linea_id: 'linea-al20',
    descuento_vidrio_ancho: 1.2,
    descuento_vidrio_alto: 2.8,
    perfiles_formula: [
      { perfil_id: 'p-jamba', formula_largo: 'alto', cantidad: 2 },
      { perfil_id: 'p-riel-sup', formula_largo: 'ancho - 1.2', cantidad: 1 },
      { perfil_id: 'p-riel-inf', formula_largo: 'ancho - 1.2', cantidad: 1 },
      { perfil_id: 'p-pierna', formula_largo: 'alto - 2.8', cantidad: 2 },
      { perfil_id: 'p-traslapo', formula_largo: 'alto - 2.8', cantidad: 2 },
      { perfil_id: 'p-zocalo', formula_largo: 'ancho / 2', cantidad: 2 },
      { perfil_id: 'p-cabezal', formula_largo: 'ancho / 2', cantidad: 2 }
    ],
    accesorios_formula: [
      { accesorio_id: 'acc-rueda', cantidad_fija: 2 }
    ]
  }

  const vidrio4mm: Vidrio = {
    id: 'vid-4mm',
    vidrieria_id: 'vid-1',
    nombre: 'Incoloro 4mm',
    espesor_mm: 4,
    precio_m2: 18000,
    stock_m2: 50,
    activo: true
  }

  const accesoriosCatalogo: Accesorio[] = [
    { id: 'acc-rueda', vidrieria_id: 'vid-1', nombre: 'Rueda Corredera AL20', precio_unitario: 2500, stock_unidades: 200, activo: true }
  ]

  it('calcula exactamente las medidas de piezas para Corredera AL20 (150 x 120 cm)', () => {
    const params: ParametrosCalculoVentana = {
      ancho_vano: 150,
      alto_vano: 120,
      cantidad: 1,
      linea: lineaAl20,
      tipologia: tipologiaCorredera,
      formula: formulaReal,
      vidrio: vidrio4mm,
      perfiles_catalogo: perfilesCatalogo,
      accesorios_catalogo: accesoriosCatalogo,
      margen_comercial_defecto: 30
    }

    const res = calcularVentana(params)

    expect(res.valido).toBe(true)
    expect(res.errores).toHaveLength(0)

    // Verificar dimensiones útiles sin marco
    expect(res.dimensiones.ancho_util).toBe(150)
    expect(res.dimensiones.alto_util).toBe(120)

    // Jamba: 120 cm x 2
    const jamba = res.perfiles.find(p => p.perfil_id === 'p-jamba')!
    expect(jamba.largo_cm).toBe(120)
    expect(jamba.cantidad_piezas).toBe(2)
    expect(jamba.metros_brutos_unitario).toBe(2.4)

    // Riel Superior: 150 - 1.2 = 148.8 cm
    const rielSup = res.perfiles.find(p => p.perfil_id === 'p-riel-sup')!
    expect(rielSup.largo_cm).toBe(148.8)

    // Piernas: 120 - 2.8 = 117.2 cm
    const piernas = res.perfiles.find(p => p.perfil_id === 'p-pierna')!
    expect(piernas.largo_cm).toBe(117.2)

    // Zócalos: 150 / 2 = 75 cm
    const zocalos = res.perfiles.find(p => p.perfil_id === 'p-zocalo')!
    expect(zocalos.largo_cm).toBe(75)

    // Paño de vidrio: ancho 150 - 1.2 = 148.8 cm; alto 120 - 2.8 = 117.2 cm
    expect(res.dimensiones.ancho_vidrio_cm).toBe(148.8)
    expect(res.dimensiones.alto_vidrio_cm).toBe(117.2)
    // m² = (148.8 * 117.2) / 10000 = 1.7439 m²
    expect(res.dimensiones.m2_vidrio_unitario).toBeCloseTo(1.7439, 3)

    // Accesorios
    expect(res.accesorios[0].cantidad_total).toBe(2)
    expect(res.accesorios[0].costo_neto).toBe(5000)

    // Margen y totales
    expect(res.totales.margen_pct).toBe(30)
    expect(res.totales.precio_neto_total).toBeGreaterThan(res.totales.costo_total)
    expect(Number.isInteger(res.totales.precio_neto_total)).toBe(true)
  })

  it('descuenta marco de madera correctamente reduciendo el vano útil', () => {
    const marcoMadera: MarcoMadera = {
      id: 'marco-pino',
      vidrieria_id: 'vid-1',
      nombre: 'Pino 2x1',
      ancho_pulgadas: 2,
      espesor_cm: 2.0,
      precio_metro: 4000,
      stock_metros: 80,
      activo: true
    }

    const params: ParametrosCalculoVentana = {
      ancho_vano: 150,
      alto_vano: 120,
      cantidad: 1,
      linea: lineaAl20,
      tipologia: tipologiaCorredera,
      formula: formulaReal,
      vidrio: vidrio4mm,
      marco_madera: marcoMadera,
      perfiles_catalogo: perfilesCatalogo
    }

    const res = calcularVentana(params)

    expect(res.valido).toBe(true)
    // Con espesor de 2.0 cm por lado, ancho útil = 150 - 4 = 146 cm; alto útil = 120 - 4 = 116 cm
    expect(res.dimensiones.ancho_util).toBe(146)
    expect(res.dimensiones.alto_util).toBe(116)

    // Jamba ahora debe medir 116 cm
    const jamba = res.perfiles.find(p => p.perfil_id === 'p-jamba')!
    expect(jamba.largo_cm).toBe(116)

    // Marco de madera calculado sobre vano exterior (2 * (150 + 120) / 100 = 5.4 m)
    expect(res.marco_madera).toBeDefined()
    expect(res.marco_madera?.metros_totales).toBeCloseTo(5.4, 1)
  })

  it('bloquea el cálculo si el marco de madera excede el vano', () => {
    const marcoGrueso: MarcoMadera = {
      id: 'marco-grueso',
      vidrieria_id: 'vid-1',
      nombre: 'Roble 4x4',
      ancho_pulgadas: 4,
      espesor_cm: 30.0,
      precio_metro: 8000,
      stock_metros: 20,
      activo: true
    }

    const params: ParametrosCalculoVentana = {
      ancho_vano: 50,
      alto_vano: 50,
      cantidad: 1,
      linea: lineaAl20,
      tipologia: tipologiaCorredera,
      formula: formulaReal,
      vidrio: vidrio4mm,
      marco_madera: marcoGrueso
    }

    const res = calcularVentana(params)
    expect(res.valido).toBe(false)
    expect(res.errores.some(e => e.includes('marco de madera'))).toBe(true)
  })

  it('calcula recargo de color porcentual y por metro', () => {
    const colorBlanco: Color = {
      id: 'col-blanco',
      vidrieria_id: 'vid-1',
      linea_id: 'linea-al20',
      nombre: 'Blanco Esmaltado',
      tipo_recargo: 'porcentaje',
      valor_recargo: 15,
      activo: true
    }

    const params: ParametrosCalculoVentana = {
      ancho_vano: 150,
      alto_vano: 120,
      cantidad: 1,
      linea: lineaAl20,
      tipologia: tipologiaCorredera,
      formula: formulaReal,
      vidrio: vidrio4mm,
      color: colorBlanco,
      perfiles_catalogo: perfilesCatalogo
    }

    const res = calcularVentana(params)
    expect(res.valido).toBe(true)
    expect(res.color.recargo_neto).toBe(Math.round(res.totales.costo_perfiles * 0.15))
    expect(res.totales.recargo_color).toBe(res.color.recargo_neto)
  })
})
