# Especificaciones — Ventanas

Aplicación web para cotizar, presupuestar y descontar stock de una vidriería que fabrica ventanas de aluminio y de PVC.

Este documento reemplaza el borrador `Especificaciones` como especificación de producto. El borrador se conserva sin cambios.

## 1. Objetivo

Permitir que el personal de una vidriería arme un presupuesto de ventanas en el celular o en el PC, calcule el costo a partir de materiales, mano de obra, merma, margen, descuentos e IVA, entregue un PDF al cliente (también por WhatsApp) y, al aceptar el presupuesto, descuente el stock. Si ese presupuesto se rechaza después, el stock vuelve.

Otro objetivo de la misma versión: generar el listado de compra de material a partir de uno o varios presupuestos, mostrando cuánto hace falta, cuánto hay en stock y cuánto hay que comprar.

## 2. Decisiones cerradas

- Web responsive (celular y PC). Se publica como sitio estático en GitHub Pages. Los datos y el acceso viven en Supabase, no en el navegador.
- Varias vidrierías en la misma aplicación, con datos aislados (multi-tenant).
- Un solo rol dentro de cada vidriería: todos los usuarios de esa vidriería pueden hacer todo lo de su empresa. No ven datos de otra.
- El presupuesto calcula materiales, mano de obra, margen comercial, descuentos e IVA.
- Las medidas de la ventana se ingresan en centímetros. El espesor del marco de madera y el descuento de vidrio también se ingresan en centímetros.
- Moneda: pesos chilenos. Se muestra neto e IVA 19% por separado. Dinero y medidas se muestran con separador de miles.
- La ventana se cotiza por tipología (corredera, batiente, paño fijo, etc.) con una fórmula de consumo por tipología y línea. Además se pueden agregar ítems manuales con cantidad y valor.
- El presupuesto acepta ítems libres (instalación, traslado, otros) con descripción, cantidad y precio.
- Estados del presupuesto: borrador, enviado, aceptado, rechazado.
- Entrega al cliente: PDF descargable (logo, ítems, neto, IVA, total) y opción de enviarlo por WhatsApp.
- Stock de perfiles, vidrio y accesorios. Se descuenta al pasar a aceptado. Si después pasa a rechazado, se revierte el mismo movimiento.
- Listado de compra desde uno o varios presupuestos, en cualquier estado. Muestra necesario, stock y a comprar, en las mismas unidades del stock. Se ve en pantalla y se descarga en PDF. No agrupa por proveedor.

## 3. Fuera de alcance en esta versión

- App nativa iOS/Android.
- Roles distintos (admin, cotizador, solo lectura) y panel de administración de la plataforma.
- Optimización de corte de barras, depósito de retazos y comparación de merma real contra merma estimada.
- Módulo de compras: no hay órdenes de compra, recepción de mercadería ni proveedores. El listado de compra es un documento de cantidades, no un pedido al proveedor.
- Órdenes de fabricación, instalación y entrega.
- Envío de correo desde la app.
- API de WhatsApp Business. El envío es compartir el PDF o un enlace, no un mensaje automático de un número de empresa.
- Multi-moneda.

## 4. Usuarios, vidrierías y acceso

Cada vidriería es un tenant. Sus catálogos, clientes, presupuestos, precios y stock no son visibles para otra vidriería.

Un usuario pertenece a una sola vidriería. Entra con correo y contraseña. Dentro de su vidriería no hay restricción por rol.

Alta de una vidriería: el registro crea la vidriería y su primer usuario. Para registrarse, el formulario exige un código de activación que solo conoce el operador de la plataforma. Sin ese código, el registro no procede. Ese usuario puede invitar a otros de la misma vidriería. No hay pantalla para crear o administrar otras vidrierías.

Datos mínimos de la vidriería, editables y usados en el PDF:

- Razón social o nombre de fantasía
- RUT
- Dirección, teléfono, correo
- Logo
- Margen comercial por defecto
- Porcentaje de merma por defecto
- Datos de mano de obra por defecto

## 5. Catálogos

Todo catálogo es propio de la vidriería. Se puede crear, editar y desactivar. Lo desactivado no se ofrece en presupuestos nuevos y no se borra si ya fue usado.

### 5.1 Material y línea

