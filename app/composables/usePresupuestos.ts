import type {
  Presupuesto,
  PresupuestoVentana,
  PresupuestoItemLibre,
  Cliente,
  EstadoPresupuesto
} from '~~/shared/tipos'
import { calcularTotalesPresupuesto } from '~~/shared/calculo'

export const usePresupuestos = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { vidrieria } = useVidrieria()

  const presupuestos = useState<Presupuesto[]>('presupuestos_lista', () => [])
  const clientes = useState<Cliente[]>('presupuestos_clientes', () => [])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  // 1. Cargar presupuestos
  async function cargarPresupuestos() {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('presupuestos')
        .select('*, ventanas:presupuesto_ventanas(*), items_libres:presupuesto_items_libres(*)')
        .order('numero', { ascending: false })

      if (err) throw err
      presupuestos.value = data || []
      return presupuestos.value
    } catch (err: any) {
      error.value = err.message || 'Error al cargar presupuestos'
      return []
    } finally {
      cargando.value = false
    }
  }

  // 2. Cargar presupuesto por ID
  async function cargarPresupuestoPorId(id: string): Promise<Presupuesto | null> {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('presupuestos')
        .select('*, ventanas:presupuesto_ventanas(*), items_libres:presupuesto_items_libres(*)')
        .eq('id', id)
        .single()

      if (err) throw err
      return data
    } catch (err: any) {
      error.value = err.message || 'Error al obtener el presupuesto'
      return null
    } finally {
      cargando.value = false
    }
  }

  // 3. Clientes
  async function cargarClientes() {
    const { data, error: err } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true })

    if (err) throw err
    clientes.value = data || []
    return clientes.value
  }

  async function guardarCliente(clienteData: { nombre: string; telefono?: string; correo?: string; direccion?: string }) {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')

    const { data, error: err } = await supabase
      .from('clientes')
      .insert({
        vidrieria_id: vidrieria.value.id,
        nombre: clienteData.nombre.trim(),
        telefono: clienteData.telefono?.trim() || null,
        correo: clienteData.correo?.trim() || null,
        direccion: clienteData.direccion?.trim() || null
      })
      .select()
      .single()

    if (err) throw err
    await cargarClientes()
    return data
  }

  // 4. Guardar Presupuesto (Crear o Actualizar)
  async function guardarPresupuesto(
    cabecera: Partial<Presupuesto>,
    ventanas: PresupuestoVentana[] = [],
    itemsLibres: PresupuestoItemLibre[] = []
  ): Promise<Presupuesto> {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')

    if (ventanas.length === 0 && itemsLibres.length === 0) {
      throw new Error('El presupuesto debe contener al menos una ventana o un ítem libre')
    }

    // Calcular totales comerciales
    const totales = calcularTotalesPresupuesto(
      ventanas,
      itemsLibres,
      cabecera.descuento_tipo || 'monto',
      cabecera.descuento_valor || 0
    )

    // Si el cliente no tiene ID pero se ingresó un nombre, buscar o crear
    let clienteId = cabecera.cliente_id || null
    if (!clienteId && cabecera.cliente_nombre?.trim()) {
      const clienteExistente = clientes.value.find(
        c => c.nombre.trim().toLowerCase() === cabecera.cliente_nombre!.trim().toLowerCase()
      )
      if (clienteExistente) {
        clienteId = clienteExistente.id
      } else {
        const nuevoCliente = await guardarCliente({
          nombre: cabecera.cliente_nombre,
          telefono: cabecera.cliente_telefono || undefined,
          correo: cabecera.cliente_correo || undefined,
          direccion: cabecera.cliente_direccion || undefined
        })
        clienteId = nuevoCliente.id
      }
    }

    const payloadCabecera = {
      vidrieria_id: vidrieria.value.id,
      cliente_id: clienteId,
      cliente_nombre: cabecera.cliente_nombre?.trim() || 'Cliente General',
      cliente_telefono: cabecera.cliente_telefono?.trim() || null,
      cliente_correo: cabecera.cliente_correo?.trim() || null,
      cliente_direccion: cabecera.cliente_direccion?.trim() || null,
      fecha: cabecera.fecha || new Date().toISOString().split('T')[0],
      validez_dias: cabecera.validez_dias || 15,
      observaciones: cabecera.observaciones?.trim() || null,
      descuento_tipo: cabecera.descuento_tipo || 'monto',
      descuento_valor: cabecera.descuento_valor || 0,
      subtotal_neto: totales.subtotal_neto,
      descuento_neto: totales.descuento_neto,
      neto: totales.neto,
      iva: totales.iva,
      total: totales.total,
      estado: cabecera.estado || 'borrador',
      created_by: user.value?.id || null,
      updated_at: new Date().toISOString()
    }

    let presupuestoGuardado: Presupuesto

    if (cabecera.id) {
      // Actualizar existente
      const { data, error: err } = await supabase
        .from('presupuestos')
        .update(payloadCabecera)
        .eq('id', cabecera.id)
        .select()
        .single()

      if (err) throw err
      presupuestoGuardado = data

      // Limpiar y recrear líneas de ventanas e ítems libres
      await supabase.from('presupuesto_ventanas').delete().eq('presupuesto_id', cabecera.id)
      await supabase.from('presupuesto_items_libres').delete().eq('presupuesto_id', cabecera.id)
    } else {
      // Obtener número correlativo
      const { data: numData, error: numErr } = await supabase.rpc('obtener_siguiente_numero_presupuesto', {
        p_vidrieria_id: vidrieria.value.id
      })
      if (numErr) throw numErr
      const numeroCorrelativo = numData || 1

      const { data, error: err } = await supabase
        .from('presupuestos')
        .insert({
          ...payloadCabecera,
          numero: numeroCorrelativo
        })
        .select()
        .single()

      if (err) throw err
      presupuestoGuardado = data
    }

    // Insertar ventanas
    if (ventanas.length > 0) {
      const payloadVentanas = ventanas.map((v, idx) => ({
        presupuesto_id: presupuestoGuardado.id,
        vidrieria_id: vidrieria.value!.id,
        posicion: idx + 1,
        linea_id: v.linea_id || null,
        tipologia_id: v.tipologia_id || null,
        vidrio_id: v.vidrio_id || null,
        color_id: v.color_id || null,
        marco_madera_id: v.marco_madera_id || null,
        ancho_vano: v.ancho_vano,
        alto_vano: v.alto_vano,
        cantidad: v.cantidad,
        margen_pct: v.margen_pct,
        observacion: v.observacion || null,
        costo_materiales: v.costo_materiales,
        costo_mano_obra: v.costo_mano_obra,
        costo_total: v.costo_total,
        precio_neto_unitario: v.precio_neto_unitario,
        precio_neto_total: v.precio_neto_total,
        calculo_snapshot: v.calculo_snapshot
      }))

      const { error: ventErr } = await supabase.from('presupuesto_ventanas').insert(payloadVentanas)
      if (ventErr) throw ventErr
    }

    // Insertar ítems libres
    if (itemsLibres.length > 0) {
      const payloadItems = itemsLibres.map((it, idx) => ({
        presupuesto_id: presupuestoGuardado.id,
        vidrieria_id: vidrieria.value!.id,
        posicion: idx + 1,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario_neto: it.precio_unitario_neto,
        total_neto: Math.round(it.cantidad * it.precio_unitario_neto)
      }))

      const { error: itemErr } = await supabase.from('presupuesto_items_libres').insert(payloadItems)
      if (itemErr) throw itemErr
    }

    await cargarPresupuestos()
    return presupuestoGuardado
  }

  // 5. Cambiar Estado
  async function cambiarEstado(id: string, nuevoEstado: EstadoPresupuesto) {
    const { data, error: err } = await supabase
      .from('presupuestos')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (err) throw err
    await cargarPresupuestos()
    return data
  }

  // 6. Duplicar Presupuesto
  async function duplicarPresupuesto(id: string): Promise<Presupuesto> {
    const original = await cargarPresupuestoPorId(id)
    if (!original) throw new Error('Presupuesto original no encontrado')

    const { id: _, numero: __, created_at: ___, updated_at: ____, ...resto } = original

    return await guardarPresupuesto(
      {
        ...resto,
        id: undefined,
        estado: 'borrador',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: original.observaciones ? `${original.observaciones} (Copia de #${original.numero})` : `Copia de #${original.numero}`
      },
      original.ventanas || [],
      original.items_libres || []
    )
  }

  return {
    presupuestos,
    clientes,
    cargando,
    error,
    cargarPresupuestos,
    cargarPresupuestoPorId,
    cargarClientes,
    guardarCliente,
    guardarPresupuesto,
    cambiarEstado,
    duplicarPresupuesto
  }
}
