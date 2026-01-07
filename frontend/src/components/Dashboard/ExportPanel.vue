<template>
  <div class="export-panel card">
    <div class="card-header">
      <h3>Exportar Datos</h3>
    </div>
    
    <div class="export-options">
      <div class="form-group">
        <label>Formato</label>
        <select v-model="exportFormat">
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </select>
      </div>

      <div class="form-group">
        <label>Incluir</label>
        <div class="checkbox-group">
          <label>
            <input type="checkbox" v-model="includeHistory" />
            Historial de cambios
          </label>
          <label>
            <input type="checkbox" v-model="includeStats" />
            Estadísticas
          </label>
        </div>
      </div>

      <button class="btn btn-success btn-block" @click="handleExport" :disabled="exporting">
        <span v-if="exporting">Exportando...</span>
        <span v-else>📥 Exportar Datos</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAnalytics } from '../../composables/useAnalytics'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  }
})

const { exportData } = useAnalytics()

const exportFormat = ref('json')
const includeHistory = ref(false)
const includeStats = ref(false)
const exporting = ref(false)

const handleExport = async () => {
  exporting.value = true
  
  try {
    if (exportFormat.value === 'json') {
      await exportData(props.filters)
    } else {
      // Exportar CSV
      await exportCSV()
    }
  } catch (error) {
    console.error('Error exportando:', error)
    alert('Error al exportar datos: ' + error.message)
  } finally {
    exporting.value = false
  }
}

const exportCSV = async () => {
  // Implementar exportación CSV
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const params = new URLSearchParams()
  
  if (props.filters.provincia && props.filters.provincia !== 'todas') {
    params.append('provincia', props.filters.provincia)
  }
  if (props.filters.comunidad && props.filters.comunidad !== 'todas') {
    params.append('comunidad', props.filters.comunidad)
  }
  if (props.filters.carretera) {
    params.append('carretera', props.filters.carretera)
  }
  if (props.filters.status && props.filters.status !== 'todas') {
    params.append('status', props.filters.status)
  }
  if (props.filters.fecha_inicio) {
    params.append('fecha_inicio', props.filters.fecha_inicio)
  }
  if (props.filters.fecha_fin) {
    params.append('fecha_fin', props.filters.fecha_fin)
  }

  const response = await fetch(`${API_URL}/api/admin/data/raw?${params}&limit=10000`)
  const result = await response.json()
  
  // Convertir a CSV
  const headers = ['ID', 'Latitud', 'Longitud', 'Estado', 'Carretera', 'PK', 'Sentido', 'Orientación', 'Comunidad', 'Provincia', 'Municipio', 'Primera Vista', 'Última Vista']
  const rows = result.data.map(item => [
    item.id,
    item.lat,
    item.lon,
    item.status,
    item.carretera || '',
    item.pk || '',
    item.sentido || '',
    item.orientacion || '',
    item.comunidad || '',
    item.provincia || '',
    item.municipio || '',
    item.first_seen || '',
    item.last_seen || ''
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `balizas-${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
</script>

<style scoped>
.export-panel {
  margin-top: 1rem;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}
</style>

