# 02 — Catálogos

Estado: En especificación.

Sale de `Especificaciones.md`, sección 5 ("Catálogos", puntos 5.1 al 5.8).

## 1. Objetivo de la etapa

Permitir que cada vidriería administre sus propios catálogos de materiales, precios base y fórmulas de corte de ventanas:

1. **Líneas**: agrupa perfiles por tipo de material fijo (`aluminio` o `pvc`).
2. **Perfiles**: pertenecen a una línea. Tienen código, nombre, precio neto por metro, stock en metros y merma propia opcional.
3. **Vidrios**: tipos y espesores con precio neto por m² y stock en m².
4. **Colores**: terminaciones con recargo opcional (porcentaje o monto por metro).
5. **Accesorios**: herrajes y componentes con precio unitario neto y stock en unidades.
6. **Marcos de madera**: marcos perimetrales con precio por metro, stock y espesor en centímetros (impacto en el vano útil).
7. **Tipologías**: modelos de ventana (corredera, batiente, paño fijo, etc.) con mano de obra base por tipología.
8. **Fórmulas de corte**: reglas de consumo de perfiles, accesorios y descuentos de vidrio para una combinación de (tipología + línea).

Todo catálogo pertenece exclusivamente a la vidriería (`vidrieria_id`) y se aísla con Row Level Security (RLS).

## 2. Decisiones de diseño y negocio

### 2.1 Material y Líneas
- El tipo de material es fijo: `'aluminio'` o `'pvc'`. No es un catálogo libre.
- Las líneas pertenecen a un material y a la vidriería (ej. "Aluminio AL-20", "Aluminio AL-25", "PVC Línea Europea").
- Al desactivar una línea, sus perfiles no se ofrecen para ventanas nuevas, pero no se eliminan.

### 2.2 Perfiles
- Todo perfil pertenece a una línea existente de la vidriería.
- Campos: `codigo` (texto, ej. "AL-2001"), `nombre` (ej. "Jamba"), `precio_metro` (entero neto), `stock_metros` (numérico decimal), `merma` (porcentaje entero opcional; si es null, el motor usará la merma por defecto de la vidriería), `activo` (booleano).
- El stock se gestiona en **metros lineales**, no en barras físicas.

### 2.3 Vidrios
- Campos: `nombre` (ej. "Incoloro 4mm", "Termopanel DVH 4/12/4"), `espesor_mm` (entero, ej. 4, 6, 8 — permite distinguir vidrios del mismo tipo pero diferente grosor), `precio_m2` (entero neto), `stock_m2` (numérico decimal), `activo` (booleano).

### 2.4 Colores y Acabados
- Son terminaciones que aplican a los perfiles de aluminio/PVC. Se asocian a una **línea específica** (ej: los colores disponibles de la Línea 20 pueden ser distintos a los de la Línea 25).
- Campos: `linea_id` (FK a `lineas`, null = disponible para cualquier línea), `nombre` (ej. "Blanco", "Natural", "Titanio", "Folio Roble"), `tipo_recargo` (`'ninguno'`, `'porcentaje'`, `'monto_metro'`), `valor_recargo` (numérico; % o $ neto/m según tipo), `activo` (booleano).

### 2.5 Accesorios
- Herrajes e insumos unitarios: `nombre` (ej. "Ruedas tandem AL-25", "Cierre caracol", "Felpa 7x6"), `precio_unitario` (entero neto), `stock_unidades` (entero o numérico), `activo` (booleano).

