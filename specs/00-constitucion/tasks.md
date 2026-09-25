# 00 — Tareas

Estado: en curso. El plan fue aceptado con pnpm como gestor.

Plan: `specs/00-constitucion/plan.md`.

## 1. Crear el proyecto

- [x] `pnpm dlx nuxi@latest init` en la raíz, TypeScript, sin sobrescribir `specs/` ni `Especificaciones.md`.
- [x] Instalar con pnpm `@nuxtjs/supabase`, `@pinia/nuxt` y el módulo de pruebas.
- [x] Versiones en `pnpm-lock.yaml`: nuxt 4.5.2, @nuxtjs/supabase 2.0.10, @pinia/nuxt 1.0.2, vue 3.5.43, vue-router 5.3.1, @nuxt/test-utils 4.3.2, vitest 5.0.1, pnpm 12.6.0.

Verificación: `pnpm dev` responde 200 en `http://localhost:3000/`. El HTML no redirige a `/login` y `redirect` queda en false. Hecho el 2026-09-23.

## 2. Configurar

- [x] `ssr: false`.
- [x] Base de rutas desde `NUXT_APP_BASE_URL`, default `/`.
- [x] Router en hash.
- [x] Módulo de Supabase con `redirect: false` y variables `NUXT_PUBLIC_`.
- [x] `.env.example` con las dos variables públicas, vacías, y un comentario de que la clave de servicio no va ahí.
- [x] `.gitignore` con `.nuxt`, `.output`, `node_modules`, `.env`. Lo trajo el esqueleto; no hubo que agregarlo.

Verificación: el dev server abre, sin pedir login. Hecho el 2026-09-23.

## 3. Carpetas de esta etapa

- [x] `shared/dinero/` con un índice vacío de lógica.
- [x] `supabase/migrations/` con `.gitkeep`.
- [x] Ninguna carpeta de las etapas 01 a 07.

Verificación: el árbol coincide con la sección 3 del plan. Hecho el 2026-09-23.

## 4. Publicación

- [x] `.github/workflows/pages.yml` según la sección 4 del plan.
- [x] Permisos de Pages en el workflow, no en secreto.
- [x] Documentado en `specs/README.md` el paso manual: Settings, Pages, source "GitHub Actions".

Verificación: `pnpm generate` produjo `.output/public/index.html`, `200.html` y `404.html`. Hecho el 2026-09-23.

## 5. Cerrar la etapa

- [x] Verificación 1: `pnpm dev` responde 200 y no pide login.
- [x] Verificación 2: `pnpm generate` dejó `index.html`, `200.html` y `404.html`.
- [x] Verificación 3: servir `.output/public` y abrir una ruta con hash. Verificado el 2026-09-23 con `npx serve`. El servidor respondió 200 al pedir `/` (el hash `#/presupuestos/1` nunca llega al servidor). El error 500 en pantalla es por falta de variables de Supabase, esperado en esta etapa sin proyecto de Supabase todavía. Ningún 404 del servidor.
- [x] Verificación 4: en `.output/public` no hay clave de servicio.
- [x] Verificación 5: no existen las carpetas de las etapas 01 a 07.
- [x] Cambiar el estado de la etapa 00 en `specs/README.md` a aceptada. Hecho el 2026-09-23.
- [x] No se abrió la etapa 01.
