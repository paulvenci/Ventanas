# 06 — PDF del Presupuesto y Envío por WhatsApp

Estado: Aceptada y Validada 2026-09-24.  
Sale de: `Especificaciones.md` — Secciones 10, 11, 12, 13 y Criterios 6 y 7.

---

## 1. Objetivo de la etapa

Permitir que el usuario genere y descargue un documento PDF profesional del presupuesto comercial y lo comparta fácilmente con el cliente (por WhatsApp o correo) desde el teléfono móvil o el computador.

El PDF es el documento formal de cara al cliente final:
- Contiene la identidad de la vidriería (logo, datos comerciales, contacto).
- Contiene los datos del cliente, condiciones comerciales (validez, forma de pago, observaciones).
- Detalla cada ítem presupuestado (ventanas e ítems libres) con sus características visibles y precio de venta unitario y total.
- **NO expone los costos internos del taller** (no muestra costo de perfiles por barra, mermas, costo de mano de obra por hora/m², ni margen de ganancia).
- Proporciona un flujo de envío directo por WhatsApp adaptado según el dispositivo (móvil vs escritorio).

---

## 2. Decisiones de diseño y negocio

### 2.1 Generación en cualquier estado
- El PDF puede generarse en **cualquier estado** del presupuesto (`borrador`, `enviado`, `aceptado`, `rechazado`).
- Si el presupuesto está en `borrador`, se puede incluir una marca de agua o indicador sutil de estado (o simplemente indicar el estado actual en el encabezado).

### 2.2 Contenido visible en el PDF

1. **Encabezado Vidriería:**
   - Logo oficial (si existe en la configuración).
   - Nombre de la vidriería o razón social.
   - RUT / Identificación tributaria.
   - Dirección y teléfono / correo de contacto.

2. **Metadatos del Presupuesto:**
   - Número de presupuesto correlativo (ej. `#1001`).
   - Fecha de emisión.
   - Fecha de validez (o texto descriptivo: "Válido por X días").
   - Estado actual del presupuesto.

3. **Datos del Cliente:**
   - Nombre / Razón social.
   - Teléfono / WhatsApp.
   - Correo electrónico (si está disponible).
   - Dirección / Ubicación de la obra.

4. **Tabla de Ventanas / Productos:**
   Por cada ventana presupuestada:
   - Posición / Identificador (ej. `V1`, `V2` o `Ventana 1`).
   - Línea y Tipología (ej. `Línea 20 — Corredera 2 Hojas`).
   - Dimensiones: Ancho (cm) × Alto (cm).
   - Color del perfil (ej. `Mate`, `Titanio`, `Blanco`).
   - Vidrio seleccionado (ej. `Incoloro 4mm`).
   - Marco de madera: `Sí (Espesor: X cm)` o `No`.
   - Cantidad de unidades iguales.
   - Precio unitario neto.
   - Subtotal neto de la línea.

5. **Tabla de Ítems Libres (si existen):**
   - Descripción del ítem (ej. `Instalación en segundo piso`, `Flete a faena`).
   - Cantidad.
   - Precio unitario neto.
   - Subtotal neto.

6. **Totales Económicos:**
   - Subtotal Neto.
   - Descuento comercial aplicado (monto en pesos y/o porcentaje).
   - Neto con descuento.
   - IVA (19%).
   - **Total a Pagar (pesos enteros con separador de miles, ej. `$ 1.250.000`)**.

7. **Observaciones y Condiciones:**
   - Términos de entrega, formas de pago, garantías, etc.

---

### 2.3 Exclusiones críticas (Confidencialidad interna)

> [!IMPORTANT]
> **Protección de márgenes y costos internos**:
> El PDF NO debe incluir bajo ninguna circunstancia:
> - Costo de barras o fórmulas de corte.
> - Desglose de mermas (%).
> - Costo de mano de obra base.
> - Margen de utilidad / ganancia aplicada.
> Solo se muestran precios finales netos de venta.

---

### 2.4 Integración con WhatsApp

Siguiendo la regla de no depender de una API de WhatsApp Business de pago:

1. **En dispositivos móviles (celulares/tablets):**
   - Se utiliza la API estándar `navigator.share({ files: [pdfBlob], title: 'Presupuesto #...', text: '...' })`.
   - Abre la hoja nativa del sistema operativo para compartir directamente el archivo PDF a WhatsApp o cualquier otra app instalada.
   - Si el navegador móvil no soporta compartir archivos vía `navigator.share`, se descarga el PDF automáticamente y se abre WhatsApp con el mensaje predefinido.

2. **En computadores (escritorio):**
   - Al pulsar "Enviar por WhatsApp", se descarga automáticamente el archivo PDF al computador (`Presupuesto-XXXX.pdf`).
   - Simultáneamente se abre WhatsApp Web / WhatsApp Desktop (`https://wa.me/<telefono>?text=<mensaje_codificado>`).
   - Mensaje prellenado con:
     - Saludo al cliente.
     - Nombre de la vidriería.
     - Número de presupuesto.
     - Monto total.
     - Indicación de que el archivo PDF descargado se adjunta a continuación.

---

## 3. Criterios de Aceptación

1. **Descarga en 1 clic**: Desde la vista de presupuesto (`/presupuestos/[id]`), un botón "Descargar PDF" genera y descarga el archivo `.pdf` con nombre legible (ej. `Presupuesto-1001-Juan-Perez.pdf`).
2. **Fidelidad y Diseño Limpio**: El PDF tiene un diseño limpio, profesional y legible, con paginación automática si el presupuesto contiene muchas ventanas.
3. **Omisión de Costos Internos**: Inspeccionando el contenido visible del PDF no aparece ningún dato de costo base, merma ni margen de ganancia.
4. **Formato Numérico Chileno**: Moneda en pesos enteros (`$ 1.234.567`) y medidas en cm.
5. **Botón WhatsApp Inteligente**:
   - En PC: Descarga el PDF y abre la URL de WhatsApp con el número del cliente y mensaje prellenado.
   - En móvil con Web Share API: Lanza el diálogo nativo para compartir el archivo PDF directamente a WhatsApp.
