# Plan de Implementación — Etapa 06: PDF del Presupuesto y WhatsApp

## 1. Arquitectura Técnica

Para garantizar velocidad, soporte offline y generación directa en el cliente (tanto en móviles como en PC), utilizaremos **`jspdf`** junto con **`jspdf-autotable`**.

### Ventajas de este enfoque:
1. **100% en el navegador**: No requiere backend de renderizado (Puppeteer, microservicios externos).
2. **Generación directa de Blob**: Permite entregar el archivo binario a la API `navigator.share({ files: [file] })` de dispositivos móviles.
3. **Paginación automática controlada**: Tablas largas de ventanas se quiebran limpiamente entre páginas manteniendo los encabezados.
4. **Diseño vectorial nítido**: Textos, líneas y tablas no se pixelan como sucede al capturar canvas de pantalla.
5. **Liviano y rápido**: Tiempo de generación inferior a 100ms.

---

## 2. Componentes a Desarrollar

### 2.1 Composable `usePresupuestoPdf.ts`
Ubicación: `app/composables/usePresupuestoPdf.ts`
Responsabilidades:
- Configurar documento A4 en orientación vertical.
- Dibujar encabezado con logo de la vidriería (si existe y es cargable como Data URL / Base64) y datos de contacto.
- Dibujar bloque de cliente y metadatos del presupuesto (número, fecha, validez, estado).
- Generar tabla de ventanas usando `autoTable`:
  - Columnas: Posición / Ventana, Medidas, Vidrio & Color, Cant., Precio Unit., Total Neto.
- Generar tabla o filas de ítems libres (si existen).
- Dibujar resumen de totales: Subtotal, Descuento (si aplica), Neto, IVA 19%, Total a Pagar.
- Dibujar bloque de condiciones comerciales y observaciones.
- Dibujar pie de página con numeración "Página X de Y".
- Métodos públicos:
  - `descargarPdf(presupuesto, vidrieria)`
  - `compartirWhatsApp(presupuesto, vidrieria)`
  - `generarBlobPdf(presupuesto, vidrieria)`

### 2.2 Integración en `app/pages/presupuestos/[id].vue`
- Incorporar botones destacados en la barra de acciones:
  - `[📄 Descargar PDF]`
  - `[💬 Enviar por WhatsApp]`
- Manejo de estados de carga (spinner durante la generación).
- Retroalimentación amigable si el navegador móvil no soporta compartir archivos nativos (fallback a descarga + apertura de chat).

---

## 3. Manejo de Imágenes y Logo

Para insertar el logo de la vidriería en el PDF mediante `jspdf.addImage()`:
- Función auxiliar `urlToBase64(url)` para convertir URLs de imágenes de Supabase Storage en Data URLs.
- Si la imagen falla en cargar o no existe, el PDF muestra elegantemente el nombre de la vidriería en tipografía destacada sin romper la generación.

---

## 4. Estrategia de Pruebas

- Pruebas unitarias del formateo de datos y cálculo de totales en PDF.
- Verificación estricta de que los campos de costos internos (`costo_perfiles`, `costo_vidrio`, `merma`, `mano_obra`, `margen`) no son expuestos en la salida.
- Prueba end-to-end de generación y verificación en navegador.
