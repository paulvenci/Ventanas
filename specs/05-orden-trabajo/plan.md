# 05 — Plan de Construcción: Orden de Trabajo y Listado de Cortes

Estado: En redacción.
Basado en: `specs/05-orden-trabajo/spec.md`

---

## 1. Arquitectura y Enfoque

Seguiremos la separación limpia de capas usada en etapas anteriores:
1. **Base de Datos / Supabase**:
   - Migración SQL `0008_ordenes_trabajo.sql` para crear la tabla `ordenes_trabajo`, índices, función correlativa transaccional `next_numero_ot(vidrieria_id)` y políticas RLS multitenant por `vidrieria_id`.
2. **Capa de Dominio Puro (Sin dependencias externas ni UI)**:
   - Crear `shared/calculo/cortes.ts`:
     - Algoritmo de corte unidimensional *First Fit Decreasing* (FFD) considerando largo aprovechable (default 599 cm) y ancho de corte (kerf de 0.5 cm por corte).
     - Función `optimizarCortesPerfil`: agrupa, ordena y asigna piezas a barras optimizadas con cálculo de sobrante y % de aprovechamiento.
     - Función `generarListadoCortes`: procesa las ventanas y sus snapshots inmutables para consolidar el despiece por perfil.
     - Función `generarListadoMateriales`: consolida perfiles (en barras calculadas), vidrio (en m² totales), accesorios (unidades totales) y marco de madera (metros totales).
   - Pruebas unitarias en Vitest (`tests/cortes.test.ts`):
     - Validar que una pieza mayor a la barra lance error/aviso.
     - Validar que varias piezas pequeñas se empaqueten minimizando barras.
     - Validar kerf de sierra y cálculo de sobrante.
3. **Capa de Tipos TypeScript (`shared/tipos`)**:
   - Exportar interfaces de `OrdenTrabajo`, `EstadoOT`, y estructuras de `Cortes` y `MaterialesConsolidados`.
4. **Capa de Aplicación Nuxt 4 (Composables y UI)**:
   - Composable `useOrdenesTrabajo.ts`:
     - `cargarOTs()`, `obtenerOT(id)`, `crearOTDesdePresupuesto(presupuestoId, fechaEntrega, observaciones)`, `cambiarEstadoOT(id, nuevoEstado)`.
   - Modificación en `app/pages/presupuestos/[id].vue`:
     - Si el presupuesto está `aceptado`, mostrar botón destacado "Generar Orden de Trabajo" o enlace directo a su OT si ya existe.
   - Páginas nuevas:
     - `app/pages/ordenes-trabajo/index.vue`: Listado general con buscador, filtros de estado (`pendiente`, `en_produccion`, `lista_instalar`, `instalada`, `cancelada`) y accesos rápidos.
     - `app/pages/ordenes-trabajo/[id].vue`: Detalle de la OT con 3 pestañas:
       - **Resumen**: Estado con acciones de cambio, cliente, fechas y referencia al presupuesto.
       - **Listado de Cortes**: Visualización gráfica de barras de 5,99 m con barras apiladas proporcionales, piezas numeradas, sobrantes en cm y opción de reasignar piezas manualmente. Botón de impresión limpia / PDF de taller.
       - **Listado de Materiales**: Consolidado cuantitativo para bodega/compra (barras totales por perfil, m² de vidrio, unidades de accesorios y metros de marco).

---

## 2. Decisiones Técnicas y Algoritmo FFD

- **Kerf**: 0.5 cm por corte. Si una barra tiene $N$ piezas, el espacio consumido es:
  $$\text{Espacio consumido} = \sum (\text{largo\_pieza}) + (N - 1) \times 0.5$$
- **Reordenamiento interactivo**:
  En Vue 3, las barras y sus piezas estarán en un estado reactivo local en la vista. Si el usuario mueve una pieza o ajusta la barra, se recalcula la validez (que no supere los 599 cm) y el sobrante al instante.
- **Impresión / PDF de Taller**:
  Uso de vista con clases `@media print` para generar de inmediato un documento imprimible o guardable en PDF con checkboxes de corte para el operario de maestranza, sin dependencias pesadas de terceros para este paso de taller.

---

## 3. Pruebas y Validación

1. Tests unitarios en `tests/cortes.test.ts` con Vitest probando los casos de prueba del algoritmo de optimización.
2. Comprobación de integridad con `pnpm build` / `pnpm test`.
3. Verificación interactiva del flujo en el navegador:
   - Presupuesto aceptado → Crear OT → Ver visualizador de barras y materiales.
