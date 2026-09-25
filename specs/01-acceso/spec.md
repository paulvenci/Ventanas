# 01 — Acceso y vidriería

Estado: spec para revisar. No hay plan ni tareas. No hay código.

Origen: `Especificaciones.md`, secciones 4 y 12. Esta etapa no agrega catálogos, cálculo ni presupuestos.

## 1. Qué decide

- Cómo se registra una vidriería y su primer usuario.
- Cómo inicia y cierra sesión un usuario.
- Cómo se guardan y editan los datos de la vidriería.
- Cómo se invita a un segundo usuario y cómo se desactiva.
- Cómo se aíslan los datos de una vidriería de otra en la base.
- Qué rutas requieren sesión y cómo se redirige al login.

## 2. Registro

El registro crea, en una sola operación atómica:

1. Un usuario en Supabase Auth (correo y contraseña).
2. Una fila en la tabla `vidrierias` con los datos mínimos.
3. Una fila en la tabla `usuarios` que relaciona el `auth.uid()` con esa vidriería.

Si cualquier paso falla, no queda ninguno. No existe una vidriería sin usuario ni un usuario sin vidriería.

Antes de crear cualquier cuenta, el formulario valida un **código de activación** contra la base. Si el código no coincide, el registro se rechaza sin crear nada. El código lo establece el operador de la plataforma directamente en la tabla `configuracion_plataforma`. No se expone en el bundle del sitio.

Datos mínimos obligatorios al registrarse:

- Código de activación (validado antes de proceder, no se guarda)
- Nombre (razón social o fantasía)
- Nombre del usuario
- Correo (es el del usuario, ya lo trae el formulario de auth)
- Contraseña

Datos opcionales en el registro, editables después:

- RUT
- Dirección, teléfono, correo de la vidriería (distinto al del usuario)
- Logo
- Margen comercial por defecto (porcentaje)
- Porcentaje de merma por defecto
- Monto fijo de mano de obra por defecto (neto, por ventana)
- Valor de mano de obra por m2 por defecto (neto)

El registro no crea catálogos, tipologías ni fórmulas. Eso es la etapa 02.

## 3. Sesión

Supabase Auth maneja correo y contraseña. La aplicación no guarda contraseñas.

- La sesión vive en el navegador (localStorage, que maneja el SDK de Supabase).
- Al recargar, el SDK restaura la sesión si el token no expiró.
- Al cerrar sesión, el SDK borra el token. La app redirige al login.
- El módulo `@nuxtjs/supabase` se configura con `redirect: true` en esta etapa. El login es `/#/login` (hash mode).

No hay recuperación de contraseña en esta etapa. Se agrega si la spec lo incorpora más adelante.

## 4. Datos de la vidriería

Una pantalla de configuración, accesible solo con sesión, permite editar los campos de la sección 2. El logo se sube a Supabase Storage, en una ruta propia de esa vidriería. No se guarda como base64 en la tabla.

La URL del logo se guarda en la tabla `vidrierias`. Si no hay logo, ese campo es nulo y el PDF lo omite.

Los valores por defecto de margen, merma y mano de obra se usan en las etapas 03 y 04. Esta etapa los guarda pero no los aplica todavía.

## 5. Usuarios de la vidriería

Un usuario pertenece a una sola vidriería. No hay roles dentro de la vidriería: todos pueden hacer todo.

- **Invitar**: el administrador actual escribe un correo. Supabase envía el correo de invitación. Al aceptar, el nuevo usuario queda vinculado a la misma vidriería.
- **Desactivar**: el campo `activo` en `usuarios` pasa a `false`. El usuario no puede iniciar sesión en la aplicación (la política de fila lo excluye), aunque la cuenta de Supabase Auth siga existiendo.
- No se puede desactivar al único usuario activo de la vidriería.

## 6. Aislamiento de datos (RLS)

Toda tabla de negocio tiene una columna `vidrieria_id`. Las políticas de fila garantizan:

- `SELECT`, `INSERT`, `UPDATE`, `DELETE` solo operan sobre filas donde `vidrieria_id` coincide con la vidriería del usuario autenticado.
- La vidriería del usuario se resuelve leyendo `usuarios.vidrieria_id` donde `usuarios.auth_uid = auth.uid()`.
- Un pedido armado a mano contra la API pública tampoco devuelve filas ajenas.

Esta etapa escribe las políticas para `vidrierias` y `usuarios`. Las etapas siguientes agregan las políticas de sus propias tablas.

## 7. Migraciones

La etapa 01 agrega las primeras migraciones en `supabase/migrations/`:

