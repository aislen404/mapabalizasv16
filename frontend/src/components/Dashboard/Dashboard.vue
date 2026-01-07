<template>
  <div class="dashboard">
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Resumen General -->
    <div v-show="activeTab === 'summary'" class="tab-content" :class="{ active: activeTab === 'summary' }">
      <StatsCards :stats="generalStats" :accumulated-data="accumulatedData" :loading="loading" />
      
      <div class="card">
        <div class="card-header">
          <h3>Distribución por Estado</h3>
        </div>
        <PieChart
          :labels="['Activas', 'Perdidas']"
          :data="[generalStats.activas || 0, generalStats.perdidas || 0]"
          title="Distribución de Balizas"
        />
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Top 10 Provincias</h3>
        </div>
        <BarChart
          :labels="topProvinciasLabels"
          :datasets="topProvinciasDatasets"
          title="Balizas por Provincia"
        />
      </div>
    </div>

    <!-- Análisis Temporal -->
    <div v-show="activeTab === 'temporal'" class="tab-content" :class="{ active: activeTab === 'temporal' }">
      <div v-if="error" class="status-message error">
        Error: {{ error }}
      </div>
      <div v-if="!error && timeSeriesData.length === 0 && !loading" class="status-message info">
        No hay datos disponibles para el período seleccionado. Asegúrate de que la base de datos esté configurada y contenga datos históricos.
      </div>
      <TemporalAnalysis
        v-if="timeSeriesData.length > 0"
        :filters="filters"
        :time-series-data="timeSeriesData"
        :time-series-labels="timeSeriesLabels"
      />
      <div v-else-if="!error" class="loading">
        <div class="spinner"></div>
        <p>Cargando datos temporales...</p>
      </div>
    </div>

    <!-- Análisis Geográfico -->
    <div v-show="activeTab === 'geographic'" class="tab-content" :class="{ active: activeTab === 'geographic' }">
      <div v-if="error" class="status-message error">
        Error: {{ error }}
      </div>
      <div v-if="!error && locationStats.byComunidad.length === 0 && !loading" class="status-message info">
        No hay datos disponibles para el análisis geográfico. Asegúrate de que la base de datos esté configurada y contenga datos históricos.
      </div>
      <div class="card">
        <div class="card-header">
          <h3>Distribución por Comunidad Autónoma</h3>
        </div>
        <BarChart
          v-if="locationStats.byComunidad.length > 0"
          :labels="locationStatsLabels"
          :datasets="locationStatsDatasets"
          title="Balizas por Comunidad"
        />
        <div v-else class="loading">
          <div class="spinner"></div>
          <p>Cargando datos geográficos...</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Top 15 Provincias</h3>
        </div>
        <BarChart
          :labels="topProvinciasLabels"
          :datasets="topProvinciasDatasets"
          title="Provincias con más Balizas"
        />
      </div>
    </div>

    <!-- Datos Crudos -->
    <div v-show="activeTab === 'raw'" class="tab-content" :class="{ active: activeTab === 'raw' }">
      <div v-if="error" class="status-message error">
        Error: {{ error }}
      </div>
      <div v-if="!error && rawData.length === 0 && !loading" class="status-message info">
        No hay datos disponibles. Asegúrate de que la base de datos esté configurada y contenga datos históricos.
      </div>
      <div class="card">
        <div class="card-header">
          <h3>Datos Históricos</h3>
        </div>
        <DataTable
          :data="rawData"
          :total="rawDataTotal"
          :loading="loading"
          :error="error"
          :has-more="hasMoreData"
          @load-more="loadMoreData"
        />
      </div>
      
      <ExportPanel :filters="filters" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAnalytics } from '../../composables/useAnalytics'
