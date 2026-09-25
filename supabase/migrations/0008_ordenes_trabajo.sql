-- 0008_ordenes_trabajo.sql
-- Gestión de órdenes de trabajo para taller derivadas de presupuestos aceptados

-- 1. FUNCIÓN HELPER PARA UPDATED_AT SI NO EXISTE
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. TABLA ORDENES DE TRABAJO
create table if not exists ordenes_trabajo (
  id               uuid primary key default gen_random_uuid(),
  vidrieria_id     uuid not null references vidrierias(id) on delete cascade,
  presupuesto_id   uuid not null references presupuestos(id) on delete cascade,
  numero           integer not null,
  estado           text not null default 'pendiente'
                   check (estado in ('pendiente', 'en_produccion', 'lista_instalar', 'instalada', 'cancelada')),
  fecha_creacion   date not null default current_date,
  fecha_entrega    date,
  observaciones    text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint uq_ot_presupuesto unique (presupuesto_id),
  constraint uq_ot_numero unique (vidrieria_id, numero)
);

-- 3. ÍNDICES
create index if not exists idx_ot_vidrieria on ordenes_trabajo (vidrieria_id);
create index if not exists idx_ot_presupuesto on ordenes_trabajo (presupuesto_id);

-- 4. TRIGGER PARA ACTUALIZAR updated_at
drop trigger if exists set_ordenes_trabajo_updated_at on ordenes_trabajo;
create trigger set_ordenes_trabajo_updated_at
  before update on ordenes_trabajo
  for each row execute function set_updated_at();

-- 5. FUNCIÓN CORRELATIVA TRANSACCIONAL
create or replace function next_numero_ot(p_vidrieria_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_siguiente integer;
begin
  select coalesce(max(numero), 0) + 1
  into v_siguiente
  from ordenes_trabajo
  where vidrieria_id = p_vidrieria_id;

  return v_siguiente;
end;
$$;

-- 6. POLÍTICAS RLS (Row Level Security)
alter table ordenes_trabajo enable row level security;

drop policy if exists "ordenes_trabajo: tenant propio" on ordenes_trabajo;

create policy "ordenes_trabajo: tenant propio" on ordenes_trabajo for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());