```
0001_vidrierias.sql             tabla vidrierias
0002_usuarios.sql               tabla usuarios + políticas de fila
0003_storage.sql                bucket logos, políticas de acceso
0004_configuracion_plataforma.sql   tabla de configuración del operador
0005_rpc_registro.sql           funciones de validación y creación atómica
```

La tabla `configuracion_plataforma` tiene una sola fila y no tiene RLS de lectura para ningún usuario (ni anónimo ni autenticado). Solo se puede leer desde funciones `security definer`. El operador la gestiona desde el panel de Supabase.

| Columna | Tipo | Notas |
|---|---|---|
| id | integer, PK | siempre 1 (fila única) |
| codigo_registro | text, NOT NULL | hash bcrypt del código real |

El código se guarda como hash, no en texto plano. Para cambiarlo, el operador genera un nuevo hash y actualiza la fila.

El esquema de `vidrierias`:

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid, PK | gen_random_uuid() |
| nombre | text, NOT NULL | |
| rut | text | |
| direccion | text | |
| telefono | text | |
| correo | text | |
| logo_url | text | URL en Storage |
| margen_defecto | integer | porcentaje, puede ser nulo |
| merma_defecto | integer | porcentaje, puede ser nulo |
| mano_obra_fijo_defecto | integer | pesos netos, puede ser nulo |
| mano_obra_m2_defecto | integer | pesos netos por m2, puede ser nulo |
| created_at | timestamptz | now() |

El esquema de `usuarios`:

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid, PK | gen_random_uuid() |
| auth_uid | uuid, NOT NULL, UNIQUE | auth.uid() del usuario |
| vidrieria_id | uuid, NOT NULL, FK → vidrierias.id | |
| nombre | text | nombre visible del usuario |
| activo | boolean, NOT NULL | default true |
| created_at | timestamptz | now() |

## 8. Pantallas

- `/login`: correo y contraseña. Enlace a `/registro`.
- `/registro`: nombre de la vidriería, correo, contraseña. Al registrar, redirige al inicio.
- `/configuracion`: datos de la vidriería, logo, valores por defecto. Solo con sesión.
- `/usuarios`: lista de usuarios de la vidriería, botón invitar, botón desactivar. Solo con sesión.
- `/` (inicio): pantalla de bienvenida mínima, con enlace a las secciones. Solo con sesión. El contenido real lo construye la etapa 04.

## 9. Qué no hace este plan

- No crea catálogos, líneas, perfiles, tipologías ni fórmulas.
- No implementa recuperación de contraseña.
- No agrega roles ni restricciones por función dentro de la vidriería.
- No crea el proyecto de Supabase en la nube: el plan indica cómo hacerlo manualmente una sola vez.
- No diseña el PDF ni el listado de compra.

## 10. Criterios de aceptación

1. Registrar una vidriería crea la fila en `vidrierias` y la fila en `usuarios` en la misma operación. Si falla una, no queda ninguna.
2. Un usuario registrado puede iniciar sesión, navegar al inicio y cerrar sesión.
3. Al cerrar sesión, intentar abrir `/#/configuracion` redirige a `/#/login`.
4. Desde una cuenta de otra vidriería, una consulta a `vidrierias` no devuelve la fila de la primera. Aplica también a `usuarios`.
5. El logo se sube a Storage y la URL queda guardada en `vidrierias.logo_url`. Eliminar el logo borra el archivo de Storage y pone el campo en nulo.
6. Invitar un correo nuevo envía el correo de invitación de Supabase y, al aceptar, la fila en `usuarios` queda con `vidrieria_id` correcto.
7. Desactivar un usuario deja `activo = false`. Ese usuario no puede iniciar sesión en la aplicación.
8. No se puede desactivar al único usuario activo.
9. El margen, la merma y los valores de mano de obra por defecto se guardan en `vidrierias` y se leen en la pantalla de configuración.

## 11. Decisiones tomadas

Las siguientes preguntas quedaron abiertas en el borrador y se resuelven aquí antes de pasar al plan:

1. **Confirmación de correo**: acceso inmediato. No se exige verificar el correo al registrarse. Supabase se configura con `email confirmations` desactivadas. Se puede activar más adelante cambiando esta spec primero.
2. **Nombre del usuario**: se pide en el formulario de registro (campo obligatorio). Queda guardado en `usuarios.nombre`.
3. **URL del sitio**: el repositorio es público en GitHub. La URL de Pages es `https://paulvenci.github.io/Ventanas/`. El `redirectTo` para el correo de invitación de Supabase es `https://paulvenci.github.io/Ventanas/#/`. En desarrollo local se usa `http://localhost:3000/#/`.
