-- 0001_vidrierias.sql
-- Tabla principal de la vidriería (tenant).

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

-- Un usuario autenticado solo puede operar sobre su propia vidriería.
-- La subquery a usuarios se evalúa por fila; no hay recursión.
create policy "vidrierias: solo la propia"
  on vidrierias
  for all
  using (
    id = get_usuario_vidrieria_id()
  )
  with check (
    id = get_usuario_vidrieria_id()
  );
