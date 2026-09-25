# 04 — Plan de Construcción: Presupuesto

Estado: Plan listo para revisión.

Spec: `specs/04-presupuesto/spec.md`.

---

## 1. Base de Datos y Supabase (`supabase/migrations/0007_presupuestos.sql`)

1. **Tablas**:
   - `clientes`: agenda de clientes por vidriería.
   - `presupuestos`: cabecera comercial con correlativo único por tenant, totales y estado.
   - `presupuesto_ventanas`: líneas de ventanas con especificaciones y snapshot JSON.
   - `presupuesto_items_libres`: ítems manuales libres (instalación, flete, etc.).
2. **Función correlativo atómico**:
   - Función SQL `obtener_siguiente_numero_presupuesto(p_vidrieria_id uuid)` que calcula de manera atómica:
     `select coalesce(max(numero), 0) + 1 from presupuestos where vidrieria_id = p_vidrieria_id;`
3. **Seguridad (RLS)**:
   - Políticas en las 4 tablas con `vidrieria_id = get_usuario_vidrieria_id()`.

---

## 2. Tipos Compartidos (`shared/tipos/presupuesto.ts`)

- `Cliente`: datos del cliente.
- `EstadoPresupuesto`: `'borrador' | 'enviado' | 'aceptado' | 'rechazado'`.
- `TipoDescuentoPresupuesto`: `'porcentaje' | 'monto'`.
- `PresupuestoVentana`: fila de ventana con `calculo_snapshot: ResultadoCalculoVentana`.
- `PresupuestoItemLibre`: fila de ítem libre.
- `Presupuesto`: cabecera completa con arrays de ventanas e ítems libres.

---

## 3. Lógica de Totales (`shared/calculo/totalesPresupuesto.ts`)

Módulo puro de cálculo comercial:
- `calcularTotalesPresupuesto(ventanas, itemsLibres, tipoDescuento, valorDescuento)`:
  - Suma subtotales netos.
  - Aplica descuento porcentual o fijo.
  - Calcula IVA (19%) sobre el neto resultante.
  - Retorna montos redondeados al entero más cercano.

---

## 4. Tests Unitarios (`tests/presupuesto.test.ts`)

Pruebas en Vitest para validar:
1. Suma de precios de ventanas + ítems libres.
2. Descuento porcentual (ej. 10%) e impacto en IVA.
3. Descuento en monto neto fijo.
4. Protección contra descuento que exceda el subtotal (neto no puede ser negativo).
5. Redondeo exacto al peso en IVA y total.

---

## 5. Composables y Servicios (`app/composables/usePresupuestos.ts`)

- Métodos:
  - `cargarPresupuestos(filtros)`
  - `cargarPresupuestoPorId(id)`
  - `guardarPresupuesto(datos, ventanas, itemsLibres)` (creación o actualización)
  - `cambiarEstado(id, nuevoEstado)`
  - `duplicarPresupuesto(id)`
  - `buscarClientes(query)`

---

## 6. Interfaz de Usuario

1. **Navegación**: Enlace "Presupuestos" en `app/layouts/default.vue`.
2. **Listado (`app/pages/presupuestos/index.vue`)**:
   - Tabla con Número, Cliente, Fecha, Estado, Total, Acciones.
   - Pestañas de estado (Todos, Borradores, Enviados, Aceptados, Rechazados).
   - Buscador por texto.
3. **Editor / Detalle (`app/pages/presupuestos/[id].vue`)**:
   - Cabecera: Cliente, fechas, correlativo, botones de estado.
   - Sección Ventanas:
     - Tabla de ventanas cotizadas.
     - Botón "+ Agregar Ventana" que abre un modal con el configurador interactivo conectado al motor de la Etapa 03.
   - Sección Ítems Libres:
     - Tabla editable de descripción, cantidad y precio.
   - Resumen financiero lateral o inferior (Subtotal, Descuento, Neto, IVA, Total).
   - Bloqueo de controles cuando el estado es `aceptado`.
