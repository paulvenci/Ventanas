-- 0002_usuarios.sql
-- Tabla que vincula auth.uid() con una vidriería y helper security definer para RLS.

create table usuarios (
  id            uuid primary key default gen_random_uuid(),
  auth_uid      uuid not null unique,
  vidrieria_id  uuid not null references vidrierias(id),
  nombre        text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table usuarios enable row level security;

-- Función security definer que evita la recursión infinita en las políticas de RLS
create or replace function get_usuario_vidrieria_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select vidrieria_id from usuarios where auth_uid = auth.uid() and activo = true limit 1;
$$;

grant execute on function get_usuario_vidrieria_id() to authenticated, anon;

-- Un usuario solo ve los usuarios de su propia vidriería (o su propio registro).
create policy "usuarios: solo la propia vidriería"
  on usuarios
  for all
  using (
    vidrieria_id = get_usuario_vidrieria_id() or auth_uid = auth.uid()
  )
  with check (
    vidrieria_id = get_usuario_vidrieria_id()
  );
