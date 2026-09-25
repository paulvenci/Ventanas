# 04 — Presupuesto

Estado: En especificación para revisión.

Sale de `Especificaciones.md`, secciones:
- 6 ("Cómo se arma una ventana")
- 7 ("Presupuesto": 7.1 Datos, 7.2 Cálculo, 7.3 Estados, 7.4 Cliente)

---

## 1. Objetivo de la etapa

Permitir que el usuario de la vidriería gestione presupuestos comerciales completos:
1. Crear, listar, ver, editar y duplicar presupuestos.
2. Registrar y seleccionar clientes de la vidriería de forma rápida.
3. Incorporar una o más ventanas cotizadas mediante el motor de cálculo de la Etapa 03, guardando su configuración y snapshot inmutable.
4. Agregar ítems libres (instalación, fletes, terminaciones especiales) con cantidad y precio unitario neto.
5. Aplicar descuentos globales (porcentaje o monto neto).
6. Calcular subtotales, neto, IVA (19%) y total general redondeados al peso chileno.
7. Manejar el flujo de estados (`borrador`, `enviado`, `aceptado`, `rechazado`) con bloqueo de edición cuando esté aceptado.

---

## 2. Decisiones de diseño y negocio

### 2.1 Correlativo por vidriería
- Cada presupuesto tiene un número correlativo propio dentro de su vidriería (`numero`: 1, 2, 3...).
- El correlativo no se comparte con otras vidrierías ni se reinicia.
- Se implementará una función transaccional en Supabase para obtener el siguiente correlativo atómicamente (`next_numero_presupuesto(vidrieria_id)`).

### 2.2 Clientes
- Los clientes pertenecen a la vidriería (`vidrieria_id`).
- Datos: `nombre` (obligatorio), `telefono`, `correo`, `direccion`.
- En el presupuesto se puede elegir un cliente existente o tipear uno nuevo; si es nuevo, se guarda automáticamente en el catálogo de clientes.
- Los datos de contacto se copian al presupuesto para preservar el historial ante cambios futuros del cliente.

### 2.3 Contenido del Presupuesto
Un presupuesto puede contener:
- **Una o más ventanas**: calculadas con el motor de la Etapa 03, guardando su snapshot detallado de costos y cortes.
- **Cero o más ítems libres**: descripción, cantidad y precio unitario neto (ej: instalación, retiro de escombros, flete).
- **Regla de integridad**: Un presupuesto no puede guardarse vacío (debe tener al menos una ventana o un ítem libre).

### 2.4 Totales e Impuestos
Todos los valores base son netos:
1. $\text{Subtotal Ventanas Neto} = \sum \text{precio\_neto\_total de cada ventana}$
2. $\text{Subtotal Ítems Libres Neto} = \sum (\text{cantidad} \times \text{precio\_unitario\_neto})$
3. $\text{Subtotal Neto General} = \text{Subtotal Ventanas} + \text{Subtotal Ítems Libres}$
4. $\text{Descuento Neto}$:
   - Si es porcentaje: $\text{round}(\text{Subtotal Neto General} \times (\text{descuento\_valor} / 100))$
   - Si es monto: $\min(\text{descuento\_valor}, \text{Subtotal Neto General})$
5. $\text{Neto Final} = \text{Subtotal Neto General} - \text{Descuento Neto}$ (nunca menor a cero).
6. $\text{IVA (19\%)} = \text{round}(\text{Neto Final} \times 0.19)$
7. $\text{Total} = \text{Neto Final} + \text{IVA}$

Todos los valores finales se redondean al peso entero sin decimales.

### 2.5 Estados y Transiciones
- **Borrador**: Estado inicial. Totalmente editable. No mueve stock.
- **Enviado**: Se entregó al cliente. Editable. Puede regresar a borrador. No mueve stock.
- **Aceptado**: El cliente aprobó el trabajo. Queda **bloqueado para edición**. (En la Etapa 05 este estado disparará el descuento de stock).
- **Rechazado**: El presupuesto no se concretó.
- **Duplicación**: Desde cualquier estado (incluidos aceptado o rechazado) se puede duplicar a un presupuesto nuevo en estado `borrador`.

---

## 3. Modelo de datos en Supabase

### 3.1 Tabla `clientes`
```sql
create table if not exists clientes (
  id           uuid primary key default gen_random_uuid(),
  vidrieria_id uuid not null references vidrierias(id) on delete cascade,
  nombre       text not null,
  telefono     text,
  correo       text,
  direccion    text,
  created_at   timestamptz not null default now()
);
```

