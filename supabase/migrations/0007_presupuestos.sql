-- 0007_presupuestos.sql
-- Gestión de clientes y presupuestos comerciales con desglose de ventanas y totales

-- 1. CLIENTES
create table if not exists clientes (
  id           uuid primary key default gen_random_uuid(),
  vidrieria_id uuid not null references vidrierias(id) on delete cascade,
  nombre       text not null,
  telefono     text,
  correo       text,
  direccion    text,
  created_at   timestamptz not null default now()
);

-- 2. PRESUPUESTOS (cabecera)
create table if not exists presupuestos (
  id                uuid primary key default gen_random_uuid(),
  vidrieria_id      uuid not null references vidrierias(id) on delete cascade,
  numero            integer not null,
  cliente_id        uuid references clientes(id) on delete set null,
  cliente_nombre    text not null,
  cliente_telefono  text,
  cliente_correo    text,
  cliente_direccion text,
  fecha             date not null default current_date,
  validez_dias      integer not null default 15,
  observaciones     text,
  descuento_tipo    text not null default 'monto' check (descuento_tipo in ('porcentaje', 'monto')),
  descuento_valor   numeric(10, 2) not null default 0,
  subtotal_neto     integer not null default 0,
  descuento_neto    integer not null default 0,
  neto              integer not null default 0,
  iva               integer not null default 0,
  total             integer not null default 0,
  estado            text not null default 'borrador' check (estado in ('borrador', 'enviado', 'aceptado', 'rechazado')),
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint uq_presupuesto_numero unique (vidrieria_id, numero)
);

-- 3. VENTANAS DEL PRESUPUESTO
create table if not exists presupuesto_ventanas (
  id                   uuid primary key default gen_random_uuid(),
  presupuesto_id       uuid not null references presupuestos(id) on delete cascade,
  vidrieria_id         uuid not null references vidrierias(id) on delete cascade,
  posicion             integer not null default 1,
  linea_id             uuid references lineas(id) on delete set null,
  tipologia_id         uuid references tipologias(id) on delete set null,
  vidrio_id            uuid references vidrios(id) on delete set null,
  color_id             uuid references colores(id) on delete set null,
  marco_madera_id      uuid references marcos_madera(id) on delete set null,
  ancho_vano           numeric(6, 2) not null,
  alto_vano            numeric(6, 2) not null,
  cantidad             integer not null default 1,
  margen_pct           numeric(5, 2) not null default 30,
  observacion          text,
  costo_materiales     integer not null default 0,
  costo_mano_obra      integer not null default 0,
  costo_total          integer not null default 0,
  precio_neto_unitario integer not null default 0,
  precio_neto_total    integer not null default 0,
  calculo_snapshot     jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now()
);

-- 4. ÍTEMS LIBRES DEL PRESUPUESTO
create table if not exists presupuesto_items_libres (
  id                   uuid primary key default gen_random_uuid(),
  presupuesto_id       uuid not null references presupuestos(id) on delete cascade,
  vidrieria_id         uuid not null references vidrierias(id) on delete cascade,
  posicion             integer not null default 1,
  descripcion          text not null,
  cantidad             integer not null default 1,
  precio_unitario_neto integer not null default 0,
  total_neto           integer not null default 0,
  created_at           timestamptz not null default now()
);

-- 5. FUNCIÓN PARA OBTENER SIGUIENTE CORRELATIVO
create or replace function obtener_siguiente_numero_presupuesto(p_vidrieria_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_siguiente integer;
begin
  select coalesce(max(numero), 0) + 1
  into v_siguiente
  from presupuestos
  where vidrieria_id = p_vidrieria_id;

  return v_siguiente;
end;
$$;

-- 6. POLÍTICAS RLS (Row Level Security)
alter table clientes                 enable row level security;
alter table presupuestos             enable row level security;
alter table presupuesto_ventanas     enable row level security;
alter table presupuesto_items_libres enable row level security;

drop policy if exists "clientes: tenant propio"                 on clientes;
drop policy if exists "presupuestos: tenant propio"             on presupuestos;
drop policy if exists "presupuesto_ventanas: tenant propio"     on presupuesto_ventanas;
drop policy if exists "presupuesto_items_libres: tenant propio" on presupuesto_items_libres;

create policy "clientes: tenant propio" on clientes for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());

create policy "presupuestos: tenant propio" on presupuestos for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());

create policy "presupuesto_ventanas: tenant propio" on presupuesto_ventanas for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());

create policy "presupuesto_items_libres: tenant propio" on presupuesto_items_libres for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());
