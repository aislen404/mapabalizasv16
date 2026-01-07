<template>
  <div class="stats-panel">
    <h3>Estadísticas</h3>
    
    <div class="stat-item">
      <span class="stat-label">Total de balizas:</span>
      <span class="stat-value">{{ totalBalizas }}</span>
    </div>

    <div class="stat-item">
      <span class="stat-label">Activas:</span>
      <span class="stat-value active">{{ balizasActivas }}</span>
    </div>

    <div class="stat-item">
      <span class="stat-label">Perdidas:</span>
      <span class="stat-value lost">{{ balizasPerdidas }}</span>
    </div>

    <div class="stat-item">
      <span class="stat-label">Por provincia:</span>
      <span class="stat-value">{{ provinciasCount }}</span>
    </div>

    <div class="stat-item">
      <span class="stat-label">Por comunidad:</span>
      <span class="stat-value">{{ comunidadesCount }}</span>
    </div>

    <div v-if="lastUpdate" class="stat-item">
      <span class="stat-label">Última actualización:</span>
      <span class="stat-value" style="font-size: 0.85rem;">{{ formatTime(lastUpdate) }}</span>
    </div>

    <div v-if="topProvincias.length > 0" class="top-provincias">
      <h4 style="margin: 1rem 0 0.5rem 0; font-size: 0.95rem; color: #666;">Top Provincias:</h4>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li 
          v-for="item in topProvincias.slice(0, 5)" 
          :key="item.provincia"
          style="padding: 0.25rem 0; font-size: 0.85rem; display: flex; justify-content: space-between;"
        >
          <span>{{ item.provincia }}:</span>
          <span style="font-weight: 600;">{{ item.count }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  balizas: {
    type: Array,
    required: true,
    default: () => []
  },
  lastUpdate: {
    type: Date,
    default: null
  }
})

const totalBalizas = computed(() => props.balizas.length)

const balizasActivas = computed(() => 
  props.balizas.filter(b => b.status === 'active').length
)

const balizasPerdidas = computed(() => 
  props.balizas.filter(b => b.status === 'lost').length
)

const provinciasCount = computed(() => {
  const provincias = new Set()
  props.balizas.forEach(b => {
    if (b.provincia && b.provincia !== 'N/A') {
      provincias.add(b.provincia)
    }
  })
  return provincias.size
})

const comunidadesCount = computed(() => {
  const comunidades = new Set()
  props.balizas.forEach(b => {
    if (b.comunidad && b.comunidad !== 'N/A') {
      comunidades.add(b.comunidad)
    }
  })
  return comunidades.size
})

const topProvincias = computed(() => {
  const counts = {}
  props.balizas.forEach(b => {
    if (b.provincia && b.provincia !== 'N/A') {
      counts[b.provincia] = (counts[b.provincia] || 0) + 1
    }
  })
  
  return Object.entries(counts)
    .map(([provincia, count]) => ({ provincia, count }))
    .sort((a, b) => b.count - a.count)
})

const formatTime = (date) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}
</script>

<style scoped>
.stats-panel {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
}

.stats-panel h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.stat-value.active {
  color: #28a745;
}

.stat-value.lost {
  color: #dc3545;
}
</style>

