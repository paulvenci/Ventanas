<template>
  <div class="container" style="max-width: 1200px;">
    <!-- Encabezado de página -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1>Catálogos de Materiales y Fórmulas</h1>
        <p class="subtitle" style="margin-bottom: 0;">Administra líneas, perfiles, vidrios, colores, accesorios, marcos y modelos de corte</p>
      </div>
    </div>

    <!-- Alertas globales -->
    <div v-if="notificacion" :class="`alert ${notificacion.tipo === 'error' ? 'alert-danger' : 'alert-success'}`">
      <span>{{ notificacion.mensaje }}</span>
    </div>

    <!-- Pestañas de Catálogo -->
    <div class="catalog-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['catalog-tab-btn', { active: pestanaActiva === tab.id }]"
        @click="pestanaActiva = tab.id"
      >
        <span>{{ tab.label }}</span>
        <span class="tab-count">{{ tab.contador() }}</span>
      </button>
    </div>

    <!-- ========================================== -->
    <!-- 1. PESTAÑA: LÍNEAS Y PERFILES -->
    <!-- ========================================== -->
    <div v-if="pestanaActiva === 'perfiles'" class="tab-pane">
      <div style="display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; align-items: start;">
        <!-- Panel Izquierdo: Líneas de Material -->
        <div class="card" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.1rem;">Líneas</h3>
            <button @click="abrirModalLinea()" class="btn btn-primary btn-sm">+ Nueva</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <button
              :class="['linea-item-btn', { active: lineaSeleccionadaId === null }]"
              @click="lineaSeleccionadaId = null"
            >
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 600;">Todos los perfiles</span>
              </div>
              <span class="badge badge-muted">{{ perfiles.length }}</span>
            </button>

            <div
              v-for="linea in lineas"
              :key="linea.id"
              :class="['linea-item-btn', { active: lineaSeleccionadaId === linea.id, inactivo: !linea.activo }]"
              @click="lineaSeleccionadaId = linea.id"
            >
              <div style="display: flex; flex-direction: column; gap: 0.15rem; text-align: left; overflow: hidden;">
                <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ linea.nombre }}</span>
                <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">{{ linea.tipo_material }}</span>
              </div>

              <div style="display: flex; align-items: center; gap: 0.35rem;">
                <button
                  @click.stop="abrirModalLinea(linea)"
                  class="icon-btn"
                  title="Editar línea"
                >
                  ✏️
                </button>
                <span class="badge badge-muted">{{ perfilesPorLinea(linea.id).length }}</span>
              </div>
            </div>

            <div v-if="lineas.length === 0" style="padding: 1rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
              No hay líneas creadas. Crea una para asociarle perfiles.
            </div>
          </div>
        </div>

        <!-- Panel Derecho: Perfiles -->
        <div class="card" style="padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <h3 style="margin-bottom: 0.25rem;">
                {{ lineaSeleccionada ? `Perfiles: ${lineaSeleccionada.nombre}` : 'Todos los Perfiles' }}
              </h3>
              <p style="font-size: 0.85rem; color: var(--text-dim);">
                Largo de barra estándar: 5,99 m aprovechables. El stock se administra en metros lineales.
              </p>
            </div>
            <div style="display: flex; gap: 0.75rem;">
              <input
                v-model="busquedaPerfil"
                type="text"
                placeholder="Buscar perfil o código..."
                class="form-input"
                style="width: 200px; padding: 0.4rem 0.75rem; font-size: 0.85rem;"
              />
              <button @click="abrirModalPerfil()" class="btn btn-primary btn-sm">+ Nuevo Perfil</button>
            </div>
          </div>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre del Perfil</th>
                  <th>Línea</th>
                  <th style="text-align: right;">Largo Barra</th>
                  <th style="text-align: right;">Precio Neto/m</th>
                  <th style="text-align: right;">Stock Metros</th>
                  <th style="text-align: center;">Merma</th>
                  <th style="text-align: center;">Estado</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="perfil in perfilesFiltrados" :key="perfil.id">
                  <td style="font-family: monospace; font-weight: 600; color: #38bdf8;">{{ perfil.codigo }}</td>
                  <td style="font-weight: 500;">{{ perfil.nombre }}</td>
                  <td style="font-size: 0.85rem; color: var(--text-muted);">
                    {{ perfil.linea?.nombre || obtenerNombreLinea(perfil.linea_id) }}
                  </td>
                  <td style="text-align: right; font-size: 0.85rem;">{{ perfil.largo_barra_m || 5.99 }} m</td>
                  <td style="text-align: right; font-weight: 600;">${{ formatearDinero(perfil.precio_metro) }}</td>
                  <td style="text-align: right;">{{ perfil.stock_metros }} m</td>
                  <td style="text-align: center; font-size: 0.85rem;">
                    {{ perfil.merma != null ? `${perfil.merma}%` : 'Defecto' }}
                  </td>
                  <td style="text-align: center;">
                    <span :class="['badge', perfil.activo ? 'badge-success' : 'badge-muted']">
                      {{ perfil.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                      <button @click="abrirModalPerfil(perfil)" class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem;">Editar</button>
                      <button
                        @click="cambiarEstado('perfiles', perfil.id, perfil.activo)"
                        :class="['btn btn-sm', perfil.activo ? 'btn-danger' : 'btn-secondary']"
                        style="padding: 0.25rem 0.5rem;"
                      >
                        {{ perfil.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="perfilesFiltrados.length === 0">
                  <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-dim);">
                    No se encontraron perfiles en esta vista.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 2. PESTAÑA: VIDRIOS -->
    <!-- ========================================== -->
    <div v-if="pestanaActiva === 'vidrios'" class="tab-pane">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 style="margin-bottom: 0.25rem;">Catálogo de Vidrios y Cristales</h3>
            <p style="font-size: 0.85rem; color: var(--text-dim);">
              Define espesor en mm, precio neto por metro cuadrado y stock disponible.
            </p>
          </div>
          <button @click="abrirModalVidrio()" class="btn btn-primary btn-sm">+ Nuevo Vidrio</button>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Tipo / Nombre</th>
                <th style="text-align: center;">Espesor (mm)</th>
                <th style="text-align: right;">Precio Neto / m²</th>
                <th style="text-align: right;">Stock (m²)</th>
                <th style="text-align: center;">Estado</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="vidrio in vidrios" :key="vidrio.id">
                <td style="font-weight: 500;">{{ vidrio.nombre }}</td>
                <td style="text-align: center; font-weight: 600;">{{ vidrio.espesor_mm }} mm</td>
                <td style="text-align: right; font-weight: 600;">${{ formatearDinero(vidrio.precio_m2) }}</td>
                <td style="text-align: right;">{{ vidrio.stock_m2 }} m²</td>
                <td style="text-align: center;">
                  <span :class="['badge', vidrio.activo ? 'badge-success' : 'badge-muted']">
                    {{ vidrio.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button @click="abrirModalVidrio(vidrio)" class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem;">Editar</button>
                    <button
                      @click="cambiarEstado('vidrios', vidrio.id, vidrio.activo)"
                      :class="['btn btn-sm', vidrio.activo ? 'btn-danger' : 'btn-secondary']"
                      style="padding: 0.25rem 0.5rem;"
                    >
                      {{ vidrio.activo ? 'Desactivar' : 'Activar' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="vidrios.length === 0">
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-dim);">
                  No hay vidrios registrados. Agrega el primero con el botón superior.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 3. PESTAÑA: COLORES / TERMINACIONES -->
    <!-- ========================================== -->
    <div v-if="pestanaActiva === 'colores'" class="tab-pane">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 style="margin-bottom: 0.25rem;">Colores y Acabados de Perfiles</h3>
            <p style="font-size: 0.85rem; color: var(--text-dim);">
              Terminaciones asociadas a líneas específicas o globales, con recargos opcionales (% o $/m).
            </p>
          </div>
          <button @click="abrirModalColor()" class="btn btn-primary btn-sm">+ Nuevo Color</button>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre del Acabado</th>
                <th>Línea Asociada</th>
                <th>Tipo de Recargo</th>
                <th style="text-align: right;">Valor Recargo</th>
                <th style="text-align: center;">Estado</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="color in colores" :key="color.id">
                <td style="font-weight: 500;">{{ color.nombre }}</td>
                <td style="font-size: 0.85rem; color: var(--text-muted);">
                  {{ color.linea_id ? obtenerNombreLinea(color.linea_id) : 'Disponible para todas' }}
                </td>
                <td style="text-transform: capitalize; font-size: 0.85rem;">
                  {{ color.tipo_recargo === 'porcentaje' ? 'Porcentaje (%)' : color.tipo_recargo === 'monto_metro' ? 'Monto por metro ($/m)' : 'Sin recargo' }}
                </td>
                <td style="text-align: right; font-weight: 600;">
                  <span v-if="color.tipo_recargo === 'porcentaje'">+{{ color.valor_recargo }}%</span>
                  <span v-else-if="color.tipo_recargo === 'monto_metro'">+${{ formatearDinero(color.valor_recargo) }}/m</span>
                  <span v-else style="color: var(--text-dim);">-</span>
                </td>
                <td style="text-align: center;">
                  <span :class="['badge', color.activo ? 'badge-success' : 'badge-muted']">
                    {{ color.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button @click="abrirModalColor(color)" class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem;">Editar</button>
                    <button
                      @click="cambiarEstado('colores', color.id, color.activo)"
                      :class="['btn btn-sm', color.activo ? 'btn-danger' : 'btn-secondary']"
                      style="padding: 0.25rem 0.5rem;"
                    >
                      {{ color.activo ? 'Desactivar' : 'Activar' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="colores.length === 0">
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-dim);">
                  No hay colores registrados. Agrega terminaciones como Blanco, Mate, Madera, etc.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 4. PESTAÑA: ACCESORIOS -->
    <!-- ========================================== -->
    <div v-if="pestanaActiva === 'accesorios'" class="tab-pane">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 style="margin-bottom: 0.25rem;">Accesorios, Herrajes e Insumos</h3>
            <p style="font-size: 0.85rem; color: var(--text-dim);">
              Ruedas, rodamientos, cierres, felpas y tornillería con precio unitario y stock.
            </p>
          </div>
          <button @click="abrirModalAccesorio()" class="btn btn-primary btn-sm">+ Nuevo Accesorio</button>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre del Accesorio</th>
                <th style="text-align: right;">Precio Unitario Neto</th>
                <th style="text-align: right;">Stock Unidades</th>
                <th style="text-align: center;">Estado</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="acc in accesorios" :key="acc.id">
                <td style="font-weight: 500;">{{ acc.nombre }}</td>
                <td style="text-align: right; font-weight: 600;">${{ formatearDinero(acc.precio_unitario) }}</td>
                <td style="text-align: right;">{{ acc.stock_unidades }} un</td>
                <td style="text-align: center;">
                  <span :class="['badge', acc.activo ? 'badge-success' : 'badge-muted']">
                    {{ acc.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button @click="abrirModalAccesorio(acc)" class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem;">Editar</button>
                    <button
                      @click="cambiarEstado('accesorios', acc.id, acc.activo)"
                      :class="['btn btn-sm', acc.activo ? 'btn-danger' : 'btn-secondary']"
                      style="padding: 0.25rem 0.5rem;"
                    >
                      {{ acc.activo ? 'Desactivar' : 'Activar' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="accesorios.length === 0">
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-dim);">
                  No hay accesorios registrados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 5. PESTAÑA: MARCOS DE MADERA -->
    <!-- ========================================== -->
    <div v-if="pestanaActiva === 'marcos'" class="tab-pane">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 style="margin-bottom: 0.25rem;">Marcos de Madera Perimetrales</h3>
            <p style="font-size: 0.85rem; color: var(--text-dim);">
              Marcos opcionales que reducen las dimensiones útiles del vano (espesor en cm) y tienen ancho de tabla en pulgadas.
            </p>
          </div>
          <button @click="abrirModalMarco()" class="btn btn-primary btn-sm">+ Nuevo Marco</button>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre del Marco</th>
                <th style="text-align: center;">Ancho Tabla</th>
                <th style="text-align: center;">Espesor Interior (cm)</th>
                <th style="text-align: right;">Precio Neto / m</th>
                <th style="text-align: right;">Stock Metros</th>
                <th style="text-align: center;">Estado</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="marco in marcosMadera" :key="marco.id">
                <td style="font-weight: 500;">{{ marco.nombre }}</td>
                <td style="text-align: center; font-weight: 600;">{{ marco.ancho_pulgadas }}"</td>
                <td style="text-align: center;">{{ marco.espesor_cm }} cm</td>
                <td style="text-align: right; font-weight: 600;">${{ formatearDinero(marco.precio_metro) }}</td>
                <td style="text-align: right;">{{ marco.stock_metros }} m</td>
                <td style="text-align: center;">
                  <span :class="['badge', marco.activo ? 'badge-success' : 'badge-muted']">
                    {{ marco.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button @click="abrirModalMarco(marco)" class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem;">Editar</button>
                    <button
                      @click="cambiarEstado('marcos_madera', marco.id, marco.activo)"
                      :class="['btn btn-sm', marco.activo ? 'btn-danger' : 'btn-secondary']"
                      style="padding: 0.25rem 0.5rem;"
                    >
                      {{ marco.activo ? 'Desactivar' : 'Activar' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="marcosMadera.length === 0">
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-dim);">
                  No hay marcos de madera registrados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 6. PESTAÑA: TIPOLOGÍAS Y FÓRMULAS -->
    <!-- ========================================== -->
    <div v-if="pestanaActiva === 'tipologias'" class="tab-pane">
      <div style="display: grid; grid-template-columns: 320px 1fr; gap: 1.5rem; align-items: start;">
        <!-- Lista de Tipologías -->
        <div class="card" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.1rem;">Modelos / Tipologías</h3>
            <button @click="abrirModalTipologia()" class="btn btn-primary btn-sm">+ Nueva</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div
              v-for="tipo in tipologias"
              :key="tipo.id"
              :class="['linea-item-btn', { active: tipologiaSeleccionadaId === tipo.id, inactivo: !tipo.activo }]"
              @click="seleccionarTipologia(tipo.id)"
            >
              <div style="display: flex; flex-direction: column; gap: 0.2rem; text-align: left; overflow: hidden;">
                <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ tipo.nombre }}</span>
                <span style="font-size: 0.75rem; color: #38bdf8; text-transform: uppercase;">{{ tipo.tipo_base }}</span>
              </div>

              <div style="display: flex; align-items: center; gap: 0.35rem;">
                <button
                  @click.stop="abrirModalTipologia(tipo)"
                  class="icon-btn"
                  title="Editar tipología"
                >
                  ✏️
                </button>
              </div>
            </div>

            <div v-if="tipologias.length === 0" style="padding: 1rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
              No hay tipologías creadas. Crea una para definir sus fórmulas de corte.
            </div>
          </div>
        </div>

        <!-- Editor de Fórmulas para la Tipología Seleccionada -->
        <div class="card" style="padding: 1.5rem;">
          <div v-if="tipologiaSeleccionada">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
              <div>
                <span class="badge badge-muted" style="text-transform: uppercase; margin-bottom: 0.35rem;">{{ tipologiaSeleccionada.tipo_base }}</span>
                <h2>{{ tipologiaSeleccionada.nombre }}</h2>
                <p style="font-size: 0.85rem; color: var(--text-dim); margin-top: 0.25rem;">
                  Configuración de corte de perfiles, accesorios fijos y paño de vidrio según dimensiones del vano.
                </p>
              </div>

              <!-- Selector de línea para la fórmula -->
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <label class="form-label" style="margin: 0; white-space: nowrap;">Línea de perfil:</label>
                <select
                  v-model="lineaFormulaSeleccionadaId"
                  @change="cargarFormulaActual"
                  class="form-select"
                  style="width: 200px; padding: 0.4rem 0.75rem; font-size: 0.85rem;"
                >
                  <option v-for="l in lineasActivas" :key="l.id" :value="l.id">
                    {{ l.nombre }} ({{ l.tipo_material }})
                  </option>
                </select>
              </div>
            </div>

            <div v-if="lineasActivas.length === 0" class="alert alert-danger">
              Debes crear al menos una línea de perfil activa para configurar fórmulas.
            </div>

            <div v-else>
              <!-- 1. Descuentos de Vidrio -->
              <div style="background: #0b1120; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 0.75rem; color: #38bdf8;">1. Descuento para Paño de Vidrio</h4>
                <p style="font-size: 0.825rem; color: var(--text-dim); margin-bottom: 1rem;">
                  Centímetros a restar de las dimensiones del vano para obtener el tamaño final del cristal cortado:
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label">Descuento Ancho (cm)</label>
                    <input
                      v-model.number="formulaActual.descuento_vidrio_ancho"
                      type="number"
                      step="0.1"
                      class="form-input"
                      placeholder="Ej. 1.2"
                    />
                  </div>
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label">Descuento Alto (cm)</label>
                    <input
                      v-model.number="formulaActual.descuento_vidrio_alto"
                      type="number"
                      step="0.1"
                      class="form-input"
                      placeholder="Ej. 2.8"
                    />
                  </div>
                </div>
              </div>

              <!-- 2. Perfiles Requeridos y Fórmulas de Corte -->
              <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <div>
                    <h4 style="color: #38bdf8;">2. Perfiles y Fórmulas de Corte</h4>
                    <p style="font-size: 0.8rem; color: var(--text-dim);">
                      Expresión en cm usando <code>alto</code> y <code>ancho</code> (ej: <code>alto</code>, <code>ancho - 1.2</code>, <code>ancho / 2</code>).
                    </p>
                  </div>
                  <button @click="agregarItemPerfilFormula()" class="btn btn-secondary btn-sm">+ Agregar Perfil</button>
                </div>

                <div class="table-container">
                  <table class="table">
                    <thead>
                      <tr>
                        <th style="width: 35%;">Perfil (Línea)</th>
                        <th style="width: 35%;">Fórmula Largo (cm)</th>
                        <th style="width: 15%; text-align: center;">Cantidad</th>
                        <th style="width: 15%; text-align: right;">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in formulaActual.perfiles_formula" :key="idx">
                        <td>
                          <select v-model="item.perfil_id" class="form-select" style="padding: 0.35rem 0.5rem; font-size: 0.85rem;">
                            <option value="" disabled>Selecciona perfil...</option>
                            <option v-for="p in perfilesDeLineaActual" :key="p.id" :value="p.id">
                              {{ p.codigo }} - {{ p.nombre }}
                            </option>
                          </select>
                        </td>
                        <td>
                          <input
                            v-model="item.formula_largo"
                            type="text"
                            class="form-input"
                            style="padding: 0.35rem 0.5rem; font-family: monospace; font-size: 0.85rem;"
                            placeholder="ej: ancho - 1.2 o alto"
                          />
                        </td>
                        <td style="text-align: center;">
                          <input
                            v-model.number="item.cantidad"
                            type="number"
                            min="1"
                            class="form-input"
                            style="padding: 0.35rem 0.5rem; text-align: center; font-size: 0.85rem;"
                          />
                        </td>
                        <td style="text-align: right;">
                          <button @click="eliminarItemPerfilFormula(idx)" class="btn btn-danger btn-sm" style="padding: 0.25rem 0.5rem;">
                            ✕
                          </button>
                        </td>
                      </tr>
                      <tr v-if="formulaActual.perfiles_formula.length === 0">
                        <td colspan="4" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">
                          No has agregado perfiles a esta fórmula. Haz clic en "+ Agregar Perfil".
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- 3. Accesorios Fijos -->
              <div style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <div>
                    <h4 style="color: #38bdf8;">3. Accesorios Fijos por Ventana</h4>
                    <p style="font-size: 0.8rem; color: var(--text-dim);">
                      Insumos que se consumen en cantidad fija por cada ventana fabricada (ej: 2 ruedas, 1 cierre).
                    </p>
                  </div>
                  <button @click="agregarItemAccesorioFormula()" class="btn btn-secondary btn-sm">+ Agregar Accesorio</button>
                </div>

                <div class="table-container">
                  <table class="table">
                    <thead>
                      <tr>
                        <th style="width: 60%;">Accesorio</th>
                        <th style="width: 25%; text-align: center;">Cantidad Fija</th>
                        <th style="width: 15%; text-align: right;">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in formulaActual.accesorios_formula" :key="idx">
                        <td>
                          <select v-model="item.accesorio_id" class="form-select" style="padding: 0.35rem 0.5rem; font-size: 0.85rem;">
                            <option value="" disabled>Selecciona accesorio...</option>
                            <option v-for="a in accesoriosActivos" :key="a.id" :value="a.id">
                              {{ a.nombre }} (${{ formatearDinero(a.precio_unitario) }})
                            </option>
                          </select>
                        </td>
                        <td style="text-align: center;">
                          <input
                            v-model.number="item.cantidad_fija"
                            type="number"
                            min="1"
                            class="form-input"
                            style="padding: 0.35rem 0.5rem; text-align: center; font-size: 0.85rem;"
                          />
                        </td>
                        <td style="text-align: right;">
                          <button @click="eliminarItemAccesorioFormula(idx)" class="btn btn-danger btn-sm" style="padding: 0.25rem 0.5rem;">
                            ✕
                          </button>
                        </td>
                      </tr>
                      <tr v-if="formulaActual.accesorios_formula.length === 0">
                        <td colspan="3" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">
                          No hay accesorios asociados a esta fórmula.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- 4. Simulador / Probador en Vivo de Fórmulas -->
              <div style="background: rgba(56, 189, 248, 0.05); border: 1px dashed rgba(56, 189, 248, 0.3); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="margin-bottom: 0.75rem; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem;">
                  🧪 Simulador de Corte en Vivo
                </h4>
                <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label class="form-label" style="margin: 0;">Ancho Vano:</label>
                    <input v-model.number="testAncho" type="number" class="form-input" style="width: 90px; padding: 0.35rem 0.5rem;" />
                    <span style="font-size: 0.85rem;">cm</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label class="form-label" style="margin: 0;">Alto Vano:</label>
                    <input v-model.number="testAlto" type="number" class="form-input" style="width: 90px; padding: 0.35rem 0.5rem;" />
                    <span style="font-size: 0.85rem;">cm</span>
                  </div>
                </div>

                <div style="font-size: 0.85rem;">
                  <div style="margin-bottom: 0.5rem; font-weight: 600;">Resultado de piezas calculadas:</div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.5rem;">
                    <div
                      v-for="(item, idx) in formulaActual.perfiles_formula"
                      :key="idx"
                      style="background: #0b1120; padding: 0.5rem 0.75rem; border-radius: 4px; border: 1px solid var(--border-color);"
                    >
                      <div style="font-weight: 500; color: #f8fafc;">{{ obtenerNombrePerfil(item.perfil_id) || 'Perfil #' + (idx+1) }}</div>
                      <div style="color: #38bdf8; font-family: monospace;">
                        {{ item.cantidad }}x {{ evaluarExpresion(item.formula_largo, testAncho, testAlto) }} cm
                        ({{ ((evaluarExpresion(item.formula_largo, testAncho, testAlto) / 100) * item.cantidad).toFixed(2) }} m)
                      </div>
                    </div>
                  </div>
                  <div style="margin-top: 0.75rem; color: #6ee7b7; font-weight: 500;">
                    Paño de vidrio calculado:
                    {{ (testAncho - (formulaActual.descuento_vidrio_ancho || 0)).toFixed(1) }} x {{ (testAlto - (formulaActual.descuento_vidrio_alto || 0)).toFixed(1) }} cm
                    = {{ (((testAncho - (formulaActual.descuento_vidrio_ancho || 0)) * (testAlto - (formulaActual.descuento_vidrio_alto || 0))) / 10000).toFixed(3) }} m²
                  </div>
                </div>
              </div>

              <!-- Botón Guardar Fórmula -->
              <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                <button
                  @click="guardarFormulaActual"
                  class="btn btn-primary"
                  :disabled="guardando"
                >
                  {{ guardando ? 'Guardando fórmula...' : 'Guardar Fórmula de Corte' }}
                </button>
              </div>
            </div>
          </div>

          <div v-else style="text-align: center; padding: 3rem; color: var(--text-dim);">
            Selecciona una tipología en el listado izquierdo para configurar sus fórmulas de corte.
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODALES DE FORMULARIO -->
    <!-- ============================================================== -->

    <!-- Modal 1: Línea -->
    <div v-if="modalLineaAbierto" class="modal-backdrop" @click.self="modalLineaAbierto = false">
      <div class="modal-card">
        <h3>{{ formLinea.id ? 'Editar Línea' : 'Nueva Línea de Material' }}</h3>
        <form @submit.prevent="submitLinea">
          <div class="form-group">
            <label class="form-label">Tipo de Material *</label>
            <select v-model="formLinea.tipo_material" class="form-select" required>
              <option value="aluminio">Aluminio</option>
              <option value="pvc">PVC</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nombre de la Línea *</label>
            <input v-model="formLinea.nombre" type="text" class="form-input" placeholder="Ej. Línea 20, Línea 25, Europea" required />
          </div>
          <div class="modal-actions">
            <button type="button" @click="modalLineaAbierto = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 2: Perfil -->
    <div v-if="modalPerfilAbierto" class="modal-backdrop" @click.self="modalPerfilAbierto = false">
      <div class="modal-card">
        <h3>{{ formPerfil.id ? 'Editar Perfil' : 'Nuevo Perfil' }}</h3>
        <form @submit.prevent="submitPerfil">
          <div class="form-group">
            <label class="form-label">Línea de Material *</label>
            <select v-model="formPerfil.linea_id" class="form-select" required>
              <option value="" disabled>Selecciona línea...</option>
              <option v-for="l in lineasActivas" :key="l.id" :value="l.id">
                {{ l.nombre }} ({{ l.tipo_material }})
              </option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Código *</label>
              <input v-model="formPerfil.codigo" type="text" class="form-input" placeholder="Ej. AL2001" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nombre del Perfil *</label>
              <input v-model="formPerfil.nombre" type="text" class="form-input" placeholder="Ej. Jamba, Riel Sup." required />
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Precio Neto por Metro ($) *</label>
              <input v-model.number="formPerfil.precio_metro" type="number" min="0" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Stock Actual (Metros)</label>
              <input v-model.number="formPerfil.stock_metros" type="number" step="0.01" min="0" class="form-input" />
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Largo de Barra Útil (m)</label>
              <input v-model.number="formPerfil.largo_barra_m" type="number" step="0.01" class="form-input" placeholder="5.99" />
              <small style="color: var(--text-dim); font-size: 0.75rem;">Largo comercial aprovechable de la tira</small>
            </div>
            <div class="form-group">
              <label class="form-label">Merma propia (%)</label>
              <input v-model.number="formPerfil.merma" type="number" min="0" max="100" class="form-input" placeholder="Vacío = usa vidriería" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="modalPerfilAbierto = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 3: Vidrio -->
    <div v-if="modalVidrioAbierto" class="modal-backdrop" @click.self="modalVidrioAbierto = false">
      <div class="modal-card">
        <h3>{{ formVidrio.id ? 'Editar Vidrio' : 'Nuevo Vidrio / Cristal' }}</h3>
        <form @submit.prevent="submitVidrio">
          <div class="form-group">
            <label class="form-label">Nombre / Tipo *</label>
            <input v-model="formVidrio.nombre" type="text" class="form-input" placeholder="Ej. Incoloro 4mm, DVH 4/12/4" required />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Espesor (mm) *</label>
              <input v-model.number="formVidrio.espesor_mm" type="number" min="1" max="100" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Precio Neto por m² ($) *</label>
              <input v-model.number="formVidrio.precio_m2" type="number" min="0" class="form-input" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Stock Actual (m²)</label>
            <input v-model.number="formVidrio.stock_m2" type="number" step="0.01" min="0" class="form-input" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="modalVidrioAbierto = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 4: Color -->
    <div v-if="modalColorAbierto" class="modal-backdrop" @click.self="modalColorAbierto = false">
      <div class="modal-card">
        <h3>{{ formColor.id ? 'Editar Color' : 'Nuevo Color / Terminación' }}</h3>
        <form @submit.prevent="submitColor">
          <div class="form-group">
            <label class="form-label">Nombre del Color *</label>
            <input v-model="formColor.nombre" type="text" class="form-input" placeholder="Ej. Blanco, Mate, Madera Nogal" required />
          </div>
          <div class="form-group">
            <label class="form-label">Línea de Perfil Específica (Opcional)</label>
            <select v-model="formColor.linea_id" class="form-select">
              <option :value="null">Disponible para todas las líneas</option>
              <option v-for="l in lineasActivas" :key="l.id" :value="l.id">
                {{ l.nombre }} ({{ l.tipo_material }})
              </option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Tipo de Recargo</label>
              <select v-model="formColor.tipo_recargo" class="form-select">
                <option value="ninguno">Ninguno</option>
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_metro">Monto por metro ($/m)</option>
              </select>
            </div>
            <div class="form-group" v-if="formColor.tipo_recargo !== 'ninguno'">
              <label class="form-label">Valor Recargo</label>
              <input v-model.number="formColor.valor_recargo" type="number" step="0.01" min="0" class="form-input" required />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="modalColorAbierto = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 5: Accesorio -->
    <div v-if="modalAccesorioAbierto" class="modal-backdrop" @click.self="modalAccesorioAbierto = false">
      <div class="modal-card">
        <h3>{{ formAccesorio.id ? 'Editar Accesorio' : 'Nuevo Accesorio' }}</h3>
        <form @submit.prevent="submitAccesorio">
          <div class="form-group">
            <label class="form-label">Nombre del Accesorio *</label>
            <input v-model="formAccesorio.nombre" type="text" class="form-input" placeholder="Ej. Cierre caracol, Rueda AL-20" required />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Precio Unitario Neto ($) *</label>
              <input v-model.number="formAccesorio.precio_unitario" type="number" min="0" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Stock Unidades</label>
              <input v-model.number="formAccesorio.stock_unidades" type="number" min="0" class="form-input" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="modalAccesorioAbierto = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 6: Marco Madera -->
    <div v-if="modalMarcoAbierto" class="modal-backdrop" @click.self="modalMarcoAbierto = false">
      <div class="modal-card">
        <h3>{{ formMarco.id ? 'Editar Marco de Madera' : 'Nuevo Marco de Madera' }}</h3>
        <form @submit.prevent="submitMarco">
          <div class="form-group">
            <label class="form-label">Nombre / Tipo de Madera *</label>
            <input v-model="formMarco.nombre" type="text" class="form-input" placeholder="Ej. Pino 2x1, Raulí" required />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Ancho Tabla (pulgadas) *</label>
              <input v-model.number="formMarco.ancho_pulgadas" type="number" step="0.5" min="0.5" class="form-input" placeholder="Ej. 2" required />
            </div>
            <div class="form-group">
              <label class="form-label">Espesor Interior (cm) *</label>
              <input v-model.number="formMarco.espesor_cm" type="number" step="0.1" min="0" class="form-input" placeholder="Ej. 2.0" required />
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Precio Neto por Metro ($) *</label>
              <input v-model.number="formMarco.precio_metro" type="number" min="0" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Stock Metros</label>
              <input v-model.number="formMarco.stock_metros" type="number" step="0.1" min="0" class="form-input" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="modalMarcoAbierto = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 7: Tipología -->
    <div v-if="modalTipologiaAbierto" class="modal-backdrop" @click.self="modalTipologiaAbierto = false">
      <div class="modal-card">
        <h3>{{ formTipologia.id ? 'Editar Tipología' : 'Nueva Tipología / Modelo' }}</h3>
        <form @submit.prevent="submitTipologia">
          <div class="form-group">
            <label class="form-label">Tipo Base *</label>
            <select v-model="formTipologia.tipo_base" class="form-select" required>
              <option value="corredera">Corredera</option>
              <option value="batiente">Batiente</option>
              <option value="pano_fijo">Paño Fijo</option>
              <option value="proyectante">Proyectante</option>
              <option value="guillotina">Guillotina</option>
              <option value="pivotante">Pivotante</option>
              <option value="oscilobatiente">Oscilobatiente</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nombre Descriptivo *</label>
            <input v-model="formTipologia.nombre" type="text" class="form-input" placeholder="Ej. Corredera Aluminio Línea 20 Vidrio 4mm" required />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Mano de Obra Fija ($)</label>
              <input v-model.number="formTipologia.mano_obra_fijo" type="number" min="0" class="form-input" placeholder="Vacío = usa vidriería" />
            </div>
            <div class="form-group">
              <label class="form-label">Mano de Obra por m² ($)</label>
              <input v-model.number="formTipologia.mano_obra_m2" type="number" min="0" class="form-input" placeholder="Vacío = usa vidriería" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="modalTipologiaAbierto = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  Linea,
  Perfil,
  Vidrio,
  Color,
  Accesorio,
  MarcoMadera,
  Tipologia,
  FormulaTipologia,
  TipoBase,
  TipoMaterial,
  TipoRecargoColor,
  ItemPerfilFormula,
  ItemAccesorioFormula
} from '~~/shared/tipos'

const {
  lineas,
  perfiles,
  vidrios,
  colores,
  accesorios,
  marcosMadera,
  tipologias,
  formulas,
  cargarTodo,
  guardarLinea,
  guardarPerfil,
  guardarVidrio,
  guardarColor,
  guardarAccesorio,
  guardarMarcoMadera,
  guardarTipologia,
  guardarFormula,
  toggleActivo
} = useCatalogos()

const pestanaActiva = ref<'perfiles' | 'vidrios' | 'colores' | 'accesorios' | 'marcos' | 'tipologias'>('perfiles')
const guardando = ref(false)
const notificacion = ref<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null)

function mostrarNotificacion(mensaje: string, tipo: 'exito' | 'error' = 'exito') {
  notificacion.value = { tipo, mensaje }
  setTimeout(() => {
    notificacion.value = null
  }, 4000)
}

const tabs = [
  { id: 'perfiles' as const, label: 'Líneas y Perfiles', contador: () => perfiles.value.length },
  { id: 'vidrios' as const, label: 'Vidrios', contador: () => vidrios.value.length },
  { id: 'colores' as const, label: 'Colores', contador: () => colores.value.length },
  { id: 'accesorios' as const, label: 'Accesorios', contador: () => accesorios.value.length },
  { id: 'marcos' as const, label: 'Marcos de Madera', contador: () => marcosMadera.value.length },
  { id: 'tipologias' as const, label: 'Tipologías y Fórmulas', contador: () => tipologias.value.length }
]

// Filtros y estados auxiliares
const lineaSeleccionadaId = ref<string | null>(null)
const busquedaPerfil = ref('')
const tipologiaSeleccionadaId = ref<string | null>(null)
const lineaFormulaSeleccionadaId = ref<string | null>(null)

// Valores de prueba para simulador
const testAncho = ref<number>(150)
const testAlto = ref<number>(120)

// Computed helpers
const lineasActivas = computed(() => lineas.value.filter(l => l.activo))
const accesoriosActivos = computed(() => accesorios.value.filter(a => a.activo))

const lineaSeleccionada = computed(() => {
  return lineas.value.find(l => l.id === lineaSeleccionadaId.value) || null
})

const perfilesFiltrados = computed(() => {
  return perfiles.value.filter(p => {
    const matchLinea = !lineaSeleccionadaId.value || p.linea_id === lineaSeleccionadaId.value
    const matchBusqueda = !busquedaPerfil.value ||
      p.nombre.toLowerCase().includes(busquedaPerfil.value.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busquedaPerfil.value.toLowerCase())
    return matchLinea && matchBusqueda
  })
})

const tipologiaSeleccionada = computed(() => {
  return tipologias.value.find(t => t.id === tipologiaSeleccionadaId.value) || null
})

const perfilesDeLineaActual = computed(() => {
  if (!lineaFormulaSeleccionadaId.value) return []
  return perfiles.value.filter(p => p.linea_id === lineaFormulaSeleccionadaId.value && p.activo)
})

function perfilesPorLinea(lineaId: string) {
  return perfiles.value.filter(p => p.linea_id === lineaId)
}

function obtenerNombreLinea(lineaId: string | null) {
  if (!lineaId) return 'Todas'
  const l = lineas.value.find(x => x.id === lineaId)
  return l ? l.nombre : 'Línea'
}

function obtenerNombrePerfil(perfilId: string) {
  const p = perfiles.value.find(x => x.id === perfilId)
  return p ? `${p.codigo} - ${p.nombre}` : ''
}

function formatearDinero(num: number | null | undefined) {
  if (num == null) return '0'
  return Math.round(num).toLocaleString('es-CL')
}

// -------------------------------------------------------------
// Evaluador simple de expresiones aritméticas para el simulador
// -------------------------------------------------------------
function evaluarExpresion(expr: string, ancho: number, alto: number): number {
  if (!expr) return 0
  try {
    const limpia = expr
      .replace(/ancho/gi, ancho.toString())
      .replace(/alto/gi, alto.toString())
      .replace(/,/g, '.')
    // Solo permitir caracteres matemáticos seguros
    if (!/^[\d\s+\-*/().]+$/.test(limpia)) return 0
    const res = Function(`"use strict"; return (${limpia})`)()
    return Number(res.toFixed(1))
  } catch {
    return 0
  }
}

// -------------------------------------------------------------
// FÓRMULA ACTUAL
// -------------------------------------------------------------
const formulaActual = reactive<{
  id?: string
  descuento_vidrio_ancho: number
  descuento_vidrio_alto: number
  perfiles_formula: ItemPerfilFormula[]
  accesorios_formula: ItemAccesorioFormula[]
}>({
  descuento_vidrio_ancho: 0,
  descuento_vidrio_alto: 0,
  perfiles_formula: [],
  accesorios_formula: []
})

function seleccionarTipologia(id: string) {
  tipologiaSeleccionadaId.value = id
  if (!lineaFormulaSeleccionadaId.value && lineasActivas.value.length > 0) {
    lineaFormulaSeleccionadaId.value = lineasActivas.value[0].id
  }
  cargarFormulaActual()
}

function cargarFormulaActual() {
  if (!tipologiaSeleccionadaId.value || !lineaFormulaSeleccionadaId.value) return

  const f = formulas.value.find(
    x => x.tipologia_id === tipologiaSeleccionadaId.value && x.linea_id === lineaFormulaSeleccionadaId.value
  )

  if (f) {
    formulaActual.id = f.id
    formulaActual.descuento_vidrio_ancho = f.descuento_vidrio_ancho || 0
    formulaActual.descuento_vidrio_alto = f.descuento_vidrio_alto || 0
    formulaActual.perfiles_formula = JSON.parse(JSON.stringify(f.perfiles_formula || []))
    formulaActual.accesorios_formula = JSON.parse(JSON.stringify(f.accesorios_formula || []))
  } else {
    formulaActual.id = undefined
    formulaActual.descuento_vidrio_ancho = 0
    formulaActual.descuento_vidrio_alto = 0
    formulaActual.perfiles_formula = []
    formulaActual.accesorios_formula = []
  }
}

function agregarItemPerfilFormula() {
  formulaActual.perfiles_formula.push({
    perfil_id: perfilesDeLineaActual.value[0]?.id || '',
    formula_largo: 'alto',
    cantidad: 1
  })
}

function eliminarItemPerfilFormula(idx: number) {
  formulaActual.perfiles_formula.splice(idx, 1)
}

function agregarItemAccesorioFormula() {
  formulaActual.accesorios_formula.push({
    accesorio_id: accesoriosActivos.value[0]?.id || '',
    cantidad_fija: 1
  })
}

function eliminarItemAccesorioFormula(idx: number) {
  formulaActual.accesorios_formula.splice(idx, 1)
}

async function guardarFormulaActual() {
  if (!tipologiaSeleccionadaId.value || !lineaFormulaSeleccionadaId.value) return
  guardando.value = true
  try {
    // Rellenar desnormalizados
    const perfilesConNombres = formulaActual.perfiles_formula.map(it => {
      const p = perfiles.value.find(x => x.id === it.perfil_id)
      return {
        ...it,
        perfil_nombre: p?.nombre || '',
        perfil_codigo: p?.codigo || ''
      }
    })

    const accesoriosConNombres = formulaActual.accesorios_formula.map(it => {
      const a = accesorios.value.find(x => x.id === it.accesorio_id)
      return {
        ...it,
        accesorio_nombre: a?.nombre || ''
      }
    })

    await guardarFormula({
      id: formulaActual.id,
      tipologia_id: tipologiaSeleccionadaId.value,
      linea_id: lineaFormulaSeleccionadaId.value,
      descuento_vidrio_ancho: formulaActual.descuento_vidrio_ancho,
      descuento_vidrio_alto: formulaActual.descuento_vidrio_alto,
      perfiles_formula: perfilesConNombres,
      accesorios_formula: accesoriosConNombres
    })

    mostrarNotificacion('Fórmula guardada exitosamente.')
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al guardar la fórmula', 'error')
  } finally {
    guardando.value = false
  }
}

// -------------------------------------------------------------
// MODALES Y FORMULARIOS
// -------------------------------------------------------------
const modalLineaAbierto = ref(false)
const formLinea = reactive<{ id?: string; nombre: string; tipo_material: TipoMaterial }>({
  nombre: '',
  tipo_material: 'aluminio'
})

function abrirModalLinea(linea?: Linea) {
  if (linea) {
    formLinea.id = linea.id
    formLinea.nombre = linea.nombre
    formLinea.tipo_material = linea.tipo_material
  } else {
    formLinea.id = undefined
    formLinea.nombre = ''
    formLinea.tipo_material = 'aluminio'
  }
  modalLineaAbierto.value = true
}

async function submitLinea() {
  guardando.value = true
  try {
    await guardarLinea(formLinea)
    modalLineaAbierto.value = false
    mostrarNotificacion('Línea guardada exitosamente.')
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al guardar línea', 'error')
  } finally {
    guardando.value = false
  }
}

const modalPerfilAbierto = ref(false)
const formPerfil = reactive<{
  id?: string
  linea_id: string
  codigo: string
  nombre: string
  precio_metro: number
  stock_metros: number
  largo_barra_m: number
  merma: number | null
}>({
  linea_id: '',
  codigo: '',
  nombre: '',
  precio_metro: 0,
  stock_metros: 0,
  largo_barra_m: 5.99,
  merma: null
})

function abrirModalPerfil(perfil?: Perfil) {
  if (perfil) {
    formPerfil.id = perfil.id
    formPerfil.linea_id = perfil.linea_id
    formPerfil.codigo = perfil.codigo
    formPerfil.nombre = perfil.nombre
    formPerfil.precio_metro = perfil.precio_metro
    formPerfil.stock_metros = perfil.stock_metros
    formPerfil.largo_barra_m = perfil.largo_barra_m || 5.99
    formPerfil.merma = perfil.merma
  } else {
    formPerfil.id = undefined
    formPerfil.linea_id = lineaSeleccionadaId.value || lineasActivas.value[0]?.id || ''
    formPerfil.codigo = ''
    formPerfil.nombre = ''
    formPerfil.precio_metro = 0
    formPerfil.stock_metros = 0
    formPerfil.largo_barra_m = 5.99
    formPerfil.merma = null
  }
  modalPerfilAbierto.value = true
}

async function submitPerfil() {
  guardando.value = true
  try {
    await guardarPerfil(formPerfil)
    modalPerfilAbierto.value = false
    mostrarNotificacion('Perfil guardado exitosamente.')
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al guardar perfil', 'error')
  } finally {
    guardando.value = false
  }
}

const modalVidrioAbierto = ref(false)
const formVidrio = reactive<{
  id?: string
  nombre: string
  espesor_mm: number
  precio_m2: number
  stock_m2: number
}>({
  nombre: '',
  espesor_mm: 4,
  precio_m2: 0,
  stock_m2: 0
})

function abrirModalVidrio(vidrio?: Vidrio) {
  if (vidrio) {
    formVidrio.id = vidrio.id
    formVidrio.nombre = vidrio.nombre
    formVidrio.espesor_mm = vidrio.espesor_mm
    formVidrio.precio_m2 = vidrio.precio_m2
    formVidrio.stock_m2 = vidrio.stock_m2
  } else {
    formVidrio.id = undefined
    formVidrio.nombre = ''
    formVidrio.espesor_mm = 4
    formVidrio.precio_m2 = 0
    formVidrio.stock_m2 = 0
  }
  modalVidrioAbierto.value = true
}

async function submitVidrio() {
  guardando.value = true
  try {
    await guardarVidrio(formVidrio)
    modalVidrioAbierto.value = false
    mostrarNotificacion('Vidrio guardado exitosamente.')
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al guardar vidrio', 'error')
  } finally {
    guardando.value = false
  }
}

const modalColorAbierto = ref(false)
const formColor = reactive<{
  id?: string
  linea_id: string | null
  nombre: string
  tipo_recargo: TipoRecargoColor
  valor_recargo: number
}>({
  linea_id: null,
  nombre: '',
  tipo_recargo: 'ninguno',
  valor_recargo: 0
})

function abrirModalColor(color?: Color) {
  if (color) {
    formColor.id = color.id
    formColor.linea_id = color.linea_id
    formColor.nombre = color.nombre
    formColor.tipo_recargo = color.tipo_recargo
    formColor.valor_recargo = color.valor_recargo
  } else {
    formColor.id = undefined
    formColor.linea_id = lineaSeleccionadaId.value || null
    formColor.nombre = ''
    formColor.tipo_recargo = 'ninguno'
    formColor.valor_recargo = 0
  }
  modalColorAbierto.value = true
}

async function submitColor() {
  guardando.value = true
  try {
    await guardarColor(formColor)
    modalColorAbierto.value = false
    mostrarNotificacion('Color guardado exitosamente.')
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al guardar color', 'error')
  } finally {
    guardando.value = false
  }
}

const modalAccesorioAbierto = ref(false)
const formAccesorio = reactive<{
  id?: string
  nombre: string
  precio_unitario: number
  stock_unidades: number
}>({
  nombre: '',
  precio_unitario: 0,
  stock_unidades: 0
})

function abrirModalAccesorio(acc?: Accesorio) {
  if (acc) {
    formAccesorio.id = acc.id
    formAccesorio.nombre = acc.nombre
    formAccesorio.precio_unitario = acc.precio_unitario
    formAccesorio.stock_unidades = acc.stock_unidades
  } else {
    formAccesorio.id = undefined
    formAccesorio.nombre = ''
    formAccesorio.precio_unitario = 0
    formAccesorio.stock_unidades = 0
  }
  modalAccesorioAbierto.value = true
}

async function submitAccesorio() {
  guardando.value = true
  try {
    await guardarAccesorio(formAccesorio)
    modalAccesorioAbierto.value = false
    mostrarNotificacion('Accesorio guardado exitosamente.')
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al guardar accesorio', 'error')
  } finally {
    guardando.value = false
  }
}

const modalMarcoAbierto = ref(false)
const formMarco = reactive<{
  id?: string
  nombre: string
  ancho_pulgadas: number
  espesor_cm: number
  precio_metro: number
  stock_metros: number
}>({
  nombre: '',
  ancho_pulgadas: 2,
  espesor_cm: 2,
  precio_metro: 0,
  stock_metros: 0
})

function abrirModalMarco(marco?: MarcoMadera) {
  if (marco) {
    formMarco.id = marco.id
    formMarco.nombre = marco.nombre
    formMarco.ancho_pulgadas = marco.ancho_pulgadas
    formMarco.espesor_cm = marco.espesor_cm
    formMarco.precio_metro = marco.precio_metro
    formMarco.stock_metros = marco.stock_metros
  } else {
    formMarco.id = undefined
    formMarco.nombre = ''
    formMarco.ancho_pulgadas = 2
    formMarco.espesor_cm = 2
    formMarco.precio_metro = 0
    formMarco.stock_metros = 0
  }
  modalMarcoAbierto.value = true
}

async function submitMarco() {
  guardando.value = true
  try {
    await guardarMarcoMadera(formMarco)
    modalMarcoAbierto.value = false
    mostrarNotificacion('Marco de madera guardado exitosamente.')
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al guardar marco', 'error')
  } finally {
    guardando.value = false
  }
}

const modalTipologiaAbierto = ref(false)
const formTipologia = reactive<{
  id?: string
  nombre: string
  tipo_base: TipoBase
  mano_obra_fijo: number | null
  mano_obra_m2: number | null
}>({
  nombre: '',
  tipo_base: 'corredera',
  mano_obra_fijo: null,
  mano_obra_m2: null
})

function abrirModalTipologia(tipo?: Tipologia) {
  if (tipo) {
    formTipologia.id = tipo.id
    formTipologia.nombre = tipo.nombre
    formTipologia.tipo_base = tipo.tipo_base
    formTipologia.mano_obra_fijo = tipo.mano_obra_fijo
    formTipologia.mano_obra_m2 = tipo.mano_obra_m2
  } else {
    formTipologia.id = undefined
    formTipologia.nombre = ''
    formTipologia.tipo_base = 'corredera'
    formTipologia.mano_obra_fijo = null
    formTipologia.mano_obra_m2 = null
  }
  modalTipologiaAbierto.value = true
}

async function submitTipologia() {
  guardando.value = true
  try {
    const res = await guardarTipologia(formTipologia)
    modalTipologiaAbierto.value = false
    mostrarNotificacion('Tipología guardada exitosamente.')
    if (res?.id) {
      seleccionarTipologia(res.id)
    }
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al guardar tipología', 'error')
  } finally {
    guardando.value = false
  }
}

async function cambiarEstado(tabla: string, id: string, estadoActual: boolean) {
  try {
    await toggleActivo(tabla, id, estadoActual)
    await cargarTodo()
    mostrarNotificacion('Estado actualizado exitosamente.')
  } catch (err: any) {
    mostrarNotificacion(err.message || 'Error al cambiar estado', 'error')
  }
}

onMounted(async () => {
  await cargarTodo()
  if (tipologias.value.length > 0 && !tipologiaSeleccionadaId.value) {
    seleccionarTipologia(tipologias.value[0].id)
  }
})
</script>

<style scoped>
.catalog-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.catalog-tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.catalog-tab-btn:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.catalog-tab-btn.active {
  color: #38bdf8;
  border-bottom-color: #38bdf8;
  font-weight: 600;
}

.tab-count {
  background: #334155;
  color: #f8fafc;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-weight: 600;
}

.linea-item-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem;
  background: #0b1120;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.15s ease;
}

.linea-item-btn:hover {
  background: var(--bg-surface-hover);
  border-color: #475569;
}

.linea-item-btn.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
}

.linea-item-btn.inactivo {
  opacity: 0.6;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.icon-btn:hover {
  opacity: 1;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1.5rem;
}

.modal-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow-lg);
}

.modal-card h3 {
  margin-bottom: 1.25rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
