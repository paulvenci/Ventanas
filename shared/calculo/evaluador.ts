/**
 * Evaluador aritmético seguro para fórmulas de corte de perfiles.
 * Permite expresiones en función de 'ancho' y 'alto' en centímetros.
 *
 * Ejemplos válidos:
 *   "alto"
 *   "ancho - 1.2"
 *   "alto - 2,8"
 *   "ancho / 2"
 *   "(ancho - 1.5) / 2"
 */
export function evaluarExpresionLargo(
  expresion: string,
  anchoCm: number,
  altoCm: number
): number {
  if (!expresion || typeof expresion !== 'string') {
    throw new Error('La expresión de fórmula no puede estar vacía')
  }

  if (anchoCm <= 0 || altoCm <= 0) {
    throw new Error(`Las dimensiones deben ser mayores a cero (ancho: ${anchoCm}, alto: ${altoCm})`)
  }

  // 1. Normalizar variables y separadores decimales
  let limpia = expresion.trim()

  // Reemplazar coma decimal por punto decimal
  limpia = limpia.replace(/,/g, '.')

  // Reemplazar variables 'ancho' y 'alto' (insensible a mayúsculas) con paréntesis para seguridad
  limpia = limpia.replace(/\bancho\b/gi, `(${anchoCm})`)
  limpia = limpia.replace(/\balto\b/gi, `(${altoCm})`)

  // 2. Validación estricta: solo números, operadores matemáticos y paréntesis
  const soloCaracteresValidos = /^[\d\s+\-*/().]+$/
  if (!soloCaracteresValidos.test(limpia)) {
    throw new Error(`Expresión contiene caracteres no válidos: "${expresion}"`)
  }

  // 3. Evaluación segura
  try {
    const fn = new Function(`"use strict"; return (${limpia});`)
    const resultado = fn()

    if (typeof resultado !== 'number' || isNaN(resultado) || !isFinite(resultado)) {
      throw new Error(`El cálculo arrojó un resultado no numérico: "${expresion}"`)
    }

    // Redondear a 2 decimales para precisión de corte en cm
    return Number(resultado.toFixed(2))
  } catch (err: any) {
    throw new Error(`Error de sintaxis en la fórmula "${expresion}": ${err.message}`)
  }
}
