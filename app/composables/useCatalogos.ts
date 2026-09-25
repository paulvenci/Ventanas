import type {
  Linea,
  Perfil,
  Vidrio,
  Color,
  Accesorio,
  MarcoMadera,
  Tipologia,
  FormulaTipologia
} from '~~/shared/tipos'

export const useCatalogos = () => {
  const supabase = useSupabaseClient()
  const { vidrieria } = useVidrieria()

  // Estados locales reactivos
  const lineas = useState<Linea[]>('cat_lineas', () => [])
  const perfiles = useState<Perfil[]>('cat_perfiles', () => [])
  const vidrios = useState<Vidrio[]>('cat_vidrios', () => [])
  const colores = useState<Color[]>('cat_colores', () => [])
  const accesorios = useState<Accesorio[]>('cat_accesorios', () => [])
  const marcosMadera = useState<MarcoMadera[]>('cat_marcos_madera', () => [])
  const tipologias = useState<Tipologia[]>('cat_tipologias', () => [])
  const formulas = useState<FormulaTipologia[]>('cat_formulas', () => [])

  const cargando = ref(false)
  const error = ref<string | null>(null)

  // Métodos de carga
  async function cargarLineas() {
    const { data, error: err } = await supabase
      .from('lineas')
      .select('*')
      .order('nombre', { ascending: true })
    if (err) throw err
    lineas.value = data || []
    return lineas.value
  }

  async function cargarPerfiles(lineaId?: string) {
    let query = supabase
      .from('perfiles')
      .select('*, linea:lineas(*)')
      .order('nombre', { ascending: true })

    if (lineaId) {
      query = query.eq('linea_id', lineaId)
    }

    const { data, error: err } = await query
    if (err) throw err
    perfiles.value = data || []
    return perfiles.value
  }

  async function cargarVidrios() {
    const { data, error: err } = await supabase
      .from('vidrios')
      .select('*')
      .order('nombre', { ascending: true })
    if (err) throw err
    vidrios.value = data || []
    return vidrios.value
  }

  async function cargarColores() {
    const { data, error: err } = await supabase
      .from('colores')
      .select('*')
      .order('nombre', { ascending: true })
    if (err) throw err
    colores.value = data || []
    return colores.value
  }

  async function cargarAccesorios() {
    const { data, error: err } = await supabase
      .from('accesorios')
      .select('*')
      .order('nombre', { ascending: true })
    if (err) throw err
    accesorios.value = data || []
    return accesorios.value
  }

  async function cargarMarcosMadera() {
    const { data, error: err } = await supabase
      .from('marcos_madera')
      .select('*')
      .order('nombre', { ascending: true })
    if (err) throw err
    marcosMadera.value = data || []
    return marcosMadera.value
  }

  async function cargarTipologias() {
    const { data, error: err } = await supabase
      .from('tipologias')
      .select('*')
      .order('nombre', { ascending: true })
    if (err) throw err
    tipologias.value = data || []
    return tipologias.value
  }

  async function cargarFormulas(tipologiaId?: string, lineaId?: string) {
    let query = supabase
      .from('formulas_tipologia')
      .select('*')

    if (tipologiaId) query = query.eq('tipologia_id', tipologiaId)
    if (lineaId) query = query.eq('linea_id', lineaId)

    const { data, error: err } = await query
    if (err) throw err
    formulas.value = data || []
    return formulas.value
  }

  async function cargarTodo() {
    cargando.value = true
    error.value = null
    try {
      await Promise.all([
        cargarLineas(),
        cargarPerfiles(),
        cargarVidrios(),
        cargarColores(),
        cargarAccesorios(),
        cargarMarcosMadera(),
        cargarTipologias(),
        cargarFormulas()
      ])
    } catch (err: any) {
      error.value = err.message || 'Error al cargar catálogos'
    } finally {
      cargando.value = false
    }
  }

  // Operaciones de guardado / edición
  async function guardarLinea(datos: Partial<Linea>) {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')
    const payload = { ...datos, vidrieria_id: vidrieria.value.id }
    
    if (datos.id) {
      const { data, error: err } = await supabase
        .from('lineas')
        .update(payload)
        .eq('id', datos.id)
        .select()
        .single()
      if (err) throw err
      await cargarLineas()
      return data
    } else {
      const { data, error: err } = await supabase
        .from('lineas')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      await cargarLineas()
      return data
    }
  }

  async function guardarPerfil(datos: Partial<Perfil>) {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')
    const payload = { ...datos, vidrieria_id: vidrieria.value.id }
    delete (payload as any).linea

    if (datos.id) {
      const { data, error: err } = await supabase
        .from('perfiles')
        .update(payload)
        .eq('id', datos.id)
        .select()
        .single()
      if (err) throw err
      await cargarPerfiles()
      return data
    } else {
      const { data, error: err } = await supabase
        .from('perfiles')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      await cargarPerfiles()
      return data
    }
  }

  async function guardarVidrio(datos: Partial<Vidrio>) {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')
    const payload = { ...datos, vidrieria_id: vidrieria.value.id }

    if (datos.id) {
      const { data, error: err } = await supabase
        .from('vidrios')
        .update(payload)
        .eq('id', datos.id)
        .select()
        .single()
      if (err) throw err
      await cargarVidrios()
      return data
    } else {
      const { data, error: err } = await supabase
        .from('vidrios')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      await cargarVidrios()
      return data
    }
  }

  async function guardarColor(datos: Partial<Color>) {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')
    const payload = { ...datos, vidrieria_id: vidrieria.value.id }

    if (datos.id) {
      const { data, error: err } = await supabase
        .from('colores')
        .update(payload)
        .eq('id', datos.id)
        .select()
        .single()
      if (err) throw err
      await cargarColores()
      return data
    } else {
      const { data, error: err } = await supabase
        .from('colores')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      await cargarColores()
      return data
    }
  }

  async function guardarAccesorio(datos: Partial<Accesorio>) {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')
    const payload = { ...datos, vidrieria_id: vidrieria.value.id }

    if (datos.id) {
      const { data, error: err } = await supabase
        .from('accesorios')
        .update(payload)
        .eq('id', datos.id)
        .select()
        .single()
      if (err) throw err
      await cargarAccesorios()
      return data
    } else {
      const { data, error: err } = await supabase
        .from('accesorios')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      await cargarAccesorios()
      return data
    }
  }

  async function guardarMarcoMadera(datos: Partial<MarcoMadera>) {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')
    const payload = { ...datos, vidrieria_id: vidrieria.value.id }

    if (datos.id) {
      const { data, error: err } = await supabase
        .from('marcos_madera')
        .update(payload)
        .eq('id', datos.id)
        .select()
        .single()
      if (err) throw err
      await cargarMarcosMadera()
      return data
    } else {
      const { data, error: err } = await supabase
        .from('marcos_madera')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      await cargarMarcosMadera()
      return data
    }
  }

  async function guardarTipologia(datos: Partial<Tipologia>) {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')
    const payload = { ...datos, vidrieria_id: vidrieria.value.id }

    if (datos.id) {
      const { data, error: err } = await supabase
        .from('tipologias')
        .update(payload)
        .eq('id', datos.id)
        .select()
        .single()
      if (err) throw err
      await cargarTipologias()
      return data
    } else {
      const { data, error: err } = await supabase
        .from('tipologias')
        .insert(payload)
        .select()
        .single()
      if (err) throw err
      await cargarTipologias()
      return data
    }
  }

  async function guardarFormula(datos: Partial<FormulaTipologia>) {
    if (!vidrieria.value) throw new Error('No hay vidriería activa')
    const payload = { ...datos, vidrieria_id: vidrieria.value.id }

    const { data, error: err } = await supabase
      .from('formulas_tipologia')
      .upsert(payload, { onConflict: 'vidrieria_id,tipologia_id,linea_id' })
      .select()
      .single()

    if (err) throw err
    await cargarFormulas()
    return data
  }

  // Toggle de activación / desactivación
  async function toggleActivo(tabla: string, id: string, estadoActual: boolean) {
    const nuevoEstado = !estadoActual
    const { error: err } = await (supabase.from(tabla as any) as any)
      .update({ activo: nuevoEstado })
      .eq('id', id)
    if (err) throw err
    return nuevoEstado
  }

  return {
    lineas,
    perfiles,
    vidrios,
    colores,
    accesorios,
    marcosMadera,
    tipologias,
    formulas,
    cargando,
    error,
    cargarTodo,
    cargarLineas,
    cargarPerfiles,
    cargarVidrios,
    cargarColores,
    cargarAccesorios,
    cargarMarcosMadera,
    cargarTipologias,
    cargarFormulas,
    guardarLinea,
    guardarPerfil,
    guardarVidrio,
    guardarColor,
    guardarAccesorio,
    guardarMarcoMadera,
    guardarTipologia,
    guardarFormula,
    toggleActivo
  }
}
