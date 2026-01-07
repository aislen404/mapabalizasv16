import { ref, computed, onMounted, onUnmounted } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v16'

export function useBalizas() {
  const balizas = ref([])
  const loading = ref(false)
  const error = ref(null)
  const lastUpdate = ref(null)
  let refreshInterval = null

  /**
   * Obtiene las balizas del backend
   */
  const fetchBalizas = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(API_URL)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data || !Array.isArray(data.balizas)) {
        throw new Error('Formato de datos inválido: se espera { balizas: [...] }')
      }

      balizas.value = data.balizas
      lastUpdate.value = new Date()
      error.value = null
    } catch (err) {
      console.error('Error obteniendo balizas:', err)
      error.value = err.message
      // No limpiar balizas en caso de error para mantener datos anteriores
    } finally {
      loading.value = false
    }
  }

  /**
   * Inicia la actualización automática cada 60 segundos
   */
  const startAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    
    refreshInterval = setInterval(() => {
      fetchBalizas()
    }, 60000) // 60 segundos
  }

  /**
   * Detiene la actualización automática
   */
  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  /**
   * Fuerza una actualización manual
   */
  const refresh = () => {
    fetchBalizas()
  }

  // Cargar datos al montar
  onMounted(() => {
    fetchBalizas()
    startAutoRefresh()
  })

  // Limpiar intervalo al desmontar
  onUnmounted(() => {
    stopAutoRefresh()
  })

  // Estadísticas computadas
  const totalBalizas = computed(() => balizas.value.length)
  
  const balizasActivas = computed(() => 
    balizas.value.filter(b => b.status === 'active').length
  )
  
  const balizasPerdidas = computed(() => 
    balizas.value.filter(b => b.status === 'lost').length
  )

  return {
    balizas,
    loading,
    error,
    lastUpdate,
    totalBalizas,
    balizasActivas,
    balizasPerdidas,
    fetchBalizas,
    refresh,
    startAutoRefresh,
    stopAutoRefresh
  }
}

