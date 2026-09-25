# 03 — Tareas: Cálculo de una ventana

Estado: Aceptada 2026-09-24.

Plan: `specs/03-calculo/plan.md`.

## 1. Tipos Compartidos de Cálculo

- [x] Crear `shared/tipos/calculo.ts` con `ParametrosCalculoVentana`, `ResultadoCalculoVentana` y subtipos asociados.
- [x] Exportar los nuevos tipos en `shared/tipos/index.ts`.

## 2. Evaluador de Expresiones Aritméticas

- [x] Crear `shared/calculo/evaluador.ts` con validación estricta de tokens, reemplazo de `ancho`/`alto` y evaluación segura.
- [x] Manejar comas decimales y errores sintácticos con mensajes claros.

## 3. Motor de Cálculo de una Ventana

- [x] Crear `shared/calculo/motor.ts` con la función pura `calcularVentana()`.
  - [x] Paso 1: Cálculo y validación de marco de madera y vano útil.
  - [x] Paso 2: Evaluación de perfiles, metros brutos, mermas y barras estimadas (5,99 m).
  - [x] Paso 3: Recargo de color (% o $/m).
  - [x] Paso 4: Descuento de vidrio y cálculo de m² con merma.
  - [x] Paso 5: Accesorios fijos.
  - [x] Paso 6: Ítems manuales adicionales.
  - [x] Paso 7: Mano de obra fija y por m².
  - [x] Paso 8: Suma de costos, margen comercial y redondeo al peso chileno.
- [x] Crear `shared/calculo/index.ts` reexportando el evaluador y el motor.

## 4. Pruebas Unitarias Automatizadas (Vitest)

- [x] Instalar o verificar configuración de Vitest en el proyecto (`vitest run`).
- [x] Crear `tests/calculo.test.ts` con suite de pruebas:
  - [x] Test 1: Corredera AL20 Vidrio 4mm (150 x 120 cm) con fórmulas provistas por el usuario.
  - [x] Test 2: Marco de madera y reducción de vano útil.
  - [x] Test 3: Bloqueo por dimensiones inválidas (espesor de marco o descuentos excesivos).
  - [x] Test 4: Mermas de perfil vs merma general de vidriería.
  - [x] Test 5: Recargos de color (% y $/m).
  - [x] Test 6: Mano de obra y redondeo final de precios al peso.
- [x] Ejecutar la suite de tests y asegurar que todos pasen al 100% (9 de 9 pasados).

## 5. Composable Reactivo

- [x] Crear `app/composables/useCalculoVentana.ts` para conectar el estado reactivo con el motor de cálculo.

## 6. Cierre de Etapa

- [x] Verificación de criterios de aceptación cumplidos.
- [x] Actualizar estado de etapa 03 a "Aceptada" en `specs/README.md`.
