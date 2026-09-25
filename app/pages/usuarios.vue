<template>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1>Usuarios del Taller</h1>
        <p class="subtitle">Gestiona el equipo de trabajo y los accesos a esta vidriería</p>
      </div>

      <button @click="mostrarModalInvitar = true" class="btn btn-primary">
        + Invitar usuario
      </button>
    </div>

    <div v-if="mensajeExito" class="alert alert-success">
      <span>{{ mensajeExito }}</span>
    </div>

    <div v-if="mensajeError" class="alert alert-danger">
      <span>{{ mensajeError }}</span>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Fecha de Ingreso</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargandoUsuarios">
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">
              Cargando lista de usuarios...
            </td>
          </tr>
          <tr v-else-if="usuarios.length === 0">
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">
              No hay usuarios registrados.
            </td>
          </tr>
          <tr v-for="u in usuarios" :key="u.id">
            <td>
              <div style="font-weight: 500;">{{ u.nombre || 'Sin nombre' }}</div>
              <div v-if="u.auth_uid === usuarioActual?.id" style="font-size: 0.75rem; color: #38bdf8; font-weight: 600;">
                (Tu usuario actual)
              </div>
            </td>
            <td>
              <span v-if="u.activo" class="badge badge-success">Activo</span>
              <span v-else class="badge badge-muted">Inactivo</span>
            </td>
            <td style="color: var(--text-muted); font-size: 0.85rem;">
              {{ formatearFecha(u.created_at) }}
            </td>
            <td style="text-align: right;">
              <template v-if="u.auth_uid !== usuarioActual?.id">
                <button
                  v-if="u.activo"
                  @click="cambiarEstadoUsuario(u, false)"
                  class="btn btn-danger btn-sm"
                  :disabled="procesandoId === u.id"
                >
                  {{ procesandoId === u.id ? 'Desactivando...' : 'Desactivar' }}
                </button>
                <button
                  v-else
                  @click="cambiarEstadoUsuario(u, true)"
                  class="btn btn-secondary btn-sm"
                  :disabled="procesandoId === u.id"
                >
                  {{ procesandoId === u.id ? 'Activando...' : 'Reactivar' }}
                </button>
              </template>
              <span v-else style="color: var(--text-dim); font-size: 0.85rem;">
                No modificable
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para invitar usuario -->
    <div v-if="mostrarModalInvitar" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem;">
      <div class="card" style="width: 100%; max-width: 460px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
        <h3 style="margin-bottom: 0.5rem;">Invitar Usuario al Taller</h3>
        <p class="subtitle" style="margin-bottom: 1.25rem;">
          Se enviará un correo con un enlace para que el nuevo colaborador cree su clave y acceda a esta vidriería.
        </p>

        <form @submit.prevent="enviarInvitacion">
          <div class="form-group">
            <label class="form-label" for="nombreInv">Nombre del colaborador</label>
            <input
              id="nombreInv"
              v-model="nombreInvitado"
              type="text"
              class="form-input"
              required
              placeholder="Ej. Carlos Soto"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="correoInv">Correo electrónico</label>
            <input
              id="correoInv"
              v-model="correoInvitado"
              type="email"
              class="form-input"
              required
              placeholder="colaborador@taller.cl"
            />
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button
              type="button"
              class="btn btn-secondary"
              @click="mostrarModalInvitar = false"
              :disabled="enviandoInvitacion"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="enviandoInvitacion"
            >
              {{ enviandoInvitacion ? 'Enviando invitación...' : 'Enviar invitación' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Usuario } from '~/shared/tipos'

const supabase = useSupabaseClient()
const usuarioActual = useSupabaseUser()
const { vidrieria, cargar: cargarVidrieria } = useVidrieria()

const usuarios = ref<Usuario[]>([])
const cargandoUsuarios = ref(false)
const procesandoId = ref<string | null>(null)
const mensajeExito = ref<string | null>(null)
const mensajeError = ref<string | null>(null)

const mostrarModalInvitar = ref(false)
const nombreInvitado = ref('')
const correoInvitado = ref('')
const enviandoInvitacion = ref(false)

async function obtenerUsuarios() {
  cargandoUsuarios.value = true
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    usuarios.value = data || []
  } catch (err: any) {
    mensajeError.value = `Error al listar usuarios: ${err.message}`
  } finally {
    cargandoUsuarios.value = false
  }
}

onMounted(async () => {
  if (!vidrieria.value) {
    await cargarVidrieria()
  }
  await obtenerUsuarios()
})

function formatearFecha(fechaStr?: string) {
  if (!fechaStr) return '-'
  try {
    return new Date(fechaStr).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return fechaStr
  }
}

async function cambiarEstadoUsuario(u: Usuario, nuevoEstado: boolean) {
  mensajeError.value = null
  mensajeExito.value = null

  // Validación: No se puede desactivar si es el único activo
  if (!nuevoEstado) {
    const activos = usuarios.value.filter(usr => usr.activo)
    if (activos.length <= 1) {
      mensajeError.value = 'No es posible desactivar al único usuario activo de la vidriería.'
      return
    }
  }

  procesandoId.value = u.id

  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: nuevoEstado })
      .eq('id', u.id)

    if (error) throw error

    u.activo = nuevoEstado
    mensajeExito.value = nuevoEstado
      ? `El usuario ${u.nombre || ''} ha sido reactivado.`
      : `El usuario ${u.nombre || ''} ha sido desactivado.`
  } catch (err: any) {
    mensajeError.value = `Error al actualizar usuario: ${err.message}`
  } finally {
    procesandoId.value = null
  }
}

async function enviarInvitacion() {
  if (!vidrieria.value) return

  enviandoInvitacion.value = true
  mensajeError.value = null
  mensajeExito.value = null

  try {
    // Invocamos la Edge Function de Supabase para invitar usuario usando la clave service_role
    const { data, error } = await supabase.functions.invoke('invitar-usuario', {
      body: {
        correo: correoInvitado.value.trim(),
        nombre: nombreInvitado.value.trim(),
        vidrieria_id: vidrieria.value.id
      }
    })

    if (error) throw error

    mensajeExito.value = `Se envió la invitación correctamente a ${correoInvitado.value}.`
    mostrarModalInvitar.value = false
    nombreInvitado.value = ''
    correoInvitado.value = ''
    await obtenerUsuarios()
  } catch (err: any) {
    mensajeError.value = `Error al enviar la invitación: ${err.message || 'Verifica la configuración del servidor'}`
  } finally {
    enviandoInvitacion.value = false
  }
}
</script>
