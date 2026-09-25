<template>
  <div class="container" style="max-width: 1200px;">
    <!-- Encabezado -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1 style="display: flex; align-items: center; gap: 0.5rem;">
          <span>📋</span> Órdenes de Trabajo
        </h1>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">
          Control de producción en taller, despiece y optimización de cortes de barras.
        </p>
      </div>

      <NuxtLink to="/presupuestos" class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.4rem;">
        <span>←</span> Ir a Presupuestos
      </NuxtLink>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="card" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <!-- Buscador -->
        <div style="flex: 1; min-width: 250px;">
          <input
            v-model="filtroBusqueda"
            type="text"
            class="input-text"
            placeholder="Buscar por N° OT, presupuesto o cliente..."
            style="width: 100%;"
          />
        </div>

        <!-- Filtro por Estado -->
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <button
            v-for="estado in estadosFiltro"
            :key="estado.valor"
            @click="filtroEstado = estado.valor"
            class="btn btn-sm"
            :class="filtroEstado === estado.valor ? 'btn-primary' : 'btn-secondary'"
            style="font-size: 0.8rem;"
          >
            {{ estado.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Estado Cargando -->
    <div v-if="cargando" style="text-align: center; padding: 3rem; color: var(--text-muted);">
      Cargando órdenes de trabajo...
    </div>

    <!-- Sin Resultados -->
    <div
      v-else-if="ordenesFiltradas.length === 0"
      class="card"
      style="text-align: center; padding: 3.5rem 1.5rem;"
    >
      <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📋</div>
      <h3 style="margin-bottom: 0.5rem;">No se encontraron órdenes de trabajo</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 450px; margin: 0 auto 1.5rem;">
        Las órdenes de trabajo se generan automáticamente cuando un presupuesto comercial pasa a estado <strong>Aceptado</strong>.
      </p>
      <NuxtLink to="/presupuestos" class="btn btn-primary" style="display: inline-block;">
        Ver Presupuestos Aceptados
      </NuxtLink>
    </div>

    <!-- Tabla de Órdenes de Trabajo -->
    <div v-else class="card" style="padding: 0; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.02);">
            <th style="padding: 0.85rem 1.25rem;">N° OT</th>
            <th style="padding: 0.85rem 1rem;">Presupuesto</th>
            <th style="padding: 0.85rem 1rem;">Cliente</th>
            <th style="padding: 0.85rem 1rem;">Fecha Creación</th>
            <th style="padding: 0.85rem 1rem;">Fecha Entrega</th>
            <th style="padding: 0.85rem 1rem;">Ventanas</th>
            <th style="padding: 0.85rem 1rem;">Estado</th>
            <th style="padding: 0.85rem 1.25rem; text-align: right;">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ot in ordenesFiltradas"
            :key="ot.id"
            style="border-bottom: 1px solid var(--border-color); transition: background 0.15s;"
            class="hover-row"
          >
            <!-- N° OT -->
            <td style="padding: 1rem 1.25rem; font-weight: 700; color: #38bdf8;">
              #{{ ot.numero }}
            </td>

            <!-- Presupuesto -->
            <td style="padding: 1rem 1rem;">
              <NuxtLink
                v-if="ot.presupuesto"
                :to="`/presupuestos/${ot.presupuesto.id}`"
                style="color: var(--text-color); font-weight: 500;"
              >
                Presupuesto #{{ ot.presupuesto.numero }}
              </NuxtLink>
              <span v-else style="color: var(--text-muted);">-</span>
            </td>

            <!-- Cliente -->
            <td style="padding: 1rem 1rem;">
              <div style="font-weight: 500;">
                {{ ot.presupuesto?.cliente_nombre || 'Cliente sin nombre' }}
              </div>
              <div v-if="ot.presupuesto?.cliente_telefono" style="font-size: 0.8rem; color: var(--text-muted);">
                📞 {{ ot.presupuesto.cliente_telefono }}
              </div>
            </td>

            <!-- Fecha Creación -->
            <td style="padding: 1rem 1rem; color: var(--text-muted);">
              {{ ot.fecha_creacion }}
            </td>

            <!-- Fecha Entrega -->
            <td style="padding: 1rem 1rem;">
              <span v-if="ot.fecha_entrega" style="color: #fbbf24; font-weight: 500;">
                📅 {{ ot.fecha_entrega }}
              </span>
              <span v-else style="color: var(--text-muted); font-size: 0.85rem;">Por definir</span>
            </td>

            <!-- Cantidad de Ventanas -->
            <td style="padding: 1rem 1rem; color: var(--text-muted);">
              {{ calcularTotalVentanas(ot) }} vent.
            </td>

            <!-- Estado -->
            <td style="padding: 1rem 1rem;">
              <span :class="['badge', obtenerClaseEstado(ot.estado)]">
                {{ obtenerLabelEstado(ot.estado) }}
              </span>
            </td>

            <!-- Acciones -->
            <td style="padding: 1rem 1.25rem; text-align: right;">
              <NuxtLink
                :to="`/ordenes-trabajo/${ot.id}`"
                class="btn btn-secondary btn-sm"
                style="display: inline-flex; align-items: center; gap: 0.35rem;"
              >
                <span>🔍 Ver Cortes</span>
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EstadoOT, OrdenTrabajo } from '~~/shared/tipos'

const { ordenes, cargando, cargarOrdenesTrabajo } = useOrdenesTrabajo()

const filtroBusqueda = ref('')
const filtroEstado = ref<string>('todas')

const estadosFiltro = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'pendiente', label: 'Pendientes' },
  { valor: 'en_produccion', label: 'En Producción' },
  { valor: 'lista_instalar', label: 'Listas p/ Instalar' },
  { valor: 'instalada', label: 'Instaladas' },
  { valor: 'cancelada', label: 'Canceladas' }
]

function obtenerClaseEstado(estado: EstadoOT) {
  switch (estado) {
    case 'pendiente': return 'badge-muted'
    case 'en_produccion': return 'badge-info'
    case 'lista_instalar': return 'badge-warning'
    case 'instalada': return 'badge-success'
    case 'cancelada': return 'badge-danger'
    default: return 'badge-muted'
  }
}

function obtenerLabelEstado(estado: EstadoOT) {
  switch (estado) {
    case 'pendiente': return 'Pendiente'
    case 'en_produccion': return 'En Producción'
    case 'lista_instalar': return 'Lista para Instalar'
    case 'instalada': return 'Instalada'
    case 'cancelada': return 'Cancelada'
    default: return estado
  }
}

function calcularTotalVentanas(ot: OrdenTrabajo) {
  if (!ot.presupuesto?.ventanas) return 0
  return ot.presupuesto.ventanas.reduce((acc: number, v: any) => acc + (v.cantidad || 1), 0)
}

const ordenesFiltradas = computed(() => {
  return ordenes.value.filter(ot => {
    // Filtro estado
    if (filtroEstado.value !== 'todas' && ot.estado !== filtroEstado.value) {
      return false
    }

    // Filtro búsqueda
    if (filtroBusqueda.value.trim()) {
      const q = filtroBusqueda.value.toLowerCase().trim()
      const matchNumOT = String(ot.numero).includes(q)
      const matchNumPres = String(ot.presupuesto?.numero || '').includes(q)
      const matchCliente = (ot.presupuesto?.cliente_nombre || '').toLowerCase().includes(q)
      return matchNumOT || matchNumPres || matchCliente
    }

    return true
  })
})

onMounted(async () => {
  await cargarOrdenesTrabajo()
})
</script>

<style scoped>
.hover-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.badge-info {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.badge-success {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}
</style>
