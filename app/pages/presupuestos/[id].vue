<template>
  <div class="container editor-presupuesto">
    <!-- Encabezado con N° y Estados -->
    <div class="editor-encabezado">
      <div>
        <div class="editor-breadcrumb">
          <NuxtLink to="/presupuestos" class="editor-volver">
            ← Presupuestos
          </NuxtLink>
          <span class="editor-sep">/</span>
          <span :class="['badge', obtenerClaseEstado(form.estado)]">{{ form.estado }}</span>
        </div>
        <h1>{{ esNuevo ? 'Nuevo Presupuesto' : `Presupuesto #${form.numero}` }}</h1>
      </div>

      <!-- Acciones de estado (si no es nuevo) -->
      <div v-if="!esNuevo" class="editor-acciones">
        <button
          v-if="form.estado === 'borrador'"
          @click="handleCambiarEstado('enviado')"
          class="btn btn-secondary btn-sm"
        >
          Marcar como Enviado
        </button>

        <button
          v-if="form.estado === 'enviado'"
          @click="handleCambiarEstado('borrador')"
          class="btn btn-secondary btn-sm"
        >
          Volver a Borrador
        </button>

        <button
          v-if="form.estado === 'borrador' || form.estado === 'enviado'"
          @click="handleCambiarEstado('aceptado')"
          class="btn btn-primary btn-sm"
          style="background-color: #10b981;"
        >
          ✓ Aceptar Presupuesto
        </button>

        <!-- Botón Orden de Trabajo (si está aceptado) -->
        <template v-if="form.estado === 'aceptado'">
          <NuxtLink
            v-if="otAsociada"
            :to="`/ordenes-trabajo/${otAsociada.id}`"
            class="btn btn-primary btn-sm"
            style="background-color: #0284c7; display: inline-flex; align-items: center; gap: 0.35rem;"
          >
            📋 Ver Orden de Trabajo #{{ otAsociada.numero }}
          </NuxtLink>
          <button
            v-else
            @click="modalGenerarOT = true"
            class="btn btn-primary btn-sm"
            style="background-color: #0284c7; display: inline-flex; align-items: center; gap: 0.35rem;"
          >
            📋 Generar Orden de Trabajo
          </button>
        </template>

        <button
          v-if="form.estado === 'aceptado'"
          @click="handleCambiarEstado('rechazado')"
          class="btn btn-danger btn-sm"
        >
          Marcar como Rechazado
        </button>

        <button
          @click="handleDuplicarActual"
          class="btn btn-secondary btn-sm"
        >
          Duplicar
        </button>

        <!-- Botones PDF y WhatsApp superiores -->
        <button
          type="button"
          @click="handleDescargarPdf"
          class="btn btn-secondary btn-sm"
          :disabled="generandiPdf || (ventanas.length === 0 && itemsLibres.length === 0)"
          style="display: inline-flex; align-items: center; gap: 0.35rem;"
          title="Descargar presupuesto formal en PDF"
        >
          📄 {{ generandiPdf ? 'Generando...' : 'Descargar PDF' }}
        </button>

        <button
          type="button"
          @click="handleCompartirWhatsApp"
          class="btn btn-secondary btn-sm"
          :disabled="generandiPdf || (ventanas.length === 0 && itemsLibres.length === 0)"
          style="display: inline-flex; align-items: center; gap: 0.35rem; color: #4ade80; border-color: #22c55e;"
          title="Compartir presupuesto por WhatsApp"
        >
          💬 WhatsApp
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="bloqueadoEdicion" class="alert alert-danger" style="margin-bottom: 1.5rem;">
      <span>🔒 Este presupuesto está <strong>Aceptado</strong> y sus ítems se encuentran bloqueados para edición.</span>
    </div>

    <div v-if="notificacion" :class="`alert ${notificacion.tipo === 'error' ? 'alert-danger' : 'alert-success'}`">
      <span>{{ notificacion.mensaje }}</span>
    </div>

    <div class="grid-editor-presupuesto">
      <!-- COLUMNA PRINCIPAL -->
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- 1. Datos del Cliente y Presupuesto -->
        <div class="card">
          <h3 style="margin-bottom: 1.25rem; font-size: 1.15rem;">1. Datos del Cliente</h3>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Nombre del Cliente *</label>
              <input
                v-model="form.cliente_nombre"
                type="text"
                class="form-input"
                placeholder="Nombre o Razón Social"
                required
                :disabled="bloqueadoEdicion"
                list="clientes-list"
                @change="onSeleccionarClienteExistente"
              />
              <datalist id="clientes-list">
                <option v-for="c in clientes" :key="c.id" :value="c.nombre" />
              </datalist>
            </div>

            <div class="form-group">
              <label class="form-label">Teléfono (WhatsApp)</label>
              <input
                v-model="form.cliente_telefono"
                type="tel"
                class="form-input"
                placeholder="+56 9 1234 5678"
                :disabled="bloqueadoEdicion"
              />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Correo Electrónico</label>
              <input
                v-model="form.cliente_correo"
                type="email"
                class="form-input"
                placeholder="cliente@correo.cl"
                :disabled="bloqueadoEdicion"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Dirección</label>
              <input
                v-model="form.cliente_direccion"
                type="text"
                class="form-input"
                placeholder="Calle, Número, Comuna"
                :disabled="bloqueadoEdicion"
              />
            </div>
          </div>

          <div class="form-row-2" style="margin-top: 0.25rem;">
            <div class="form-group">
              <label class="form-label">Fecha de Emisión</label>
              <input
                v-model="form.fecha"
                type="date"
                class="form-input"
                :disabled="bloqueadoEdicion"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Validez de la Oferta (días)</label>
              <input
                v-model.number="form.validez_dias"
                type="number"
                min="1"
                class="form-input"
                :disabled="bloqueadoEdicion"
              />
            </div>
          </div>
        </div>

        <!-- 2. Ventanas Cotizadas -->
        <div class="card">
          <div class="card-seccion-header">
            <div>
              <h3>2. Ventanas</h3>
              <p class="card-seccion-desc">
                Calculadas automáticamente según tipología, fórmulas y materiales
              </p>
            </div>
            <button
              v-if="!bloqueadoEdicion"
              type="button"
              @click="abrirModalVentana()"
              class="btn btn-primary btn-sm"
            >
              + Agregar Ventana
            </button>
          </div>

          <!-- Móvil: una tarjeta por ventana -->
          <div class="lista-movil">
            <p v-if="ventanas.length === 0" class="lista-vacia">
              No hay ventanas en este presupuesto. Toca "+ Agregar Ventana".
            </p>
            <article v-for="(vent, idx) in ventanas" :key="`m-${idx}`" class="item-card">
              <div class="item-card-top">
                <span class="item-card-indice">#{{ idx + 1 }}</span>
                <strong>{{ vent.calculo_snapshot.vidrio?.nombre || 'Ventana' }}</strong>
                <button
                  v-if="!bloqueadoEdicion"
                  type="button"
                  @click="eliminarVentana(idx)"
                  class="btn btn-danger btn-sm item-card-borrar"
                  title="Eliminar ventana"
                >
                  ✕
                </button>
              </div>
              <p class="item-card-meta">
                {{ vent.ancho_vano }} × {{ vent.alto_vano }} cm · Margen {{ vent.margen_pct }}% · Cant. {{ vent.cantidad }}
              </p>
              <div class="item-card-montos">
                <span>Unit. ${{ formatearDinero(vent.precio_neto_unitario) }}</span>
                <strong>${{ formatearDinero(vent.precio_neto_total) }}</strong>
              </div>
            </article>
          </div>

          <div class="table-container solo-escritorio">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Modelo / Tipología</th>
                  <th>Vano (cm)</th>
                  <th style="text-align: center;">Cant.</th>
                  <th style="text-align: right;">P. Unit Neto</th>
                  <th style="text-align: right;">Total Neto</th>
                  <th v-if="!bloqueadoEdicion" style="text-align: right; width: 100px;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(vent, idx) in ventanas" :key="idx">
                  <td style="color: var(--text-dim); font-size: 0.85rem;">{{ idx + 1 }}</td>
                  <td>
                    <div style="font-weight: 600;">{{ vent.calculo_snapshot.vidrio?.nombre || 'Ventana' }}</div>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">
                      {{ vent.ancho_vano }}x{{ vent.alto_vano }} cm — Margen: {{ vent.margen_pct }}%
                    </div>
                  </td>
                  <td style="font-size: 0.85rem;">
                    {{ vent.ancho_vano }} x {{ vent.alto_vano }}
                  </td>
                  <td style="text-align: center; font-weight: 600;">
                    {{ vent.cantidad }}
                  </td>
                  <td style="text-align: right; font-weight: 500;">
                    ${{ formatearDinero(vent.precio_neto_unitario) }}
                  </td>
                  <td style="text-align: right; font-weight: 700; color: #38bdf8;">
                    ${{ formatearDinero(vent.precio_neto_total) }}
                  </td>
                  <td v-if="!bloqueadoEdicion" style="text-align: right;">
                    <div style="display: flex; gap: 0.35rem; justify-content: flex-end;">
                      <button
                        type="button"
                        @click="eliminarVentana(idx)"
                        class="btn btn-danger btn-sm"
                        style="padding: 0.2rem 0.45rem;"
                        title="Eliminar ventana"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="ventanas.length === 0">
                  <td :colspan="bloqueadoEdicion ? 6 : 7" style="text-align: center; padding: 2rem; color: var(--text-dim);">
                    No hay ventanas en este presupuesto. Haz clic en "+ Agregar Ventana".
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. Ítems Libres (Instalación, Flete, etc.) -->
        <div class="card">
          <div class="card-seccion-header">
            <div>
              <h3>3. Ítems Libres y Servicios</h3>
              <p class="card-seccion-desc">
                Instalación, traslados o servicios adicionales sin fórmula
              </p>
            </div>
            <button
              v-if="!bloqueadoEdicion"
              type="button"
              @click="agregarItemLibre"
              class="btn btn-secondary btn-sm"
            >
              + Agregar Ítem Libre
            </button>
          </div>

          <!-- Móvil: un formulario apilado por ítem -->
          <div class="lista-movil">
            <p v-if="itemsLibres.length === 0" class="lista-vacia">
              Sin ítems libres adicionales.
            </p>
            <article v-for="(it, idx) in itemsLibres" :key="`ml-${idx}`" class="item-card">
              <div class="item-card-top">
                <span class="item-card-indice">Ítem {{ idx + 1 }}</span>
                <button
                  v-if="!bloqueadoEdicion"
                  type="button"
                  @click="eliminarItemLibre(idx)"
                  class="btn btn-danger btn-sm item-card-borrar"
                >
                  ✕
                </button>
              </div>
              <label class="form-label">Descripción</label>
              <input
                v-model="it.descripcion"
                type="text"
                class="form-input"
                placeholder="Ej. Instalación en obra, Retiro marco viejo"
                :disabled="bloqueadoEdicion"
              />
              <div class="form-row-2" style="margin-top: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Cantidad</label>
                  <input
                    v-model.number="it.cantidad"
                    type="number"
                    min="1"
                    inputmode="numeric"
                    class="form-input"
                    :disabled="bloqueadoEdicion"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Precio neto unit.</label>
                  <input
                    v-model.number="it.precio_unitario_neto"
                    type="number"
                    min="0"
                    inputmode="decimal"
                    class="form-input"
                    :disabled="bloqueadoEdicion"
                  />
                </div>
              </div>
              <div class="item-card-montos">
                <span>Total neto</span>
                <strong>${{ formatearDinero((it.cantidad || 0) * (it.precio_unitario_neto || 0)) }}</strong>
              </div>
            </article>
          </div>

          <div class="table-container solo-escritorio">
            <table class="table">
              <thead>
                <tr>
                  <th>Descripción del Servicio / Ítem</th>
                  <th style="width: 100px; text-align: center;">Cantidad</th>
                  <th style="width: 160px; text-align: right;">Precio Neto Unit.</th>
                  <th style="width: 160px; text-align: right;">Total Neto</th>
                  <th v-if="!bloqueadoEdicion" style="width: 60px; text-align: right;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, idx) in itemsLibres" :key="idx">
                  <td>
                    <input
                      v-model="it.descripcion"
                      type="text"
                      class="form-input"
                      placeholder="Ej. Instalación en obra, Retiro marco viejo"
                      :disabled="bloqueadoEdicion"
                      style="padding: 0.35rem 0.5rem; font-size: 0.875rem;"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="it.cantidad"
                      type="number"
                      min="1"
                      class="form-input"
                      :disabled="bloqueadoEdicion"
                      style="padding: 0.35rem 0.5rem; text-align: center; font-size: 0.875rem;"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="it.precio_unitario_neto"
                      type="number"
                      min="0"
                      class="form-input"
                      :disabled="bloqueadoEdicion"
                      style="padding: 0.35rem 0.5rem; text-align: right; font-size: 0.875rem;"
                    />
                  </td>
                  <td style="text-align: right; font-weight: 600;">
                    ${{ formatearDinero((it.cantidad || 0) * (it.precio_unitario_neto || 0)) }}
                  </td>
                  <td v-if="!bloqueadoEdicion" style="text-align: right;">
                    <button
                      type="button"
                      @click="eliminarItemLibre(idx)"
                      class="btn btn-danger btn-sm"
                      style="padding: 0.2rem 0.45rem;"
                    >
                      ✕
                    </button>
                  </td>
                </tr>

                <tr v-if="itemsLibres.length === 0">
                  <td :colspan="bloqueadoEdicion ? 4 : 5" style="text-align: center; padding: 1.5rem; color: var(--text-dim); font-size: 0.875rem;">
                    Sin ítems libres adicionales.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. Observaciones -->
        <div class="card" style="padding: 1.5rem;">
          <h3 style="font-size: 1.15rem; margin-bottom: 0.75rem;">Observaciones y Condiciones</h3>
          <textarea
            v-model="form.observaciones"
            class="form-input"
            rows="3"
            placeholder="Condiciones de pago, plazos de entrega, detalles de instalación..."
            :disabled="bloqueadoEdicion"
          ></textarea>
        </div>
      </div>

      <!-- COLUMNA LATERAL: RESUMEN DE TOTALES -->
      <div class="resumen-columna">
        <div class="card" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 1.25rem; font-size: 1.15rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
            Resumen del Presupuesto
          </h3>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.95rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Subtotal Ventanas:</span>
              <span style="font-weight: 600;">${{ formatearDinero(totales.subtotal_ventanas) }}</span>
            </div>

            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Subtotal Ítems Libres:</span>
              <span style="font-weight: 600;">${{ formatearDinero(totales.subtotal_items_libres) }}</span>
            </div>

            <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; display: flex; justify-content: space-between;">
              <span style="font-weight: 500;">Subtotal Neto:</span>
              <span style="font-weight: 600;">${{ formatearDinero(totales.subtotal_neto) }}</span>
            </div>

            <!-- Descuento Global -->
            <div style="border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
              <div class="descuento-fila">
                <span style="color: var(--text-muted); font-size: 0.85rem;">Descuento Global:</span>
                <select
                  v-model="form.descuento_tipo"
                  class="form-select descuento-tipo"
                  :disabled="bloqueadoEdicion"
                >
                  <option value="monto">Monto ($)</option>
                  <option value="porcentaje">Porcentaje (%)</option>
                </select>
              </div>

              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <input
                  v-model.number="form.descuento_valor"
                  type="number"
                  min="0"
                  class="form-input"
                  style="padding: 0.35rem 0.5rem; font-size: 0.85rem; text-align: right;"
                  placeholder="0"
                  :disabled="bloqueadoEdicion"
                />
              </div>

              <div v-if="totales.descuento_neto > 0" style="display: flex; justify-content: space-between; margin-top: 0.35rem; color: #f87171; font-size: 0.85rem;">
                <span>Descuento aplicado:</span>
                <span>-${{ formatearDinero(totales.descuento_neto) }}</span>
              </div>
            </div>

            <!-- Neto Final -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: space-between; font-size: 1rem;">
              <span style="font-weight: 600;">Neto:</span>
              <span style="font-weight: 700;">${{ formatearDinero(totales.neto) }}</span>
            </div>

            <!-- IVA 19% -->
            <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
              <span>IVA (19%):</span>
              <span>${{ formatearDinero(totales.iva) }}</span>
            </div>

            <!-- Total General -->
            <div style="border-top: 2px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: space-between; font-size: 1.25rem;">
              <span style="font-weight: 700;">TOTAL:</span>
              <span style="font-weight: 800; color: #34d399;">${{ formatearDinero(totales.total) }}</span>
            </div>
          </div>

          <div style="margin-top: 1.75rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <button
              v-if="!bloqueadoEdicion"
              type="button"
              @click="guardarPresupuestoCompleto"
              class="btn btn-primary btn-block"
              :disabled="guardando || (ventanas.length === 0 && itemsLibres.length === 0)"
            >
              {{ guardando ? 'Guardando...' : (esNuevo ? 'Crear Presupuesto' : 'Guardar Cambios') }}
            </button>

            <!-- Botones PDF y WhatsApp en barra lateral -->
            <button
              type="button"
              @click="handleDescargarPdf"
              class="btn btn-secondary btn-block"
              :disabled="generandiPdf || (ventanas.length === 0 && itemsLibres.length === 0)"
              style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;"
            >
              <span>📄</span>
              <span>{{ generandiPdf ? 'Generando PDF...' : 'Descargar PDF' }}</span>
            </button>

            <button
              type="button"
              @click="handleCompartirWhatsApp"
              class="btn btn-secondary btn-block"
              :disabled="generandiPdf || (ventanas.length === 0 && itemsLibres.length === 0)"
              style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; border-color: #22c55e; color: #4ade80;"
            >
              <span>💬</span>
              <span>Enviar por WhatsApp</span>
            </button>

            <NuxtLink to="/presupuestos" class="btn btn-secondary btn-block">
              Cerrar
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL: AGREGAR VENTANA CON MOTOR DE CÁLCULO DE LA ETAPA 03     -->
    <!-- ============================================================== -->
    <div v-if="modalVentanaAbierto" class="modal-backdrop" @click.self="modalVentanaAbierto = false">
      <div class="modal-card">
        <h3 style="margin-bottom: 1rem;">Configurar Ventana para Cotización</h3>

        <div class="form-row-2" style="margin-bottom: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Línea de Perfil *</label>
            <select v-model="mvLineaId" class="form-select" required>
              <option value="" disabled>Selecciona línea...</option>
              <option v-for="l in lineasActivas" :key="l.id" :value="l.id">
                {{ l.nombre }} ({{ l.tipo_material }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tipología / Modelo *</label>
            <select v-model="mvTipologiaId" class="form-select" required>
              <option value="" disabled>Selecciona modelo...</option>
              <option v-for="t in tipologiasActivas" :key="t.id" :value="t.id">
                {{ t.nombre }} ({{ t.tipo_base }})
              </option>
            </select>
          </div>
        </div>

        <div class="form-row-3" style="margin-bottom: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Ancho Vano (cm) *</label>
            <input v-model.number="mvAncho" type="number" min="1" step="0.5" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Alto Vano (cm) *</label>
            <input v-model.number="mvAlto" type="number" min="1" step="0.5" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Cantidad *</label>
            <input v-model.number="mvCantidad" type="number" min="1" class="form-input" required />
          </div>
        </div>

        <div class="form-row-2" style="margin-bottom: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Vidrio / Cristal *</label>
            <select v-model="mvVidrioId" class="form-select" required>
              <option value="" disabled>Selecciona vidrio...</option>
              <option v-for="v in vidriosActivos" :key="v.id" :value="v.id">
                {{ v.nombre }} ({{ v.espesor_mm }} mm) - ${{ formatearDinero(v.precio_m2) }}/m²
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Color / Acabado</label>
            <select v-model="mvColorId" class="form-select">
              <option :value="null">Estándar (Sin recargo)</option>
              <option v-for="c in coloresDisponibles" :key="c.id" :value="c.id">
                {{ c.nombre }}
                <span v-if="c.tipo_recargo === 'porcentaje'">(+{{ c.valor_recargo }}%)</span>
                <span v-else-if="c.tipo_recargo === 'monto_metro'">(+${{ c.valor_recargo }}/m)</span>
              </option>
            </select>
          </div>
        </div>

        <div class="grid-marco-margen">
          <div class="form-group">
            <label class="form-label">Marco de Madera (Opcional)</label>
            <select v-model="mvMarcoId" class="form-select">
              <option :value="null">Sin marco de madera</option>
              <option v-for="m in marcosActivos" :key="m.id" :value="m.id">
                {{ m.nombre }} ({{ m.ancho_pulgadas }}", esp. {{ m.espesor_cm }} cm)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Margen Comercial (%)</label>
            <input v-model.number="mvMargen" type="number" min="0" max="200" class="form-input" />
          </div>
        </div>

        <!-- Preview del Cálculo del Motor en Vivo -->
        <div v-if="calculoModal.valido" class="calculo-preview">
          <div class="calculo-preview-top">
            <span class="calculo-preview-titulo">Desglose calculado</span>
            <span class="calculo-preview-precio">
              Precio neto: ${{ formatearDinero(calculoModal.totales.precio_neto_total) }}
            </span>
          </div>

          <div class="calculo-preview-grid">
            <div>Vano útil: {{ calculoModal.dimensiones.ancho_util }}x{{ calculoModal.dimensiones.alto_util }} cm</div>
            <div>Vidrio: {{ calculoModal.dimensiones.m2_vidrio_total }} m²</div>
            <div>Costo Mat.: ${{ formatearDinero(calculoModal.totales.costo_materiales) }}</div>
            <div>Mano Obra: ${{ formatearDinero(calculoModal.totales.costo_mano_obra) }}</div>
            <div>Costo Total: ${{ formatearDinero(calculoModal.totales.costo_total) }}</div>
            <div>P. Unit.: ${{ formatearDinero(calculoModal.totales.precio_neto_unitario) }}</div>
          </div>
        </div>

        <div v-else-if="calculoModal.errores.length > 0" class="alert alert-danger" style="margin-bottom: 1.25rem; font-size: 0.85rem;">
          <span>{{ calculoModal.errores[0] }}</span>
        </div>

        <div class="modal-actions">
          <button type="button" @click="modalVentanaAbierto = false" class="btn btn-secondary">Cancelar</button>
          <button
            type="button"
            @click="confirmarAgregarVentana"
            class="btn btn-primary"
            :disabled="!calculoModal.valido"
          >
            Agregar al Presupuesto
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Generar Orden de Trabajo -->
    <div v-if="modalGenerarOT" class="modal-backdrop" @click.self="modalGenerarOT = false">
      <div class="modal-card" style="max-width: 520px;">
        <h3 style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>📋</span> Generar Orden de Trabajo
        </h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
          Se creará la orden interna para el taller con el listado de cortes optimizados de barras de 5,99 m y materiales.
        </p>

        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem; font-weight: 500;">
              Fecha Estimada de Entrega / Instalación:
            </label>
            <input
              type="date"
              v-model="otFechaEntrega"
              class="input-text"
              style="width: 100%;"
            />
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem; font-weight: 500;">
              Instrucciones / Observaciones para Taller:
            </label>
            <textarea
              v-model="otObservaciones"
              rows="3"
              class="input-text"
              placeholder="Ej: Priorizar corte de correderas, embalar vidrios con protección reforzada..."
              style="width: 100%; resize: vertical;"
            ></textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" @click="modalGenerarOT = false" class="btn btn-secondary" :disabled="creandoOT">
            Cancelar
          </button>
          <button
            type="button"
            @click="handleConfirmarGenerarOT"
            class="btn btn-primary"
            style="background-color: #0284c7;"
            :disabled="creandoOT"
          >
            {{ creandoOT ? 'Generando...' : 'Confirmar y Ver Cortes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { calcularVentana, calcularTotalesPresupuesto } from '~~/shared/calculo'
import type {
  Presupuesto,
  PresupuestoVentana,
  PresupuestoItemLibre,
  EstadoPresupuesto,
  TipoDescuentoPresupuesto,
  OrdenTrabajo
} from '~~/shared/tipos'

const route = useRoute()
const router = useRouter()
const presupuestoIdParam = route.params.id as string
const esNuevo = computed(() => presupuestoIdParam === 'nuevo')

const {
  clientes,
  cargarClientes,
  cargarPresupuestoPorId,
  guardarPresupuesto,
  cambiarEstado,
  duplicarPresupuesto
} = usePresupuestos()

const {
  obtenerOTPorPresupuestoId,
  crearOTDesdePresupuesto
} = useOrdenesTrabajo()

const {
  lineas,
  perfiles,
  tipologias,
  vidrios,
  colores,
  accesorios,
  marcosMadera,
  formulas,
  cargarTodo: cargarCatalogos
} = useCatalogos()

const { vidrieria } = useVidrieria()
const {
  descargarPdf,
  compartirWhatsApp,
  generandiPdf
} = usePresupuestoPdf()

const guardando = ref(false)
const notificacion = ref<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null)

// Estado para Orden de Trabajo asociada
const otAsociada = ref<OrdenTrabajo | null>(null)
const modalGenerarOT = ref(false)
const otFechaEntrega = ref('')
const otObservaciones = ref('')
const creandoOT = ref(false)

async function handleConfirmarGenerarOT() {
  if (!form.id) return
  creandoOT.value = true
  try {
    const nuevaOT = await crearOTDesdePresupuesto(form.id, {
      fecha_entrega: otFechaEntrega.value || null,
      observaciones: otObservaciones.value || null
    })
    otAsociada.value = nuevaOT
    modalGenerarOT.value = false
    mostrarNotificacion(`Orden de Trabajo #${nuevaOT.numero} creada exitosamente.`, 'exito')
    // Navegar a la orden de trabajo
    router.push(`/ordenes-trabajo/${nuevaOT.id}`)
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al generar la orden de trabajo', 'error')
  } finally {
    creandoOT.value = false
  }
}

function mostrarNotificacion(mensaje: string, tipo: 'exito' | 'error' = 'exito') {
  notificacion.value = { mensaje, tipo }
  setTimeout(() => { notificacion.value = null }, 4000)
}

// Formulario Cabecera
const form = reactive<{
  id?: string
  numero: number
  cliente_id?: string | null
  cliente_nombre: string
  cliente_telefono: string
  cliente_correo: string
  cliente_direccion: string
  fecha: string
  validez_dias: number
  observaciones: string
  descuento_tipo: TipoDescuentoPresupuesto
  descuento_valor: number
  estado: EstadoPresupuesto
}>({
  id: undefined,
  numero: 0,
  cliente_id: null,
  cliente_nombre: '',
  cliente_telefono: '',
  cliente_correo: '',
  cliente_direccion: '',
  fecha: new Date().toISOString().split('T')[0],
  validez_dias: 15,
  observaciones: '',
  descuento_tipo: 'monto',
  descuento_valor: 0,
  estado: 'borrador'
})

const ventanas = ref<PresupuestoVentana[]>([])
const itemsLibres = ref<PresupuestoItemLibre[]>([])

const bloqueadoEdicion = computed(() => form.estado === 'aceptado')

// Computed catálogos
const lineasActivas = computed(() => lineas.value.filter(l => l.activo))
const tipologiasActivas = computed(() => tipologias.value.filter(t => t.activo))
const vidriosActivos = computed(() => vidrios.value.filter(v => v.activo))
const marcosActivos = computed(() => marcosMadera.value.filter(m => m.activo))

// Totales reactivos
const totales = computed(() => {
  return calcularTotalesPresupuesto(
    ventanas.value,
    itemsLibres.value,
    form.descuento_tipo,
    form.descuento_valor
  )
})

function formatearDinero(num: number | null | undefined) {
  if (num == null) return '0'
  return Math.round(num).toLocaleString('es-CL')
}

function obtenerClaseEstado(estado: EstadoPresupuesto) {
  switch (estado) {
    case 'aceptado': return 'badge-success'
    case 'enviado': return 'badge-info'
    case 'rechazado': return 'badge-danger'
    default: return 'badge-muted'
  }
}

function onSeleccionarClienteExistente() {
  const match = clientes.value.find(
    c => c.nombre.toLowerCase().trim() === form.cliente_nombre.toLowerCase().trim()
  )
  if (match) {
    form.cliente_id = match.id
    form.cliente_telefono = match.telefono || ''
    form.cliente_correo = match.correo || ''
    form.cliente_direccion = match.direccion || ''
  }
}

// -------------------------------------------------------------
// MODAL AGREGAR VENTANA
// -------------------------------------------------------------
const modalVentanaAbierto = ref(false)
const mvLineaId = ref<string>('')
const mvTipologiaId = ref<string>('')
const mvAncho = ref<number>(150)
const mvAlto = ref<number>(120)
const mvCantidad = ref<number>(1)
const mvVidrioId = ref<string>('')
const mvColorId = ref<string | null>(null)
const mvMarcoId = ref<string | null>(null)
const mvMargen = ref<number>(30)

const coloresDisponibles = computed(() => {
  return colores.value.filter(c => c.activo && (!c.linea_id || c.linea_id === mvLineaId.value))
})

function abrirModalVentana() {
  mvLineaId.value = lineasActivas.value[0]?.id || ''
  mvTipologiaId.value = tipologiasActivas.value[0]?.id || ''
  mvVidrioId.value = vidriosActivos.value[0]?.id || ''
  mvColorId.value = null
  mvMarcoId.value = null
  mvAncho.value = 150
  mvAlto.value = 120
  mvCantidad.value = 1
  mvMargen.value = vidrieria.value?.margen_defecto ?? 30
  modalVentanaAbierto.value = true
}

const calculoModal = computed(() => {
  const linea = lineas.value.find(l => l.id === mvLineaId.value)
  const tipologia = tipologias.value.find(t => t.id === mvTipologiaId.value)
  const vidrio = vidrios.value.find(v => v.id === mvVidrioId.value)
  const color = mvColorId.value ? colores.value.find(c => c.id === mvColorId.value) : null
  const marco = mvMarcoId.value ? marcosMadera.value.find(m => m.id === mvMarcoId.value) : null

  if (!linea || !tipologia || !vidrio) {
    return {
      valido: false,
      errores: ['Selecciona línea, tipología y vidrio'],
      dimensiones: { ancho_util: 0, alto_util: 0, m2_vidrio_total: 0 },
      totales: { costo_materiales: 0, costo_mano_obra: 0, costo_total: 0, precio_neto_total: 0, precio_neto_unitario: 0 }
    }
  }

  const formula = formulas.value.find(
    f => f.tipologia_id === tipologia.id && f.linea_id === linea.id
  )

  return calcularVentana({
    ancho_vano: mvAncho.value,
    alto_vano: mvAlto.value,
    cantidad: mvCantidad.value,
    linea,
    tipologia,
    formula,
    vidrio,
    color,
    marco_madera: marco,
    perfiles_catalogo: perfiles.value,
    accesorios_catalogo: accesorios.value,
    merma_vidrieria_defecto: vidrieria.value?.merma_defecto ?? 5,
    merma_vidrio_defecto: 0,
    mano_obra_fijo_defecto: vidrieria.value?.mano_obra_fijo_defecto ?? 0,
    mano_obra_m2_defecto: vidrieria.value?.mano_obra_m2_defecto ?? 0,
    margen_comercial_defecto: mvMargen.value,
    margen_comercial_override: mvMargen.value
  })
})

function confirmarAgregarVentana() {
  if (!calculoModal.value.valido) return

  const calc = calculoModal.value as any

  ventanas.value.push({
    posicion: ventanas.value.length + 1,
    linea_id: mvLineaId.value,
    tipologia_id: mvTipologiaId.value,
    vidrio_id: mvVidrioId.value,
    color_id: mvColorId.value,
    marco_madera_id: mvMarcoId.value,
    ancho_vano: mvAncho.value,
    alto_vano: mvAlto.value,
    cantidad: mvCantidad.value,
    margen_pct: mvMargen.value,
    costo_materiales: calc.totales.costo_materiales,
    costo_mano_obra: calc.totales.costo_mano_obra,
    costo_total: calc.totales.costo_total,
    precio_neto_unitario: calc.totales.precio_neto_unitario,
    precio_neto_total: calc.totales.precio_neto_total,
    calculo_snapshot: calc
  })

  modalVentanaAbierto.value = false
}

function eliminarVentana(idx: number) {
  ventanas.value.splice(idx, 1)
}

function agregarItemLibre() {
  itemsLibres.value.push({
    posicion: itemsLibres.value.length + 1,
    descripcion: '',
    cantidad: 1,
    precio_unitario_neto: 0,
    total_neto: 0
  })
}

function eliminarItemLibre(idx: number) {
  itemsLibres.value.splice(idx, 1)
}

// -------------------------------------------------------------
// GUARDADO Y ESTADOS
// -------------------------------------------------------------
async function guardarPresupuestoCompleto() {
  guardando.value = true
  try {
    const res = await guardarPresupuesto(
      {
        ...form,
        id: esNuevo.value ? undefined : form.id
      },
      ventanas.value,
      itemsLibres.value
    )

    mostrarNotificacion('Presupuesto guardado exitosamente.')
    if (esNuevo.value && res?.id) {
      router.replace(`/presupuestos/${res.id}`)
    }
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al guardar el presupuesto', 'error')
  } finally {
    guardando.value = false
  }
}

async function handleCambiarEstado(nuevoEstado: EstadoPresupuesto) {
  if (!form.id) return
  try {
    await cambiarEstado(form.id, nuevoEstado)
    form.estado = nuevoEstado
    if (nuevoEstado === 'aceptado') {
      otAsociada.value = await obtenerOTPorPresupuestoId(form.id)
    }
    mostrarNotificacion(`Estado cambiado a ${nuevoEstado}`)
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al cambiar estado', 'error')
  }
}

async function handleDuplicarActual() {
  if (!form.id) return
  try {
    const copia = await duplicarPresupuesto(form.id)
    mostrarNotificacion(`Copia creada con N° #${copia.numero}`)
    router.push(`/presupuestos/${copia.id}`)
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al duplicar', 'error')
  }
}

// -------------------------------------------------------------
// PDF Y WHATSAPP
// -------------------------------------------------------------
function obtenerPresupuestoParaPdf(): Presupuesto {
  return {
    id: form.id || 'temp',
    vidrieria_id: vidrieria.value?.id || '',
    numero: form.numero || 1,
    cliente_id: form.cliente_id,
    cliente_nombre: form.cliente_nombre || 'Cliente Particular',
    cliente_telefono: form.cliente_telefono,
    cliente_correo: form.cliente_correo,
    cliente_direccion: form.cliente_direccion,
    fecha: form.fecha,
    validez_dias: form.validez_dias,
    observaciones: form.observaciones,
    descuento_tipo: form.descuento_tipo,
    descuento_valor: form.descuento_valor,
    subtotal_neto: totales.value.subtotal_neto,
    descuento_neto: totales.value.descuento_neto,
    neto: totales.value.neto,
    iva: totales.value.iva,
    total: totales.value.total,
    estado: form.estado,
    ventanas: ventanas.value,
    items_libres: itemsLibres.value
  }
}

async function handleDescargarPdf() {
  if (ventanas.value.length === 0 && itemsLibres.value.length === 0) {
    mostrarNotificacion('El presupuesto debe tener al menos una ventana o un ítem para generar el PDF', 'error')
    return
  }

  try {
    const presupuestoActual = obtenerPresupuestoParaPdf()
    await descargarPdf({
      presupuesto: presupuestoActual,
      vidrieria: vidrieria.value,
      lineas: lineas.value,
      tipologias: tipologias.value
    })
    mostrarNotificacion('PDF generado y descargado exitosamente.', 'exito')
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al generar el PDF', 'error')
  }
}

async function handleCompartirWhatsApp() {
  if (ventanas.value.length === 0 && itemsLibres.value.length === 0) {
    mostrarNotificacion('El presupuesto debe tener al menos una ventana o un ítem para generar el PDF', 'error')
    return
  }

  try {
    const presupuestoActual = obtenerPresupuestoParaPdf()
    const res = await compartirWhatsApp({
      presupuesto: presupuestoActual,
      vidrieria: vidrieria.value,
      lineas: lineas.value,
      tipologias: tipologias.value
    })
    if (res.metodo === 'wa_link') {
      mostrarNotificacion('PDF descargado. Abriendo WhatsApp Web con el mensaje preparado.', 'exito')
    } else if (res.enviado) {
      mostrarNotificacion('Presupuesto compartido exitosamente.', 'exito')
    }
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al compartir por WhatsApp', 'error')
  }
}

onMounted(async () => {
  await Promise.all([cargarClientes(), cargarCatalogos()])

  if (!esNuevo.value) {
    const p = await cargarPresupuestoPorId(presupuestoIdParam)
    if (p) {
      form.id = p.id
      form.numero = p.numero
      form.cliente_id = p.cliente_id
      form.cliente_nombre = p.cliente_nombre
      form.cliente_telefono = p.cliente_telefono || ''
      form.cliente_correo = p.cliente_correo || ''
      form.cliente_direccion = p.cliente_direccion || ''
      form.fecha = p.fecha
      form.validez_dias = p.validez_dias
      form.observaciones = p.observaciones || ''
      form.descuento_tipo = p.descuento_tipo
      form.descuento_valor = p.descuento_valor
      form.estado = p.estado

      ventanas.value = p.ventanas || []
      itemsLibres.value = p.items_libres || []

      // Cargar OT si ya existe
      if (p.estado === 'aceptado') {
        otAsociada.value = await obtenerOTPorPresupuestoId(p.id)
      }
    }
  }
})
</script>

<style scoped>
.editor-presupuesto {
  max-width: 1200px;
}

.editor-encabezado {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}

.editor-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.editor-volver {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.editor-sep {
  color: var(--border-color);
}

.editor-acciones {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editor-acciones :deep(.btn) {
  width: 100%;
  justify-content: center;
}

.editor-presupuesto :deep(h1) {
  font-size: 1.45rem;
  overflow-wrap: anywhere;
}

.card-seccion-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.card-seccion-header h3 {
  font-size: 1.05rem;
  margin-bottom: 0.15rem;
}

.card-seccion-header :deep(.btn) {
  width: 100%;
}

.card-seccion-desc {
  font-size: 0.825rem;
  color: var(--text-dim);
  margin-bottom: 0;
}

.lista-vacia {
  text-align: center;
  padding: 1.25rem 0.5rem;
  color: var(--text-dim);
  font-size: 0.875rem;
}

.item-card {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  margin-bottom: 0.75rem;
  background: #172033;
}

.item-card-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.item-card-top strong {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.item-card-indice {
  color: var(--text-dim);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.item-card-borrar {
  margin-left: auto;
  padding: 0.2rem 0.5rem;
  flex-shrink: 0;
}

.item-card-meta {
  font-size: 0.8rem;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}

.item-card-montos {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  margin-top: 0.65rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.item-card-montos strong {
  color: #38bdf8;
  font-size: 1rem;
}

.solo-escritorio {
  display: none;
}

.resumen-columna {
}

.descuento-fila {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.descuento-tipo {
  width: 9.5rem;
  max-width: 48%;
  flex-shrink: 0;
  min-height: 36px;
  padding: 0.2rem 0.4rem;
  font-size: 0.8rem;
}

.grid-marco-margen {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.calculo-preview {
  background: #0b1120;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  margin-bottom: 1.25rem;
}

.calculo-preview-top {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  margin-bottom: 0.65rem;
}

.calculo-preview-titulo {
  font-weight: 600;
  color: #38bdf8;
  font-size: 0.9rem;
}

.calculo-preview-precio {
  font-size: 1.05rem;
  font-weight: 700;
  color: #34d399;
}

.calculo-preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  padding: 0;
}

.modal-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 1.15rem 1rem calc(1.15rem + env(safe-area-inset-bottom, 0px));
  width: 100%;
  max-width: 680px;
  box-shadow: var(--shadow-lg);
  max-height: 92vh;
  overflow-y: auto;
}

.modal-actions {
  display: flex;
  flex-direction: column-reverse;
  gap: 0.6rem;
  margin-top: 1.25rem;
}

.modal-actions :deep(.btn) {
  width: 100%;
  justify-content: center;
}

.badge-info {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

@media (min-width: 640px) {
  .editor-encabezado {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.75rem;
  }

  .editor-acciones {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: 560px;
  }

  .editor-acciones :deep(.btn) {
    width: auto;
  }

  .editor-presupuesto :deep(h1) {
    font-size: 1.875rem;
  }

  .card-seccion-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .card-seccion-header :deep(.btn) {
    width: auto;
    flex-shrink: 0;
  }

  .lista-movil {
    display: none;
  }

  .solo-escritorio {
    display: block;
  }

  .resumen-columna {
    position: sticky;
    top: 80px;
  }

  .grid-marco-margen {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .calculo-preview {
    padding: 1rem;
  }

  .calculo-preview-top {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .calculo-preview-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .modal-backdrop {
    align-items: center;
    padding: 1.5rem;
  }

  .modal-card {
    border-radius: var(--radius-lg);
    padding: 1.75rem;
    max-height: 90vh;
  }

  .modal-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .modal-actions :deep(.btn) {
    width: auto;
  }
}

@media (min-width: 960px) {
  .resumen-columna {
    position: sticky;
    top: 80px;
  }
}
</style>
