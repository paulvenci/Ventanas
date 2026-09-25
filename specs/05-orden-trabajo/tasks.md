# 05 — Tareas: Orden de Trabajo y Listado de Cortes

Estado: Completada y Validada (2026-09-24).
Dependencias: Etapa 04 completada.

---

## Tareas

- [x] **Tarea 1: Tipos compartidos de Dominio**
  - [x] Crear interfaces en `shared/tipos/ordenTrabajo.ts` (`OrdenTrabajo`, `EstadoOT`, `BarraCorte`, `PiezaCorteOptimizada`, `ListadoCortesPerfil`, `MaterialConsolidado`).
  - [x] Reexportar desde `shared/tipos/index.ts`.

- [x] **Tarea 2: Motor de Optimización de Cortes y Materiales (Lógica Pura)**
  - [x] Crear `shared/calculo/cortes.ts` con algoritmo FFD, cálculo de mermas/sobrantes por barra y consolidación de materiales.
  - [x] Crear suite de pruebas unitarias `tests/cortes.test.ts` con Vitest.
  - [x] Validar con `pnpm test` hasta tener 100% de tests aprobados (17/17 tests passing).

- [x] **Tarea 3: Base de Datos y Supabase Migration**
  - [x] Crear migración `supabase/migrations/0008_ordenes_trabajo.sql`.
  - [x] Implementar tabla `ordenes_trabajo`, relación 1:1 con `presupuestos`, función correlativa `next_numero_ot` y políticas RLS.
  - [x] Aplicar migración en base de datos.

- [x] **Tarea 4: Composable `useOrdenesTrabajo`**
  - [x] Crear `app/composables/useOrdenesTrabajo.ts` para gestionar lectura, creación desde presupuesto y cambios de estado con Supabase.

- [x] **Tarea 5: Conexión con Presupuestos**
  - [x] En `app/pages/presupuestos/[id].vue`, habilitar botón "Generar Orden de Trabajo" cuando el estado sea `aceptado`.
  - [x] Modal rápido para definir fecha estimada de entrega y notas.
  - [x] Redirección automática a la OT recién creada.

- [x] **Tarea 6: Vistas de Orden de Trabajo**
  - [x] Implementar `app/pages/ordenes-trabajo/index.vue`: Listado general con buscador, filtros y badges de estado.
  - [x] Implementar `app/pages/ordenes-trabajo/[id].vue`:
    - Resumen y flujo de estados (`pendiente`, `en_produccion`, `lista_instalar`, `instalada`, `cancelada`).
    - Gráfico y desglose de barras optimizadas de perfiles (5,99 m) con cálculo de piezas y sobrantes en cm.
    - Tabla consolidada de materiales (barras de perfiles, vidrio m², accesorios, marco).
    - Estilos específicos de impresión (`@media print`) para hoja de taller con checkboxes.
  - [x] Agregar enlace de navegación "Órdenes de Trabajo" en el layout/menú principal (`app/layouts/default.vue`).

- [x] **Tarea 7: Validación Integral**
  - [x] Ejecutar tests automáticos (`pnpm test` - 17 tests pasados).
  - [x] Probar flujo completo en el navegador: aceptar presupuesto → generar OT → inspeccionar cortes de 5,99 m y materiales → validar layout de impresión.
