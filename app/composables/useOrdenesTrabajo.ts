import type { OrdenTrabajo, EstadoOT } from '~~/shared/tipos'

export const useOrdenesTrabajo = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { vidrieria } = useVidrieria()

  const ordenes = useState<OrdenTrabajo[]>('ordenes_trabajo_lista', () => [])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  // 1. Cargar todas las órdenes de trabajo
  async function cargarOrdenesTrabajo() {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('ordenes_trabajo')
        .select(`
          *,
          presupuesto:presupuestos(
            id,
            numero,
            cliente_nombre,
            cliente_telefono,
            cliente_direccion,
            total,
            estado,
            ventanas:presupuesto_ventanas(*)
          )
        `)
        .order('numero', { ascending: false })

      if (err) throw err
      ordenes.value = data || []
      return ordenes.value
    } catch (err: any) {
      error.value = err.message || 'Error al cargar órdenes de trabajo'
      return []
    } finally {
      cargando.value = false
    }
  }

  // 2. Cargar una OT específica por ID
  async function cargarOTPorId(id: string): Promise<OrdenTrabajo | null> {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('ordenes_trabajo')
        .select(`
          *,
          presupuesto:presupuestos(
            *,
            ventanas:presupuesto_ventanas(*),
            items_libres:presupuesto_items_libres(*)
          )
        `)
        .eq('id', id)
        .single()

      if (err) throw err
      return data
    } catch (err: any) {
      error.value = err.message || 'Error al obtener orden de trabajo'
      return null
    } finally {
      cargando.value = false
    }
  }

  // 3. Verificar si un presupuesto ya tiene una OT asociada
  async function obtenerOTPorPresupuestoId(presupuestoId: string): Promise<OrdenTrabajo | null> {
    try {
      const { data, error: err } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .maybeSingle()

      if (err) throw err
      return data
    } catch {
      return null
    }
  }

  // 4. Crear OT desde un presupuesto aceptado
  async function crearOTDesdePresupuesto(
    presupuestoId: string,
    datos: { fecha_entrega?: string | null; observaciones?: string | null } = {}
  ): Promise<OrdenTrabajo> {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')

    // Verificar si ya existe OT para este presupuesto
    const existente = await obtenerOTPorPresupuestoId(presupuestoId)
    if (existente) {
      return existente
    }

    cargando.value = true
    error.value = null

    try {
      // 1. Obtener siguiente correlativo
      const { data: numData, error: errNum } = await supabase.rpc('next_numero_ot', {
        p_vidrieria_id: vidrieria.value.id
      })
      if (errNum) throw errNum
      const numeroOT = numData as number

      // 2. Insertar orden de trabajo
      const payload = {
        vidrieria_id: vidrieria.value.id,
        presupuesto_id: presupuestoId,
        numero: numeroOT,
        estado: 'pendiente' as EstadoOT,
        fecha_creacion: new Date().toISOString().split('T')[0],
        fecha_entrega: datos.fecha_entrega || null,
        observaciones: datos.observaciones || null,
        created_by: user.value?.id || null
      }

      const { data, error: errInsert } = await supabase
        .from('ordenes_trabajo')
        .insert(payload)
        .select()
        .single()

      if (errInsert) throw errInsert

      await cargarOrdenesTrabajo()
      return data
    } catch (err: any) {
      error.value = err.message || 'Error al crear la orden de trabajo'
      throw err
    } finally {
      cargando.value = false
    }
  }

  // 5. Cambiar estado de la OT
  async function cambiarEstadoOT(id: string, nuevoEstado: EstadoOT) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('ordenes_trabajo')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err

      // Actualizar en el estado local
      const idx = ordenes.value.findIndex(o => o.id === id)
      if (idx !== -1) {
        ordenes.value[idx].estado = nuevoEstado
      }

      return data
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar estado de la orden de trabajo'
      throw err
    } finally {
      cargando.value = false
    }
  }

  // 6. Actualizar datos generales (fechas, observaciones)
  async function actualizarOT(id: string, datos: Partial<OrdenTrabajo>) {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('ordenes_trabajo')
        .update({
          fecha_entrega: datos.fecha_entrega,
          observaciones: datos.observaciones,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      await cargarOrdenesTrabajo()
      return data
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar orden de trabajo'
      throw err
    } finally {
      cargando.value = false
    }
  }

  return {
    ordenes,
    ordenesTrabajo: ordenes,
    cargando,
    error,
    cargarOrdenesTrabajo,
    cargarOTPorId,
    obtenerOTPorPresupuestoId,
    crearOTDesdePresupuesto,
    cambiarEstadoOT,
    actualizarOT
  }
}
