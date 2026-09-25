# 03 — Cálculo de una ventana

Estado: En especificación para revisión.

Sale de `Especificaciones.md`, secciones:
- 5.3 ("Tipologías y fórmulas")
- 5.7 ("Marco de madera")
- 5.8 ("Mano de obra")
- 6 ("Cómo se arma una ventana")
- 7.2 ("Cálculo")

---

## 1. Objetivo de la etapa

Implementar el **motor de cálculo de una ventana**, como un módulo de lógica pura (sin efectos secundarios ni dependencias de base de datos o UI), capaz de recibir las dimensiones del vano, la configuración elegida, la fórmula del catálogo y los parámetros comerciales, y entregar:

1. El cálculo exacto de medidas útiles tras descontar marco de madera (si aplica).
2. El despiece de perfiles con sus metros lineales brutos, con merma y costo neto, evaluando expresiones matemáticas dinámicas.
3. El cálculo del paño de vidrio con sus descuentos y superficie en m².
4. El cálculo de accesorios e insumos fijos.
5. El recargo de color (ninguno, porcentaje sobre perfiles o monto fijo por metro lineal).
6. La mano de obra desglosada (componente fijo por ventana + componente por m² de vidrio).
7. Los costos de materiales, costo total, margen comercial aplicado y precio neto final (redondeado al peso chileno).
8. La estructura de **snapshot JSON** inmutable que guardará la ventana en el presupuesto (Etapa 04).

---

## 2. Entradas del Motor de Cálculo

Para calcular una ventana, el motor requiere los siguientes parámetros:

### 2.1 Dimensiones y cantidad
- `ancho_vano`: número decimal en centímetros (> 0).
- `alto_vano`: número decimal en centímetros (> 0).
- `cantidad`: número entero de ventanas idénticas (>= 1).

### 2.2 Material, Línea y Tipología
- `linea`: objeto con datos de la línea (`id`, `nombre`, `tipo_material`).
- `tipologia`: objeto con datos del modelo (`id`, `nombre`, `tipo_base`, `mano_obra_fijo`, `mano_obra_m2`).
- `formula`: objeto con la regla de consumo para esa combinación (`descuento_vidrio_ancho`, `descuento_vidrio_alto`, `perfiles_formula`, `accesorios_formula`).
  - Si no existe fórmula para la combinación (tipología + línea), el cálculo no se puede realizar por fórmula (requiere carga manual).

### 2.3 Vidrio
- `vidrio`: objeto con `id`, `nombre`, `espesor_mm`, `precio_m2`.

### 2.4 Color / Acabado
- `color`: objeto opcional con `id`, `nombre`, `tipo_recargo` (`'ninguno' | 'porcentaje' | 'monto_metro'`), `valor_recargo`. Si es nulo o indefinido, recargo = 0.

### 2.5 Marco de Madera (Opcional)
- `marco_madera`: objeto opcional con `id`, `nombre`, `ancho_pulgadas`, `espesor_cm`, `precio_metro`. Si es nulo, no lleva marco.

### 2.6 Parámetros comerciales y de taller
- `merma_vidrieria_pct`: porcentaje de merma por defecto para perfiles (ej. 5%).
- `merma_vidrio_pct`: porcentaje de merma para vidrio (por defecto 0% salvo configuración).
- `mano_obra_fijo_defecto`: monto neto fijo por ventana si la tipología no lo define.
- `mano_obra_m2_defecto`: monto neto por m² de vidrio si la tipología no lo define.
- `margen_comercial_pct`: porcentaje de margen comercial sobre costo total (ej. 30%).

### 2.7 Ítems manuales y ajustes (Opcionales)
- `ajustes_perfiles`: mapa opcional de modificaciones sobre la fórmula (ej. forzar metros o cantidad de piezas).
- `items_manuales`: lista de ítems libres agregados a la ventana (`descripcion`, `unidad`, `cantidad`, `precio_unitario_neto`, `stock_item_id`).

---

## 3. Algoritmo y Reglas de Cálculo

### 3.1 Marco de Madera y Vano Útil
1. Si `marco_madera` está presente:
   - `ancho_util = ancho_vano - (2 * marco_madera.espesor_cm)`
   - `alto_util = alto_vano - (2 * marco_madera.espesor_cm)`
   - **Validación crítica**: Si `ancho_util <= 0` o `alto_util <= 0`, el cálculo se detiene y arroja error explicativo: *"El espesor del marco de madera excede las dimensiones del vano"*.
   - Metros lineales de marco: Se calcula sobre el **perímetro del vano exterior**:
     $$\text{metros\_marco\_unitario} = \frac{2 \times (\text{ancho\_vano} + \text{alto\_vano})}{100}$$
   - Se aplica la merma de la vidriería al marco:
     $$\text{metros\_marco\_con\_merma} = \text{metros\_marco\_unitario} \times \left(1 + \frac{\text{merma\_pct}}{100}\right) \times \text{cantidad}$$
   - Costo marco:
     $$\text{costo\_marco} = \text{metros\_marco\_con\_merma} \times \text{marco\_madera.precio\_metro}$$
