<template>
  <div class="container" style="max-width: 1200px;">
    <!-- Encabezado -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1>Presupuestos Comerciales</h1>
        <p class="subtitle" style="margin-bottom: 0;">Administra cotizaciones, clientes, estados y desglose de materiales</p>
      </div>
      <NuxtLink to="/presupuestos/nuevo" class="btn btn-primary">
        + Nuevo Presupuesto
      </NuxtLink>
    </div>

    <!-- Alertas -->
    <div v-if="mensaje" :class="`alert ${mensaje.tipo === 'error' ? 'alert-danger' : 'alert-success'}`">
      <span>{{ mensaje.texto }}</span>
    </div>

    <!-- Tarjetas de resumen rápido -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
      <div class="card" style="padding: 1.25rem;">
        <span style="font-size: 0.8rem; color: var(--text-dim); text-transform: uppercase;">Total Registrados</span>
        <div style="font-size: 1.75rem; font-weight: 700; color: #f8fafc; margin-top: 0.25rem;">{{ presupuestos.length }}</div>
      </div>
      <div class="card" style="padding: 1.25rem;">
        <span style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;">En Borrador</span>
        <div style="font-size: 1.75rem; font-weight: 700; color: #94a3b8; margin-top: 0.25rem;">
          {{ presupuestos.filter(p => p.estado === 'borrador').length }}
        </div>
      </div>
      <div class="card" style="padding: 1.25rem;">
        <span style="font-size: 0.8rem; color: #38bdf8; text-transform: uppercase;">Enviados</span>
        <div style="font-size: 1.75rem; font-weight: 700; color: #38bdf8; margin-top: 0.25rem;">
          {{ presupuestos.filter(p => p.estado === 'enviado').length }}
        </div>
      </div>
      <div class="card" style="padding: 1.25rem;">
        <span style="font-size: 0.8rem; color: #34d399; text-transform: uppercase;">Aceptados</span>
        <div style="font-size: 1.75rem; font-weight: 700; color: #34d399; margin-top: 0.25rem;">
          {{ presupuestos.filter(p => p.estado === 'aceptado').length }}
        </div>
      </div>
    </div>

    <!-- Barra de filtros y búsqueda -->
    <div class="card" style="padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <!-- Pestañas de estado -->
        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
          <button
            v-for="st in filtrosEstado"
            :key="st.id"
            :class="['filtro-btn', { active: filtroEstadoActual === st.id }]"
            @click="filtroEstadoActual = st.id"
          >
            {{ st.label }}
          </button>
        </div>

        <!-- Buscador -->
        <div style="width: 280px;">
          <input
            v-model="busquedaTexto"
            type="text"
            placeholder="Buscar por cliente o N°..."
            class="form-input"
            style="padding: 0.45rem 0.75rem; font-size: 0.875rem;"
          />
        </div>
      </div>
    </div>

    <!-- Tabla de Presupuestos -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="table-container" style="border: none; border-radius: 0;">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 80px;">N°</th>
              <th>Cliente</th>
              <th>Fecha / Validez</th>
              <th style="text-align: center;">Contenido</th>
              <th style="text-align: right;">Neto</th>
              <th style="text-align: right;">Total (c/IVA)</th>
              <th style="text-align: center;">Estado</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in presupuestosFiltrados" :key="p.id">
              <td style="font-weight: 700; font-family: monospace; color: #38bdf8;">
                #{{ p.numero }}
              </td>
              <td>
                <div style="font-weight: 600;">{{ p.cliente_nombre }}</div>
                <div v-if="p.cliente_telefono" style="font-size: 0.8rem; color: var(--text-dim);">
                  {{ p.cliente_telefono }}
                </div>
              </td>
              <td style="font-size: 0.85rem; color: var(--text-muted);">
                <div>{{ formatearFecha(p.fecha) }}</div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">Validez: {{ p.validez_dias }} días</div>
              </td>
              <td style="text-align: center; font-size: 0.85rem;">
                <span class="badge badge-muted" style="margin-right: 0.25rem;">
                  {{ (p.ventanas || []).length }} vent.
                </span>
                <span v-if="(p.items_libres || []).length > 0" class="badge badge-muted">
                  {{ (p.items_libres || []).length }} extra
                </span>
              </td>
              <td style="text-align: right; font-weight: 500;">
                ${{ formatearDinero(p.neto) }}
              </td>
              <td style="text-align: right; font-weight: 700; color: #34d399;">
                ${{ formatearDinero(p.total) }}
              </td>
              <td style="text-align: center;">
                <span :class="['badge', obtenerClaseEstado(p.estado)]">
                  {{ p.estado }}
                </span>
              </td>
              <td style="text-align: right;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                  <NuxtLink
                    :to="`/presupuestos/${p.id}`"
                    class="btn btn-secondary btn-sm"
                    style="padding: 0.25rem 0.6rem;"
                  >
                    {{ p.estado === 'aceptado' ? 'Ver' : 'Editar' }}
                  </NuxtLink>

                  <button
                    @click="handleDuplicar(p.id)"
                    class="btn btn-secondary btn-sm"
                    style="padding: 0.25rem 0.6rem;"
                    title="Duplicar como borrador nuevo"
                  >
                    Duplicar
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="presupuestosFiltrados.length === 0">
              <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-dim);">
                <div v-if="cargando">Cargando presupuestos...</div>
                <div v-else>
                  No se encontraron presupuestos. Crea el primero con el botón "+ Nuevo Presupuesto".
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EstadoPresupuesto } from '~~/shared/tipos'

