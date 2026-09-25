# 03 — Plan de Construcción: Cálculo de una ventana

Estado: Plan listo para revisión.

Spec: `specs/03-calculo/spec.md`.

---

## 1. Arquitectura de Componentes

El motor de cálculo es el núcleo del negocio de la aplicación. Para garantizar solidez, testeabilidad y reusabilidad tanto en el cliente como en posibles edge functions, se diseñará como un **módulo puro en `shared/`**, sin dependencias de Supabase, Pinia ni el DOM:

```
shared/
  calculo/
    evaluador.ts        # Parser/evaluador aritmético seguro para expresiones ('ancho', 'alto')
    motor.ts            # Función pura calcularVentana(params): ResultadoCalculoVentana
    index.ts            # Re-export del motor y utilidades
  tipos/
    calculo.ts          # Interfaces de entrada (Parámetros) y salida (Snapshot)
tests/
  calculo.test.ts       # Suite completa de tests unitarios con Vitest
app/
  composables/
    useCalculoVentana.ts # Composable reactivo que envuelve el motor para la UI
```

---

## 2. Componentes en Detalle

### 2.1 Evaluador de Expresiones (`shared/calculo/evaluador.ts`)
- Debe soportar sumas, restas, multiplicaciones, divisiones, paréntesis y números decimales.
- Variables permitidas exclusivamente: `ancho` y `alto` (insensible a mayúsculas/minúsculas).
- Manejo de coma decimal (ej. `1,2` $\rightarrow$ `1.2`).
- Retorna número o lanza un error descriptivo si la sintaxis es inválida.
- Protección contra inyección de código: valida tokens permitidos con RegExp antes de evaluar.

### 2.2 Motor de Dominio (`shared/calculo/motor.ts`)
Función principal:
```typescript
export function calcularVentana(params: ParametrosCalculoVentana): ResultadoCalculoVentana
```
Pasos ordenados ejecutados en la función:
1. **Validación inicial**: verificar que `ancho_vano > 0`, `alto_vano > 0` y `cantidad >= 1`.
2. **Cálculo de marco de madera**:
   - Si existe: descontar $2 \times \text{espesor}$ para obtener `ancho_util` y `alto_util`. Validar que sean $> 0$.
   - Calcular perímetro del vano, aplicar merma y costo neto.
3. **Cálculo de perfiles**:
   - Evaluar cada ítem de `formula.perfiles_formula`.
   - Validar largos $> 0$.
   - Calcular metros lineales unitarios y totales con merma.
   - Calcular costo por perfil y estimar barras de 5,99 m.
4. **Recargo de color**:
   - Calcular recargo porcentual o por metro lineal según `tipo_recargo`.
5. **Cálculo de vidrio**:
   - Restar descuentos de vidrio sobre las medidas útiles. Validar $> 0$.
   - Calcular m² unitario y total con merma de vidrio.
   - Calcular costo neto de vidrio.
6. **Cálculo de accesorios**:
   - Multiplicar cantidad fija por cantidad de ventanas y precio unitario.
7. **Ítems manuales**:
   - Sumar cantidad por precio unitario de cada ítem manual.
8. **Mano de obra**:
   - Obtener tarifas (con fallback a vidriería).
   - Calcular fijo + (m² $\times$ valor m²).
9. **Totales y margen**:
   - Sumar costo de materiales + mano de obra.
   - Aplicar margen comercial y redondear precios finales al entero más cercano (`Math.round`).

### 2.3 Tipos TypeScript (`shared/tipos/calculo.ts`)
- `ParametrosCalculoVentana`: interfaz con todas las entradas descritas en la spec.
- `ResultadoCalculoVentana`: interfaz completa del desglose y totales.
- Tipos auxiliares de ítems manuales y ajustes.

### 2.4 Composable Reactivo (`app/composables/useCalculoVentana.ts`)
- Conecta los catálogos cargados en la sesión (`useCatalogos`, `useVidrieria`) con el motor.
- Provee un estado reactivo de la ventana en edición con recálculo automático cuando cambian las dimensiones o los materiales seleccionados.

---

## 3. Pruebas Unitarias Automatizadas (`tests/calculo.test.ts`)

Se configurará Vitest para ejecutar pruebas automatizadas verificando:
1. **Caso Real: Corredera AL20 Vidrio 4mm (150 x 120 cm)**:
   - Jamba: 120 cm x 2 = 2.4 m
   - Riel Sup.: 148.8 cm x 1 = 1.488 m
   - Riel Inf.: 148.8 cm x 1 = 1.488 m
   - Piernas: 117.2 cm x 2 = 2.344 m
   - Traslapos: 117.2 cm x 2 = 2.344 m
   - Zócalos: 75 cm x 2 = 1.5 m
   - Cabezal: 75 cm x 2 = 1.5 m
   - Descuento vidrio y m² resultante.
2. **Impacto de Marco de Madera**:
   - Comprobar reducción de vano útil con marco de 2.0 cm.
   - Comprobar bloqueo con vano menor al doble del espesor.
3. **Mermas**:
   - Comprobar cálculo de merma por perfil vs merma general de vidriería.
4. **Recargos de color**:
   - Recargo porcentual (15%) y recargo por metro ($500/m).
5. **Mano de obra y margen comercial**:
   - Comprobar desglose y redondeo exacto al peso chileno.

---

## 4. Criterios de Aceptación del Plan

1. El motor de cálculo no tiene acoplamiento a base de datos ni a Vue.
2. Todas las operaciones matemáticas cumplen la especificación de `Especificaciones.md`.
3. La suite de pruebas de Vitest pasa al 100% de manera determinista.
