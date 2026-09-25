# 05 — Orden de Trabajo y Listado de Cortes

Estado: Aceptada y Validada 2026-09-24.

Sale de la decisión de diseño tomada tras la Etapa 04. El presupuesto aceptado genera una Orden de Trabajo (OT) como documento interno del taller, con el listado optimizado de cortes de perfiles y materiales.

---

## 1. Objetivo de la etapa

Cuando un presupuesto es **aceptado**, se puede generar una **Orden de Trabajo (OT)** que:

1. Reúne todas las ventanas del presupuesto con su snapshot de cálculo.
2. Genera un **listado de cortes de perfiles** con largo de cada pieza agrupado por tipo de perfil.
3. **Optimiza el uso de barras** de 5,99 m (o el largo registrado en catálogo) para minimizar desperdicio, usando el algoritmo First Fit Decreasing (FFD).
4. Calcula **cuántas barras** se necesitan de cada perfil y el **desperdicio estimado**.
5. Genera un **listado consolidado de materiales** (perfiles en barras, m² de vidrio, accesorios en unidades, marco de madera en metros).
6. Permite exportar/imprimir como PDF para el taller.
7. Permite **ajustar manualmente** la distribución de cortes si el usuario lo requiere.

---

## 2. Decisiones de diseño y negocio

### 2.1 Relación Presupuesto ↔ OT

- Relación **1:1**: cada presupuesto aceptado genera exactamente una OT.
- No se puede crear una OT desde un presupuesto en estado `borrador` o `rechazado`.
- Si el presupuesto se duplica, la OT no se duplica; el nuevo presupuesto comienza sin OT.

### 2.2 Estados de la OT

| Estado | Descripción |
|--------|-------------|
| `pendiente` | Creada, aún no enviada al taller |
| `en_produccion` | El taller está fabricando |
| `lista_instalar` | Ventanas fabricadas, listas para entregar/instalar |
| `instalada` | Entregada e instalada en terreno |
| `cancelada` | Se canceló la orden |

Transiciones permitidas:
```
pendiente → en_produccion → lista_instalar → instalada
pendiente → cancelada
en_produccion → cancelada
```

### 2.3 Listado de cortes

Cada pieza de perfil tiene:
- **Perfil** (código + nombre)
- **Largo de pieza** en cm (calculado por la fórmula de la tipología)
- **Cantidad de piezas** totales (cantidad_piezas × cantidad_ventanas × cantidad de ventanas iguales en el presupuesto)
- **Ventana de origen** (posición en el presupuesto + dimensiones)

El listado agrupa primero por tipo de perfil y luego muestra las piezas individuales.

### 2.4 Algoritmo de optimización de barras (First Fit Decreasing)

Para cada tipo de perfil:

1. Recolectar todas las piezas del presupuesto (de todas las ventanas) para ese perfil.
2. Ordenar las piezas de **mayor a menor** largo.
3. Para cada pieza, intentar colocarla en la primera barra que tenga suficiente espacio restante.
4. Si ninguna barra existente tiene espacio, abrir una **nueva barra**.
5. El ancho del corte (kerf) se considera **0,5 cm** por corte.

**Resultado por barra:**
- Lista de piezas asignadas con su largo.
- Sobrante/desperdicio en cm.
- Porcentaje de aprovechamiento.

**Resultado global por perfil:**
- Total de barras necesarias.
- Desperdicio total (cm y %).
- Metros totales consumidos.

### 2.5 Ajuste manual

El usuario puede:
- Mover una pieza de una barra a otra.
- Forzar una pieza a una barra nueva.
- El sistema recalcula sobrantes automáticamente.

Esto se logra en la interfaz, no persiste en la base de datos; cada vez que se abre la OT se recalcula y se puede ajustar de nuevo. Si en el futuro se requiere persistir el layout de cortes, se agrega un campo `cortes_layout_json`.

### 2.6 Listado de materiales

Consolidación de todos los materiales de todas las ventanas del presupuesto:

| Material | Detalle | Unidad | Cantidad | Precio Unit. | Costo Neto |
|----------|---------|--------|----------|-------------|------------|
| Perfil Jamba L20 | Código: JB-20 | barras | 3 | $12.500 | $37.500 |
| Perfil Riel Sup. L20 | Código: RS-20 | barras | 2 | $11.000 | $22.000 |
| Vidrio 4mm | Incoloro | m² | 4,82 | $8.500 | $40.970 |
| Felpa 5x7 | Accesorio | und | 8 | $350 | $2.800 |
| Marco Pino 3" | Madera | m | 6,2 | $4.200 | $26.040 |

### 2.7 Control de cortes (papel/PDF)

El operario marca a mano en el documento impreso. No hay control digital de avance de corte en esta etapa. El PDF del listado de cortes incluye checkboxes vacíos para marcar cada pieza cortada.

---

## 3. Modelo de datos en Supabase

### 3.1 Tabla `ordenes_trabajo`

```sql
create table if not exists ordenes_trabajo (
  id               uuid primary key default gen_random_uuid(),
  vidrieria_id     uuid not null references vidrierias(id) on delete cascade,
  presupuesto_id   uuid not null references presupuestos(id) on delete cascade,
  numero           integer not null,
  estado           text not null default 'pendiente'
                   check (estado in ('pendiente','en_produccion','lista_instalar','instalada','cancelada')),
  fecha_creacion   date not null default current_date,
  fecha_entrega    date,
  observaciones    text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint uq_ot_presupuesto unique (presupuesto_id),
  constraint uq_ot_numero unique (vidrieria_id, numero)
);
```

