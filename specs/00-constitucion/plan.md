# 00 — Plan

Estado: para revisar. No hay código todavía. Al aceptarse, se ejecutan las tareas de `tasks.md`.

Spec: `specs/00-constitucion/spec.md`.

## 1. Versiones

Se instalan con pnpm, en el rango de la última estable. El número exacto queda en `pnpm-lock.yaml`, no se copia a mano a esta spec. El gestor es pnpm; no se usa npm ni yarn.

- Nuxt 4, última 4.x. Hoy la línea estable publicada es 4.5.x. Node 22 en CI, que cubre el mínimo de Nuxt 4.
- `@nuxtjs/supabase` 2, compatible con Nuxt 3 y 4. Hoy 2.0.x.
- Pinia 4, con `@pinia/nuxt`. Nuxt ya trae Vue 3.5: no se fija Vue por separado.
- Vitest, el que el módulo de pruebas de Nuxt instale.
- Supabase CLI para las migraciones. No se crea el proyecto de Supabase desde esta etapa: hace falta la cuenta, y eso es de la etapa 01.

## 2. Cómo se crea

Un solo proyecto Nuxt en la raíz del repositorio, al lado de `specs/` y `Especificaciones.md`. No se anida en otra carpeta.

El esqueleto es el de `pnpm dlx nuxi@latest init`, con TypeScript. Después se agregan los módulos con pnpm. No se escribe una página de negocio. `package.json` declara `packageManager` con la versión de pnpm que se use.

`nuxt.config.ts` deja:

- `ssr: false`. La aplicación no pre-renderiza datos: al generar, no hay sesión ni filas que hornear en el HTML. Todo se lee en el navegador, con la sesión de Supabase.
- La base de rutas igual a `NUXT_APP_BASE_URL`, con default `/`. En GitHub Pages de un repositorio de proyecto esa variable es `/<repo>/`.
- `@nuxtjs/supabase` con la URL y la clave pública leídas de variables `NUXT_PUBLIC_`. `redirect: false`: esta etapa no tiene pantallas de acceso, y el módulo no debe redirigir a un login que todavía no existe. La etapa 01 lo enciende.

`.gitignore` ignora `.nuxt`, `.output`, `node_modules` y `.env`.

## 3. Carpetas

Se crean ahora solo las que esta etapa posee:

```
app/                   páginas de Nuxt; queda la de inicio del esqueleto
shared/
  dinero/              formato y redondeo, vacío salvo un índice que exporte nada
supabase/
  migrations/          vacío, con un .gitkeep
  config.toml          no se commitea con secretos; el plan de la etapa 01 lo completa
.github/
  workflows/
    pages.yml
```

No se crean `vidrierias`, `catalogos`, `calculo`, `presupuestos`, `stock` ni `documentos`. Esas aparecen cuando su spec se acepte.

## 4. Publicación

GitHub Actions, en cada push a `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm generate`, que es `nuxt generate`
3. Subir `.output/public` como artefacto de Pages
4. Desplegar con la acción oficial de Pages

El sitio se sirve desde la rama que Pages construye, no desde `main` a mano. En el repositorio, Pages queda en source "GitHub Actions".

Recarga de una ruta interna: con `ssr: false`, Nuxt emite `200.html`. GitHub Pages no reescribe rutas a ese archivo. Por eso el router usa hash (`app.router.options.hashMode`). Una ruta queda como `/#/presupuestos/1`, se recarga sin 404 y no depende de un truco de servidor. Cuando el sitio tenga dominio propio se puede volver a history, cambiando este plan primero.

La clave pública y la URL de Supabase entran al workflow como variables de repositorio, no como secretos: son públicas en el sitio igual. La clave de servicio no se declara en el workflow ni en ningún archivo del repositorio. Si aparece en un `.env` local, `.gitignore` ya lo cubre.

El workflow de esta etapa no ejecuta migraciones ni escribe en la base. Genera el sitio.

## 5. Qué no hace este plan

- No crea tablas, políticas de fila ni el proyecto de Supabase.
- No agrega login, registro ni una vidriería de prueba.
- No elige librería de PDF.
- No escribe la lógica de `shared/dinero`. La regla está en la spec; el código entra en la primera etapa que muestre un monto, salvo que la etapa 01 lo necesite antes.

## 6. Cómo se verifica

Sin cuenta de Supabase y sin datos:

1. `pnpm dev` abre la página de inicio del esqueleto.
2. `pnpm generate` termina y deja `.output/public/index.html` y `200.html`.
3. Servir `.output/public` y abrir una ruta con hash no devuelve 404.
4. Buscar en `.output/public` no encuentra una clave de servicio ni un secreto. La clave pública, si se inyectó, sí puede aparecer: es el comportamiento esperado.
5. El repositorio no contiene las carpetas de las etapas 01 a 07.
