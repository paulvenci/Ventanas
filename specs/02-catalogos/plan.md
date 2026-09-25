# 02 — Plan: Catálogos

Estado: En elaboración. Derivado de `specs/02-catalogos/spec.md`.

## 1. Arquitectura de Base de Datos (Supabase)

Se creará la migración SQL `supabase/migrations/0006_catalogos.sql` que implementa las 8 tablas de catálogos con sus restricciones de integridad y políticas RLS.

### Tablas e Índices

```sql
-- 1. LINEAS (Aluminio o PVC)
create table lineas (
  id             uuid primary key default gen_random_uuid(),
  vidrieria_id   uuid not null references vidrierias(id) on delete cascade,
  tipo_material  text not null check (tipo_material in ('aluminio', 'pvc')),
  nombre         text not null,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 2. PERFILES (Asociados a una línea)
create table perfiles (
  id             uuid primary key default gen_random_uuid(),
  vidrieria_id   uuid not null references vidrierias(id) on delete cascade,
  linea_id       uuid not null references lineas(id) on delete cascade,
  codigo         text not null,
  nombre         text not null,
  precio_metro   integer not null default 0,
  stock_metros   numeric(10, 2) not null default 0,
  merma          integer check (merma >= 0 and merma <= 100),
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 3. VIDRIOS
create table vidrios (
  id             uuid primary key default gen_random_uuid(),
  vidrieria_id   uuid not null references vidrierias(id) on delete cascade,
  nombre         text not null,
  precio_m2      integer not null default 0,
  stock_m2       numeric(10, 2) not null default 0,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 4. COLORES
create table colores (
  id             uuid primary key default gen_random_uuid(),
  vidrieria_id   uuid not null references vidrierias(id) on delete cascade,
  nombre         text not null,
  tipo_recargo   text not null default 'ninguno' check (tipo_recargo in ('ninguno', 'porcentaje', 'monto_metro')),
  valor_recargo  numeric(10, 2) not null default 0,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 5. ACCESORIOS
create table accesorios (
  id              uuid primary key default gen_random_uuid(),
  vidrieria_id    uuid not null references vidrierias(id) on delete cascade,
  nombre          text not null,
  precio_unitario integer not null default 0,
  stock_unidades  integer not null default 0,
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- 6. MARCOS DE MADERA
create table marcos_madera (
  id             uuid primary key default gen_random_uuid(),
  vidrieria_id   uuid not null references vidrierias(id) on delete cascade,
  nombre         text not null,
  precio_metro   integer not null default 0,
  stock_metros   numeric(10, 2) not null default 0,
  espesor_cm     numeric(5, 2) not null default 0,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 7. TIPOLOGIAS
create table tipologias (
  id              uuid primary key default gen_random_uuid(),
  vidrieria_id    uuid not null references vidrierias(id) on delete cascade,
  nombre          text not null,
  mano_obra_fijo  integer,
  mano_obra_m2    integer,
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- 8. FORMULAS POR TIPOLOGIA Y LINEA
create table formulas_tipologia (
  id                     uuid primary key default gen_random_uuid(),
  vidrieria_id           uuid not null references vidrierias(id) on delete cascade,
  tipologia_id           uuid not null references tipologias(id) on delete cascade,
  linea_id               uuid not null references lineas(id) on delete cascade,
  descuento_vidrio_ancho numeric(6, 2) not null default 0,
  descuento_vidrio_alto  numeric(6, 2) not null default 0,
  perfiles_formula       jsonb not null default '[]'::jsonb,
  accesorios_formula     jsonb not null default '[]'::jsonb,
  created_at             timestamptz not null default now(),
  constraint uq_tipologia_linea unique (vidrieria_id, tipologia_id, linea_id)
);
```

### Seguridad RLS
Cada tabla habilitará RLS con políticas directas usando `get_usuario_vidrieria_id()`:

```sql
-- Para cada tabla T en (lineas, perfiles, vidrios, colores, accesorios, marcos_madera, tipologias, formulas_tipologia):
alter table T enable row level security;

create policy "T: solo la propia vidrieria"
  on T for all
  using (vidrieria_id = get_usuario_vidrieria_id())
  with check (vidrieria_id = get_usuario_vidrieria_id());
```

## 2. Tipos TypeScript Compartidos

Se creará `shared/tipos/catalogos.ts` modelando cada entidad con tipado estricto:
- `Linea`
- `Perfil`
- `Vidrio`
- `Color`
- `Accesorio`
- `MarcoMadera`
- `Tipologia`
- `FormulaTipologia` y sus interfaces internas `ItemPerfilFormula` (perfil_id, regla: `2*ancho + 2*alto`, etc.) e `ItemAccesorioFormula`.

## 3. Composable `app/composables/useCatalogos.ts`

Centraliza las consultas y mutaciones de los catálogos en el cliente Nuxt:
- Funciones de carga: `cargarLineas()`, `cargarPerfiles()`, `cargarVidrios()`, etc.
- Funciones de guardado / edición con validación.
- Función de cambio de estado `toggleActivo(tabla, id, estado)`.

## 4. Interfaz de Usuario: `app/pages/catalogos.vue`

Diseño limpio tipo dashboard con pestañas:
1. **Líneas y Perfiles**:
   - Selector o tarjetas por línea de material.
   - Tabla de perfiles con código, nombre, precio/m, stock y merma.
   - Modal para nuevo perfil y nueva línea.
2. **Vidrios**:
   - Tabla con nombre, precio/m², stock y botón de estado.
3. **Colores**:
   - Tabla con nombre, tipo de recargo (% o $/m) y valor.
4. **Accesorios**:
   - Listado de herrajes con precio y unidades en inventario.
5. **Marcos de Madera**:
   - Lista con precio/m y espesor (cm) que descuenta al vano.
6. **Tipologías y Fórmulas**:
   - Selector de Tipología + Línea.
   - Configuración de descuentos de vidrio en cm.
   - Constructor visual de consumo de perfiles y accesorios.

Se agregará el enlace **Catálogos** en la barra de navegación del layout principal (`app/layouts/default.vue`).

## 5. Aplicación vía MCP

La migración `0006_catalogos.sql` se aplicará directamente a Supabase mediante el tool MCP de `supabase` (`execute_sql`), garantizando rapidez y cero intervención manual en el panel web.
