import { calcularVentana } from '~~/shared/calculo'
import type {
  Linea,
  Tipologia,
  FormulaTipologia,
  Vidrio,
  Color,
  MarcoMadera,
  ItemManualVentana,
  AjustePerfilVentana,
  ResultadoCalculoVentana
} from '~~/shared/tipos'

export const useCalculoVentana = () => {
  const { vidrieria } = useVidrieria()
  const { perfiles, accesorios, formulas } = useCatalogos()

  // Estado del configurador
  const anchoVano = ref<number>(150)
  const altoVano = ref<number>(120)
  const cantidad = ref<number>(1)

  const lineaSeleccionada = ref<Linea | null>(null)
  const tipologiaSeleccionada = ref<Tipologia | null>(null)
  const vidrioSeleccionado = ref<Vidrio | null>(null)
  const colorSeleccionado = ref<Color | null>(null)
  const marcoMaderaSeleccionado = ref<MarcoMadera | null>(null)

  const margenOverride = ref<number | null>(null)
  const ajustesPerfiles = ref<Record<string, AjustePerfilVentana>>({})
  const itemsManuales = ref<ItemManualVentana[]>([])

  // Fórmula correspondiente a la combinación tipologia + linea seleccionada
  const formulaAplicable = computed<FormulaTipologia | null>(() => {
    if (!tipologiaSeleccionada.value || !lineaSeleccionada.value) return null
    return formulas.value.find(
      f => f.tipologia_id === tipologiaSeleccionada.value?.id &&
           f.linea_id === lineaSeleccionada.value?.id
    ) || null
  })

  // Resultado reactivo del cálculo
  const resultado = computed<ResultadoCalculoVentana>(() => {
    if (!lineaSeleccionada.value || !tipologiaSeleccionada.value || !vidrioSeleccionado.value) {
      return {
        valido: false,
        errores: ['Selecciona línea, tipología y tipo de vidrio para calcular'],
        dimensiones: {
          ancho_vano: anchoVano.value,
          alto_vano: altoVano.value,
          cantidad: cantidad.value,
          espesor_marco_cm: 0,
          ancho_util: anchoVano.value,
          alto_util: altoVano.value,
          ancho_vidrio_cm: 0,
          alto_vidrio_cm: 0,
          m2_vidrio_unitario: 0,
          m2_vidrio_total: 0
        },
        perfiles: [],
        vidrio: {
          vidrio_id: '',
          nombre: '',
          espesor_mm: 0,
          m2_unitario: 0,
          m2_total: 0,
          precio_m2: 0,
          merma_pct: 0,
          costo_neto: 0
        },
        color: {
          nombre: 'Estándar',
          tipo_recargo: 'ninguno',
          valor_recargo: 0,
          recargo_neto: 0
        },
        accesorios: [],
        marco_madera: undefined,
        items_manuales: [],
        mano_obra: {
          fijo_unitario: 0,
          m2_unitario: 0,
          costo_unitario: 0,
          costo_neto: 0
        },
        totales: {
          costo_perfiles: 0,
          recargo_color: 0,
          costo_vidrio: 0,
          costo_accesorios: 0,
          costo_marco_madera: 0,
          costo_items_manuales: 0,
          costo_materiales: 0,
          costo_mano_obra: 0,
          costo_total: 0,
          margen_pct: 0,
          ganancia_neta: 0,
          precio_neto_total: 0,
          precio_neto_unitario: 0
        }
      }
    }

    return calcularVentana({
      ancho_vano: anchoVano.value,
      alto_vano: altoVano.value,
      cantidad: cantidad.value,
      linea: lineaSeleccionada.value,
      tipologia: tipologiaSeleccionada.value,
      formula: formulaAplicable.value,
      vidrio: vidrioSeleccionado.value,
      color: colorSeleccionado.value,
      marco_madera: marcoMaderaSeleccionado.value,
      perfiles_catalogo: perfiles.value,
      accesorios_catalogo: accesorios.value,
      merma_vidrieria_defecto: vidrieria.value?.merma_defecto ?? 5,
      merma_vidrio_defecto: 0,
      mano_obra_fijo_defecto: vidrieria.value?.mano_obra_fijo_defecto ?? 0,
      mano_obra_m2_defecto: vidrieria.value?.mano_obra_m2_defecto ?? 0,
      margen_comercial_defecto: vidrieria.value?.margen_defecto ?? 30,
      margen_comercial_override: margenOverride.value,
      ajustes_perfiles: ajustesPerfiles.value,
      items_manuales: itemsManuales.value
    })
  })

  return {
    anchoVano,
    altoVano,
    cantidad,
    lineaSeleccionada,
    tipologiaSeleccionada,
    vidrioSeleccionado,
    colorSeleccionado,
    marcoMaderaSeleccionado,
    margenOverride,
    ajustesPerfiles,
    itemsManuales,
    formulaAplicable,
    resultado
  }
}
