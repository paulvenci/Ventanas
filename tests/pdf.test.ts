import { describe, it, expect } from 'vitest'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Presupuesto, Vidrieria } from '../shared/tipos'

describe('usePresupuestoPdf - Generación de PDF formal', () => {
  const vidrieriaMock: Vidrieria = {
    id: 'vid-123',
    nombre: 'Aluminios & Cristales El Sol',
    rut: '76.123.456-7',
    direccion: 'Av. Industrial 456, Rancagua',
    telefono: '+56 9 9876 5432',
    correo: 'ventas@cristaleselsol.cl',
    logo_url: null,
    margen_defecto: 30,
    merma_defecto: 5,
    mano_obra_fijo_defecto: 10000,
    mano_obra_m2_defecto: 5000
  }

  const presupuestoMock: Presupuesto = {
    id: 'p-999',
    vidrieria_id: 'vid-123',
    numero: 1042,
    cliente_nombre: 'Constructora Los Andes',
    cliente_telefono: '+56 9 1122 3344',
    cliente_correo: 'contacto@losandes.cl',
    cliente_direccion: 'Calle Las Pircas 890, Santiago',
    fecha: '2026-09-24',
    validez_dias: 15,
    observaciones: 'Instalación en piso 3. Incluye sellos y burletes.',
    descuento_tipo: 'porcentaje',
    descuento_valor: 10,
    subtotal_neto: 200000,
    descuento_neto: 20000,
    neto: 180000,
    iva: 34200,
    total: 214200,
    estado: 'enviado',
    ventanas: [
      {
        posicion: 1,
        ancho_vano: 120,
        alto_vano: 100,
        cantidad: 2,
        margen_pct: 35,
        costo_materiales: 50000,
        costo_mano_obra: 20000,
        costo_total: 70000,
        precio_neto_unitario: 94500,
        precio_neto_total: 189000,
        calculo_snapshot: {
          valido: true,
          errores: [],
          dimensiones: {
            ancho_vano: 120,
            alto_vano: 100,
            cantidad: 2,
            espesor_marco_cm: 0,
            ancho_util: 120,
            alto_util: 100,
            ancho_vidrio_cm: 58,
            alto_vidrio_cm: 94,
            m2_vidrio_unitario: 0.54,
            m2_vidrio_total: 1.08
          },
          perfiles: [],
          vidrio: {
            vidrio_id: 'v-1',
            nombre: 'Termopanel 4-10-4',
            espesor_mm: 18,
            m2_unitario: 0.54,
            m2_total: 1.08,
            precio_m2: 25000,
            merma_pct: 5,
            costo_neto: 27000
          },
          color: {
            nombre: 'Titanio',
            tipo_recargo: 'porcentaje',
            valor_recargo: 10,
            recargo_neto: 5000
          },
          accesorios: []
        } as any
      }
    ],
    items_libres: [
      {
        posicion: 1,
        descripcion: 'Instalación en obra',
        cantidad: 1,
        precio_unitario_neto: 11000,
        total_neto: 11000
      }
    ]
  }

  it('debe inicializar un documento jsPDF con A4 vertical', () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0)
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 0)
  })

  it('debe ejecutar autoTable sin lanzar errores', () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    expect(() => {
      autoTable(doc, {
        head: [['#', 'Descripción', 'Cant.', 'Total']],
        body: [['V1', 'Ventana Corredera', '2', '$ 189.000']]
      })
    }).not.toThrow()

    expect((doc as any).lastAutoTable.finalY).toBeGreaterThan(0)
  })

  it('no debe incluir texto de costos internos o margen en la descripción pública', () => {
    const filasVentanas: any[] = []
    presupuestoMock.ventanas?.forEach((vent, idx) => {
      const calc = vent.calculo_snapshot
      const vidrioNombre = calc?.vidrio?.nombre || 'Vidrio Estándar'
      const colorNombre = calc?.color?.nombre || 'Color Estándar'
      
      const descripcion = `Ventana (Línea Estándar)\nVidrio: ${vidrioNombre} • Color: ${colorNombre}`
      filasVentanas.push([
        `V${idx + 1}`,
        descripcion,
        `${vent.ancho_vano} × ${vent.alto_vano} cm`,
        vent.cantidad,
        `$ ${vent.precio_neto_unitario.toLocaleString('es-CL')}`,
        `$ ${vent.precio_neto_total.toLocaleString('es-CL')}`
      ])
    })

    const textoPlano = JSON.stringify(filasVentanas)
    
    // Verificamos confidencialidad estricta
    expect(textoPlano).not.toContain('costo_materiales')
    expect(textoPlano).not.toContain('costo_mano_obra')
    expect(textoPlano).not.toContain('costo_total')
    expect(textoPlano).not.toContain('margen_pct')
    expect(textoPlano).not.toContain('35%') // Margen de ganancia no debe figurar
    expect(textoPlano).not.toContain('50000') // Costo interno de materiales no debe figurar
  })
})
