<template>
  <div class="auth-container">
    <div class="card auth-card">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1>Iniciar Sesión</h1>
        <p class="subtitle">Accede al panel de control de tu vidriería</p>
      </div>

      <div v-if="errorMsg" class="alert alert-danger">
        <span>{{ errorMsg }}</span>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label" for="email">Correo electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            required
            autocomplete="email"
            placeholder="ejemplo@vidrieria.cl"
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
            autocomplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="cargando" style="margin-top: 1rem;">
          {{ cargando ? 'Iniciando sesión...' : 'Entrar' }}
        </button>
      </form>

      <div style="margin-top: 1.5rem; text-align: center; font-size: 0.9rem; color: var(--text-muted); overflow-wrap: anywhere;">
        ¿Tu vidriería aún no está registrada?
        <NuxtLink to="/registro" style="font-weight: 500;">Registrar vidriería</NuxtLink>
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

const email = ref('')
const password = ref('')
const cargando = ref(false)
const errorMsg = ref<string | null>(null)

async function handleLogin() {
  cargando.value = true
  errorMsg.value = null

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    })

    if (error) {
      throw error
    }

    if (!data.user) {
      throw new Error('No se pudo verificar el usuario.')
    }

    // Verificar que el usuario esté activo en la tabla usuarios
    const { data: usuarioPerfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('id, activo, vidrieria_id')
      .eq('auth_uid', data.user.id)
      .maybeSingle()

    if (perfilError) {
      throw perfilError
    }

    if (!usuarioPerfil || !usuarioPerfil.activo) {
      // Usuario desactivado o sin perfil
      await supabase.auth.signOut()
      throw new Error('Este usuario no tiene acceso activo a la vidriería. Contacta al administrador.')
    }

    // Cargar datos de la vidriería
    await cargar()

    await navigateTo('/')
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al iniciar sesión. Verifica tus credenciales.'
  } finally {
    cargando.value = false
  }
}
</script>
