# Tareas de Implementación — Etapa 06: PDF del Presupuesto y WhatsApp

- [x] **Tarea 1: Instalación de dependencias**
  - [x] Instalar `jspdf` y `jspdf-autotable` vía `pnpm add jspdf jspdf-autotable`.
  - [x] Verificar que no haya conflictos de tipos en TypeScript.

- [x] **Tarea 2: Composable `usePresupuestoPdf`**
  - [x] Crear `app/composables/usePresupuestoPdf.ts`.
  - [x] Implementar función para convertir logo URL a Base64 / Data URL.
  - [x] Diseñar el encabezado con datos de la vidriería y número de presupuesto.
  - [x] Diseñar bloque de cliente y metadatos de emisión/validez.
  - [x] Generar tabla de ventanas con medidas, tipología, cantidad, vidrio, color y precio neto.
  - [x] Generar tabla de ítems libres si existen.
  - [x] Generar caja de totales: Neto, Descuento, IVA 19% y Total a pagar con separador de miles.
  - [x] Añadir bloque de observaciones y pie de página con paginación "Página X de Y".
  - [x] Garantizar la estricta omisión de costos base, mermas y margen.

- [x] **Tarea 3: Lógica de Compartir por WhatsApp**
  - [x] Implementar detección de Web Share API con soporte para archivos (`navigator.canShare({ files: [...] })`).
  - [x] Implementar fallback para PC con WhatsApp Web (`https://wa.me/...`) y descarga automática del PDF.
  - [x] Formatear mensaje prellenado en WhatsApp con datos del presupuesto.

- [x] **Tarea 4: Integración en la interfaz de usuario**
  - [x] En `app/pages/presupuestos/[id].vue`, añadir botones de "Descargar PDF" y "Enviar por WhatsApp".
  - [x] Agregar indicadores de estado de carga mientras se compila el PDF.

- [x] **Tarea 5: Pruebas y Validación**
  - [x] Crear suite de pruebas unitarias para validar la estructura del PDF y la omisión de costos confidenciales.
  - [x] Validar generación de PDF con un presupuesto real en la aplicación.