const {
  presupuestos,
  cargando,
  cargarPresupuestos,
  duplicarPresupuesto
} = usePresupuestos()

const mensaje = ref<{ texto: string; tipo: 'exito' | 'error' } | null>(null)
const busquedaTexto = ref('')
const filtroEstadoActual = ref<'todos' | EstadoPresupuesto>('todos')

const filtrosEstado = [
  { id: 'todos' as const, label: 'Todos' },
  { id: 'borrador' as const, label: 'Borradores' },
  { id: 'enviado' as const, label: 'Enviados' },
  { id: 'aceptado' as const, label: 'Aceptados' },
  { id: 'rechazado' as const, label: 'Rechazados' }
]

const presupuestosFiltrados = computed(() => {
  return presupuestos.value.filter(p => {
    const matchEstado = filtroEstadoActual.value === 'todos' || p.estado === filtroEstadoActual.value
    const matchBusqueda = !busquedaTexto.value ||
      p.cliente_nombre.toLowerCase().includes(busquedaTexto.value.toLowerCase()) ||
      p.numero.toString().includes(busquedaTexto.value)
    return matchEstado && matchBusqueda
  })
})

function formatearDinero(monto: number | null | undefined) {
  if (monto == null) return '0'
  return Math.round(monto).toLocaleString('es-CL')
}

function formatearFecha(fechaStr: string) {
  if (!fechaStr) return ''
  const partes = fechaStr.split('-')
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }
  return fechaStr
}

function obtenerClaseEstado(estado: EstadoPresupuesto) {
  switch (estado) {
    case 'aceptado': return 'badge-success'
    case 'enviado': return 'badge-info'
    case 'rechazado': return 'badge-danger'
    default: return 'badge-muted'
  }
}

async function handleDuplicar(id: string) {
  try {
    const copia = await duplicarPresupuesto(id)
    mensaje.value = { texto: `Presupuesto #${copia.numero} creado como borrador`, tipo: 'exito' }
    setTimeout(() => { mensaje.value = null }, 4000)
  } catch (err: any) {
    mensaje.value = { texto: err.message || 'Error al duplicar presupuesto', tipo: 'error' }
  }
}

onMounted(async () => {
  await cargarPresupuestos()
})
</script>

<style scoped>
.filtro-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filtro-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.filtro-btn.active {
  background: #334155;
  color: #38bdf8;
  font-weight: 600;
  border-color: #475569;
}

.badge-info {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}
</style>
