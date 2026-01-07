import { ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useTimeSeries() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Obtiene series temporales de conteos
   */
  const getTimeSeriesCounts = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      params.append('agrupacion', filters.agrupacion || 'hour')
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/timeseries/counts?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo series temporales:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene series temporales por ubicación
   */
  const getTimeSeriesLocations = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      params.append('agrupacion', filters.agrupacion || 'day')
      params.append('tipo', filters.tipo || 'provincia')
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/timeseries/locations?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo series por ubicación:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene análisis de patrones temporales
   */
  const getTimePatterns = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      params.append('tipo', filters.tipo || 'day-of-week')
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/timeseries/patterns?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo patrones temporales:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene datos para comparación de períodos
   */
  const getComparisonData = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      params.append('agrupacion', filters.agrupacion || 'day')
      params.append('comparison_type', filters.comparison_type || 'previous')
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/timeseries/comparison?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo datos de comparación:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene estadísticas de tendencia
   */
  const getTrendStats = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/timeseries/trends?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo estadísticas de tendencia:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getTimeSeriesCounts,
    getTimeSeriesLocations,
    getTimePatterns,
    getComparisonData,
    getTrendStats
  }
}