import { useTimeSeries } from '../../composables/useTimeSeries'
import { formatDate } from '../../utils/dateUtils'
import StatsCards from './StatsCards.vue'
import LineChart from '../Charts/LineChart.vue'
import BarChart from '../Charts/BarChart.vue'
import PieChart from '../Charts/PieChart.vue'
import AreaChart from '../Charts/AreaChart.vue'
import AccumulatedChart from '../Charts/AccumulatedChart.vue'
import DataTable from './Tables/DataTable.vue'
import ExportPanel from './ExportPanel.vue'
import TemporalAnalysis from './TemporalAnalysis.vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const activeTab = ref('summary')
const tabs = [
  { id: 'summary', label: 'Resumen General' },
  { id: 'temporal', label: 'Análisis Temporal' },
  { id: 'geographic', label: 'Análisis Geográfico' },
  { id: 'raw', label: 'Datos Crudos' }
]

const { getGeneralStats, getStatsByLocation, getRawData, getAccumulatedStats, loading: analyticsLoading, error } = useAnalytics()
const { getTimeSeriesCounts, loading: timeSeriesLoading } = useTimeSeries()

const generalStats = ref({
  total: 0,
  activas: 0,
  perdidas: 0,
  provincias: 0,
  comunidades: 0,
  carreteras: 0
})

const locationStats = ref({
  byProvincia: [],
  byComunidad: []
})

const timeSeriesData = ref([])
const accumulatedData = ref([])
const rawData = ref([])
const rawDataTotal = ref(0)
const rawDataOffset = ref(0)
const hasMoreData = ref(false)

const loading = computed(() => analyticsLoading.value || timeSeriesLoading.value)

// Computed para gráficos
const topProvinciasLabels = computed(() => {
  return locationStats.value.byProvincia.slice(0, 10).map(p => p.provincia || 'N/A')
})

const topProvinciasDatasets = computed(() => {
  const data = locationStats.value.byProvincia.slice(0, 10).map(p => parseInt(p.total || 0))
  return [{
    label: 'Total de Balizas',
    data: data,
    backgroundColor: '#007bff'
  }]
})

const locationStatsLabels = computed(() => {
  return locationStats.value.byComunidad.slice(0, 15).map(c => c.comunidad || 'N/A')
})

const locationStatsDatasets = computed(() => {
  const data = locationStats.value.byComunidad.slice(0, 15).map(c => parseInt(c.total || 0))
  return [{
    label: 'Total de Balizas',
    data: data,
    backgroundColor: '#28a745'
  }]
})

const timeSeriesLabels = computed(() => {
  return timeSeriesData.value.map(item => formatDate(item.periodo, 'dd/MM HH:mm'))
})

const accumulatedLabels = computed(() => {
  return accumulatedData.value.map(item => formatDate(item.periodo, 'dd/MM HH:mm'))
})

const timeSeriesDatasets = computed(() => {
  return [
    {
      label: 'Total',
      data: timeSeriesData.value.map(item => parseInt(item.total || 0)),
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)'
    },
    {
      label: 'Activas',
      data: timeSeriesData.value.map(item => parseInt(item.activas || 0)),
      borderColor: '#28a745',
      backgroundColor: 'rgba(40, 167, 69, 0.1)'
    },
    {
      label: 'Perdidas',
      data: timeSeriesData.value.map(item => parseInt(item.perdidas || 0)),
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)'
    },
    {
      label: 'Nuevas',
      data: timeSeriesData.value.map(item => parseInt(item.nuevas || 0)),
      borderColor: '#ffc107',
      backgroundColor: 'rgba(255, 193, 7, 0.1)'
    }
  ]
})