**Notas:**
- `constraint uq_ot_presupuesto` garantiza la relación 1:1 con presupuesto.
- `numero` es correlativo por vidriería, similar al presupuesto.
- Se implementará `next_numero_ot(vidrieria_id)` como función transaccional.

### 3.2 Sin tabla de cortes persistida

Los cortes se calculan en tiempo real a partir de los `calculo_snapshot` de `presupuesto_ventanas`. No se persisten en esta etapa. Esto evita duplicación de datos y mantiene la coherencia con el snapshot inmutable del presupuesto.

### 3.3 RLS

Las políticas de RLS se aplican igual que en tablas anteriores: `vidrieria_id = get_usuario_vidrieria_id()`.

---

## 4. Motor de Cortes (módulo puro)

Se crea `shared/calculo/cortes.ts` como módulo de dominio puro (sin dependencias de UI ni Supabase).

### 4.1 Entrada

```typescript
interface EntradaOptimizacionCortes {
  /** Todas las piezas a cortar de un mismo perfil */
  piezas: PiezaCorte[]
  /** Largo aprovechable de la barra en cm (ej: 599) */
  largo_barra_cm: number
  /** Ancho del corte de sierra en cm (kerf) */
  kerf_cm?: number  // default: 0.5
}

interface PiezaCorte {
  id: string           // identificador único de la pieza
  ventana_ref: string  // ej: "V1 (150×120)" para trazabilidad
  largo_cm: number
  cantidad: number     // si hay N piezas iguales, se expanden
}
```

### 4.2 Salida

```typescript
interface ResultadoOptimizacionCortes {
  barras: BarraOptimizada[]
  total_barras: number
  desperdicio_total_cm: number
  desperdicio_pct: number
  metros_totales: number
}

interface BarraOptimizada {
  numero: number  // 1, 2, 3...
  piezas: { pieza_id: string; ventana_ref: string; largo_cm: number }[]
  usado_cm: number
  sobrante_cm: number
  aprovechamiento_pct: number
}
```

### 4.3 Funciones exportadas

```typescript
/** Optimiza cortes de un tipo de perfil usando FFD */
export function optimizarCortesPerfil(entrada: EntradaOptimizacionCortes): ResultadoOptimizacionCortes

/** Genera el listado completo de cortes de un presupuesto */
export function generarListadoCortes(
  ventanas: PresupuestoVentanaConSnapshot[],
  perfilesCatalogo: Perfil[]
): ListadoCortesCompleto

/** Genera el listado consolidado de materiales */
export function generarListadoMateriales(
  ventanas: PresupuestoVentanaConSnapshot[]
): ListadoMaterialesConsolidado
```

---

## 5. Pantallas y Flujos de Usuario

### 5.1 Creación de OT

1. En la vista del presupuesto aceptado aparece un botón **"Generar Orden de Trabajo"**.
2. Se abre un diálogo de confirmación con fecha de entrega estimada y observaciones opcionales.
3. Al confirmar se crea la OT en estado `pendiente`.

### 5.2 Listado de OTs (`/ordenes-trabajo`)

- Tarjetas/tabla con: número OT, número presupuesto, cliente, fecha, estado (badge de color), fecha de entrega.
- Filtro por estado.
- Clic para ver detalle.

### 5.3 Detalle de OT (`/ordenes-trabajo/:id`)

La vista tiene tres pestañas/secciones:

**a) Resumen**
- Datos de la OT (número, estado, fechas, cliente).
- Resumen del presupuesto asociado.
- Botones de cambio de estado.

**b) Listado de Cortes**
- Agrupado por tipo de perfil.
- Por cada perfil: visualización de barras con las piezas distribuidas (gráfico horizontal tipo diagrama de barras apiladas).
- Cada pieza muestra: largo en cm, referencia de ventana.
- Cada barra muestra: sobrante, % aprovechamiento.
- Botón "Imprimir / Descargar PDF".

**c) Listado de Materiales**
- Tabla consolidada con todos los materiales.
- Agrupado por categoría (Perfiles, Vidrio, Accesorios, Marco Madera).
- Botón "Imprimir / Descargar PDF".

### 5.4 Ajuste manual de cortes

- Drag & drop de piezas entre barras (o menú contextual con "Mover a barra N").
- Al mover, se recalcula el sobrante de ambas barras.
- Validación: no se puede colocar una pieza si excede la capacidad de la barra.

---

## 6. Qué NO hace esta etapa

1. No persiste la distribución manual de cortes en base de datos (se recalcula cada vez).
2. No descuenta stock físico (eso sería una Etapa futura de inventario).
3. No genera PDF del presupuesto para el cliente (Etapa 06).
4. No consolida materiales de múltiples presupuestos para compra (Etapa 07).
5. No incluye tracking digital del operario en taller (solo papel impreso).

---

## 7. Criterios de Aceptación

1. Desde un presupuesto aceptado se puede crear una OT con correlativo propio.
2. No se puede crear OT desde presupuestos en estado `borrador` o `rechazado`.
3. La relación es 1:1 (un presupuesto no puede tener dos OTs).
4. Los estados de la OT siguen las transiciones definidas.
5. El listado de cortes extrae correctamente todas las piezas del `calculo_snapshot`.
6. El algoritmo FFD minimiza el número de barras y reporta el desperdicio.
7. El listado de materiales consolida perfiles (en barras), vidrio (en m²), accesorios (en unidades) y marcos (en metros).
8. La visualización de barras muestra gráficamente la distribución de piezas.
9. Se puede descargar/imprimir como PDF el listado de cortes y el listado de materiales.
10. El ajuste manual de cortes funciona y recalcula sobrantes.