### 2.6 Marcos de Madera
- Catálogo perimetral con campo `ancho_pulgadas` para identificar el tamaño de la tabla (ej. 1", 1.5", 2").
- Campos: `nombre` (ej. "Pino 2x1"), `precio_metro` (entero neto), `stock_metros` (numérico), `espesor_cm` (numérico decimal, ej. 2.0 — espacio que ocupa hacia adentro del vano en cada costado), `ancho_pulgadas` (numérico decimal, ej. 2.0 para una tabla 2x1), `activo` (booleano).

### 2.7 Tipologías y Mano de Obra
- Catálogo de modelos de ventana con un **tipo base** (corredera, batiente, paño fijo, proyectante, guillotina, etc.) que sirve para clasificar/filtrar, más un **nombre libre** que describe la combinación específica.
- Mano de obra opcional por tipología: `mano_obra_fijo` ($ neto por ventana) y `mano_obra_m2` ($ neto por m² de vidrio). Si es nulo, se toma el de la vidriería.

### 2.8 Fórmulas de Corte (Tipología + Línea)

Cada combinación (tipología + línea) almacena una fórmula que describe los materiales necesarios para una ventana dado su `ancho` y `alto` en centímetros.

**Sistema de expresiones**:
Cada perfil en la fórmula lleva un campo `formula_largo` que es una expresión aritmética con las variables `ancho` y `alto`. El motor de cálculo (Etapa 03) evaluará esa expresión con los valores reales del vano.

Ejemplo real — *Corredera Aluminio Línea 20, vidrio 4mm*:

| Perfil | formula_largo | cantidad | Descripción |
|---|---|---|---|
| Jamba | `alto` | 2 | Largo = alto del vano |
| Riel Superior | `ancho - 1.2` | 1 | Descuenta 1.2 cm |
| Riel Inferior | `ancho - 1.2` | 1 | Descuenta 1.2 cm |
| Piernas | `alto - 2.8` | 2 | Descuenta 2.8 cm |
| Traslapos | `alto - 2.8` | 2 | Descuenta 2.8 cm |
| Zócalos | `ancho / 2` | 2 | Divide el ancho en 2 hojas |
| Cabezal | `ancho / 2` | 2 | Divide el ancho en 2 hojas |

**Flujo de cálculo** (Etapa 03 lo implementa, Etapa 02 solo almacena):
1. Para cada ítem de perfil: `largo_cm = eval(formula_largo)` → `metros_brutos = (largo_cm / 100) * cantidad` → aplicar merma → calcular costo.
2. Vidrio: `m2 = (ancho_util - descuento_ancho) * (alto_util - descuento_alto) / 10000`.
3. Accesorios: `cantidad_fija * precio_unitario`.

### 2.9 Regla de no borrado (Soft Delete)
- Los elementos de catálogos no se eliminan físicamente (`DELETE`) si están asociados a fórmulas o presupuestos históricos. Se marcan con `activo = false`.
- La interfaz permite filtrar entre activos y todos, y reactivarlos cuando se requiera.

## 3. Modelo de datos propuesto (Supabase)

Tablas nuevas con clave foránea `vidrieria_id` y políticas RLS:

1. `lineas`: `id`, `vidrieria_id`, `tipo_material`, `nombre`, `activo`, `created_at`
2. `perfiles`: `id`, `vidrieria_id`, `linea_id`, `codigo`, `nombre`, `precio_metro`, `stock_metros`, `merma`, `activo`, `created_at`
3. `vidrios`: `id`, `vidrieria_id`, `nombre`, `precio_m2`, `stock_m2`, `activo`, `created_at`
4. `colores`: `id`, `vidrieria_id`, `nombre`, `tipo_recargo`, `valor_recargo`, `activo`, `created_at`
5. `accesorios`: `id`, `vidrieria_id`, `nombre`, `precio_unitario`, `stock_unidades`, `activo`, `created_at`
6. `marcos_madera`: `id`, `vidrieria_id`, `nombre`, `precio_metro`, `stock_metros`, `espesor_cm`, `activo`, `created_at`
7. `tipologias`: `id`, `vidrieria_id`, `nombre`, `mano_obra_fijo`, `mano_obra_m2`, `activo`, `created_at`
8. `formulas_tipologia`: `id`, `vidrieria_id`, `tipologia_id`, `linea_id`, `descuento_vidrio_ancho`, `descuento_vidrio_alto`, `perfiles_formula`, `accesorios_formula`, `created_at`

Todas protegidas con RLS usando la función `get_usuario_vidrieria_id()`.

## 4. Pantallas y Navegación

Dentro de la aplicación se agrega la sección **Catálogos** accesible desde la navegación principal (`/#/catalogos`):

- **Pestaña Perfiles y Líneas**: Crear y editar líneas de aluminio/PVC y sus perfiles asociados.
- **Pestaña Vidrios**: Lista de vidrios, precios por m² y stock.
- **Pestaña Colores**: Terminaciones y recargos.
- **Pestaña Accesorios**: Herrajes, ruedas y cierres con stock y precios.
- **Pestaña Marcos de Madera**: Marcos y su espesor en cm.
- **Pestaña Tipologías y Fórmulas**: Lista de modelos y editor visual de consumos por línea.

## 5. Qué no hace esta etapa

- No calcula costos de ventanas en un presupuesto (Etapa 03).
- No genera documentos ni presupuestos (Etapa 04).
- No realiza movimientos automáticos de stock (Etapa 05).
- No optimiza barras de corte (explícitamente fuera de alcance según `Especificaciones.md`).

## 6. Criterios de aceptación

1. Cada vidriería puede crear, listar, modificar y desactivar líneas, perfiles, vidrios, colores, accesorios, marcos y tipologías.
2. Un usuario de una vidriería no puede ver ni modificar los catálogos de otra vidriería (validado por RLS).
3. Una fórmula de tipología almacena correctamente los descuentos de vidrio y las reglas de consumo de perfiles y accesorios.
4. Los precios se guardan en números netos y las medidas en centímetros/metros según corresponda.
5. Los elementos desactivados dejan de aparecer como seleccionables pero conservan su integridad.
