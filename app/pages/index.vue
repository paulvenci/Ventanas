<template>
  <div class="dashboard-container">
    <!-- Encabezado Principal / Hero Mobile-First -->
    <div class="dashboard-header">
      <div class="header-info">
        <div class="header-title-row">
          <div v-if="vidrieria?.logo_url" class="taller-logo-wrap">
            <img :src="vidrieria.logo_url" :alt="vidrieria.nombre" class="taller-logo-img" />
          </div>
          <div>
            <h1 class="header-title">{{ vidrieria?.nombre || 'Panel de Vidriería' }}</h1>
            <p class="header-subtitle">Control de cotizaciones, órdenes de trabajo y taller</p>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <NuxtLink to="/presupuestos/nuevo" class="btn btn-primary btn-cta">
          <span style="font-size: 1.1rem; line-height: 1;">+</span>
          <span>Nuevo Presupuesto</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Indicadores Clave (KPIs) -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Presupuestos</div>
        <div class="kpi-val">{{ listaPresupuestos.length }}</div>
        <div class="kpi-sub">{{ enBorradorCount }} borradores &bull; {{ enviadosCount }} enviados</div>
      </div>

      <div class="kpi-card highlight-green">
        <div class="kpi-label">Aceptados</div>
        <div class="kpi-val color-green">{{ aceptadosCount }}</div>
        <div class="kpi-sub">${{ formatearDinero(montoAceptadoTotal) }} cotizados</div>
      </div>

      <div class="kpi-card highlight-sky">
        <div class="kpi-label">OTs en Producción</div>
        <div class="kpi-val color-sky">{{ otActivasCount }}</div>
        <div class="kpi-sub">{{ otTotalCount }} órdenes registradas</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Efectividad Comercial</div>
        <div class="kpi-val">{{ tasaCierre }}%</div>
        <div class="kpi-sub">Presupuestos aceptados</div>
      </div>
    </div>

    <!-- Accesos Rápidos a Módulos (Touch Hub) -->
    <div class="modulos-grid">
      <NuxtLink to="/presupuestos" class="modulo-card">
        <div class="modulo-icon-wrap" style="background: rgba(37, 99, 235, 0.15); color: #38bdf8;">
          📋
        </div>
        <div class="modulo-info">
          <h3>Presupuestos</h3>
          <p>Cotizaciones comerciales y PDFs</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/ordenes-trabajo" class="modulo-card">
        <div class="modulo-icon-wrap" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">
          🪚
        </div>
        <div class="modulo-info">
          <h3>Órdenes de Trabajo</h3>
          <p>Listado de cortes y taller</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/catalogos" class="modulo-card">
        <div class="modulo-icon-wrap" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">
          📐
        </div>
        <div class="modulo-info">
          <h3>Catálogos y Fórmulas</h3>
          <p>Perfiles, vidrios y descuentos</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/configuracion" class="modulo-card">
        <div class="modulo-icon-wrap" style="background: rgba(148, 163, 184, 0.15); color: #cbd5e1;">
          ⚙️
        </div>
        <div class="modulo-info">
          <h3>Configuración</h3>
          <p>Márgenes, taller y usuarios</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Secciones Operativas: Presupuestos y OTs Recientes -->
    <div class="dashboard-columns">
      <!-- 1. Presupuestos Recientes -->
      <div class="card" style="padding: 1.25rem;">
        <div class="card-header-flex">
          <div>
            <h2 style="font-size: 1.15rem; margin-bottom: 0.15rem;">Presupuestos Recientes</h2>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Últimas cotizaciones generadas</p>
          </div>
          <NuxtLink to="/presupuestos" class="link-more">Ver todos →</NuxtLink>
        </div>

        <div v-if="cargandoPresupuestos" class="loading-state">
          Cargando presupuestos...
        </div>

        <div v-else-if="ultimosPresupuestos.length === 0" class="empty-state">
          No hay presupuestos registrados aún.
          <NuxtLink to="/presupuestos/nuevo" class="btn btn-secondary btn-sm" style="margin-top: 0.75rem;">
            Crear el primero
          </NuxtLink>
        </div>

        <!-- Lista de tarjetas táctiles (ideal móvil y desktop) -->
        <div v-else class="items-list">
          <NuxtLink
            v-for="p in ultimosPresupuestos"
            :key="p.id"
            :to="`/presupuestos/${p.id}`"
            class="item-row"
          >
            <div class="item-left">
              <div class="item-title">
                <span class="item-numero">#{{ p.numero }}</span>
                <span class="item-name">{{ p.cliente_nombre }}</span>
              </div>
              <div class="item-meta">
                <span>{{ p.fecha }}</span>
                <span v-if="p.cliente_telefono">&bull; {{ p.cliente_telefono }}</span>
              </div>
            </div>

            <div class="item-right">
              <div class="item-total">${{ formatearDinero(p.total) }}</div>
              <span :class="['badge', obtenerClaseEstado(p.estado)]">
                {{ p.estado }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- 2. Órdenes de Trabajo Activas -->
      <div class="card" style="padding: 1.25rem;">
        <div class="card-header-flex">
          <div>
            <h2 style="font-size: 1.15rem; margin-bottom: 0.15rem;">Órdenes de Trabajo</h2>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Producción y estado de fabricación</p>
          </div>
          <NuxtLink to="/ordenes-trabajo" class="link-more">Ver todas →</NuxtLink>
        </div>

        <div v-if="cargandoOTs" class="loading-state">
          Cargando órdenes de trabajo...
        </div>

        <div v-else-if="ultimasOTs.length === 0" class="empty-state">
          No hay órdenes de trabajo activas.
          <p style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem;">
            Al aceptar un presupuesto podrás generar su ficha de corte para taller.
          </p>
        </div>

        <div v-else class="items-list">
          <NuxtLink
            v-for="ot in ultimasOTs"
            :key="ot.id"
            :to="`/ordenes-trabajo/${ot.id}`"
            class="item-row"
          >
            <div class="item-left">
              <div class="item-title">
                <span class="item-numero ot-badge">OT #{{ ot.numero }}</span>
                <span class="item-name">{{ ot.cliente_nombre || ot.presupuesto?.cliente_nombre || 'Cliente' }}</span>
              </div>
              <div class="item-meta">
                <span>Presupuesto #{{ ot.presupuesto_numero || ot.presupuesto?.numero || 'S/N' }}</span>
                <span v-if="ot.fecha_entrega">&bull; Entrega: {{ ot.fecha_entrega }}</span>
              </div>
            </div>

            <div class="item-right">
              <span :class="['badge', obtenerClaseEstadoOT(ot.estado)]">
                {{ obtenerLabelEstadoOT(ot.estado) }}
              </span>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-align: right; margin-top: 0.25rem;">
                Ver Cortes →
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Etapas y Próximos Módulos -->
    <div class="proximos-card">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
        <span style="font-size: 1.1rem;">🚀</span>
        <h4 style="font-size: 0.95rem; margin: 0; color: var(--text-main);">Flujo Completo del Sistema</h4>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
        Módulos integrados y operativos:
      </p>
      <div class="tags-container">
        <span class="flow-tag done">01. Vidriería</span>
        <span class="flow-tag done">02. Catálogos</span>
        <span class="flow-tag done">03. Motor de Cálculo</span>
        <span class="flow-tag done">04. Presupuestos</span>
        <span class="flow-tag done">05. Órdenes de Trabajo y Cortes</span>
        <span class="flow-tag done">06. PDF Formal & WhatsApp</span>
        <span class="flow-tag pending">07. Compras y Stock (Siguiente)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Presupuesto, EstadoPresupuesto, OrdenTrabajo, EstadoOT } from '~~/shared/tipos'

