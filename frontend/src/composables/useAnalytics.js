import { ref, computed } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useAnalytics() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Obtiene estadísticas generales
   */
  const getGeneralStats = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.provincia && filters.provincia !== 'todas') params.append('provincia', filters.provincia)
      if (filters.comunidad && filters.comunidad !== 'todas') params.append('comunidad', filters.comunidad)
      if (filters.carretera) params.append('carretera', filters.carretera)
      if (filters.status && filters.status !== 'todas') params.append('status', filters.status)
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/stats/general?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo estadísticas:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene estadísticas por ubicación
   */
  const getStatsByLocation = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/stats/by-location?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo estadísticas por ubicación:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene datos crudos
   */
  const getRawData = async (filters = {}, limit = 1000, offset = 0) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.provincia && filters.provincia !== 'todas') params.append('provincia', filters.provincia)
      if (filters.comunidad && filters.comunidad !== 'todas') params.append('comunidad', filters.comunidad)
      if (filters.carretera) params.append('carretera', filters.carretera)
      if (filters.status && filters.status !== 'todas') params.append('status', filters.status)
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)
      params.append('limit', limit)
      params.append('offset', offset)

      const response = await fetch(`${API_URL}/api/admin/data/raw?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo datos crudos:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Exporta datos
   */
  const exportData = async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.provincia && filters.provincia !== 'todas') params.append('provincia', filters.provincia)
      if (filters.comunidad && filters.comunidad !== 'todas') params.append('comunidad', filters.comunidad)
      if (filters.carretera) params.append('carretera', filters.carretera)
      if (filters.status && filters.status !== 'todas') params.append('status', filters.status)
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/export?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `balizas-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando datos:', err)
      error.value = err.message
      throw err
    }
  }

  /**
   * Obtiene lista de provincias
   */
  const getProvinciasList = async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.comunidad && filters.comunidad !== 'todas') params.append('comunidad', filters.comunidad)
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/locations/provincias?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo provincias:', err)
      error.value = err.message
      return []
    }
  }

  /**
   * Obtiene lista de comunidades
   */
  const getComunidadesList = async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/locations/comunidades?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo comunidades:', err)
      error.value = err.message
      return []
    }
  }

  /**
   * Obtiene estadísticas acumuladas
   */
  const getAccumulatedStats = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      params.append('agrupacion', filters.agrupacion || 'day')
      if (filters.provincia && filters.provincia !== 'todas') params.append('provincia', filters.provincia)
      if (filters.comunidad && filters.comunidad !== 'todas') params.append('comunidad', filters.comunidad)
      if (filters.carretera) params.append('carretera', filters.carretera)
      if (filters.status && filters.status !== 'todas') params.append('status', filters.status)
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin)

      const response = await fetch(`${API_URL}/api/admin/stats/accumulated?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error obteniendo estadísticas acumuladas:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getGeneralStats,
    getStatsByLocation,
    getRawData,
    exportData,
    getProvinciasList,
    getComunidadesList,
    getAccumulatedStats
  }
}