- Tipo de material: aluminio o PVC. Fijo en el sistema; no es un catálogo libre.
- Línea: pertenece a un tipo. Ejemplos: PVC línea 1, PVC línea 2, aluminio línea 20, aluminio línea 25.

### 5.2 Perfiles

Un perfil pertenece a una línea. Campos:

- Nombre y código
- Precio por metro (neto)
- Stock en metros
- Merma propia, opcional. Si no tiene, usa la merma de la vidriería.
- Activo o inactivo

El stock se lleva en metros, no en barras. El largo de barra y el aprovechamiento de cortes quedan fuera de esta versión.

### 5.3 Tipologías y fórmulas

Tipologías de partida, editables por la vidriería: corredera, batiente, paño fijo. Pueden agregar otras.

Cada tipología tiene, por línea, una fórmula que indica qué perfiles consume y cuántos metros, en función del ancho y del alto útiles (en centímetros). La fórmula también puede incluir accesorios en unidades.

El vidrio no se calcula con una fórmula libre. Su descuento es un dato de esa tipología y esa línea: cuántos centímetros se restan al ancho y cuántos al alto antes de pasar a m2. Si no se cargan, el descuento es cero y el vidrio usa el hueco completo.

Ejemplo de regla, no de catálogo cerrado: una corredera de una línea puede consumir `2 * ancho + 2 * alto` de un perfil de marco y `2 * alto` de un perfil de hoja. La vidriería carga estas reglas; el sistema no trae fórmulas de fábrica salvo un ejemplo vacío para completar.

La fórmula es la fuente del consumo. El cotizador no tiene que tipear los metros de cada perfil para una ventana estándar. Sí puede agregar ítems extra o ajustar (ver sección 6).

### 5.4 Vidrio

- Nombre (por ejemplo templado 4 mm, DVH 4/12/4)
- Precio neto por m2
- Stock en m2
- Activo o inactivo

### 5.5 Color

- Nombre (folio madera, mate, blanco, etc.)
- Recargo opcional: porcentaje o monto por metro de perfil. Si no se define, el recargo es cero.
- Activo o inactivo

### 5.6 Accesorios

Herrajes y otros ítems unitarios: nombre, precio neto unitario, stock en unidades, activo o inactivo.

### 5.7 Marco de madera

Catálogo simple: nombre, precio neto por metro, stock en metros, y el espesor del marco en centímetros (cuánto entra hacia el vano por cada lado). En la ventana es sí o no, y se elige cuál.

Si la ventana lleva marco de madera, las medidas que carga el cotizador son las del vano, no las de la ventana de aluminio o PVC. El marco reduce el hueco hacia adentro:

- Ancho útil = ancho del vano − (2 * espesor del marco)
- Alto útil = alto del vano − (2 * espesor del marco)

Ese ancho y ese alto útiles son los que usan la fórmula de perfiles, el vidrio, los accesorios de la fórmula y la mano de obra por m2. El marco de madera se consume sobre el vano, no sobre el hueco reducido: `2 * (ancho del vano + alto del vano)`, más la merma configurada.

Si el espesor deja el ancho útil o el alto útil en cero o menos, la ventana no se puede guardar. El desglose muestra el vano, el espesor y las medidas útiles.

### 5.8 Mano de obra

Configurable por tipología:

- Monto fijo por ventana, neto
- Valor por m2, neto

Se pueden usar los dos. Si una tipología no tiene valores, se usan los de la vidriería. Si tampoco existen, la mano de obra de esa ventana es cero y el presupuesto lo muestra, no lo oculta.

## 6. Cómo se arma una ventana

Al agregar una ventana al presupuesto se pide:

- Tipo: aluminio o PVC
- Línea: solo las de ese tipo
- Tipología
- Ancho y alto del vano, en centímetros, mayores que cero
- Cantidad, entera, mayor que cero
- Color
- Tipo de vidrio
- Marco de madera: no, o cuál del catálogo
- Observación, opcional

Si hay marco de madera, primero se calculan el ancho y el alto útiles (sección 5.7). Sin marco, las medidas útiles son las del vano.

Con eso el sistema calcula y muestra el desglose, antes de guardar:

