import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  Presupuesto,
  PresupuestoVentana,
  PresupuestoItemLibre,
  Vidrieria,
  Linea,
  Tipologia
} from '~~/shared/tipos'

export interface OpcionesGeneracionPdf {
  presupuesto: Presupuesto
  vidrieria: Vidrieria | null
  lineas?: Linea[]
  tipologias?: Tipologia[]
}

export const usePresupuestoPdf = () => {
  const generandiPdf = ref(false)

  // Formateador de moneda en pesos chilenos enteros
  function formatearDinero(valor: number = 0): string {
    return Math.round(valor).toLocaleString('es-CL')
  }

  // Convertir URL de imagen a Base64 de forma asíncrona
  async function cargarImagenBase64(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, { mode: 'cors' })
      if (!res.ok) return null
      const blob = await res.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }

  // Generar la instancia del documento jsPDF
  async function construirDocumentoPdf(opciones: OpcionesGeneracionPdf): Promise<jsPDF> {
    const { presupuesto, vidrieria, lineas = [], tipologias = [] } = opciones
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14

    // 1. Encabezado: Logo y datos de la vidriería
    let startY = margin

    if (vidrieria?.logo_url) {
      const logoBase64 = await cargarImagenBase64(vidrieria.logo_url)
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', margin, startY, 32, 18, undefined, 'FAST')
          startY += 20
        } catch {
          // Si falla la imagen, continuamos con texto
        }
      }
    }

    // Nombre de la Vidriería
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(15, 23, 42) // slate-900
    doc.text(vidrieria?.nombre || 'VIDRIERÍA', margin, startY + 4)

    // Datos de la vidriería (RUT, Dirección, Contacto)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105) // slate-600

    let infoVidrieriaY = startY + 9
    if (vidrieria?.rut) {
      doc.text(`RUT: ${vidrieria.rut}`, margin, infoVidrieriaY)
      infoVidrieriaY += 4
    }
    if (vidrieria?.direccion) {
      doc.text(vidrieria.direccion, margin, infoVidrieriaY)
      infoVidrieriaY += 4
    }
    const contacto = [vidrieria?.telefono, vidrieria?.correo].filter(Boolean).join(' • ')
    if (contacto) {
      doc.text(contacto, margin, infoVidrieriaY)
      infoVidrieriaY += 4
    }

    // Cuadro destacado derecho: Número y Fecha del Presupuesto
    const boxWidth = 72
    const boxHeight = 28
    const boxX = pageWidth - margin - boxWidth
    const boxY = margin

    doc.setFillColor(248, 250, 252) // slate-50
    doc.setDrawColor(203, 213, 225) // slate-300
    doc.setLineWidth(0.4)
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'FD')

    // Título Cotización / Presupuesto
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(2, 132, 199) // sky-600
    doc.text(`PRESUPUESTO #${presupuesto.numero}`, boxX + 6, boxY + 7)

    // Fecha y validez
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(51, 65, 85) // slate-700
    doc.text(`Fecha: ${presupuesto.fecha}`, boxX + 6, boxY + 13)
    doc.text(`Validez: ${presupuesto.validez_dias} días corridos`, boxX + 6, boxY + 18)

    // Estado del presupuesto
    const estadoEtiqueta = (presupuesto.estado || 'borrador').toUpperCase()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    if (presupuesto.estado === 'aceptado') {
      doc.setTextColor(22, 101, 52) // verde
    } else if (presupuesto.estado === 'rechazado') {
      doc.setTextColor(185, 28, 28) // rojo
    } else {
      doc.setTextColor(71, 85, 105)
    }
    doc.text(`Estado: ${estadoEtiqueta}`, boxX + 6, boxY + 23)

    // 2. Bloque de Datos del Cliente
    const clientBoxY = Math.max(infoVidrieriaY + 2, boxY + boxHeight + 4)
    const clientBoxWidth = pageWidth - (margin * 2)
    const clientBoxHeight = 22

    doc.setFillColor(241, 245, 249) // slate-100
    doc.setDrawColor(226, 232, 240) // slate-200
    doc.roundedRect(margin, clientBoxY, clientBoxWidth, clientBoxHeight, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text('DATOS DEL CLIENTE', margin + 4, clientBoxY + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(51, 65, 85)

    const col1X = margin + 4
    const col2X = margin + 95

    doc.text(`Cliente: ${presupuesto.cliente_nombre || 'Particular'}`, col1X, clientBoxY + 11)
    if (presupuesto.cliente_telefono) {
      doc.text(`Teléfono / WhatsApp: ${presupuesto.cliente_telefono}`, col1X, clientBoxY + 16.5)
    }

    if (presupuesto.cliente_correo) {
      doc.text(`Correo: ${presupuesto.cliente_correo}`, col2X, clientBoxY + 11)
    }
    if (presupuesto.cliente_direccion) {
      doc.text(`Dirección / Obra: ${presupuesto.cliente_direccion}`, col2X, clientBoxY + 16.5)
    }

    // 3. Tabla de Ventanas y Productos
    const tableStartY = clientBoxY + clientBoxHeight + 6

    const filasVentanas: any[] = []
    const ventanas = presupuesto.ventanas || []

    ventanas.forEach((vent, idx) => {
      const calc = vent.calculo_snapshot
      // Resolver nombre de línea y tipología
      const lineaNombre = calc?.linea?.nombre ||
        lineas.find(l => l.id === vent.linea_id)?.nombre ||
        'Estándar'

      const tipologiaNombre = calc?.tipologia?.nombre ||
        tipologias.find(t => t.id === vent.tipologia_id)?.nombre ||
        'Ventana'

      const vidrioNombre = calc?.vidrio?.nombre || 'Vidrio Estándar'
      const colorNombre = calc?.color?.nombre || 'Color Estándar'
      const marcoInfo = calc?.marco_madera?.nombre
        ? `\n+ Marco Madera: ${calc.marco_madera.nombre} (${calc.marco_madera.espesor_cm} cm)`
        : ''

      const observacion = vent.observacion ? `\nNota: ${vent.observacion}` : ''

      filasVentanas.push([
        `V${idx + 1}`,
        {
          content: `${tipologiaNombre} (${lineaNombre})\nVidrio: ${vidrioNombre} • Color: ${colorNombre}${marcoInfo}${observacion}`
        },
        `${vent.ancho_vano} × ${vent.alto_vano} cm`,
        vent.cantidad,
        `$ ${formatearDinero(vent.precio_neto_unitario)}`,
        `$ ${formatearDinero(vent.precio_neto_total)}`
      ])
    })

    // Ítems libres adicionales (si existen)
    const itemsLibres = presupuesto.items_libres || []
    itemsLibres.forEach((item, idx) => {
      filasVentanas.push([
        `S${idx + 1}`,
        {
          content: `${item.descripcion} (Ítem Libre / Servicio)`
        },
        '—',
        item.cantidad,
        `$ ${formatearDinero(item.precio_unitario_neto)}`,
        `$ ${formatearDinero(item.total_neto)}`
      ])
    })

    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Descripción y Especificaciones', 'Vano', 'Cant.', 'P. Unit. Neto', 'Total Neto']],
      body: filasVentanas,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 2.8,
        lineColor: [226, 232, 240]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10, fontStyle: 'bold', textColor: [2, 132, 199] },
        1: { cellWidth: 84 },
        2: { halign: 'center', cellWidth: 26 },
        3: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
        4: { halign: 'right', cellWidth: 24 },
        5: { halign: 'right', cellWidth: 24, fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin }
    })

    // 4. Bloque de Totales y Observaciones
    let finalY = (doc as any).lastAutoTable.finalY + 6

    // Si nos acercamos demasiado al fondo, creamos nueva página
    if (finalY + 50 > pageHeight - margin) {
      doc.addPage()
      finalY = margin + 5
    }

    const totalsBoxWidth = 75
    const totalsBoxX = pageWidth - margin - totalsBoxWidth

    // Observaciones (a la izquierda)
    const obsWidth = pageWidth - (margin * 2) - totalsBoxWidth - 8
    if (presupuesto.observaciones) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(15, 23, 42)
      doc.text('Observaciones y Condiciones:', margin, finalY + 4)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      const lineasObs = doc.splitTextToSize(presupuesto.observaciones, obsWidth)
      doc.text(lineasObs, margin, finalY + 9)
    }

    // Desglose de Totales (a la derecha)
    let currentTotalsY = finalY
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)

    // Subtotal Neto
    doc.text('Subtotal Neto:', totalsBoxX, currentTotalsY + 4)
    doc.text(`$ ${formatearDinero(presupuesto.subtotal_neto)}`, pageWidth - margin, currentTotalsY + 4, { align: 'right' })
    currentTotalsY += 5.5

    // Descuento (si existe)
    if (presupuesto.descuento_neto > 0) {
      doc.setTextColor(220, 38, 38) // rojo
      const etiquetaDesc = presupuesto.descuento_tipo === 'porcentaje'
        ? `Descuento (${presupuesto.descuento_valor}%):`
        : 'Descuento:'
      doc.text(etiquetaDesc, totalsBoxX, currentTotalsY + 4)
      doc.text(`-$ ${formatearDinero(presupuesto.descuento_neto)}`, pageWidth - margin, currentTotalsY + 4, { align: 'right' })
      currentTotalsY += 5.5

      doc.setTextColor(71, 85, 105)
      doc.text('Neto c/ Descuento:', totalsBoxX, currentTotalsY + 4)
      doc.text(`$ ${formatearDinero(presupuesto.neto)}`, pageWidth - margin, currentTotalsY + 4, { align: 'right' })
      currentTotalsY += 5.5
    }

    // IVA (19%)
    doc.setTextColor(71, 85, 105)
    doc.text('IVA (19%):', totalsBoxX, currentTotalsY + 4)
    doc.text(`$ ${formatearDinero(presupuesto.iva)}`, pageWidth - margin, currentTotalsY + 4, { align: 'right' })
    currentTotalsY += 7

    // Caja destacada de TOTAL
    doc.setFillColor(15, 23, 42) // slate-900
    doc.roundedRect(totalsBoxX, currentTotalsY, totalsBoxWidth, 10, 1.5, 1.5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL:', totalsBoxX + 4, currentTotalsY + 6.8)
    doc.text(`$ ${formatearDinero(presupuesto.total)}`, pageWidth - margin - 4, currentTotalsY + 6.8, { align: 'right' })

    // 5. Pie de página en todas las páginas (Paginación)
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184) // slate-400

      // Línea divisoria inferior
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.2)
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)

      const footerTexto = `${vidrieria?.nombre || 'Ventanas'} • Presupuesto Comercial #${presupuesto.numero}`
      doc.text(footerTexto, margin, pageHeight - 6)
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: 'right' })
    }

    return doc
  }

  // Nombre de archivo normalizado
  function generarNombreArchivo(presupuesto: Presupuesto): string {
    const clienteSanitizado = (presupuesto.cliente_nombre || 'Cliente')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 20)
    return `Presupuesto_${presupuesto.numero}_${clienteSanitizado}.pdf`
  }

  // Descarga directa en el navegador
  async function descargarPdf(opciones: OpcionesGeneracionPdf): Promise<void> {
    generandiPdf.value = true
    try {
      const doc = await construirDocumentoPdf(opciones)
      const filename = generarNombreArchivo(opciones.presupuesto)
      doc.save(filename)
    } finally {
      generandiPdf.value = false
    }
  }

  // Compartir por WhatsApp (con Web Share API en celulares o enlace wa.me en PC)
  async function compartirWhatsApp(opciones: OpcionesGeneracionPdf): Promise<{ enviado: boolean; metodo: 'share' | 'wa_link' }> {
    generandiPdf.value = true
    try {
      const { presupuesto, vidrieria } = opciones
      const doc = await construirDocumentoPdf(opciones)
      const filename = generarNombreArchivo(presupuesto)
      const pdfBlob = doc.output('blob')
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })

      // Texto prellenado del mensaje
      const nombreVidrieria = vidrieria?.nombre || 'nuestra vidriería'
      const textoMensaje = `Hola ${presupuesto.cliente_nombre || ''}, adjuntamos el Presupuesto #${presupuesto.numero} de ${nombreVidrieria} por un total de $${formatearDinero(presupuesto.total)} (IVA incluido). Quedamos atentos a cualquier consulta.`

      // Caso 1: Dispositivo móvil con Web Share API y soporte de archivos
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        try {
          await navigator.share({
            title: `Presupuesto #${presupuesto.numero} - ${nombreVidrieria}`,
            text: textoMensaje,
            files: [pdfFile]
          })
          return { enviado: true, metodo: 'share' }
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            // El usuario canceló el diálogo nativo de compartir
            return { enviado: false, metodo: 'share' }
          }
          // Si falló el share nativo, continuamos con el fallback de PC
        }
      }

      // Caso 2: Computador de escritorio o navegador sin Web Share de archivos
      // A) Descargamos automáticamente el PDF al equipo
      doc.save(filename)

      // B) Abrimos WhatsApp Web con el chat y mensaje prellenado
      let telefono = (presupuesto.cliente_telefono || '').replace(/\D/g, '')
      if (telefono.length === 9 && !telefono.startsWith('56')) {
        telefono = `56${telefono}` // Formato celular chileno internacional
      }

      const urlWa = telefono
        ? `https://wa.me/${telefono}?text=${encodeURIComponent(textoMensaje)}`
        : `https://wa.me/?text=${encodeURIComponent(textoMensaje)}`

      if (typeof window !== 'undefined') {
        window.open(urlWa, '_blank')
      }

      return { enviado: true, metodo: 'wa_link' }
    } finally {
      generandiPdf.value = false
    }
  }

  return {
    generandiPdf,
    construirDocumentoPdf,
    descargarPdf,
    compartirWhatsApp,
    formatearDinero
  }
}
