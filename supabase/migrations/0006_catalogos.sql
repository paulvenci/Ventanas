-- 0006_catalogos.sql
-- Catálogos de materiales, perfiles, vidrios, accesorios, marcos, tipologías y fórmulas de corte.
-- Revisado post-ajuste de producto: colores por línea, vidrios con espesor_mm,
-- marcos con ancho_pulgadas y tipologías con tipo_base.

-- 1. LÍNEAS (Aluminio o PVC)
create table if not exists lineas (
  id             uuid primary key default gen_random_uuid(),
  vidrieria_id   uuid not null references vidrierias(id) on delete cascade,
  tipo_material  text not null check (tipo_material in ('aluminio', 'pvc')),
  nombre         text not null,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 2. PERFILES (Asociados a una línea)
create table if not exists perfiles (
  id             uuid primary key default gen_random_uuid(),
  vidrieria_id   uuid not null references vidrierias(id) on delete cascade,
  linea_id       uuid not null references lineas(id) on delete cascade,
  codigo         text not null,
  nombre         text not null,
  precio_metro   integer not null default 0,
  stock_metros   numeric(10, 2) not null default 0,
  largo_barra_m  numeric(5, 2) not null default 5.99,
  merma          integer check (merma >= 0 and merma <= 100),
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 3. VIDRIOS (con espesor en mm para identificar el tipo)
create table if not exists vidrios (
  id             uuid primary key default gen_random_uuid(),
  vidrieria_id   uuid not null references vidrierias(id) on delete cascade,
  nombre         text not null,
  espesor_mm     integer not null default 0,
  precio_m2      integer not null default 0,
  stock_m2       numeric(10, 2) not null default 0,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 4. COLORES (terminaciones asociadas a una línea de perfiles)
create table if not exists colores (
  id             uuid primary key default gen_random_uuid(),
  vidrieria_id   uuid not null references vidrierias(id) on delete cascade,
  linea_id       uuid references lineas(id) on delete cascade,  -- null = aplica a todas las líneas
  nombre         text not null,
  tipo_recargo   text not null default 'ninguno' check (tipo_recargo in ('ninguno', 'porcentaje', 'monto_metro')),
  valor_recargo  numeric(10, 2) not null default 0,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 5. ACCESORIOS
create table if not exists accesorios (
  id              uuid primary key default gen_random_uuid(),
  vidrieria_id    uuid not null references vidrierias(id) on delete cascade,
  nombre          text not null,
  precio_unitario integer not null default 0,
  stock_unidades  integer not null default 0,
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- 6. MARCOS DE MADERA (con espesor en cm y ancho de tabla en pulgadas)
create table if not exists marcos_madera (
  id              uuid primary key default gen_random_uuid(),
  vidrieria_id    uuid not null references vidrierias(id) on delete cascade,
  nombre          text not null,
  precio_metro    integer not null default 0,
  stock_metros    numeric(10, 2) not null default 0,
  espesor_cm      numeric(5, 2) not null default 0,
  ancho_pulgadas  numeric(5, 2) not null default 0,
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- 7. TIPOLOGIAS (modelos de ventana por tipo base)
-- tipo_base: categoría de la ventana para filtrado; el nombre es libre (ej "Corredera AL20 4mm")
create table if not exists tipologias (
  id              uuid primary key default gen_random_uuid(),
  vidrieria_id    uuid not null references vidrierias(id) on delete cascade,
  nombre          text not null,
  tipo_base       text not null default 'otro'
                  check (tipo_base in ('corredera','batiente','pano_fijo','proyectante','guillotina','pivotante','oscilobatiente','otro')),
  mano_obra_fijo  integer,
  mano_obra_m2    integer,
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- 8. FÓRMULAS POR TIPOLOGÍA Y LÍNEA
--
-- perfiles_formula JSONB: array de objetos con estructura:
--   { "perfil_id": "uuid", "perfil_nombre": "Jamba",
--     "formula_largo": "alto",        -- expresión en términos de 'ancho' y 'alto' en cm
--     "cantidad": 2 }                 -- número de piezas de ese perfil
--
-- Ejemplos de formula_largo:
--   "alto"             → largo = alto
--   "ancho - 1.2"      → largo = ancho - 1.2
--   "alto - 2.8"       → largo = alto - 2.8
--   "ancho / 2"        → largo = ancho / 2
--
-- El motor de cálculo (Etapa 03) evaluará estas expresiones con los valores reales de ancho y alto.
-- El resultado en cm se convierte a metros dividiendo por 100, luego se multiplica por cantidad
-- y se aplica la merma del perfil (o la de la vidriería si la del perfil es null).
--
-- accesorios_formula JSONB: array de objetos:
--   { "accesorio_id": "uuid", "accesorio_nombre": "Rueda corr.", "cantidad_fija": 2 }

create table if not exists formulas_tipologia (
  id                     uuid primary key default gen_random_uuid(),
  vidrieria_id           uuid not null references vidrierias(id) on delete cascade,
  tipologia_id           uuid not null references tipologias(id) on delete cascade,
  linea_id               uuid not null references lineas(id) on delete cascade,
  descuento_vidrio_ancho numeric(6, 2) not null default 0,  -- cm a restar del ancho útil para el paño de vidrio
  descuento_vidrio_alto  numeric(6, 2) not null default 0,  -- cm a restar del alto útil para el paño de vidrio
  perfiles_formula       jsonb not null default '[]'::jsonb,
  accesorios_formula     jsonb not null default '[]'::jsonb,
  created_at             timestamptz not null default now(),
  constraint uq_tipologia_linea unique (vidrieria_id, tipologia_id, linea_id)
);

-- ─── RLS: aislamiento multi-tenant ───────────────────────────────────────────

alter table lineas            enable row level security;
alter table perfiles          enable row level security;
alter table vidrios           enable row level security;
alter table colores           enable row level security;
alter table accesorios        enable row level security;
alter table marcos_madera     enable row level security;
alter table tipologias        enable row level security;
alter table formulas_tipologia enable row level security;

drop policy if exists "lineas: tenant propio"             on lineas;
drop policy if exists "perfiles: tenant propio"           on perfiles;
drop policy if exists "vidrios: tenant propio"            on vidrios;
drop policy if exists "colores: tenant propio"            on colores;
drop policy if exists "accesorios: tenant propio"         on accesorios;
drop policy if exists "marcos_madera: tenant propio"      on marcos_madera;
drop policy if exists "tipologias: tenant propio"         on tipologias;
drop policy if exists "formulas_tipologia: tenant propio" on formulas_tipologia;

create policy "lineas: tenant propio" on lineas for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());

create policy "perfiles: tenant propio" on perfiles for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());

create policy "vidrios: tenant propio" on vidrios for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());

create policy "colores: tenant propio" on colores for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());

create policy "accesorios: tenant propio" on accesorios for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());

create policy "marcos_madera: tenant propio" on marcos_madera for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());

create policy "tipologias: tenant propio" on tipologias for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());

create policy "formulas_tipologia: tenant propio" on formulas_tipologia for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());