2. Si no hay marco de madera:
   - `ancho_util = ancho_vano`
   - `alto_util = alto_vano`
   - `costo_marco = 0`

### 3.2 Despiece y Consumo de Perfiles
Para cada ítem en `formula.perfiles_formula`:
1. Evaluar la expresión `formula_largo` reemplazando de forma segura:
   - `ancho` por `ancho_util` (en cm).
   - `alto` por `alto_util` (en cm).
   - Ejemplo (Corredera AL20):
     - Jamba: `alto` $\rightarrow$ $120\text{ cm}$
     - Riel Sup.: `ancho - 1.2` $\rightarrow$ $150 - 1.2 = 148.8\text{ cm}$
     - Zócalos: `ancho / 2` $\rightarrow$ $150 / 2 = 75\text{ cm}$
2. Validación: `largo_cm` debe ser $> 0$. Si resulta $\le 0$, arrojar error de corte inválido.
3. Metros lineales por ventana:
   $$\text{metros\_brutos\_unitario} = \left(\frac{\text{largo\_cm}}{100}\right) \times \text{cantidad\_piezas}$$
4. Merma aplicable: Si el perfil tiene `merma` configurada se usa esa; en caso contrario, se usa `merma_vidrieria_pct`.
   $$\text{metros\_con\_merma\_unitario} = \text{metros\_brutos\_unitario} \times \left(1 + \frac{\text{merma}}{100}\right)$$
5. Metros totales para el lote:
   $$\text{metros\_totales} = \text{metros\_con\_merma\_unitario} \times \text{cantidad}$$
6. Costo neto del perfil:
   $$\text{costo\_perfil} = \text{metros\_totales} \times \text{perfil.precio\_metro}$$
7. Barras estimadas (informativo, barra estándar 5,99 m):
   $$\text{barras\_estimadas} = \lceil \text{metros\_totales} / 5.99 \rceil$$

### 3.3 Recargo de Color / Terminación
Si `color` está definido y `color.tipo_recargo != 'ninguno'`:
- Si `tipo_recargo == 'porcentaje'`:
  $$\text{recargo\_color} = \left(\sum \text{costo\_perfiles}\right) \times \left(\frac{\text{color.valor\_recargo}}{100}\right)$$
- Si `tipo_recargo == 'monto_metro'`:
  $$\text{recargo\_color} = \left(\sum \text{metros\_totales\_perfiles}\right) \times \text{color.valor\_recargo}$$
- Si `tipo_recargo == 'ninguno'` o no hay color: `recargo_color = 0`.

### 3.4 Paño de Vidrio
1. Descuentos de corte según la fórmula:
   - `ancho_vidrio_cm = ancho_util - formula.descuento_vidrio_ancho`
   - `alto_vidrio_cm = alto_util - formula.descuento_vidrio_alto`
2. **Validación**: Si `ancho_vidrio_cm <= 0` o `alto_vidrio_cm <= 0`, arrojar error: *"Los descuentos de vidrio superan las medidas útiles"*.
3. Superficie unitaria:
   $$\text{m2\_unitario} = \frac{\text{ancho\_vidrio\_cm} \times \text{alto\_vidrio\_cm}}{10000}$$
4. Superficie total con merma:
   $$\text{m2\_totales} = \text{m2\_unitario} \times \text{cantidad} \times \left(1 + \frac{\text{merma\_vidrio\_pct}}{100}\right)$$
5. Costo neto de vidrio:
   $$\text{costo\_vidrio} = \text{m2\_totales} \times \text{vidrio.precio\_m2}$$

### 3.5 Accesorios de la Fórmula
Para cada accesorio en `formula.accesorios_formula`:
- `unidades_totales = cantidad_fija * cantidad`
- `costo_accesorio = unidades_totales * accesorio.precio_unitario`

### 3.6 Ítems Manuales Adicionales
Para cada ítem en `items_manuales`:
- `costo_item = item.cantidad * item.precio_unitario_neto`

### 3.7 Mano de Obra
1. Monto fijo: Prioridad `tipologia.mano_obra_fijo ?? mano_obra_fijo_defecto ?? 0`.
2. Monto por m²: Prioridad `tipologia.mano_obra_m2 ?? mano_obra_m2_defecto ?? 0`.
3. Mano de obra total:
   $$\text{mano\_obra\_total} = \left(\text{monto\_fijo} + (\text{m2\_unitario} \times \text{monto\_m2})\right) \times \text{cantidad}$$

