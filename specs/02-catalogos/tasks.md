# 02 — Tareas: Catálogos

Estado: Aceptada 2026-09-24.

Plan: `specs/02-catalogos/plan.md`.

## 1. Base de datos y Migración

- [x] Crear archivo `supabase/migrations/0006_catalogos.sql` con las 8 tablas, constraints y políticas RLS.
- [x] Aplicar la migración en Supabase usando el MCP `execute_sql`.
- [x] Verificar con MCP `list_tables` que las 8 tablas existan y tengan RLS habilitado.

## 2. Tipos Compartidos

- [x] Crear `shared/tipos/catalogos.ts` con las interfaces de Línea, Perfil, Vidrio, Color, Accesorio, Marco de Madera, Tipología y Fórmula.
- [x] Exportar los nuevos tipos en `shared/tipos/index.ts`.

## 3. Composable de Catálogos

- [x] Crear `app/composables/useCatalogos.ts` con métodos de lectura, creación, actualización y cambio de estado activo/inactivo.

## 4. Navegación e Interfaz

- [x] Actualizar `app/layouts/default.vue` para agregar el enlace **Catálogos** en el menú superior.
- [x] Crear `app/pages/catalogos.vue` con selector de pestañas:
  - Pestaña 1: Líneas y Perfiles (con largo aprovechable 5,99 m).
  - Pestaña 2: Vidrios (con espesor en mm).
  - Pestaña 3: Colores y Acabados (asociados a líneas o globales).
  - Pestaña 4: Accesorios y Herrajes.
  - Pestaña 5: Marcos de Madera (con ancho de tabla en pulgadas).
  - Pestaña 6: Tipologías y Fórmulas de Corte (con expresiones aritméticas dinámicas y simulador en vivo).
- [x] Implementar formularios modales para agregar y editar elementos en cada catálogo.

## 5. Verificaciones Finales

- [x] Ver. 1: Estructura de líneas y perfiles lista con RLS y persistencia.
- [x] Ver. 2: Vidrios con espesor_mm e integridad de tipos.
- [x] Ver. 3: Colores por línea o globales con recargo % o $/m.
- [x] Ver. 4: Accesorios con precio unitario y stock.
- [x] Ver. 5: Marcos de madera con ancho en pulgadas y espesor en cm.
- [x] Ver. 6: Tipologías y editor visual de fórmulas por línea con evaluador.
- [x] Ver. 7: Toggle de activación/desactivación funcional con soft delete.
- [x] Ver. 8: Compilación limpia en Vite / Nuxt HMR.

## 6. Cierre de Etapa

- [x] Todas las pruebas pasadas.
- [x] Actualizar estado de etapa 02 a "Aceptada" en `specs/README.md`.
