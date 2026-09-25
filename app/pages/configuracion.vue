<template>
  <div class="container" style="max-width: 800px;">
    <div style="margin-bottom: 2rem;">
      <h1>Configuración de la Vidriería</h1>
      <p class="subtitle">Administra los datos comerciales, logo y valores predeterminados para presupuestos</p>
    </div>

    <div v-if="mensajeExito" class="alert alert-success">
      <span>{{ mensajeExito }}</span>
    </div>

    <div v-if="mensajeError" class="alert alert-danger">
      <span>{{ mensajeError }}</span>
    </div>

    <div class="card" style="margin-bottom: 2rem;">
      <h3 style="margin-bottom: 1.25rem;">Logo de la Empresa</h3>

      <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
        <div style="width: 100px; height: 100px; border-radius: 8px; border: 1px dashed var(--border-color); display: flex; align-items: center; justify-content: center; background: #0b1120; overflow: hidden;">
          <img v-if="form.logo_url" :src="form.logo_url" alt="Logo de la vidriería" style="width: 100%; height: 100%; object-fit: contain;" />
          <span v-else style="font-size: 0.8rem; color: var(--text-dim); text-align: center; padding: 0.5rem;">Sin logo</span>
        </div>

        <div style="flex: 1; min-width: 240px;">
          <label class="form-label" for="logoInput">Cargar nuevo archivo de imagen</label>
          <input
            id="logoInput"
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            class="form-input"
            @change="handleSubirLogo"
            :disabled="subiendoLogo || guardando"
            style="padding: 0.5rem;"
          />
          <small style="font-size: 0.8rem; color: var(--text-dim); display: block; margin-top: 0.35rem;">
            Formatos recomendados: PNG, JPG o SVG. Se mostrará en presupuestos y documentos.
          </small>
          <div v-if="subiendoLogo" style="font-size: 0.85rem; color: #38bdf8; margin-top: 0.25rem;">
            Subiendo archivo...
          </div>
        </div>
      </div>
    </div>

    <form @submit.prevent="guardarConfiguracion" class="card">
      <h3 style="margin-bottom: 1.25rem;">Datos Comerciales</h3>

      <div class="form-group">
        <label class="form-label" for="nombre">Nombre de la Vidriería *</label>
        <input
          id="nombre"
          v-model="form.nombre"
          type="text"
          class="form-input"
          required
          placeholder="Nombre visible en presupuestos"
        />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="rut">RUT de la Empresa</label>
          <input
            id="rut"
            v-model="form.rut"
            type="text"
            class="form-input"
            placeholder="12.345.678-9"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="telefono">Teléfono de Contacto</label>
          <input
            id="telefono"
            v-model="form.telefono"
            type="tel"
            class="form-input"
            placeholder="+56 9 1234 5678"
          />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="correo">Correo de Contacto</label>
          <input
            id="correo"
            v-model="form.correo"
            type="email"
            class="form-input"
            placeholder="contacto@vidrieria.cl"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="direccion">Dirección comercial</label>
          <input
            id="direccion"
            v-model="form.direccion"
            type="text"
            class="form-input"
            placeholder="Av. Los Vidrieros 1234, Comuna"
          />
        </div>
      </div>

      <h3 style="margin-top: 2rem; margin-bottom: 1.25rem;">Parámetros por Defecto para Cálculos</h3>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="margen">Margen comercial base (%)</label>
          <input
            id="margen"
            v-model.number="form.margen_defecto"
            type="number"
            min="0"
            max="200"
            class="form-input"
            placeholder="Ej. 30"
          />
          <small style="color: var(--text-dim); font-size: 0.75rem;">Porcentaje de ganancia sobre costo de materiales.</small>
        </div>

        <div class="form-group">
          <label class="form-label" for="merma">Merma base (%)</label>
          <input
            id="merma"
            v-model.number="form.merma_defecto"
            type="number"
            min="0"
            max="100"
            class="form-input"
            placeholder="Ej. 5"
          />
          <small style="color: var(--text-dim); font-size: 0.75rem;">Porcentaje estimado de pérdida en cortes.</small>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="manoObraFijo">Mano de obra fija base ($)</label>
          <input
            id="manoObraFijo"
            v-model.number="form.mano_obra_fijo_defecto"
            type="number"
            min="0"
            class="form-input"
            placeholder="Ej. 15000"
          />
          <small style="color: var(--text-dim); font-size: 0.75rem;">Costo fijo por confección de ventana.</small>
        </div>

        <div class="form-group">
          <label class="form-label" for="manoObraM2">Mano de obra por m² base ($)</label>
          <input
            id="manoObraM2"
            v-model.number="form.mano_obra_m2_defecto"
            type="number"
            min="0"
            class="form-input"
            placeholder="Ej. 8000"
          />
          <small style="color: var(--text-dim); font-size: 0.75rem;">Costo variable según superficie en m².</small>
        </div>
      </div>

      <div style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
        <button type="submit" class="btn btn-primary" :disabled="guardando || subiendoLogo">
          {{ guardando ? 'Guardando cambios...' : 'Guardar configuración' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Vidrieria } from '~/shared/tipos'

const supabase = useSupabaseClient()
const { vidrieria, cargar, actualizar } = useVidrieria()

const guardando = ref(false)
const subiendoLogo = ref(false)
const mensajeExito = ref<string | null>(null)
const mensajeError = ref<string | null>(null)

const form = reactive<{
  nombre: string
  rut: string
  direccion: string
  telefono: string
  correo: string
  logo_url: string
  margen_defecto: number | null
  merma_defecto: number | null
  mano_obra_fijo_defecto: number | null
  mano_obra_m2_defecto: number | null
}>({
  nombre: '',
  rut: '',
  direccion: '',
  telefono: '',
  correo: '',
  logo_url: '',
  margen_defecto: null,
  merma_defecto: null,
  mano_obra_fijo_defecto: null,
  mano_obra_m2_defecto: null,
})

function sincronizarForm(v: Vidrieria | null) {
  if (!v) return
  form.nombre = v.nombre || ''
  form.rut = v.rut || ''
  form.direccion = v.direccion || ''
  form.telefono = v.telefono || ''
  form.correo = v.correo || ''
  form.logo_url = v.logo_url || ''
  form.margen_defecto = v.margen_defecto ?? null
  form.merma_defecto = v.merma_defecto ?? null
  form.mano_obra_fijo_defecto = v.mano_obra_fijo_defecto ?? null
  form.mano_obra_m2_defecto = v.mano_obra_m2_defecto ?? null
}

onMounted(async () => {
  if (!vidrieria.value) {
    await cargar()
  }
  sincronizarForm(vidrieria.value)
})

watch(vidrieria, (nuevo) => {
  sincronizarForm(nuevo)
})

async function handleSubirLogo(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !vidrieria.value) return

  subiendoLogo.value = true
  mensajeError.value = null
  mensajeExito.value = null

  try {
    const ext = file.name.split('.').pop() || 'png'
    const filePath = `${vidrieria.value.id}/logo.${ext}`

    // Subida a bucket logos
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      })

    if (uploadError) throw uploadError

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath)

    const nuevaUrl = `${urlData.publicUrl}?t=${Date.now()}`
    form.logo_url = nuevaUrl

    // Guardar URL directamente en la base
    await actualizar({ logo_url: nuevaUrl })
    mensajeExito.value = 'Logo actualizado exitosamente.'
  } catch (err: any) {
    mensajeError.value = `Error al subir el logo: ${err.message}`
  } finally {
    subiendoLogo.value = false
  }
}

async function guardarConfiguracion() {
  guardando.value = true
  mensajeError.value = null
  mensajeExito.value = null

  try {
    await actualizar({
      nombre: form.nombre.trim(),
      rut: form.rut?.trim() || null,
      direccion: form.direccion?.trim() || null,
      telefono: form.telefono?.trim() || null,
      correo: form.correo?.trim() || null,
      logo_url: form.logo_url?.trim() || null,
      margen_defecto: form.margen_defecto,
      merma_defecto: form.merma_defecto,
      mano_obra_fijo_defecto: form.mano_obra_fijo_defecto,
      mano_obra_m2_defecto: form.mano_obra_m2_defecto
    })

    mensajeExito.value = 'Configuración guardada exitosamente.'
  } catch (err: any) {
    mensajeError.value = err.message || 'Error al guardar los datos de la vidriería.'
  } finally {
    guardando.value = false
  }
}
</script>