const { vidrieria, cargar: cargarVidrieria } = useVidrieria()
const { presupuestos, cargarPresupuestos } = usePresupuestos()
const { ordenesTrabajo, cargarOrdenesTrabajo } = useOrdenesTrabajo()

const cargandoPresupuestos = ref(true)
const cargandoOTs = ref(true)

function formatearDinero(num: number | null | undefined): string {
  if (num == null) return '0'
  return Math.round(num).toLocaleString('es-CL')
}

// Estadísticas de Presupuestos
const listaPresupuestos = computed(() => presupuestos.value || [])
const listaOTs = computed(() => ordenesTrabajo.value || [])

const enBorradorCount = computed(() => {
  return listaPresupuestos.value.filter(p => p.estado === 'borrador').length
})

const enviadosCount = computed(() => {
  return listaPresupuestos.value.filter(p => p.estado === 'enviado').length
})

const aceptadosCount = computed(() => {
  return listaPresupuestos.value.filter(p => p.estado === 'aceptado').length
})

const montoAceptadoTotal = computed(() => {
  return listaPresupuestos.value
    .filter(p => p.estado === 'aceptado')
    .reduce((sum, p) => sum + (p.total || 0), 0)
})

const tasaCierre = computed(() => {
  if (listaPresupuestos.value.length === 0) return 0
  return Math.round((aceptadosCount.value / listaPresupuestos.value.length) * 100)
})