const loadData = async () => {
  try {
    // Estadísticas generales (con todos los filtros)
    const stats = await getGeneralStats(props.filters)
    generalStats.value = stats || {
      total: 0,
      activas: 0,
      perdidas: 0,
      provincias: 0,
      comunidades: 0,
      carreteras: 0
    }

    // Estadísticas por ubicación (con todos los filtros)
    const locationFilters = {
      provincia: props.filters.provincia,
      comunidad: props.filters.comunidad,
      carretera: props.filters.carretera,
      status: props.filters.status,
      fecha_inicio: props.filters.fecha_inicio,
      fecha_fin: props.filters.fecha_fin
    }
    const location = await getStatsByLocation(locationFilters)
    locationStats.value = location || { byProvincia: [], byComunidad: [] }

    // Series temporales (con todos los filtros) - solo si estamos en temporal
    if (activeTab.value === 'temporal') {
      const timeSeriesFilters = {
        agrupacion: props.filters.agrupacion || 'day',
        fecha_inicio: props.filters.fecha_inicio,
        fecha_fin: props.filters.fecha_fin
      }
      const timeSeries = await getTimeSeriesCounts(timeSeriesFilters)
      timeSeriesData.value = timeSeries.data || []

      // Estadísticas acumuladas (con todos los filtros)
      const accumulatedFilters = {
        agrupacion: props.filters.agrupacion || 'day',
        provincia: props.filters.provincia,
        comunidad: props.filters.comunidad,
        carretera: props.filters.carretera,
        status: props.filters.status,
        fecha_inicio: props.filters.fecha_inicio,
        fecha_fin: props.filters.fecha_fin
      }
      const accumulated = await getAccumulatedStats(accumulatedFilters)
      accumulatedData.value = accumulated.data || []
    }

    // Datos crudos (solo si estamos en la pestaña raw)
    if (activeTab.value === 'raw') {
      await loadRawData()
    }
  } catch (err) {
    console.error('Error cargando datos:', err)
    error.value = err.message || 'Error al cargar datos'
  }
}

const loadRawData = async () => {
  try {
    const result = await getRawData(props.filters, 100, rawDataOffset.value)
    if (rawDataOffset.value === 0) {
      rawData.value = result.data || []
    } else {
      rawData.value = [...rawData.value, ...(result.data || [])]
    }
    rawDataTotal.value = result.total || 0
    hasMoreData.value = (rawData.value.length < rawDataTotal.value)
  } catch (err) {
    console.error('Error cargando datos crudos:', err)
  }
}

const loadMoreData = () => {
  rawDataOffset.value += 100
  loadRawData()
}

onMounted(() => {
  loadData()
})

watch(() => props.filters, () => {
  rawDataOffset.value = 0
  loadData()
}, { deep: true })

watch(() => activeTab.value, (newTab) => {
  // Cargar datos específicos de cada pestaña cuando se activa
  if (newTab === 'raw' && rawData.value.length === 0) {
    loadRawData()
  } else if (newTab === 'temporal') {
    // Recargar series temporales y acumuladas
    const loadTemporalData = async () => {
      try {
        const timeSeriesFilters = {
          agrupacion: props.filters.agrupacion || 'day',
          fecha_inicio: props.filters.fecha_inicio,
          fecha_fin: props.filters.fecha_fin
        }
        const timeSeries = await getTimeSeriesCounts(timeSeriesFilters)
        timeSeriesData.value = timeSeries.data || []

        const accumulatedFilters = {
          agrupacion: props.filters.agrupacion || 'day',
          provincia: props.filters.provincia,
          comunidad: props.filters.comunidad,
          carretera: props.filters.carretera,
          status: props.filters.status,
          fecha_inicio: props.filters.fecha_inicio,
          fecha_fin: props.filters.fecha_fin
        }
        const accumulated = await getAccumulatedStats(accumulatedFilters)
        accumulatedData.value = accumulated.data || []
      } catch (err) {
        console.error('Error cargando datos temporales:', err)
      }
    }
    loadTemporalData()
  } else if (newTab === 'geographic' && locationStats.value.byComunidad.length === 0) {
    // Recargar estadísticas geográficas si no hay datos
    const loadGeographicData = async () => {
      try {
        const locationFilters = {
          provincia: props.filters.provincia,
          comunidad: props.filters.comunidad,
          carretera: props.filters.carretera,
          status: props.filters.status,
          fecha_inicio: props.filters.fecha_inicio,
          fecha_fin: props.filters.fecha_fin
        }
        const location = await getStatsByLocation(locationFilters)
        locationStats.value = location || { byProvincia: [], byComunidad: [] }
      } catch (err) {
        console.error('Error cargando datos geográficos:', err)
      }
    }
    loadGeographicData()
  }
})
</script>

<style scoped>
.dashboard {
  width: 100%;
}
</style>

