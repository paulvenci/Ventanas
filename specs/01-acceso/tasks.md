# 01 — Tareas

Estado: Aceptada el 2026-09-23.

Plan: `specs/01-acceso/plan.md`.

## 1. Proyecto de Supabase (manual, una sola vez)

- [x] Crear el proyecto en supabase.com. Región: São Paulo.
- [x] En Authentication → Settings: desactivar "Enable email confirmations".
- [x] En Authentication → Settings → Site URL: `https://paulvenci.github.io/Ventanas/`.
- [x] En Authentication → Settings → Redirect URLs: agregar `http://localhost:3000/`.
- [x] En GitHub → Settings → Variables: cargar `NUXT_PUBLIC_SUPABASE_URL`.
- [x] En GitHub → Settings → Variables: cargar `NUXT_PUBLIC_SUPABASE_KEY`.
- [x] Crear `.env` local con las mismas dos variables.

Verificación: `pnpm dev` arranca sin error de Supabase (el 500 que salía en la etapa 00 desaparece). Hecho el 2026-09-23.

## 2. Migraciones

- [x] Crear `supabase/migrations/0001_vidrierias.sql` con la tabla y la política RLS.
- [x] Crear `supabase/migrations/0002_usuarios.sql` con la tabla y las políticas RLS.
- [x] Crear `supabase/migrations/0003_storage.sql` con el bucket `logos` (público) y sus políticas de escritura/borrado.
- [x] Crear `supabase/migrations/0004_configuracion_plataforma.sql` con la tabla sin RLS de lectura.
- [x] Crear `supabase/migrations/0005_rpc_registro.sql` con las funciones `verificar_codigo_registro`, `crear_vidrieria` y `vincular_usuario_invitado`.
- [x] Aplicar las migraciones en el proyecto de Supabase (SQL Editor o `supabase db push`).
- [x] Desde el SQL Editor, insertar la fila inicial en `configuracion_plataforma` con el código hasheado.

Verificación: en el panel de Supabase, las cinco tablas/funciones existen. Una consulta directa a `configuracion_plataforma` devuelve "0 rows" (RLS bloquea).

## 3. Configuración de Nuxt

- [x] En `nuxt.config.ts`, cambiar `redirect: false` a `redirect: true`.
- [x] Agregar `redirectOptions` con `login: '/login'`, `callback: '/confirm'`, `exclude: ['/login', '/registro']`.

Verificación: `pnpm dev` y abrir `/#/` sin sesión redirige a `/#/login`.

## 4. Tipos compartidos

- [x] Crear `shared/tipos/vidrieria.ts` con la interfaz `Vidrieria` (todas las columnas de la tabla).
- [x] Crear `shared/tipos/usuario.ts` con la interfaz `Usuario`.
- [x] Crear `shared/tipos/index.ts` que re-exporte ambas.

## 5. Composable de vidriería

- [x] Crear `composables/useVidrieria.ts` con la función `cargar()` y el estado `vidrieria`.

## 6. Páginas

- [x] Crear `app/pages/login.vue`: formulario correo + contraseña, enlace a `/registro`, llamada a `supabase.auth.signInWithPassword`.
- [x] Crear `app/pages/registro.vue`: formulario código de activación + nombre vidriería + nombre usuario + correo + contraseña. Flujo: verificar código → signUp → crear_vidrieria → redirigir a `/`.
- [x] Crear `app/pages/index.vue`: pantalla de bienvenida mínima con saludo y enlace a `/configuracion` y `/usuarios`. Solo con sesión.
- [x] Crear `app/pages/configuracion.vue`: formulario con todos los campos de `vidrierias`, upload de logo, botón guardar. Solo con sesión.
- [x] Crear `app/pages/usuarios.vue`: lista de usuarios de la vidriería, botón invitar, botón desactivar. Solo con sesión.
- [x] Crear `app/pages/confirm.vue`: callback de Supabase para invitaciones; detecta el token y llama a `vincular_usuario_invitado`.

## 7. Edge Function para invitaciones

- [x] Crear `supabase/functions/invitar-usuario/index.ts`.
- [x] La función valida que el llamador sea un usuario activo de la vidriería.
- [x] Llama a `auth.admin.inviteUserByEmail` con `redirectTo: https://paulvenci.github.io/Ventanas/#/confirm?vidrieria_id=...`.

## 8. Desactivar usuario

- [x] En `usuarios.vue`, el botón "Desactivar" llama a un UPDATE que pone `activo = false`.
- [x] Antes de ejecutar, verificar que quede al menos un usuario activo. Si no, mostrar error y no proceder.
- [x] La política RLS de `usuarios` valida que el usuario llamador esté activo para acceder o modificar los registros del tenant.

## 9. Verificaciones finales

- [x] Ver. 1: registrar una vidriería nueva con código correcto → filas en `vidrierias` y `usuarios` creadas.
- [x] Ver. 2: intentar registrar con código incorrecto → error, sin filas creadas.
- [x] Ver. 3: iniciar sesión → llega a `/#/`, cierre de sesión → vuelve a `/#/login`.
- [x] Ver. 4: abrir `/#/configuracion` sin sesión → redirige a `/#/login`.
- [x] Ver. 5: desde otra cuenta (otra vidriería), `SELECT * FROM vidrierias` no devuelve la primera.
- [x] Ver. 6: subir logo → URL guardada en `vidrierias.logo_url`, imagen visible en configuración.
- [x] Ver. 7: invitar correo nuevo → llega el correo, al aceptar aparece en la lista de usuarios.
- [x] Ver. 8: desactivar usuario → no puede iniciar sesión.
- [x] Ver. 9: intentar desactivar al único usuario activo → error, no se desactiva.
- [x] Ver. 10: `pnpm generate` y revisar `.output/public` — sin claves de servicio.

## 10. Cerrar la etapa

- [x] Todas las verificaciones pasadas.
- [x] Cambiar el estado de la etapa 01 en `specs/README.md` a "Aceptada".
- [x] Etapa 01 completada exitosamente. Listo para abrir la etapa 02.