// Estadísticas de OTs
const otTotalCount = computed(() => listaOTs.value.length)

const otActivasCount = computed(() => {
  return listaOTs.value.filter(ot =>
    ot.estado === 'pendiente' || ot.estado === 'en_produccion'
  ).length
})

// Últimos registros para el dashboard
const ultimosPresupuestos = computed(() => {
  return [...listaPresupuestos.value].slice(0, 5)
})

const ultimasOTs = computed(() => {
  return [...listaOTs.value].slice(0, 4)
})

function obtenerClaseEstado(estado: EstadoPresupuesto) {
  switch (estado) {
    case 'borrador': return 'badge-muted'
    case 'enviado': return 'badge-info'
    case 'aceptado': return 'badge-success'
    case 'rechazado': return 'badge-danger'
    default: return 'badge-muted'
  }
}

function obtenerClaseEstadoOT(estado: EstadoOT) {
  switch (estado) {
    case 'pendiente': return 'badge-muted'
    case 'en_produccion': return 'badge-info'
    case 'lista_instalar': return 'badge-warning'
    case 'instalada': return 'badge-success'
    case 'cancelada': return 'badge-danger'
    default: return 'badge-muted'
  }
}

function obtenerLabelEstadoOT(estado: EstadoOT) {
  switch (estado) {
    case 'pendiente': return 'Pendiente'
    case 'en_produccion': return 'En Producción'
    case 'lista_instalar': return 'Lista p/ Instalar'
    case 'instalada': return 'Instalada'
    case 'cancelada': return 'Cancelada'
    default: return estado
  }
}

onMounted(async () => {
  if (!vidrieria.value) {
    await cargarVidrieria()
  }

  try {
    await cargarPresupuestos()
  } finally {
    cargandoPresupuestos.value = false
  }

  try {
    await cargarOrdenesTrabajo()
  } finally {
    cargandoOTs.value = false
  }
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem 1rem;
}

/* Header */
.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.taller-logo-wrap {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  background: #1e293b;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.taller-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-title {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
}

.header-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
  margin-bottom: 0;
}

.btn-cta {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

/* KPIs Grid (Mobile 2 col, Desktop 4 col) */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.kpi-card.highlight-green {
  border-color: rgba(16, 185, 129, 0.3);
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(30, 41, 59, 1) 100%);
}

.kpi-card.highlight-sky {
  border-color: rgba(56, 189, 248, 0.3);
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.05) 0%, rgba(30, 41, 59, 1) 100%);
}

.kpi-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
  font-weight: 600;
}

.kpi-val {
  font-size: 1.6rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0.35rem 0;
  line-height: 1;
}

.color-green { color: #34d399 !important; }
.color-sky { color: #38bdf8 !important; }

.kpi-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Modulos Touch Hub */
.modulos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

.modulo-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.modulo-card:hover {
  border-color: #38bdf8;
  transform: translateY(-2px);
}

.modulo-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.modulo-info h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-main);
}

.modulo-info p {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0.1rem 0 0 0;
  display: none;
}

/* Dashboard Columns */
.dashboard-columns {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
}

.link-more {
  font-size: 0.825rem;
  color: #38bdf8;
  font-weight: 500;
}

.link-more:hover {
  text-decoration: underline;
}

/* Lista táctil */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.item-row:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border-color);
}

.item-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.item-title {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.item-numero {
  font-weight: 800;
  color: #38bdf8;
  font-family: monospace;
  font-size: 0.85rem;
}

.ot-badge {
  color: #34d399;
}

.item-name {
  font-weight: 600;
  color: var(--text-main);
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.item-meta {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  flex-shrink: 0;
}

.item-total {
  font-weight: 700;
  color: #f8fafc;
  font-size: 0.9rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 1.5rem 1rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Badges adicionales */
.badge-info {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

/* Proximos Modulos */
.proximos-card {
  background: rgba(15, 23, 42, 0.5);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.flow-tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.flow-tag.done {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.flow-tag.pending {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  border: 1px dashed rgba(148, 163, 184, 0.25);
}

/* ========================================================= */
/* DESKTOP BREAKPOINTS (Tablet / PC > 768px)                */
/* ========================================================= */
@media (min-width: 768px) {
  .dashboard-container {
    padding: 2rem 1.5rem;
  }

  .dashboard-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .btn-cta {
    width: auto;
  }

  .header-title {
    font-size: 1.85rem;
  }

  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .modulos-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .modulo-card {
    padding: 1.15rem;
  }

  .modulo-info p {
    display: block;
  }

  .dashboard-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .item-name {
    max-width: 250px;
  }
}
</style>
