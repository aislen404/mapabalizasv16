<template>
  <div class="map-view">
    <header class="view-header">
      <h1>Balizas V16 - Mapa Interactivo</h1>
      <div class="header-status">
        <span v-if="loading" class="status-loading">Actualizando...</span>
        <span v-else-if="error" class="status-error">Error: {{ error }}</span>
        <span v-else-if="lastUpdate" class="status-ok">
          Última actualización: {{ formatTime(lastUpdate) }}
        </span>
      </div>
    </header>

    <div class="view-content">
      <aside class="map-sidebar">
        <SearchBar 
          v-model="searchText" 
          @search="handleSearch"
        />
        
        <FiltersPanel
          :balizas="balizas"
          :filters="filters"
          @update:filters="handleFiltersUpdate"
        />

        <StatisticsPanel
          :balizas="filteredBalizas"
          :lastUpdate="lastUpdate"
        />

        <div class="action-buttons">
          <ShareButton :filters="filters" />
          <ExportButton :balizas="filteredBalizas" />
        </div>
      </aside>

      <main class="map-container">
        <MapViewComponent
          :balizas="filteredBalizas"
          :loading="loading"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBalizas } from '../composables/useBalizas'
import { filterBalizas, searchBalizas } from '../utils/filters'
import MapViewComponent from '../components/Map/MapView.vue'
import FiltersPanel from '../components/Map/FiltersPanel.vue'
import SearchBar from '../components/Map/SearchBar.vue'
import StatisticsPanel from '../components/Map/StatisticsPanel.vue'
import ShareButton from '../components/Shared/ShareButton.vue'
import ExportButton from '../components/Shared/ExportButton.vue'

const { balizas, loading, error, lastUpdate } = useBalizas()

const searchText = ref('')
const filters = ref({
  provincia: 'todas',
  comunidad: 'todas',
  carretera: '',
  estado: 'todas'
})

// Aplicar búsqueda primero, luego filtros
const searchedBalizas = computed(() => {
  return searchBalizas(balizas.value, searchText.value)
})

const filteredBalizas = computed(() => {
  return filterBalizas(searchedBalizas.value, filters.value)
})

const handleSearch = (text) => {
  searchText.value = text
}

const handleFiltersUpdate = (newFilters) => {
  filters.value = { ...newFilters }
}

const formatTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleTimeString('es-ES')
}

// Cargar filtros desde URL al montar
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const provincia = urlParams.get('provincia')
  const comunidad = urlParams.get('comunidad')
  const carretera = urlParams.get('carretera')
  const estado = urlParams.get('estado')
  const search = urlParams.get('search')

  if (provincia) filters.value.provincia = provincia
  if (comunidad) filters.value.comunidad = comunidad
  if (carretera) filters.value.carretera = carretera
  if (estado) filters.value.estado = estado
  if (search) searchText.value = search
})
</script>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.view-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.view-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-status {
  font-size: 0.9rem;
}

.status-loading {
  color: #3498db;
}

.status-error {
  color: #e74c3c;
}

.status-ok {
  color: #2ecc71;
}

.view-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.map-sidebar {
  width: 350px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1rem;
  gap: 1rem;
}

.map-container {
  flex: 1;
  position: relative;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}
</style>