- Medidas del vano y, si hay marco, espesor y medidas útiles
- Metros de cada perfil según la fórmula de esa tipología y línea, usando las medidas útiles
- Metros con merma (la del perfil, o la de la vidriería si el perfil no tiene)
- Recargo de color, si existe
- Vidrio: al ancho útil se le resta el descuento de ancho de esa tipología y línea, y al alto útil el descuento de alto. m2 = ancho de vidrio * alto de vidrio. Si un descuento deja un lado en cero o menos, la ventana no se puede guardar. Va con merma de vidrio si la vidriería la configuró; si no, merma de vidrio = 0
- Accesorios que la fórmula indique
- Marco de madera, si corresponde, sobre el perímetro del vano
- Mano de obra
- Costo de materiales, costo total y precio de la ventana

Además de la fórmula, en esa ventana se pueden agregar ítems manuales: descripción, unidad, cantidad y precio neto. Sirven para un perfil extra, un herraje que la fórmula no trae, o un ajuste. Un ítem manual de material puede opcionalmente estar vinculado a un ítem de stock; si lo está, también se descuenta al aceptar.

El cotizador puede corregir los metros o las cantidades que arrojó la fórmula en esa ventana, sin cambiar la fórmula del catálogo. La corrección queda guardada en el presupuesto y es la que se usa para precio y stock.

Si falta la fórmula de esa tipología y línea, no se inventa el consumo: la ventana no se puede guardar hasta cargar la fórmula o hasta ingresar los consumos a mano en esa ventana.

## 7. Presupuesto

### 7.1 Datos

- Número correlativo por vidriería
- Cliente: nombre, teléfono, correo y dirección, opcionales salvo el nombre
- Fecha y validez en días (por defecto 15)
- Observaciones
- Una o más ventanas
- Cero o más ítems libres: descripción, cantidad, precio neto unitario (instalación, traslado, otros)
- Descuento global: porcentaje o monto, sobre el neto
- Estado

Un presupuesto puede ser solo ítems libres, sin ventanas. No puede guardarse vacío.

### 7.2 Cálculo

Todos los precios de catálogo y los ítems libres son netos.

1. Costo de materiales de la ventana = perfiles (metros con merma * precio por metro) + recargo de color + vidrio (m2 * precio) + accesorios + marco de madera + ítems manuales vinculados a material.
2. Mano de obra de la ventana = fijo + (m2 * valor por m2), multiplicado por la cantidad.
3. Costo de la ventana = materiales + mano de obra.
4. Precio neto de la ventana = costo * (1 + margen). El margen por defecto es el de la vidriería y se puede cambiar en esa ventana o en el presupuesto.
5. Neto del presupuesto = suma de precios netos de ventanas + suma de ítems libres − descuento global.
6. IVA = 19% del neto.
7. Total = neto + IVA.

Los montos se redondean al peso. No hay decimales en el PDF ni en pantalla. El descuento no puede dejar el neto negativo.

El margen y el descuento son editables mientras el presupuesto está en borrador o enviado. Aceptado queda bloqueado (sección 7.3).

### 7.3 Estados

- Borrador: editable. No mueve stock.
- Enviado: se marcó como entregado al cliente. Sigue editable. No mueve stock. Se puede volver a borrador.
- Aceptado: deja de ser editable. Descuenta stock. Transiciones permitidas: a rechazado.
- Rechazado: terminal. No mueve stock, salvo cuando se llega desde aceptado: en ese caso se revierte el descuento.

No se puede pasar a aceptado si el descuento dejaría algún stock en negativo. La pantalla muestra qué ítem no alcanza y en cuánto.

Desde un presupuesto aceptado o rechazado se puede duplicar a un borrador nuevo, con precios recalculados al catálogo vigente. El original no cambia.

### 7.4 Cliente

Al cotizar se puede elegir un cliente ya guardado o escribir uno nuevo. Si es nuevo y tiene al menos el nombre, se guarda en la vidriería para reutilizarlo. El teléfono se usa para WhatsApp.

## 8. Stock

Ítems con stock: perfiles (metros), vidrio (m2), accesorios (unidades), marco de madera (metros).

Movimiento al aceptar, por el presupuesto completo:

- Perfiles de la fórmula (o los metros corregidos a mano), ya con merma, por la cantidad de ventanas
- Vidrio, accesorios y marco de madera en la misma lógica
- Ítems manuales solo si están vinculados a un ítem de stock

