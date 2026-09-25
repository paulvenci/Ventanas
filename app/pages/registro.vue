<template>
  <div class="auth-container">
    <div class="card auth-card" style="max-width: 480px;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1>Registrar Vidriería</h1>
        <p class="subtitle">Crea una nueva cuenta de vidriería en la plataforma</p>
      </div>

      <div v-if="errorMsg" class="alert alert-danger">
        <span>{{ errorMsg }}</span>
      </div>

      <form @submit.prevent="handleRegistro">
        <div class="form-group">
          <label class="form-label" for="codigo">Código de activación</label>
          <input
            id="codigo"
            v-model="codigoActivacion"
            type="password"
            class="form-input"
            required
            placeholder="Clave maestra de la plataforma"
          />
          <small style="font-size: 0.8rem; color: var(--text-dim);">Requerido por el operador para habilitar nuevas vidrierías.</small>
        </div>

        <div class="form-group">
          <label class="form-label" for="nombreVidrieria">Nombre de la Vidriería</label>
          <input
            id="nombreVidrieria"
            v-model="nombreVidrieria"
            type="text"
            class="form-input"
            required
            placeholder="Ej. Vidriería El Cristal"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="nombreUsuario">Tu Nombre Completo</label>
          <input
            id="nombreUsuario"
            v-model="nombreUsuario"
            type="text"
            class="form-input"
            required
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="email">Correo electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            required
            autocomplete="email"
            placeholder="contacto@vidrieriaelcristal.cl"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            required
            minlength="6"
            autocomplete="new-password"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="cargando" style="margin-top: 1rem;">
          {{ cargando ? 'Creando vidriería...' : 'Comenzar registro' }}
        </button>
      </form>

      <div style="margin-top: 1.5rem; text-align: center; font-size: 0.9rem; color: var(--text-muted);">
        ¿Ya tienes una cuenta registrada?
        <NuxtLink to="/login" style="font-weight: 500;">Iniciar sesión</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const { cargar } = useVidrieria()

const codigoActivacion = ref('')
const nombreVidrieria = ref('')
const nombreUsuario = ref('')
const email = ref('')
const password = ref('')

const cargando = ref(false)
const errorMsg = ref<string | null>(null)

async function handleRegistro() {
  cargando.value = true
  errorMsg.value = null

  try {
    // 1. Validar código de activación contra RPC
    const { data: esValido, error: rpcError } = await supabase.rpc('verificar_codigo_registro', {
      codigo: codigoActivacion.value.trim()
    })

    if (rpcError) {
      throw new Error(`Error al validar código de activación: ${rpcError.message}`)
    }

    if (!esValido) {
      throw new Error('El código de activación es incorrecto. No se puede crear la vidriería.')
    }

    // 2. Registrar usuario en Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
      options: {
        data: {
          nombre: nombreUsuario.value.trim()
        }
      }
    })

    if (signUpError) {
      throw signUpError
    }

    if (!authData.session) {
      throw new Error('El usuario fue creado pero no se obtuvo una sesión automática.')
    }

    // 3. Crear vidriería y asociar el usuario mediante RPC transaccional
    const { data: vidrieriaId, error: crearError } = await supabase.rpc('crear_vidrieria', {
      p_nombre: nombreVidrieria.value.trim(),
      p_nombre_usuario: nombreUsuario.value.trim()
    })

    if (crearError) {
      // Revertir sesión si falla la creación del tenant
      await supabase.auth.signOut()
      throw new Error(`Error al configurar la vidriería: ${crearError.message}`)
    }

    // 4. Cargar perfil de vidriería y navegar a inicio
    await cargar()
    await navigateTo('/')
  } catch (err: any) {
    errorMsg.value = err.message || 'Ocurrió un error inesperado al registrar la vidriería.'
  } finally {
    cargando.value = false
  }
}
</script>
