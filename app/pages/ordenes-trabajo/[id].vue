<template>
  <div class="container" style="max-width: 1200px;">
    <!-- Alertas y Notificaciones -->
    <div
      v-if="notificacion"
      :class="['alert', notificacion.tipo === 'error' ? 'alert-danger' : 'alert-success']"
      style="margin-bottom: 1.25rem;"
    >
      {{ notificacion.mensaje }}
    </div>

    <!-- Estado Cargando -->
    <div v-if="cargando && !ot" style="text-align: center; padding: 4rem; color: var(--text-muted);">
      Cargando orden de trabajo...
    </div>

    <!-- Error No Encontrado -->
    <div v-else-if="!ot" class="card" style="text-align: center; padding: 3rem;">
      <h3>Orden de trabajo no encontrada</h3>
      <NuxtLink to="/ordenes-trabajo" class="btn btn-secondary" style="margin-top: 1rem; display: inline-block;">
        ← Volver a Órdenes de Trabajo
      </NuxtLink>
    </div>

    <!-- Contenido Principal -->
    <div v-else>
      <!-- Encabezado con Flujo de Estados y Acciones (oculto en impresión normal si se desea, visible para taller) -->
      <div class="no-print" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem;">
            <NuxtLink to="/ordenes-trabajo" style="color: var(--text-muted); font-size: 0.9rem;">
              ← Órdenes de Trabajo
            </NuxtLink>
            <span style="color: var(--border-color);">/</span>
            <span :class="['badge', obtenerClaseEstado(ot.estado)]">{{ obtenerLabelEstado(ot.estado) }}</span>
          </div>
          <h1 style="display: flex; align-items: center; gap: 0.5rem;">
            <span>📋</span> Orden de Trabajo #{{ ot.numero }}
          </h1>
        </div>

        <!-- Acciones de Estado y Botón de Impresión -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <!-- Botón Imprimir Hoja de Taller -->
          <button
            @click="imprimirHojaTaller"
            class="btn btn-secondary"
            style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);"
          >
            <span>🖨️ Imprimir Hoja de Taller</span>
          </button>

          <!-- Transiciones de Estado -->
          <button
            v-if="ot.estado === 'pendiente'"
            @click="handleCambiarEstado('en_produccion')"
            class="btn btn-primary"
            style="background-color: #0284c7;"
            :disabled="actualizandoEstado"
          >
            ⚙️ Iniciar Fabricación
          </button>

          <button
            v-if="ot.estado === 'en_produccion'"
            @click="handleCambiarEstado('lista_instalar')"
            class="btn btn-primary"
            style="background-color: #d97706;"
            :disabled="actualizandoEstado"
          >
            📦 Lista para Instalar
          </button>

          <button
            v-if="ot.estado === 'lista_instalar'"
            @click="handleCambiarEstado('instalada')"
            class="btn btn-primary"
            style="background-color: #059669;"
            :disabled="actualizandoEstado"
          >
            ✓ Marcar como Instalada / Entregada
          </button>

          <button
            v-if="ot.estado === 'pendiente' || ot.estado === 'en_produccion'"
            @click="handleCambiarEstado('cancelada')"
            class="btn btn-danger btn-sm"
            :disabled="actualizandoEstado"
          >
            Cancelar OT
          </button>
        </div>
      </div>

      <!-- Tarjeta Resumen General / Ficha de Taller -->
      <div class="card print-card" style="margin-bottom: 1.5rem; padding: 1.25rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; font-size: 0.9rem;">
          <div>
            <span style="color: var(--text-muted); display: block; font-size: 0.8rem;">Presupuesto de Origen:</span>
            <NuxtLink
              v-if="ot.presupuesto"
              :to="`/presupuestos/${ot.presupuesto.id}`"
              style="font-weight: 600; color: #38bdf8;"
              class="no-print"
            >
              Presupuesto #{{ ot.presupuesto.numero }}
            </NuxtLink>
            <span class="only-print" style="font-weight: 600;">
              Presupuesto #{{ ot.presupuesto?.numero }}
            </span>
          </div>

          <div>
            <span style="color: var(--text-muted); display: block; font-size: 0.8rem;">Cliente:</span>
            <span style="font-weight: 600;">{{ ot.presupuesto?.cliente_nombre || 'Sin cliente' }}</span>
            <div v-if="ot.presupuesto?.cliente_telefono" style="font-size: 0.8rem; color: var(--text-muted);">
              📞 {{ ot.presupuesto.cliente_telefono }}
            </div>
          </div>

          <div>
            <span style="color: var(--text-muted); display: block; font-size: 0.8rem;">Dirección de Entrega:</span>
            <span>{{ ot.presupuesto?.cliente_direccion || 'No especificada' }}</span>
          </div>

          <div>
            <span style="color: var(--text-muted); display: block; font-size: 0.8rem;">Fecha Estimada Entrega:</span>
            <span style="font-weight: 600; color: #fbbf24;">
              {{ ot.fecha_entrega ? ot.fecha_entrega : 'Sin fecha asignada' }}
            </span>
          </div>
        </div>

        <div v-if="ot.observaciones" style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); font-size: 0.85rem;">
          <span style="color: var(--text-muted); font-weight: 600;">Instrucciones para Taller:</span>
          <p style="margin: 0.25rem 0 0; color: var(--text-color); white-space: pre-line;">{{ ot.observaciones }}</p>
        </div>
      </div>

      <!-- Selector de Pestañas (Oculto en Impresión) -->
      <div class="tabs no-print" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
        <button
          @click="pestanaActiva = 'cortes'"
          class="btn btn-sm"
          :class="pestanaActiva === 'cortes' ? 'btn-primary' : 'btn-secondary'"
          style="display: flex; align-items: center; gap: 0.4rem;"
        >
          <span>📏</span> Listado de Cortes de Barras (5,99 m)
        </button>

        <button
          @click="pestanaActiva = 'materiales'"
          class="btn btn-sm"
          :class="pestanaActiva === 'materiales' ? 'btn-primary' : 'btn-secondary'"
          style="display: flex; align-items: center; gap: 0.4rem;"
        >
          <span>📦</span> Listado Consolidado de Materiales
        </button>

        <button
          @click="pestanaActiva = 'ventanas'"
          class="btn btn-sm"
          :class="pestanaActiva === 'ventanas' ? 'btn-primary' : 'btn-secondary'"
          style="display: flex; align-items: center; gap: 0.4rem;"
        >
          <span>🪟</span> Detalle de Ventanas Cotizadas
        </button>
      </div>

      <!-- ============================================================ -->
      <!-- PESTAÑA 1: LISTADO DE CORTES (Visible siempre en impresión)  -->
      <!-- ============================================================ -->
      <div v-show="pestanaActiva === 'cortes' || imprimiendo">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>📐</span> Optimización de Cortes de Perfiles
          </h2>
          <span style="font-size: 0.85rem; color: var(--text-muted);" class="no-print">
            Corte de sierra (kerf): 0.5 cm por corte | Barras: 5,99 m aprovechables
          </span>
        </div>

        <div v-if="!datosCortes || datosCortes.perfiles.length === 0" class="card" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No hay despiece de perfiles registrado en las ventanas de este presupuesto.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 1.5rem;">
          <!-- Card por cada tipo de perfil -->
          <div
            v-for="perfil in datosCortes.perfiles"
            :key="perfil.perfil_id"
            class="card"
            style="padding: 1.25rem;"
          >
            <!-- Cabecera del Perfil con Estadísticas de Rendimiento -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: 1.1rem; font-weight: 700; color: #38bdf8;">{{ perfil.nombre }}</span>
                  <span v-if="perfil.codigo" class="badge badge-muted" style="font-family: monospace;">{{ perfil.codigo }}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                  {{ perfil.total_piezas }} piezas totales a cortar &bull; {{ perfil.metros_lineales_piezas }} metros de piezas
                </div>
              </div>

              <!-- Indicadores Clave -->
              <div style="display: flex; gap: 1rem; align-items: center; font-size: 0.85rem;">
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.4rem 0.75rem; text-align: center;">
                  <span style="display: block; font-size: 0.75rem; color: var(--text-muted);">Barras 5,99m</span>
                  <span style="font-size: 1.1rem; font-weight: 700; color: #34d399;">{{ perfil.total_barras }}</span>
                </div>

                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.4rem 0.75rem; text-align: center;">
                  <span style="display: block; font-size: 0.75rem; color: var(--text-muted);">Sobrante / Merma</span>
                  <span style="font-size: 1rem; font-weight: 600; color: #fbbf24;">
                    {{ (perfil.desperdicio_total_cm / 100).toFixed(2) }} m ({{ perfil.desperdicio_pct }}%)
                  </span>
                </div>
              </div>
            </div>

            <!-- Barras Distribuidas -->
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div
                v-for="barra in perfil.barras"
                :key="barra.numero"
                style="background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.85rem;"
              >
                <!-- Info de la Barra -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; font-size: 0.85rem;">
                  <span style="font-weight: 600; color: var(--text-color);">
                    Barra #{{ barra.numero }} ({{ barra.largo_barra_cm / 100 }} m)
                  </span>
                  <div style="display: flex; gap: 0.75rem; font-size: 0.8rem;">
                    <span>Aprovechamiento: <strong style="color: #34d399;">{{ barra.aprovechamiento_pct }}%</strong></span>
                    <span>Sobrante: <strong style="color: #fbbf24;">{{ barra.sobrante_cm }} cm</strong></span>
                  </div>
                </div>

                <!-- Gráfico Visual de la Barra de 5.99m -->
                <div
                  class="barra-grafico-container"
                  style="display: flex; height: 42px; background: #0f172a; border-radius: 6px; overflow: hidden; position: relative; margin-bottom: 0.85rem; border: 1.5px solid #334155; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);"
                  title="Distribución de piezas en la barra de 5,99 m"
                >
                  <div
                    v-for="(pieza, pIdx) in barra.piezas"
                    :key="pIdx"
                    class="pieza-segmento-grafico"
                    :style="{
                      width: `${(pieza.largo_cm / barra.largo_barra_cm) * 100}%`,
                      backgroundColor: obtenerColorPieza(pIdx).bg,
                      color: obtenerColorPieza(pIdx).text,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: `2px solid ${obtenerColorPieza(pIdx).border}`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      padding: '0 2px',
                      boxSizing: 'border-box'
                    }"
                    :title="`Corte ${pIdx + 1}: ${pieza.largo_cm} cm (${pieza.ventana_ref})`"
                  >
                    <span class="pieza-largo-texto" style="font-weight: 800; font-size: 0.85rem; line-height: 1;">
                      {{ pieza.largo_cm }}cm
                    </span>
                    <span
                      v-if="(pieza.largo_cm / barra.largo_barra_cm) > 0.05"
                      class="pieza-ref-texto"
                      style="font-size: 0.65rem; font-weight: 600; opacity: 0.9; margin-top: 1px;"
                    >
                      {{ pieza.ventana_ref.split(' ')[0] }}
                    </span>
                  </div>

                  <!-- Espacio Sobrante -->
                  <div
                    v-if="barra.sobrante_cm > 0"
                    class="sobrante-grafico"
                    :style="{
                      width: `${(barra.sobrante_cm / barra.largo_barra_cm) * 100}%`,
                      background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 6px, rgba(0,0,0,0.2) 6px, rgba(0,0,0,0.2) 12px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderLeft: '1.5px dashed #475569'
                    }"
                    :title="`Sobrante: ${barra.sobrante_cm} cm`"
                  >
                    <span v-if="(barra.sobrante_cm / barra.largo_barra_cm) > 0.08">
                      {{ barra.sobrante_cm }}cm libre
                    </span>
                  </div>
                </div>

                <!-- Lista de piezas de la barra para checklist del operario -->
                <div class="piezas-checklist-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.5rem;">
                  <label
                    v-for="(pieza, pIdx) in barra.piezas"
                    :key="pieza.id"
                    class="pieza-checklist-card"
                    style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer; padding: 0.45rem 0.65rem; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color);"
                  >
                    <input
                      type="checkbox"
                      v-model="piezasCortadas[pieza.id]"
                      style="accent-color: #10b981; width: 17px; height: 17px; cursor: pointer;"
                    />
                    <div style="flex: 1; min-width: 0;">
                      <div style="display: flex; align-items: baseline; gap: 0.4rem;">
                        <span
                          :style="{
                            backgroundColor: obtenerColorPieza(pIdx).bg,
                            color: obtenerColorPieza(pIdx).text,
                            borderColor: obtenerColorPieza(pIdx).border
                          }"
                          style="font-size: 0.7rem; font-weight: 800; padding: 0.1rem 0.35rem; border-radius: 3px; border: 1px solid; line-height: 1;"
                        >
                          #{{ pIdx + 1 }}
                        </span>
                        <strong
                          :style="{
                            textDecoration: piezasCortadas[pieza.id] ? 'line-through' : 'none',
                            color: piezasCortadas[pieza.id] ? 'var(--text-muted)' : '#f8fafc',
                            fontSize: '0.92rem'
                          }"
                        >
                          {{ pieza.largo_cm }} cm
                        </strong>
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        {{ pieza.ventana_ref }}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- PESTAÑA 2: LISTADO DE MATERIALES                             -->
      <!-- ============================================================ -->
      <div v-show="pestanaActiva === 'materiales' || imprimiendo" style="margin-top: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>📦</span> Materiales Totales Consolidados para Bodega / Compra
          </h2>
          <span style="font-size: 0.85rem; color: var(--text-muted);" class="no-print">
            Cálculo totalizado de barras, metros cuadrados de vidrio y accesorios requeridos
          </span>
        </div>

        <div v-if="!datosCortes || datosCortes.materiales.length === 0" class="card" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No hay materiales calculados para esta orden.
        </div>

        <div v-else class="card" style="padding: 0; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.02);">
                <th style="padding: 0.85rem 1.25rem;">Categoría</th>
                <th style="padding: 0.85rem 1rem;">Material / Insumo</th>
                <th style="padding: 0.85rem 1rem;">Detalle Técnico</th>
                <th style="padding: 0.85rem 1rem; text-align: right;">Cantidad Requerida</th>
                <th style="padding: 0.85rem 1rem; text-align: center;">Unidad</th>
                <th style="padding: 0.85rem 1.25rem; text-align: right;" class="no-print">Costo Est. Neto</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(mat, mIdx) in datosCortes.materiales"
                :key="mIdx"
                style="border-bottom: 1px solid var(--border-color);"
              >
                <!-- Categoría -->
                <td style="padding: 0.85rem 1.25rem;">
                  <span :class="['badge', obtenerClaseCategoria(mat.categoria)]">
                    {{ obtenerLabelCategoria(mat.categoria) }}
                  </span>
                </td>

                <!-- Nombre -->
                <td style="padding: 0.85rem 1rem; font-weight: 600;">
                  {{ mat.nombre }}
                </td>

                <!-- Detalle -->
                <td style="padding: 0.85rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
                  {{ mat.detalle || '-' }}
                </td>

                <!-- Cantidad -->
                <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 700; color: #34d399; font-size: 1rem;">
                  {{ mat.cantidad_total }}
                </td>

                <!-- Unidad -->
                <td style="padding: 0.85rem 1rem; text-align: center; color: var(--text-muted);">
                  {{ mat.unidad }}
                </td>

                <!-- Costo Estimado -->
                <td style="padding: 0.85rem 1.25rem; text-align: right; color: var(--text-muted);" class="no-print">
                  ${{ mat.costo_estimado_total ? formatearDinero(mat.costo_estimado_total) : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- PESTAÑA 3: VENTANAS DEL PRESUPUESTO                          -->
      <!-- ============================================================ -->
      <div v-show="pestanaActiva === 'ventanas'" class="no-print" style="margin-top: 1.5rem;">
        <h2 style="font-size: 1.2rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🪟</span> Ventanas Incluidas en esta Orden
        </h2>

        <div v-if="!ot.presupuesto?.ventanas || ot.presupuesto.ventanas.length === 0" class="card" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Sin detalle de ventanas registrado.
        </div>

        <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem;">
          <div
            v-for="(v, idx) in ot.presupuesto.ventanas"
            :key="v.id || idx"
            class="card"
            style="padding: 1.25rem;"
          >
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <span style="font-weight: 700; font-size: 1rem; color: #38bdf8;">
                Ventana #{{ v.posicion || (idx + 1) }}
              </span>
              <span class="badge badge-info">{{ v.cantidad }} un.</span>
            </div>

            <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.35rem; color: var(--text-color);">
              <div><strong>Dimensiones Vano:</strong> {{ v.ancho_vano }} × {{ v.alto_vano }} cm</div>
              <div v-if="v.calculo_snapshot?.vidrio">
                <strong>Vidrio:</strong> {{ v.calculo_snapshot.vidrio.nombre }} ({{ v.calculo_snapshot.dimensiones.ancho_vidrio_cm }} × {{ v.calculo_snapshot.dimensiones.alto_vidrio_cm }} cm)
              </div>
              <div v-if="v.calculo_snapshot?.color?.nombre">
                <strong>Color Perfil:</strong> {{ v.calculo_snapshot.color.nombre }}
              </div>
              <div v-if="v.calculo_snapshot?.marco_madera">
                <strong>Marco Madera:</strong> {{ v.calculo_snapshot.marco_madera.nombre }} ({{ v.calculo_snapshot.marco_madera.ancho_pulgadas }}")
              </div>
              <div v-if="v.observacion" style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.25rem;">
                <em>Nota: {{ v.observacion }}</em>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrdenTrabajo, EstadoOT, ListadoCortesCompleto } from '~~/shared/tipos'
import { generarListadoCortesYMateriales } from '~~/shared/calculo'

const route = useRoute()
const otIdParam = route.params.id as string

const { cargarOTPorId, cambiarEstadoOT } = useOrdenesTrabajo()
const { perfiles, cargarPerfiles } = useCatalogos()

const ot = ref<OrdenTrabajo | null>(null)
const cargando = ref(true)
const actualizandoEstado = ref(false)
const pestanaActiva = ref<'cortes' | 'materiales' | 'ventanas'>('cortes')
const notificacion = ref<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null)
const imprimiendo = ref(false)

// Estado local de piezas cortadas para checklist en taller
const piezasCortadas = reactive<Record<string, boolean>>({})

// Paleta de colores de alto contraste para las piezas de perfiles (excelente en pantalla y en papel)
const COLORES_PIEZAS = [
  { bg: '#bae6fd', border: '#0284c7', text: '#0369a1' }, // Celeste cielo
  { bg: '#bbf7d0', border: '#16a34a', text: '#15803d' }, // Verde menta
  { bg: '#fde68a', border: '#d97706', text: '#b45309' }, // Ámbar
  { bg: '#fed7aa', border: '#ea580c', text: '#c2410c' }, // Naranja
  { bg: '#ddd6fe', border: '#7c3aed', text: '#6d28d9' }, // Violeta
  { bg: '#fbcfe8', border: '#db2777', text: '#be185d' }, // Rosa
  { bg: '#a5f3fc', border: '#0891b2', text: '#0e7490' }, // Cian
  { bg: '#c7d2fe', border: '#4f46e5', text: '#4338ca' }  // Índigo
]

function obtenerColorPieza(index: number) {
  return COLORES_PIEZAS[index % COLORES_PIEZAS.length]
}

function mostrarNotificacion(mensaje: string, tipo: 'exito' | 'error' = 'exito') {
  notificacion.value = { mensaje, tipo }
  setTimeout(() => { notificacion.value = null }, 4000)
}

function formatearDinero(num: number | null | undefined) {
  if (num == null) return '0'
  return Math.round(num).toLocaleString('es-CL')
}

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

function obtenerClaseCategoria(cat: string) {
  switch (cat) {
    case 'perfil': return 'badge-info'
    case 'vidrio': return 'badge-warning'
    case 'accesorio': return 'badge-muted'
    case 'marco_madera': return 'badge-success'
    default: return 'badge-muted'
  }
}

function obtenerLabelCategoria(cat: string) {
  switch (cat) {
    case 'perfil': return 'Perfil'
    case 'vidrio': return 'Vidrio'
    case 'accesorio': return 'Accesorio'
    case 'marco_madera': return 'Marco Madera'
    default: return cat
  }
}

async function handleCambiarEstado(nuevoEstado: EstadoOT) {
  if (!ot.value) return
  actualizandoEstado.value = true
  try {
    await cambiarEstadoOT(ot.value.id, nuevoEstado)
    ot.value.estado = nuevoEstado
    mostrarNotificacion(`Estado actualizado a "${obtenerLabelEstado(nuevoEstado)}"`)
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al cambiar estado', 'error')
  } finally {
    actualizandoEstado.value = false
  }
}

function imprimirHojaTaller() {
  imprimiendo.value = true
  setTimeout(() => {
    window.print()
    imprimiendo.value = false
  }, 150)
}

// Cálculo reactivo de optimización de cortes de barras y materiales consolidados
const datosCortes = computed<ListadoCortesCompleto | null>(() => {
  if (!ot.value?.presupuesto?.ventanas) return null
  return generarListadoCortesYMateriales(
    ot.value.presupuesto.ventanas,
    perfiles.value
  )
})

onMounted(async () => {
  cargando.value = true
  try {
    await cargarPerfiles()
    const data = await cargarOTPorId(otIdParam)
    ot.value = data
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al cargar la orden de trabajo', 'error')
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
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

.only-print {
  display: none;
}

/* Reglas de impresión para Hoja de Taller */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .no-print {
    display: none !important;
  }

  .only-print {
    display: block !important;
  }

  .container {
    max-width: 100% !important;
    padding: 0 !important;
  }

  body {
    background: #ffffff !important;
    color: #000000 !important;
  }

  .card, .print-card {
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    color: #000000 !important;
    box-shadow: none !important;
    break-inside: avoid;
    margin-bottom: 1rem !important;
    padding: 1rem !important;
  }

  /* Barras de corte impresas */
  .barra-grafico-container {
    background: #ffffff !important;
    border: 1.5px solid #0f172a !important;
    height: 44px !important;
    box-shadow: none !important;
  }

  .pieza-segmento-grafico {
    border-right: 2px solid #0f172a !important;
  }

  .pieza-largo-texto {
    font-weight: 800 !important;
    font-size: 9.5pt !important;
    text-shadow: none !important;
  }

  .pieza-ref-texto {
    font-weight: 600 !important;
    font-size: 7.5pt !important;
    text-shadow: none !important;
  }

  .sobrante-grafico {
    background: repeating-linear-gradient(45deg, #f8fafc, #f8fafc 6px, #e2e8f0 6px, #e2e8f0 12px) !important;
    border-left: 2px dashed #475569 !important;
    color: #475569 !important;
    font-weight: 700 !important;
    text-shadow: none !important;
  }

  .pieza-checklist-card {
    background: #f8fafc !important;
    border: 1px solid #94a3b8 !important;
    color: #000000 !important;
  }

  .pieza-checklist-card strong {
    color: #000000 !important;
    font-size: 9.5pt !important;
  }

  .pieza-checklist-card input[type="checkbox"] {
    border: 1.5px solid #000000 !important;
  }
}
</style>
