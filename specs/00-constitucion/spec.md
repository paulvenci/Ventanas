# 00 — Constitución técnica

Estado: spec para revisar. No hay plan ni tareas. No hay código.

Origen: `Especificaciones.md`, secciones 2, 3, 4 y 12. Esta etapa no agrega funciones. Fija las decisiones que las etapas 01 a 07 no pueden volver a discutir.

## 1. Qué decide

- El tipo de aplicación y el stack.
- Dónde viven los datos y quién autoriza el acceso.
- Cómo se publica en GitHub Pages.
- Cómo se separa el código.
- Cómo se aísla una vidriería de otra.
- Cómo se ingresan, guardan y muestran dinero, medidas y cantidades.
- Cómo se prueba.

## 2. Aplicación

Una aplicación web usable en celular y en PC. Se genera como sitio estático y se publica en GitHub Pages.

GitHub Pages solo entrega archivos. No ejecuta el cálculo ni guarda datos. Esas dos cosas van a otro lado:

- El cálculo de una ventana, el total del presupuesto y el armado del listado de compra se hacen en el navegador, con funciones puras, a partir de datos ya leídos. No hay servidor propio de la aplicación.
- Los datos y el acceso viven en Supabase: autenticación, base de datos y archivos (el logo). El navegador no es la fuente de esos datos.

El correo y la contraseña de `Especificaciones.md` sección 4 se resuelven con la autenticación de Supabase. La etapa 01 especifica el alta de la vidriería y la sesión. Esta constitución no diseña esas pantallas.

## 3. Stack

Última versión estable al momento de crear el proyecto. El plan fija el número exacto que se instale; esta spec no escribe un número que vaya a quedar viejo.

- Nuxt, en modo `nuxt generate`. No hay servidor Nuxt en producción.
- Vue 3, el que trae esa versión de Nuxt. No se elige aparte.
- TypeScript.
- Pinia para el estado de pantalla y para los datos ya cargados. No es la fuente de verdad: al recargar, los datos se vuelven a leer de Supabase.
- Supabase: autenticación, Postgres y Storage.
- El cliente de Supabase se usa desde el navegador. No hay capa propia de API.
- Vitest para la lógica de cálculo, stock y presupuestos.

Sin librería de componentes obligatoria. Si una etapa la necesita, se agrega en su spec.

## 4. Publicación

`nuxt generate` produce la carpeta estática. GitHub Pages sirve esa carpeta.

La dirección del sitio incluye el nombre del repositorio, así que las rutas y los assets se construyen con esa base. Recargar una ruta interna no puede caer en 404: o el router usa hash, o Pages se configura para devolver el índice. El plan elige una y la deja escrita.

En el build solo entra la clave pública de Supabase y la URL del proyecto. Esa clave es pública por diseño. No se incluye la clave de servicio ni ninguna otra credencial. El build no escribe en la base: la genera el sitio, no los datos.

## 5. Datos y acceso

Cada usuario entra con correo y contraseña contra Supabase. La sesión vive en el navegador y se cierra al salir.

Toda tabla de negocio tiene la vidriería dueña. Un usuario pertenece a una sola vidriería. Esa relación se guarda en la base, no solo en el estado de Pinia.

La base rechaza por sí misma leer o escribir filas de otra vidriería, con políticas de fila. No alcanza con filtrar en la pantalla: un pedido armado a mano contra la API pública tampoco debe devolverlas. Pedir una fila ajena se trata como si no existiera.

El logo va a Storage, en una ruta de la vidriería, con la misma regla de acceso. No se guarda como base64 dentro de una tabla.

## 6. Forma del repositorio

Todavía no se crea el proyecto. Cuando el plan de esta etapa se acepte, el código queda así:

```
app/                   páginas de Nuxt, una carpeta por etapa
components/
composables/
server/                no se usa en esta versión
supabase/
  migrations/          tablas y políticas de fila, versionadas
src/
  calculo/             etapa 03, funciones puras, sin pantallas
  dinero/              formato y redondeo, lo usan todas las etapas
specs/
Especificaciones.md
```

No se crea la carpeta de una etapa antes de que su spec esté aceptada. `calculo` no lee Supabase ni Pinia: recibe datos y devuelve datos. Quien llama decide qué se guarda.

Las migraciones son parte del producto. Un cambio de tablas se escribe ahí, no se hace a mano en el panel y se olvida.

## 7. Números

- El dinero se guarda en pesos enteros. No hay decimales ni coma flotante para precios, neto, IVA, descuento ni total. En Postgres el tipo es entero.
- El IVA es 19. Se calcula sobre el neto ya descontado y el resultado se redondea al peso.
- Las medidas de la ventana, el espesor del marco y el descuento de vidrio se ingresan y se guardan en centímetros. Para el vidrio, 1 m2 = 10.000 cm2. Para perfiles y marco de madera, 1 m = 100 cm. La conversión se hace solo al calcular.
- Metros de perfil, m2 de vidrio y cantidades de fórmula se calculan en decimal exacto, no en float. Al mostrar y al guardar el consumo que mueve stock, se redondea a 3 decimales. En Postgres se usa un decimal de escala fija, no un float.
- Un presupuesto guarda los precios, descuentos, medidas útiles y consumos con los que se calculó. Un cambio de catálogo no lo reescribe.
- En pantalla y en PDF, el dinero y las medidas se muestran con separador de miles, al estilo `1.250.000` y `1.250,5` cuando hay parte decimal. La unidad (cm, m, m2, $) se indica junto al número. El valor guardado no lleva separadores: el formato es solo de presentación.

## 8. Fuera de esta etapa

- Pantallas, tablas de negocio, registro, login y catálogos.
- Elegir la librería de PDF. Entra en la etapa 06.
- Datos de demostración y fórmulas reales de una línea de aluminio o PVC.
- Un servidor Nuxt desplegado. Si más adelante hace falta, se cambia esta spec primero.

## 9. Criterios de aceptación

1. El stack de la sección 3 queda escrito en esta spec y el plan no lo cambia sin actualizar este archivo primero.
2. El plan deja escrito cómo se publica en GitHub Pages el resultado de `nuxt generate`, y cómo se resuelve la ruta al recargar.
3. El plan deja escrito que la clave de servicio de Supabase no entra al build, y cómo se versionan las migraciones.
4. El plan nombra las carpetas de la sección 6 y no crea la de una etapa cuya spec no esté aceptada.
5. La regla de aislamiento, la de números y la de formato quedan referenciadas por las specs de las etapas 01 a 07, no recopiladas en cada una.
6. `Especificaciones.md` y esta spec coinciden en tres puntos: los datos viven en Supabase, las medidas se ingresan en centímetros, y el dinero y las medidas se muestran con separador de miles.

## 10. Preguntas abiertas

Ninguna que bloquee el plan. El alta de la vidriería junto con el primer usuario se resuelve en la spec de la etapa 01.