Cada movimiento guarda presupuesto, ítem, cantidad, fecha y usuario. La reversa al rechazar genera el movimiento inverso, no borra el historial.

Editar el stock a mano (entrada, ajuste, merma cargada por el usuario) también queda en el historial, con motivo. Eso cubre la carga inicial, la mercadería que llega y las correcciones. No hay módulo de compras: el listado dice qué comprar, pero no registra el pedido ni la recepción.

La pantalla de stock muestra existencia actual, y avisa si un ítem quedó bajo un mínimo opcional definido por la vidriería. El mínimo no bloquea el presupuesto.

## 9. Listado de compra

Sirve para saber qué material comprar para fabricar uno o varios trabajos. No es una orden de compra y no mueve stock.

### 9.1 Origen

Se arma eligiendo uno o varios presupuestos de la vidriería, en cualquier estado, incluidos borrador y rechazado. No hay armado automático por período.

Si no se elige ninguno, no se genera el listado.

### 9.2 Contenido

Solo entran materiales con stock: perfiles, vidrio, accesorios y marco de madera. La mano de obra, el recargo de color, los ítems libres y los ítems manuales no vinculados a stock no aparecen.

Por cada material, sumando todos los presupuestos elegidos:

- Necesario: el consumo guardado en esos presupuestos, ya con merma y con la cantidad de ventanas. Si el cotizador corrigió los metros a mano, se usa esa corrección.
- En stock: la existencia actual al momento de generar el listado.
- A comprar: necesario menos stock. Si el stock alcanza o sobra, a comprar es cero. No se muestra un número negativo.

Unidades: las mismas del stock. Perfiles y marco de madera en metros, vidrio en m2, accesorios en unidades. No se convierte a barras ni a planchas.

El mismo perfil usado en dos presupuestos sale en una sola línea, con las cantidades sumadas. El listado no se separa por proveedor ni por presupuesto. El PDF sí nombra los presupuestos de origen (número y cliente) para saber de qué trabajo sale la compra.

### 9.3 Stock compartido

El stock es una foto del momento. Si dos listados se generan el mismo día sobre presupuestos distintos, los dos ven el mismo stock y los dos pueden mostrar "a comprar" como si ese stock alcanzara para cada uno. El listado no reserva material.

Un presupuesto aceptado ya descontó su consumo del stock. Si se lo incluye en el listado, su material vuelve a aparecer en "necesario" y el stock ya está bajo, así que "a comprar" lo pide de nuevo. Para no comprarlo dos veces, no se incluyen presupuestos cuyo material ya se descontó, salvo que se quiera reponer ese stock.

### 9.4 Entrega

- Pantalla, con las tres columnas y el total de líneas.
- PDF, con logo y datos de la vidriería, fecha, presupuestos de origen y la tabla. No lleva precios: es una lista de compra, no una cotización al proveedor.

No hay Excel ni CSV en esta versión.

## 10. PDF del presupuesto y WhatsApp

El PDF se puede generar en cualquier estado. Incluye:

- Logo y datos de la vidriería
- Número, fecha, validez y estado
- Cliente
- Cada ventana: tipo, línea, tipología, medidas, cantidad, color, vidrio, marco de madera sí/no, precio neto de la línea
- Ítems libres
- Neto, descuento, IVA 19% y total
- Observaciones

El desglose interno de perfiles, merma, mano de obra y margen no sale en el PDF. Es información de costo de la vidriería. En la app sí se ve, en el detalle del presupuesto.

WhatsApp, sin API de empresa:

- En el celular, compartir el archivo PDF con la hoja de compartir del sistema, para adjuntarlo en WhatsApp.
- En el PC, abrir WhatsApp con un mensaje prellenado (número del cliente si existe, nombre de la vidriería, número de presupuesto y total) y descargar el PDF para adjuntarlo. No se promete el adjunto automático en el escritorio.

## 11. Pantallas

- Ingreso y registro de vidriería
- Inicio: presupuestos recientes y accesos a nuevo presupuesto, listado de compra, stock y catálogos
- Lista de presupuestos, filtro por estado y por cliente
- Editor de presupuesto, usable en celular: datos, ventanas, ítems libres, totales, cambio de estado
- Detalle de costo de una ventana (fórmula, merma, mano de obra, margen)
- PDF del presupuesto
- Listado de compra: selección de presupuestos, tabla y PDF
- Stock y historial de movimientos
- Catálogos: líneas, perfiles, tipologías y fórmulas, vidrios, colores, accesorios, marco de madera, mano de obra, clientes, datos de la vidriería
- Usuarios de la vidriería: invitar y desactivar