### 3.2 Tabla `presupuestos`
```sql
create table if not exists presupuestos (
  id              uuid primary key default gen_random_uuid(),
  vidrieria_id    uuid not null references vidrierias(id) on delete cascade,
  numero          integer not null,
  cliente_id      uuid references clientes(id) on delete set null,
  cliente_nombre  text not null,
  cliente_telefono text,
  cliente_correo   text,
  cliente_direccion text,
  fecha           date not null default current_date,
  validez_dias    integer not null default 15,
  observaciones   text,
  descuento_tipo  text not null default 'monto' check (descuento_tipo in ('porcentaje', 'monto')),
  descuento_valor numeric(10,2) not null default 0,
  subtotal_neto   integer not null default 0,
  descuento_neto  integer not null default 0,
  neto            integer not null default 0,
  iva             integer not null default 0,
  total           integer not null default 0,
  estado          text not null default 'borrador' check (estado in ('borrador', 'enviado', 'aceptado', 'rechazado')),
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint uq_presupuesto_numero unique (vidrieria_id, numero)
);
```

### 3.3 Tabla `presupuesto_ventanas`
```sql
create table if not exists presupuesto_ventanas (
  id                   uuid primary key default gen_random_uuid(),
  presupuesto_id       uuid not null references presupuestos(id) on delete cascade,
  vidrieria_id         uuid not null references vidrierias(id) on delete cascade,
  posicion             integer not null default 1,
  linea_id             uuid references lineas(id),
  tipologia_id         uuid references tipologias(id),
  vidrio_id            uuid references vidrios(id),
  color_id             uuid references colores(id),
  marco_madera_id      uuid references marcos_madera(id),
  ancho_vano           numeric(6,2) not null,
  alto_vano            numeric(6,2) not null,
  cantidad             integer not null default 1,
  margen_pct           numeric(5,2) not null default 30,
  observacion          text,
  costo_materiales     integer not null default 0,
  costo_mano_obra      integer not null default 0,
  costo_total          integer not null default 0,
  precio_neto_unitario integer not null default 0,
  precio_neto_total    integer not null default 0,
  calculo_snapshot     jsonb not null,
  created_at           timestamptz not null default now()
);
```

### 3.4 Tabla `presupuesto_items_libres`
```sql
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
```

Todas las tablas contarán con políticas de RLS asociadas a `vidrieria_id = get_usuario_vidrieria_id()`.

---

## 4. Pantallas y Flujos de Usuario

1. **Listado de Presupuestos (`/#/presupuestos`)**:
   - Tarjetas/tabla con número correlativo, cliente, fecha, total, badge de estado (`borrador`, `enviado`, `aceptado`, `rechazado`).
   - Filtro por estado y buscador por nombre o número.
   - Botón "+ Nuevo Presupuesto".
   - Acciones por fila: Ver/Editar, Duplicar, Cambiar Estado.
2. **Editor de Presupuesto (`/#/presupuestos/:id` o `/#/presupuestos/nuevo`)**:
   - Datos generales: cliente con autocompletado, validez en días, fecha, observaciones.
   - Lista de ventanas con botón para agregar ventana (modal con configurador en vivo del motor de cálculo de la Etapa 03).
   - Lista de ítems libres (instalación, traslado, etc.).
   - Panel de resumen financiero en tiempo real (Subtotal, Descuento, Neto, IVA 19%, Total).
   - Botón "Guardar Presupuesto".

---

## 5. Qué NO hace esta etapa

1. No descuenta stock físico en la base de datos (eso corresponde a la Etapa 05 al pasar a aceptado).
2. No genera el archivo PDF descargable ni envía por WhatsApp (eso corresponde a la Etapa 06).
3. No genera el listado consolidado de compras (eso corresponde a la Etapa 07).

---

## 6. Criterios de Aceptación

1. Cada vidriería tiene correlativo independiente que inicia en 1 y se incrementa secuencialmente.
2. Se pueden agregar clientes nuevos o reutilizar existentes.
3. Se pueden agregar ventanas con el motor de cálculo y se almacena el snapshot completo de materiales y costos.
4. Se pueden agregar ítems libres netos.
5. El cálculo de Neto, IVA (19%) y Total es exacto y redondeado al peso.
6. Un presupuesto en estado `aceptado` no permite editar sus ventanas ni valores.
7. La función de duplicar genera un nuevo presupuesto borrador con número correlativo nuevo y los mismos ítems.