### 3.8 Totalización y Precios Finales
1. Costo total de materiales:
   $$\text{costo\_materiales} = \sum \text{costo\_perfiles} + \text{recargo\_color} + \text{costo\_vidrio} + \sum \text{costo\_accesorios} + \text{costo\_marco} + \sum \text{costo\_items\_manuales}$$
2. Costo total:
   $$\text{costo\_total} = \text{costo\_materiales} + \text{mano\_obra\_total}$$
3. Precio neto total (redondeado al peso):
   $$\text{precio\_neto\_total} = \text{round}\left(\text{costo\_total} \times \left(1 + \frac{\text{margen\_comercial\_pct}}{100}\right)\right)$$
4. Precio neto unitario (por ventana):
   $$\text{precio\_neto\_unitario} = \text{round}\left(\frac{\text{precio\_neto\_total}}{\text{cantidad}}\right)$$

---

## 4. Estructura del Resultado (Snapshot de la Ventana)

El motor retorna una estructura TypeScript completa y serializable:

```typescript
export interface ResultadoCalculoVentana {
  valido: boolean
  errores?: string[]
  
  // Medidas y dimensiones
  dimensiones: {
    ancho_vano: number
    alto_vano: number
    cantidad: number
    espesor_marco_cm: number
    ancho_util: number
    alto_util: number
    ancho_vidrio_cm: number
    alto_vidrio_cm: number
    m2_vidrio_unitario: number
    m2_vidrio_total: number
  }

  // Despiece detallado
  perfiles: Array<{
    perfil_id: string
    codigo: string
    nombre: string
    formula_largo: string
    largo_cm: number
    cantidad_piezas: number
    metros_brutos: number
    merma_pct: number
    metros_con_merma: number
    precio_metro: number
    costo_neto: number
    barras_estimadas: number
  }>

  vidrio: {
    vidrio_id: string
    nombre: string
    espesor_mm: number
    m2_total: number
    precio_m2: number
    costo_neto: number
  }

  color: {
    color_id?: string
    nombre?: string
    tipo_recargo: TipoRecargoColor
    valor_recargo: number
    recargo_neto: number
  }

  accesorios: Array<{
    accesorio_id: string
    nombre: string
    cantidad_unitaria: number
    cantidad_total: number
    precio_unitario: number
    costo_neto: number
  }>

  marco_madera?: {
    marco_id: string
    nombre: string
    ancho_pulgadas: number
    espesor_cm: number
    metros_totales: number
    precio_metro: number
    costo_neto: number
  }

  items_manuales: Array<{
    descripcion: string
    unidad: string
    cantidad: number
    precio_unitario_neto: number
    costo_neto: number
    stock_item_id?: string
  }>

  mano_obra: {
    fijo_unitario: number
    m2_unitario: number
    costo_neto: number
  }

  totales: {
    costo_materiales: number
    costo_mano_obra: number
    costo_total: number
    margen_pct: number
    precio_neto_total: number
    precio_neto_unitario: number
  }
}
```

---

## 5. Qué NO hace esta etapa

1. No guarda ni actualiza tablas de presupuestos en Supabase (Etapa 04).
2. No descuenta stock físico (Etapa 05).
3. No renderiza PDF ni abre enlaces de WhatsApp (Etapa 06).
4. No optimiza barras de corte (cortes lineales de retazos - fuera de alcance).

---

## 6. Criterios de Aceptación y Pruebas Unitarias

1. **Evaluación de expresiones**: Calcula correctamente expresiones como `alto`, `ancho - 1.2`, `alto - 2.8`, `ancho / 2` ante vanos reales (ej. 150 cm x 120 cm).
2. **Marco de madera**: Descuenta correctamente $2 \times \text{espesor}$ al ancho y al alto útil. Si el espesor es mayor o igual a la mitad del vano, detiene el cálculo con error.
3. **Descuento de vidrio**: Resta las medidas de descuento; si el resultado es $\le 0$, arroja error.
4. **Mermas**: Aplica la merma del perfil si existe, o la de la vidriería si es nula.
5. **Recargos de color**: Calcula correctamente tanto recargo porcentual sobre perfiles como recargo por metro lineal.
6. **Mano de obra**: Aplica la tarifa fija y la tarifa por m² correctamente multiplicada por la cantidad de ventanas.
7. **Margen y Redondeo**: Suma costos, aplica margen y redondea los precios netos a números enteros (sin centavos de peso).
8. **Pruebas automatizadas**: Se deben crear tests unitarios en Vitest que cubran todos los casos anteriores y validen la exactitud numérica.
