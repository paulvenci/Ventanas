<template>
  <div class="auth-container">
    <div class="card auth-card">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1>Confirmar Invitación</h1>
        <p class="subtitle">Configura tu contraseña para acceder a la vidriería</p>
      </div>

      <div v-if="mensajeError" class="alert alert-danger">
        <span>{{ mensajeError }}</span>
      </div>

      <div v-if="mensajeExito" class="alert alert-success">
        <span>{{ mensajeExito }}</span>
      </div>

      <div v-if="cargando && !formularioListo" style="text-align: center; padding: 2rem; color: var(--text-muted);">
        Verificando invitación...
      </div>

      <form v-if="formularioListo" @submit.prevent="completarInvitacion">
        <div class="form-group">
          <label class="form-label" for="nuevaClave">Nueva contraseña</label>
          <input
            id="nuevaClave"
            v-model="nuevaContrasena"
            type="password"
            class="form-input"
            required
            minlength="6"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="guardando" style="margin-top: 1rem;">
          {{ guardando ? 'Guardando contraseña...' : 'Establecer contraseña y entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const route = useRoute()
const { cargar } = useVidrieria()

const cargando = ref(true)
const formularioListo = ref(false)
const guardando = ref(false)
const nuevaContrasena = ref('')
const mensajeError = ref<string | null>(null)
const mensajeExito = ref<string | null>(null)

onMounted(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    // Si ya hay sesión del token de invitación
    if (session) {
      formularioListo.value = true
    } else {
      // Escuchar el evento de cambio de auth en caso de que procese los hash params
      supabase.auth.onAuthStateChange(async (event, s) => {
        if (s) {
          formularioListo.value = true
        }
      })
    }
  } catch (err: any) {
    mensajeError.value = `Error al verificar invitación: ${err.message}`
  } finally {
    cargando.value = false
  }
})

async function completarInvitacion() {
  guardando.value = true
  mensajeError.value = null
  mensajeExito.value = null

  try {
    // 1. Actualizar contraseña del usuario
    const { data: userData, error: updateError } = await supabase.auth.updateUser({
      password: nuevaContrasena.value
    })

    if (updateError) throw updateError

    // 2. Extraer vidrieria_id de user_metadata o de query params
    const vidrieriaId = userData.user?.user_metadata?.vidrieria_id || (route.query.vidrieria_id as string)
    const nombre = userData.user?.user_metadata?.nombre as string | undefined

    if (vidrieriaId) {
      // 3. Vincular a la vidriería mediante RPC
      const { error: rpcError } = await supabase.rpc('vincular_usuario_invitado', {
        p_vidrieria_id: vidrieriaId,
        p_nombre: nombre || null
      })

      if (rpcError) throw rpcError
    }

    mensajeExito.value = 'Contraseña establecida exitosamente. Redirigiendo...'
    await cargar()
    setTimeout(async () => {
      await navigateTo('/')
    }, 1500)
  } catch (err: any) {
    mensajeError.value = err.message || 'Error al completar la invitación.'
  } finally {
    guardando.value = false
  }
}
</script>
