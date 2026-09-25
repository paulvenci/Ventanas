# 01 — Plan

Estado: para revisar. No hay código todavía. Al aceptarse, se ejecutan las tareas de `tasks.md`.

Spec: `specs/01-acceso/spec.md`.

## 1. Proyecto de Supabase

Una sola vez, en forma manual, antes de ejecutar las tareas:

1. Crear el proyecto en [supabase.com](https://supabase.com). Elegir región más cercana (ejemplo: São Paulo).
2. En **Authentication → Settings**:
   - Desactivar "Enable email confirmations" (acceso inmediato, spec sección 11).
   - En "Site URL": `https://paulvenci.github.io/Ventanas/`.
   - En "Redirect URLs" agregar también `http://localhost:3000/` para desarrollo.
3. En el repositorio de GitHub, ir a **Settings → Variables** y cargar:
   - `NUXT_PUBLIC_SUPABASE_URL` con la URL del proyecto.
   - `NUXT_PUBLIC_SUPABASE_KEY` con la clave anon/pública.
4. Crear `.env` local con esas dos variables (ya está en `.gitignore`).

La clave de servicio no entra al repositorio ni al workflow.

## 2. Migraciones

Se escriben cinco archivos SQL en `supabase/migrations/`, en el orden de dependencia. Se aplican con `supabase db push` o desde el panel, una vez que el proyecto existe.

### 0001_vidrierias.sql

```sql
create table vidrierias (
  id                      uuid primary key default gen_random_uuid(),
  nombre                  text not null,
  rut                     text,
  direccion               text,
  telefono                text,
  correo                  text,
  logo_url                text,
  margen_defecto          integer,
  merma_defecto           integer,
  mano_obra_fijo_defecto  integer,
  mano_obra_m2_defecto    integer,
  created_at              timestamptz not null default now()
);

alter table vidrierias enable row level security;

-- Un usuario autenticado solo ve su propia vidriería.
-- La join con usuarios se evalúa en cada consulta.
create policy "vidrierias: solo la propia"
  on vidrierias
  for all
  using (
    id = (
      select vidrieria_id from usuarios
      where auth_uid = auth.uid()
      limit 1
    )
  );
```

### 0002_usuarios.sql

```sql
create table usuarios (
  id            uuid primary key default gen_random_uuid(),
  auth_uid      uuid not null unique,
  vidrieria_id  uuid not null references vidrierias(id),
  nombre        text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table usuarios enable row level security;

-- Solo ve los usuarios de su propia vidriería.
create policy "usuarios: solo la propia vidriería"
  on usuarios
  for all
  using (
    vidrieria_id = (
      select vidrieria_id from usuarios u2
      where u2.auth_uid = auth.uid()
      limit 1
    )
  );
```

> **Nota**: la política de `vidrierias` hace una subselect a `usuarios`, y la de `usuarios` hace una subselect a sí misma. Postgres evalúa cada política de forma independiente; no hay recursión en tiempo de ejecución.

### 0003_storage.sql

```sql
insert into storage.buckets (id, name, public)
values ('logos', 'logos', false);

-- Solo el usuario autenticado de esa vidriería puede leer y escribir
-- dentro de la ruta logos/{vidrieria_id}/
create policy "logos: leer la propia"
  on storage.objects for select
  using (
    bucket_id = 'logos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = (
      select vidrieria_id::text from usuarios
      where auth_uid = auth.uid()
      limit 1
    )
  );

create policy "logos: escribir la propia"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = (
      select vidrieria_id::text from usuarios
      where auth_uid = auth.uid()
      limit 1
    )
  );

create policy "logos: eliminar la propia"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = (
      select vidrieria_id::text from usuarios
      where auth_uid = auth.uid()
      limit 1
    )
  );
```

## 3. Módulo de Supabase

En `nuxt.config.ts`, cambiar `redirect: false` a `redirect: true` y declarar las rutas que no exigen sesión:

```ts
supabase: {
  redirect: true,
  redirectOptions: {
    login: '/login',
    callback: '/confirm',
    exclude: ['/login', '/registro'],
  },
},
```

Con hash mode, Nuxt traduce `/login` a `/#/login` internamente.

### 0004_configuracion_plataforma.sql

```sql
create table configuracion_plataforma (
  id               integer primary key default 1,
  codigo_registro  text not null,
  constraint solo_una_fila check (id = 1)
);

-- Sin RLS de lectura: ningún usuario (anónimo ni autenticado) puede leer.
alter table configuracion_plataforma enable row level security;
-- No se crean policies: por defecto todo queda denegado.
```

Para cargar el código inicial, el operador ejecuta en el panel de Supabase (SQL Editor):

```sql
-- Generar el hash del código elegido (reemplazar 'mi-codigo-secreto'):
insert into configuracion_plataforma (id, codigo_registro)
values (1, crypt('mi-codigo-secreto', gen_salt('bf')));
```

Para cambiarlo:

```sql
update configuracion_plataforma
set codigo_registro = crypt('nuevo-codigo', gen_salt('bf'))
where id = 1;
```

### 0005_rpc_registro.sql

```sql
-- Verifica el código de activación. Accesible desde el cliente anónimo.
create or replace function verificar_codigo_registro(codigo text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from configuracion_plataforma
    where id = 1
      and codigo_registro = crypt(codigo, codigo_registro)
  );
$$;

-- Crea la vidriería y el usuario en una sola transacción.
-- Solo ejecutable con sesión activa (auth.uid() no nulo).
create or replace function crear_vidrieria(
  p_nombre          text,
  p_nombre_usuario  text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_vidrieria_id uuid;
begin
  insert into vidrierias (nombre)
  values (p_nombre)
  returning id into v_vidrieria_id;

  insert into usuarios (auth_uid, vidrieria_id, nombre)
  values (auth.uid(), v_vidrieria_id, p_nombre_usuario);

  return v_vidrieria_id;
end;
$$;
```

## 4. Registro

Flujo desde el navegador:

1. El usuario completa el formulario: código de activación, nombre de la vidriería, nombre del usuario, correo, contraseña.
2. Antes de crear nada, el cliente llama a la RPC anónima `verificar_codigo_registro(codigo)`.
   - Si devuelve `false`: mostrar error "Código de activación incorrecto". No se crea ningún usuario.
   - Si devuelve `true`: continuar.
3. `supabase.auth.signUp({ email, password })` → devuelve sesión (acceso inmediato).
4. Con la sesión activa, llamar a `crear_vidrieria(nombre, nombre_usuario)`:
   - Inserta en `vidrierias`.
   - Inserta en `usuarios` con el `auth.uid()` de la sesión.
   - Si falla, hace `rollback` automático (es una sola transacción SQL).
5. Al terminar, redirigir a `/`.

Si el `signUp` devuelve sesión pero `crear_vidrieria` falla, se llama a `supabase.auth.signOut()` y se muestra el error. El usuario de Auth queda huérfano sin vidriería; las políticas RLS impiden que haga nada con sesión.

## 5. Páginas

Se crean en `app/pages/`. Con hash mode, Nuxt usa `pages/login.vue` → ruta `/#/login`.

- `pages/login.vue`
- `pages/registro.vue`
- `pages/index.vue` (inicio, requiere sesión)
- `pages/configuracion.vue` (requiere sesión)
- `pages/usuarios.vue` (requiere sesión)
- `pages/confirm.vue` (callback de Supabase para invitaciones)

El composable `useSupabaseUser()` del módulo devuelve nulo si no hay sesión. El middleware de ruta que activa `redirect: true` redirige al login cuando es nulo.

## 6. Composable de vidriería

`composables/useVidrieria.ts`: carga la fila de `vidrierias` para el usuario actual y la expone a todas las páginas. Se usa en el inicio, configuración y, más adelante, en el PDF.

```ts
// composables/useVidrieria.ts
export const useVidrieria = () => {
  const supabase = useSupabaseClient()
  const vidrieria = useState<Vidrieria | null>('vidrieria', () => null)

  async function cargar() {
    const { data } = await supabase
      .from('vidrierias')
      .select('*')
      .single()
    vidrieria.value = data
  }

  return { vidrieria, cargar }
}
```

El tipo `Vidrieria` se define en `shared/tipos/vidrieria.ts` (carpeta nueva en esta etapa).

## 7. Upload de logo

Desde la página de configuración:

1. El usuario elige un archivo (input type file, imagen).
2. Se sube a `storage/logos/{vidrieria_id}/logo.{ext}`.
3. Se obtiene la URL pública firmada (o URL directa si el bucket fuera público; en este caso el bucket es privado, así que se usa `createSignedUrl` con un TTL largo, o se cambia a público solo para logos).
4. Se actualiza `vidrierias.logo_url` con esa URL.

> **Decisión de plan**: el bucket `logos` se declara público (`public: true`) en `0003_storage.sql`. Los logos de vidriería no son datos sensibles y simplifica la lectura desde el PDF (que no tiene sesión activa). La política de escritura y borrado sigue siendo privada (solo el usuario autenticado de esa vidriería).

Si se decide hacerlo privado más adelante, se cambia esta spec primero.

## 8. Invitación de usuarios

Desde la página `/usuarios`, el usuario escribe un correo y confirma. El cliente llama a `supabase.auth.admin.inviteUserByEmail()`. Esta función **requiere la clave de servicio**, que no puede estar en el navegador.

Por eso se escribe una **Edge Function** de Supabase: `supabase/functions/invitar-usuario/index.ts`. Recibe el correo y el `vidrieria_id` del llamador. Valida que el llamador sea un usuario activo de esa vidriería. Llama a `auth.admin.inviteUserByEmail` con `redirectTo: https://paulvenci.github.io/Ventanas/#/confirm`.

Al aceptar la invitación, el usuario aterriza en `/#/confirm`. Esa página detecta el token, completa la sesión y llama a la RPC `vincular_usuario_invitado(vidrieria_id)` para insertar la fila en `usuarios`.

El `vidrieria_id` se pasa como parámetro de la URL de invitación (en el `redirectTo` de la Edge Function) o se guarda en `user_metadata` al invitar.

## 9. Desactivar usuario

Desde `/usuarios`, botón "Desactivar" en cada fila que no sea el propio usuario.

- Verifica que quede al menos un usuario activo después de desactivar.
- Actualiza `usuarios.activo = false`.
- No borra la cuenta de Supabase Auth.
- La política RLS de `usuarios` incluye `and activo = true` en la cláusula `using`, por lo que el usuario desactivado no puede leer nada.

## 10. Carpetas nuevas en esta etapa

```
app/pages/            login, registro, index, configuracion, usuarios, confirm
composables/          useVidrieria.ts
shared/tipos/         vidrieria.ts
supabase/
  migrations/         0001 a 0004
  functions/
    invitar-usuario/  index.ts
```

No se crean carpetas de etapas siguientes.

## 11. Cómo se verifica

Con un proyecto de Supabase real y variables de entorno cargadas:

1. `pnpm dev`: abrir `http://localhost:3000` redirige a `/#/login`.
2. Registrar una vidriería nueva: el usuario queda en `/#/` sin pasar por verificación de correo.
3. En el panel de Supabase, verificar que existen las filas en `vidrierias` y `usuarios`.
4. Cerrar sesión: la app vuelve a `/#/login`.
5. Desde otra cuenta (otra vidriería), hacer `SELECT * FROM vidrierias` y verificar que no devuelve la primera.
6. Subir un logo: la URL queda en `vidrierias.logo_url` y la imagen se ve en la pantalla de configuración.
7. Invitar un correo nuevo: llega el correo, al aceptar aparece en la lista de usuarios.
8. Desactivar ese usuario: no puede volver a iniciar sesión (la app lo devuelve al login aunque tenga sesión de Auth).
9. Intentar desactivar al único usuario activo: la app lo rechaza con un mensaje.
