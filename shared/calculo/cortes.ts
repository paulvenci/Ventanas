import type {
  PresupuestoVentana,
  ResultadoCalculoVentana,
  Perfil,
  PiezaCorte,
  BarraCorte,
  ListadoCortesPerfil,
  MaterialConsolidado,
  ListadoCortesCompleto
} from '../tipos'

export interface OpcionesOptimizacionCorte {
  largo_barra_cm?: number // Defecto: 599 cm (5.99 m aprovechables)
  kerf_cm?: number        // Ancho de la sierra por corte, defecto: 0.5 cm
}

/**
 * Optimiza la distribución de cortes de un perfil específico en barras estándar
 * utilizando el algoritmo First Fit Decreasing (FFD) con consideración de corte de sierra (kerf).
 */
export function optimizarCortesPerfil(
  perfilId: string,
  codigo: string,
  nombre: string,
  piezasEntrada: PiezaCorte[],
  opciones: OpcionesOptimizacionCorte = {}
): ListadoCortesPerfil {
  const largoBarraCm = opciones.largo_barra_cm ?? 599
  const kerfCm = opciones.kerf_cm ?? 0.5

  if (largoBarraCm <= 0) {
    throw new Error('El largo de la barra debe ser mayor a 0 cm')
  }

  // Verificar si alguna pieza excede la barra
  for (const pieza of piezasEntrada) {
    if (pieza.largo_cm > largoBarraCm) {
      throw new Error(
        `La pieza "${pieza.perfil_nombre}" de ${pieza.largo_cm} cm excede el largo máximo de la barra (${largoBarraCm} cm)`
      )
    }
  }

  // Ordenar piezas de mayor a menor (First Fit Decreasing)
  const piezasOrdenadas = [...piezasEntrada].sort((a, b) => b.largo_cm - a.largo_cm)

  interface BarraInterna {
    numero: number
    piezas: PiezaCorte[]
    espacioUsado: number // largo acumulado + kerfs
    longitudPiezas: number // solo largo neto de piezas
  }

  const barras: BarraInterna[] = []

  for (const pieza of piezasOrdenadas) {
    let asignada = false

    for (const barra of barras) {
      // Si la barra ya tiene piezas, requiere un kerf adicional
      const espacioRequerido = barra.piezas.length > 0
        ? kerfCm + pieza.largo_cm
        : pieza.largo_cm

      if (barra.espacioUsado + espacioRequerido <= largoBarraCm) {
        barra.piezas.push(pieza)
        barra.espacioUsado += espacioRequerido
        barra.longitudPiezas += pieza.largo_cm
        asignada = true
        break
      }
    }

    if (!asignada) {
      // Abrir nueva barra
      barras.push({
        numero: barras.length + 1,
        piezas: [pieza],
        espacioUsado: pieza.largo_cm,
        longitudPiezas: pieza.largo_cm
      })
    }
  }

  // Mapear a formato BarraCorte
  const barrasResultado: BarraCorte[] = barras.map(b => {
    const sobranteCm = Number((largoBarraCm - b.espacioUsado).toFixed(2))
    const aprovechamientoPct = Number(((b.longitudPiezas / largoBarraCm) * 100).toFixed(2))

    return {
      numero: b.numero,
      largo_barra_cm: largoBarraCm,
      piezas: b.piezas,
      espacio_usado_cm: Number(b.espacioUsado.toFixed(2)),
      sobrante_cm: Math.max(0, sobranteCm),
      aprovechamiento_pct: aprovechamientoPct
    }
  })

  const totalBarras = barrasResultado.length
  const sumaLongitudPiezas = piezasEntrada.reduce((acc, p) => acc + p.largo_cm, 0)
  const metrosLinealesPiezas = Number((sumaLongitudPiezas / 100).toFixed(2))
  const metrosLinealesBarras = Number(((totalBarras * largoBarraCm) / 100).toFixed(2))

  const totalCapacidadCm = totalBarras * largoBarraCm
  const desperdicioTotalCm = Number((totalCapacidadCm - sumaLongitudPiezas).toFixed(2))
  const desperdicioPct = totalCapacidadCm > 0
    ? Number(((desperdicioTotalCm / totalCapacidadCm) * 100).toFixed(2))
    : 0

  return {
    perfil_id: perfilId,
    codigo,
    nombre,
    largo_barra_cm: largoBarraCm,
    piezas: piezasEntrada,
    total_piezas: piezasEntrada.length,
    barras: barrasResultado,
    total_barras: totalBarras,
    desperdicio_total_cm: desperdicioTotalCm,
    desperdicio_pct: desperdicioPct,
    metros_lineales_piezas: metrosLinealesPiezas,
    metros_lineales_barras: metrosLinealesBarras
  }
}

