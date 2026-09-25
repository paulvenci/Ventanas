import type { Vidrieria } from '~/shared/tipos'

export const useVidrieria = () => {
  const supabase = useSupabaseClient()
  const vidrieria = useState<Vidrieria | null>('vidrieria', () => null)
  const cargando = useState<boolean>('vidrieria_cargando', () => false)
  const error = useState<string | null>('vidrieria_error', () => null)

  async function cargar() {
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('vidrierias')
        .select('*')
        .maybeSingle()

      if (err) throw err
      vidrieria.value = data
      return data
    } catch (err: any) {
      error.value = err.message || 'Error al cargar datos de la vidriería'
      return null
    } finally {
      cargando.value = false
    }
  }

  async function actualizar(datos: Partial<Vidrieria>) {
    if (!vidrieria.value) return
    cargando.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('vidrierias')
        .update(datos)
        .eq('id', vidrieria.value.id)
        .select()
        .single()

      if (err) throw err
      vidrieria.value = data
      return data
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar vidriería'
      throw err
    } finally {
      cargando.value = false
    }
  }

  return { vidrieria, cargando, error, cargar, actualizar }
}
