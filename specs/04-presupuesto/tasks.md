# 04 — Tareas: Presupuesto

Estado: Aceptada 2026-09-24.

Plan: `specs/04-presupuesto/plan.md`.

## 1. Base de Datos y Migración

- [x] Crear archivo `supabase/migrations/0007_presupuestos.sql` con las 4 tablas, función de correlativo y políticas RLS.
- [x] Aplicar migración en Supabase usando MCP `execute_sql`.
- [x] Verificar creación de tablas y políticas RLS con MCP `list_tables`.

## 2. Tipos Compartidos

- [x] Crear `shared/tipos/presupuesto.ts` con interfaces de `Cliente`, `Presupuesto`, `PresupuestoVentana`, `PresupuestoItemLibre`.
- [x] Exportar tipos en `shared/tipos/index.ts`.

## 3. Lógica Comercial y Tests

- [x] Crear `shared/calculo/totalesPresupuesto.ts` con la función pura de totalización y descuentos.
- [x] Crear suite de pruebas `tests/presupuesto.test.ts` con Vitest.
- [x] Ejecutar `pnpm test` y verificar que pasen todas las pruebas (13 de 13 pasadas).

## 4. Composable de Presupuestos

- [x] Crear `app/composables/usePresupuestos.ts` con métodos de lectura, guardado, actualización, duplicación y cambio de estado.

## 5. Navegación e Interfaz

- [x] Agregar enlace **Presupuestos** en la barra de navegación de `app/layouts/default.vue`.
- [x] Crear página de listado `app/pages/presupuestos/index.vue` con filtros por estado y buscador.
- [x] Crear página de editor/detalle `app/pages/presupuestos/[id].vue`:
  - Selector/creador de cliente con autocompletado.
  - Modal para agregar ventana cotizada mediante el motor de cálculo de la Etapa 03 con previsualización en vivo.
  - Tabla de ítems libres (instalación, fletes, etc.).
  - Panel de totales (Subtotal, Descuento % o $, Neto, IVA 19%, Total).
  - Bloqueo de edición al estar aceptado.
  - Botón de duplicar presupuesto como borrador nuevo.

## 6. Verificaciones y Cierre de Etapa

- [x] Probar creación de presupuesto con ventana cotizada e ítem libre.
- [x] Probar transiciones de estado y bloqueo en aceptado.
- [x] Probar duplicación de presupuesto.
- [x] Validar compilación de producción con `pnpm generate` (exitosa sin errores).
- [x] Actualizar estado de etapa 04 a "Aceptada" en `specs/README.md`.