## 12. Requisitos no funcionales

- La misma aplicación en celular y PC. En el celular, el alta de una ventana y la lectura del total no deben exigir desplazamiento horizontal.
- Aislamiento de datos por vidriería en cada consulta. Un usuario no accede a otra vidriería aunque manipule la URL.
- Contraseñas las gestiona el servicio de acceso. La aplicación no las guarda.
- Precios y stock en pesos enteros y en las unidades ya dichas. Las medidas de la ventana, el espesor del marco y el descuento de vidrio se ingresan en centímetros y se convierten a metros solo para el cálculo. En pantalla y en PDF, el dinero y las medidas se muestran con separador de miles.
- El presupuesto guardado conserva los precios y consumos con los que se calculó. Un cambio posterior de catálogo no reescribe presupuestos ya guardados.

## 13. Supuestos

Quedaron así porque no se preguntaron o porque hacen falta para que el cálculo cierre. Si alguno no corresponde, se corrige este documento antes de construir.

1. El registro crea la vidriería y el primer usuario. No hay administrador de plataforma en la app.
2. El IVA es 19% y se calcula sobre el neto después del descuento. Los precios de catálogo son netos.
3. El margen es un porcentaje sobre el costo (materiales + mano de obra), no un monto fijo.
4. El vidrio descuenta centímetros al ancho y al alto según la tipología y la línea. Si esa combinación no tiene descuento cargado, el descuento es cero.
5. El marco de madera, si se incluye, reduce el ancho y el alto hacia adentro en dos veces su espesor. Los perfiles, el vidrio y la mano de obra por m2 usan esas medidas útiles. El marco se consume sobre el perímetro del vano.
6. La merma es un porcentaje configurable (vidriería o perfil) aplicado a los metros de la fórmula. No hay inventario de retazos.
7. El stock de perfiles se lleva en metros.
8. El PDF no muestra el desglose de costo ni el margen.
9. WhatsApp es compartir archivo o mensaje prellenado, no envío automático.
10. La validez por defecto del presupuesto es 15 días.
11. Un presupuesto aceptado no se edita. Para corregirlo se rechaza (vuelve el stock) o se duplica.
12. El listado de compra no reserva stock ni evita que dos listados cuenten el mismo stock disponible.
13. Incluir un presupuesto ya aceptado en el listado vuelve a pedir su material, porque ese consumo ya salió del stock.

## 14. Criterios de aceptación

1. Dos vidrierías pueden tener líneas, precios y stock distintos, y ninguna ve los datos de la otra.
2. Un usuario de una vidriería arma una ventana de PVC y una de aluminio, con línea, medidas, color, vidrio, marco de madera y cantidad, y el sistema calcula metros de perfil desde la fórmula de esa tipología y línea.
3. En una ventana con marco de madera, el ancho y el alto útiles son los del vano menos dos veces el espesor, y el vidrio aplica además el descuento de esa tipología y línea. Sin marco y sin descuento cargado, el vidrio es ancho por alto.
4. Puede sumar un ítem manual a la ventana y un ítem libre al presupuesto (por ejemplo instalación).
5. El total muestra neto, descuento, IVA 19% y total en pesos, sin decimales.
6. El PDF se descarga con logo, ítems, neto, IVA y total, y no incluye el costo interno.
7. Desde el celular se puede compartir ese PDF hacia WhatsApp.
8. Al marcar aceptado, el stock de perfiles, vidrio y accesorios baja según el consumo guardado. Si no alcanza, no deja aceptar.
9. Si ese presupuesto pasa a rechazado, el stock vuelve a la cifra anterior y el historial conserva ambos movimientos.
10. Cambiar un precio del catálogo no altera un presupuesto ya guardado.
11. Al elegir dos presupuestos, el listado suma el mismo perfil en una sola línea y muestra necesario, stock y a comprar. Si el stock cubre el necesario, a comprar es cero.
12. El PDF del listado trae los presupuestos de origen y las cantidades, y no trae precios.
13. Un ítem libre de instalación no aparece en el listado de compra.
