import { format, subHours, subDays, subWeeks, subMonths, startOfDay, endOfDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Utilidades para manejo de fechas y períodos
 */

/**
 * Obtiene el rango de fechas para un período predefinido
 */
export function getPeriodRange(period) {
  const now = new Date()
  
  switch (period) {
    case 'last-hour':
      return {
        inicio: subHours(now, 1).toISOString(),
        fin: now.toISOString()
      }
    case 'last-24h':
      return {
        inicio: subHours(now, 24).toISOString(),
        fin: now.toISOString()
      }
    case 'last-7d':
      return {
        inicio: subDays(now, 7).toISOString(),
        fin: now.toISOString()
      }
    case 'last-30d':
      return {
        inicio: subDays(now, 30).toISOString(),
        fin: now.toISOString()
      }
    case 'today':
      return {
        inicio: startOfDay(now).toISOString(),
        fin: endOfDay(now).toISOString()
      }
    case 'this-week':
      return {
        inicio: startOfDay(subDays(now, now.getDay())).toISOString(),
        fin: endOfDay(now).toISOString()
      }
    case 'this-month':
      return {
        inicio: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)).toISOString(),
        fin: endOfDay(now).toISOString()
      }
    case 'all':
    default:
      return {
        inicio: null,
        fin: null
      }
  }
}

/**
 * Formatea una fecha para mostrar
 */
export function formatDate(date, formatStr = 'dd/MM/yyyy HH:mm') {
  if (!date) return 'N/A'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatStr, { locale: es })
  } catch {
    return String(date)
  }
}

/**
 * Formatea un período para mostrar
 */
export function formatPeriod(period) {
  const labels = {
    'last-hour': 'Última hora',
    'last-24h': 'Últimas 24 horas',
    'last-7d': 'Últimos 7 días',
    'last-30d': 'Últimos 30 días',
    'today': 'Hoy',
    'this-week': 'Esta semana',
    'this-month': 'Este mes',
    'all': 'Todo',
    'custom': 'Personalizado'
  }
  return labels[period] || period
}

/**
 * Obtiene opciones de períodos predefinidos
 */
export function getPeriodOptions() {
  return [
    { value: 'last-hour', label: 'Última hora' },
    { value: 'last-24h', label: 'Últimas 24 horas' },
    { value: 'last-7d', label: 'Últimos 7 días' },
    { value: 'last-30d', label: 'Últimos 30 días' },
    { value: 'today', label: 'Hoy' },
    { value: 'this-week', label: 'Esta semana' },
    { value: 'this-month', label: 'Este mes' },
    { value: 'all', label: 'Todo' },
    { value: 'custom', label: 'Personalizado' }
  ]
}

/**
 * Obtiene opciones de agrupación temporal
 */
export function getGroupingOptions() {
  return [
    { value: 'hour', label: 'Por hora' },
    { value: 'day', label: 'Por día' },
    { value: 'week', label: 'Por semana' },
    { value: 'month', label: 'Por mes' }
  ]
}

/**
 * Calcula la diferencia en tiempo legible
 */
export function timeAgo(date) {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const now = new Date()
    const diffMs = now - dateObj
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Hace menos de un minuto'
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
    
    return formatDate(dateObj)
  } catch {
    return String(date)
  }
}

/**
 * Valida un rango de fechas
 */
export function validateDateRange(inicio, fin) {
  if (!inicio || !fin) return { valid: false, error: 'Ambas fechas son requeridas' }
  
  const inicioDate = typeof inicio === 'string' ? parseISO(inicio) : inicio
  const finDate = typeof fin === 'string' ? parseISO(fin) : fin
  
  if (isNaN(inicioDate.getTime())) {
    return { valid: false, error: 'Fecha de inicio inválida' }
  }
  
  if (isNaN(finDate.getTime())) {
    return { valid: false, error: 'Fecha de fin inválida' }
  }
  
  if (inicioDate > finDate) {
    return { valid: false, error: 'La fecha de inicio debe ser anterior a la fecha de fin' }
  }
  
  return { valid: true }
}