/**
 * Genera el listado completo de cortes y consolidado de materiales a partir de las ventanas
 * de un presupuesto y sus snapshots de cálculo.
 */
export function generarListadoCortesYMateriales(
  ventanas: PresupuestoVentana[],
  perfilesCatalogo: Perfil[] = [],
  opciones: OpcionesOptimizacionCorte = {}
): ListadoCortesCompleto {
  const piezasPorPerfil = new Map<string, {
    perfilId: string
    codigo: string
    nombre: string
    largoBarraCm: number
    piezas: PiezaCorte[]
  }>()

  const catalogoMap = new Map(perfilesCatalogo.map(p => [p.id, p]))

  // 1. Extraer todas las piezas de perfiles de los snapshots
  ventanas.forEach((ventana, vIdx) => {
    const snapshot = ventana.calculo_snapshot as ResultadoCalculoVentana | undefined
    if (!snapshot || !snapshot.perfiles) return

    const cantVentanas = ventana.cantidad || 1
    const vPos = ventana.posicion || (vIdx + 1)
    const vanoRef = `V${vPos} (${ventana.ancho_vano}×${ventana.alto_vano} cm)`

    for (const itemPerfil of snapshot.perfiles) {
      const pId = itemPerfil.perfil_id
      const perfilCat = catalogoMap.get(pId)
      const largoBarra = perfilCat?.largo_barra_m
        ? Math.round(perfilCat.largo_barra_m * 100)
        : (opciones.largo_barra_cm ?? 599)

      if (!piezasPorPerfil.has(pId)) {
        piezasPorPerfil.set(pId, {
          perfilId: pId,
          codigo: itemPerfil.codigo || perfilCat?.codigo || '',
          nombre: itemPerfil.nombre || perfilCat?.nombre || 'Perfil',
          largoBarraCm: largoBarra,
          piezas: []
        })
      }

      const entry = piezasPorPerfil.get(pId)!
      // Piezas totales = piezas_por_ventana * cantidad_ventanas
      const totalPiezasItem = itemPerfil.cantidad_piezas * cantVentanas

      for (let i = 1; i <= totalPiezasItem; i++) {
        entry.piezas.push({
          id: `corte-${vPos}-${pId}-${i}`,
          ventana_idx: vPos,
          ventana_ref: vanoRef,
          perfil_id: pId,
          perfil_codigo: entry.codigo,
          perfil_nombre: entry.nombre,
          formula_largo: itemPerfil.formula_largo,
          largo_cm: itemPerfil.largo_cm,
          cortado: false
        })
      }
    }
  })

  // 2. Optimizar cada perfil
  const perfilesOptimizados: ListadoCortesPerfil[] = []
  for (const [, item] of piezasPorPerfil) {
    const res = optimizarCortesPerfil(
      item.perfilId,
      item.codigo,
      item.nombre,
      item.piezas,
      {
        largo_barra_cm: item.largoBarraCm,
        kerf_cm: opciones.kerf_cm
      }
    )
    perfilesOptimizados.push(res)
  }

  // 3. Consolidar materiales
  const materiales: MaterialConsolidado[] = []

  // Perfiles en barras
  for (const opt of perfilesOptimizados) {
    const perfilCat = catalogoMap.get(opt.perfil_id)
    const costoUnitario = perfilCat ? Math.round(perfilCat.precio_metro * (opt.largo_barra_cm / 100)) : undefined
    const costoTotal = costoUnitario ? costoUnitario * opt.total_barras : undefined

    materiales.push({
      categoria: 'perfil',
      id_referencia: opt.perfil_id,
      nombre: `Perfil ${opt.nombre}`,
      detalle: opt.codigo ? `Código: ${opt.codigo} | Barra ${opt.largo_barra_cm / 100}m` : `Barra ${opt.largo_barra_cm / 100}m`,
      unidad: 'barras',
      cantidad_total: opt.total_barras,
      costo_estimado_unitario: costoUnitario,
      costo_estimado_total: costoTotal
    })
  }

  // Vidrios en m2
  const vidriosMap = new Map<string, { nombre: string; m2: number; costoTotal: number; precioM2: number }>()
  ventanas.forEach(v => {
    const s = v.calculo_snapshot as ResultadoCalculoVentana | undefined
    if (s?.vidrio) {
      const id = s.vidrio.vidrio_id || s.vidrio.nombre
      const actual = vidriosMap.get(id) || {
        nombre: s.vidrio.nombre,
        m2: 0,
        costoTotal: 0,
        precioM2: s.vidrio.precio_m2
      }
      actual.m2 += s.vidrio.m2_total
      actual.costoTotal += s.vidrio.costo_neto
      vidriosMap.set(id, actual)
    }
  })

  for (const [id, vid] of vidriosMap) {
    materiales.push({
      categoria: 'vidrio',
      id_referencia: id,
      nombre: `Vidrio ${vid.nombre}`,
      unidad: 'm2',
      cantidad_total: Number(vid.m2.toFixed(3)),
      costo_estimado_unitario: vid.precioM2,
      costo_estimado_total: vid.costoTotal
    })
  }

  // Accesorios en unidades
  const accMap = new Map<string, { nombre: string; cantidad: number; costoTotal: number; precioUnitario: number }>()
  ventanas.forEach(v => {
    const s = v.calculo_snapshot as ResultadoCalculoVentana | undefined
    if (s?.accesorios) {
      for (const acc of s.accesorios) {
        const id = acc.accesorio_id
        const actual = accMap.get(id) || {
          nombre: acc.nombre,
          cantidad: 0,
          costoTotal: 0,
          precioUnitario: acc.precio_unitario
        }
        actual.cantidad += acc.cantidad_total
        actual.costoTotal += acc.costo_neto
        accMap.set(id, actual)
      }
    }
  })

  for (const [id, acc] of accMap) {
    materiales.push({
      categoria: 'accesorio',
      id_referencia: id,
      nombre: acc.nombre,
      unidad: 'unidades',
      cantidad_total: acc.cantidad,
      costo_estimado_unitario: acc.precioUnitario,
      costo_estimado_total: acc.costoTotal
    })
  }

  // Marco de madera en metros
  const marcoMap = new Map<string, { nombre: string; metros: number; costoTotal: number; precioMetro: number }>()
  ventanas.forEach(v => {
    const s = v.calculo_snapshot as ResultadoCalculoVentana | undefined
    if (s?.marco_madera) {
      const id = s.marco_madera.marco_id
      const actual = marcoMap.get(id) || {
        nombre: s.marco_madera.nombre,
        metros: 0,
        costoTotal: 0,
        precioMetro: s.marco_madera.precio_metro
      }
      actual.metros += s.marco_madera.metros_totales
      actual.costoTotal += s.marco_madera.costo_neto
      marcoMap.set(id, actual)
    }
  })

  for (const [id, marco] of marcoMap) {
    materiales.push({
      categoria: 'marco_madera',
      id_referencia: id,
      nombre: `Marco Madera ${marco.nombre}`,
      unidad: 'metros',
      cantidad_total: Number(marco.metros.toFixed(2)),
      costo_estimado_unitario: marco.precioMetro,
      costo_estimado_total: marco.costoTotal
    })
  }

  return {
    perfiles: perfilesOptimizados,
    materiales
  }
}
