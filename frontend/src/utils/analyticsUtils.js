/**
 * Utilidades para análisis de datos acumulados
 */

/**
 * Calcula suma acumulada de un array de datos
 * @param {Array} data - Array de objetos con valores numéricos
 * @param {string} valueKey - Clave del valor a acumular
 * @returns {Array} - Array con valores acumulados
 */
export function calculateAccumulated(data, valueKey = 'total') {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return []
  }

  let accumulated = 0
  return data.map(item => {
    const value = parseInt(item[valueKey] || 0)
    accumulated += value
    return {
      ...item,
      acumulado: accumulated
    }
  })
}

/**
 * Calcula tasa de crecimiento entre períodos
 * @param {Array} data - Array de datos con valores acumulados
 * @param {string} valueKey - Clave del valor a analizar
 * @returns {Array} - Array con tasas de crecimiento
 */
export function calculateGrowthRate(data, valueKey = 'total') {
  if (!data || !Array.isArray(data) || data.length < 2) {
    return data.map(item => ({ ...item, growthRate: 0 }))
  }

  return data.map((item, index) => {
    if (index === 0) {
      return { ...item, growthRate: 0 }
    }

    const current = parseInt(item[valueKey] || 0)
    const previous = parseInt(data[index - 1][valueKey] || 0)
    
    if (previous === 0) {
      return { ...item, growthRate: current > 0 ? 100 : 0 }
    }

    const growthRate = ((current - previous) / previous) * 100
    return { ...item, growthRate: Math.round(growthRate * 100) / 100 }
  })
}

/**
 * Formatea valores acumulados para mostrar
 * @param {number} value - Valor a formatear
 * @returns {string} - Valor formateado
 */
export function formatAccumulatedValue(value) {
  if (value === null || value === undefined) return '0'
  
  const num = parseInt(value)
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString('es-ES')
}

/**
 * Calcula cambio porcentual entre dos valores
 * @param {number} current - Valor actual
 * @param {number} previous - Valor anterior
 * @returns {number} - Cambio porcentual
 */
export function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 100 * 100) / 100
}

/**
 * Obtiene el último valor de una serie acumulada
 * @param {Array} data - Array de datos acumulados
 * @param {string} key - Clave del valor acumulado
 * @returns {number} - Último valor acumulado
 */
export function getLastAccumulatedValue(data, key = 'acumulado_total') {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 0
  }
  return parseInt(data[data.length - 1][key] || 0)
}

/**
 * Obtiene el primer valor de una serie acumulada
 * @param {Array} data - Array de datos acumulados
 * @param {string} key - Clave del valor acumulado
 * @returns {number} - Primer valor acumulado
 */
export function getFirstAccumulatedValue(data, key = 'acumulado_total') {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 0
  }
  return parseInt(data[0][key] || 0)
}

/**
 * Calcula el cambio total en un período
 * @param {Array} data - Array de datos acumulados
 * @param {string} key - Clave del valor acumulado
 * @returns {number} - Cambio total
 */
export function calculateTotalChange(data, key = 'acumulado_total') {
  const first = getFirstAccumulatedValue(data, key)
  const last = getLastAccumulatedValue(data, key)
  return last - first
}

