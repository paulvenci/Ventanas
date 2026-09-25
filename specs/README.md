# Cómo se construye este proyecto

El producto está en `Especificaciones.md`. Ese archivo no se parte en tickets sueltos ni se traduce directo a código. Cada etapa de trabajo pasa por tres archivos antes de escribir una línea:

1. Spec: qué hace, qué no hace, y cómo se sabe que está bien.
2. Plan: cómo se construye, sin implementar todavía.
3. Tareas: la lista ordenada. Recién ahí se escribe código.

No se abre la etapa siguiente hasta que la actual cumple sus criterios y sus pruebas pasan.

## Orden de las etapas

El orden es el de dependencia, no el de la pantalla más vistosa. Una etapa no se anticipa porque "ya se sabe cómo va a ser".

| Etapa | Nombre | Depende de | Estado |
| --- | --- | --- | --- |
| 00 | Constitución técnica | — | Aceptada 2026-09-23 |
| 01 | Acceso y vidriería | 00 | Aceptada 2026-09-23 |
| 02 | Catálogos | 01 | Aceptada 2026-09-24 |
| 03 | Cálculo de una ventana | 02 | Aceptada 2026-09-24 |
| 04 | Presupuesto | 03 | Aceptada 2026-09-24 |
| 05 | Orden de Trabajo y Cortes | 04 | Aceptada 2026-09-24 |
| 06 | PDF Presupuesto | 04 | Aceptada 2026-09-24 |
| 07 | Compras consolidadas | 04, 05 | Pendiente |

La etapa 00 no es una función del usuario. Fija el stack, la forma del repositorio y las reglas que el resto no puede contradecir. Sin eso, la etapa 01 se escribiría dos veces.

## Reglas

- Un cambio de producto se escribe primero en `Especificaciones.md` y después en la spec de la etapa. No se descubre en el código.
- Si al implementar aparece un caso que la spec no cubre, se para y se completa la spec. No se inventa la regla en el código.
- Cada etapa declara qué queda fuera. Eso no se construye "ya que estamos".
- La spec de una etapa cita la sección de `Especificaciones.md` de la que sale. Si se contradicen, manda `Especificaciones.md` y se corrige la spec de la etapa.
- Las pruebas se escriben a partir de los criterios de aceptación, antes o junto con el código, no después de darlo por listo.
- No hay código de producto hasta que la etapa 00 tenga spec, plan y tareas aceptadas.

## Dónde vive cada cosa

```
specs/
  README.md          este archivo
  00-constitucion/
    spec.md
    plan.md          se escribe al cerrar la spec
    tasks.md         se escribe al cerrar el plan
  01-acceso/
  02-catalogos/
  03-calculo/
  04-presupuesto/
  05-orden-trabajo/
  06-pdf/
  07-compras/
```

`Especificaciones.md` sigue siendo la especificación de producto. `specs/` es la especificación de construcción.

## Publicación

El workflow `.github/workflows/pages.yml` genera el sitio y lo despliega. No puede activar Pages por sí mismo. Una sola vez, en el repositorio: Settings, Pages, source "GitHub Actions".

La URL y la clave pública de Supabase se cargan como variables del repositorio, `NUXT_PUBLIC_SUPABASE_URL` y `NUXT_PUBLIC_SUPABASE_KEY`. No son secretos. La clave de servicio no se carga ahí.
