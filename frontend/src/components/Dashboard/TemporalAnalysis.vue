<template>
  <div class="temporal-analysis">
    <!-- Controles superiores -->
    <div class="analysis-controls card">
      <div class="controls-row">
        <div class="control-group">
          <label>Métricas a mostrar</label>
          <div class="checkbox-group">
            <label v-for="metric in availableMetrics" :key="metric.key">
              <input 
                type="checkbox" 
                v-model="selectedMetrics" 
                :value="metric.key"
                @change="updateCharts"
              />
              <span :style="{ color: metric.color }">{{ metric.label }}</span>
            </label>
          </div>
        </div>
        
        <div class="control-group">
          <label>Vista</label>
          <select v-model="viewMode" @change="updateCharts">
            <option value="combined">Combinada</option>
            <option value="separate">Separada</option>
            <option value="comparison">Comparación</option>
          </select>
        </div>
        
        <div class="control-group">
          <label>Análisis adicional</label>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" v-model="showTrendLine" @change="updateCharts" />
              Línea de tendencia
            </label>
            <label>
              <input type="checkbox" v-model="showMovingAverage" @change="updateCharts" />
              Media móvil (7 períodos)
            </label>
            <label>
              <input type="checkbox" v-model="showPatterns" @change="loadPatternAnalysis" />
              Análisis de patrones
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista combinada -->
    <div v-if="viewMode === 'combined'" class="card">
      <div class="card-header">
        <h3>Evolución Temporal Completa</h3>
        <button class="btn btn-secondary" @click="exportChart('combined')">📥 Exportar</button>
      </div>
      <div v-if="filteredDatasets.length === 0" class="status-message info">
        Selecciona al menos una métrica para visualizar
      </div>
      <CombinedChart
        v-else
        ref="combinedChart"
        :labels="props.timeSeriesLabels"
        :datasets="filteredDatasets"
        :show-trend="showTrendLine"
        :show-moving-average="showMovingAverage"
        :title="'Análisis Temporal Completo'"
      />
    </div>

    <!-- Vista separada -->
    <template v-if="viewMode === 'separate'">
      <div v-if="activeMetrics.length === 0" class="card">
        <div class="status-message info">
          Selecciona al menos una métrica para visualizar
        </div>
      </div>
      <div v-for="metric in activeMetrics" :key="metric.key" class="card">
        <div class="card-header">
          <h3>{{ metric.label }}</h3>
          <button class="btn btn-secondary" @click="exportChart(metric.key)">📥 Exportar</button>
        </div>
        <LineChart
          :ref="`chart-${metric.key}`"
          :labels="props.timeSeriesLabels"
          :datasets="[getSingleMetricDataset(metric)]"
          :title="metric.label"
        />
      </div>
    </template>

    <!-- Vista de comparación -->
    <div v-if="viewMode === 'comparison'" class="card">
      <div class="card-header">
        <h3>Comparación de Períodos</h3>
        <div class="comparison-controls">
          <select v-model="comparisonPeriod" @change="loadComparison">
            <option value="previous">Período anterior</option>
            <option value="last-year">Mismo período año anterior</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
      </div>
      <div v-if="comparisonLabels.length === 0" class="status-message info">
        Cargando datos de comparación...
      </div>
      <ComparisonChart
        v-else
        :labels="comparisonLabels"
        :current-data="currentPeriodData"
        :comparison-data="comparisonPeriodData"
        title="Comparación de Períodos"
      />
    </div>

    <!-- Análisis de patrones -->
    <div v-if="showPatterns" class="card">
      <div class="card-header">
        <h3>Análisis de Patrones Temporales</h3>
      </div>
      <div class="patterns-grid">
        <div class="pattern-card">
          <h4>Por Día de la Semana</h4>
          <BarChart
            :labels="patternData.daysOfWeek.labels"
            :datasets="patternData.daysOfWeek.datasets"
            title="Distribución por Día"
          />
        </div>
        <div class="pattern-card">
          <h4>Por Hora del Día</h4>
          <BarChart
            :labels="patternData.hoursOfDay.labels"
            :datasets="patternData.hoursOfDay.datasets"
            title="Distribución por Hora"
          />
        </div>
      </div>
    </div>

    <!-- Estadísticas de tendencia -->
    <div class="card">
      <div class="card-header">
        <h3>Estadísticas de Tendencia</h3>
      </div>
      <div class="trend-stats">
        <div class="trend-stat" v-for="stat in trendStats" :key="stat.metric">
          <div class="trend-label">{{ stat.label }}</div>
          <div class="trend-value" :class="stat.change > 0 ? 'positive' : 'negative'">
            {{ stat.value }}
            <span class="trend-change">
              ({{ stat.change > 0 ? '+' : '' }}{{ stat.change }}%)
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas y cambios significativos -->
    <div v-if="alerts.length > 0" class="card">
      <div class="card-header">
        <h3>⚠️ Alertas y Cambios Significativos</h3>
      </div>
      <div class="alerts-list">
        <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="alert.type">
          <strong>{{ alert.title }}</strong>
          <p>{{ alert.message }}</p>
          <small>{{ formatDate(alert.timestamp) }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTimeSeries } from '../../composables/useTimeSeries'
import { formatDate } from '../../utils/dateUtils'
import LineChart from '../Charts/LineChart.vue'
import BarChart from '../Charts/BarChart.vue'
import CombinedChart from '../Charts/CombinedChart.vue'
import ComparisonChart from '../Charts/ComparisonChart.vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  timeSeriesData: {
    type: Array,
    default: () => []
  },
  timeSeriesLabels: {
    type: Array,
    default: () => []
  }
})

const { getTimeSeriesCounts, getTimeSeriesLocations, getTimePatterns, getComparisonData, getTrendStats } = useTimeSeries()

const selectedMetrics = ref(['total', 'activas', 'perdidas'])
const viewMode = ref('combined')
const showTrendLine = ref(false)
const showMovingAverage = ref(false)
const showPatterns = ref(false)
const comparisonPeriod = ref('previous')

const availableMetrics = [
  { key: 'total', label: 'Total', color: '#007bff' },
  { key: 'activas', label: 'Activas', color: '#28a745' },
  { key: 'perdidas', label: 'Perdidas', color: '#dc3545' },
  { key: 'nuevas', label: 'Nuevas', color: '#ffc107' }
]

const patternData = ref({
  daysOfWeek: { labels: [], datasets: [] },
  hoursOfDay: { labels: [], datasets: [] }
})

const comparisonLabels = ref([])
const currentPeriodData = ref([])
const comparisonPeriodData = ref([])

const alerts = ref([])
const trendStats = ref([])

const activeMetrics = computed(() => {
  return availableMetrics.filter(m => selectedMetrics.value.includes(m.key))
})

const filteredDatasets = computed(() => {
  if (!props.timeSeriesData || props.timeSeriesData.length === 0) {
    return []
  }
  
  const datasets = []
  
  if (selectedMetrics.value.includes('total')) {
    datasets.push({
      label: 'Total',
      data: props.timeSeriesData.map(d => parseInt(d.total || 0)),
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)'
    })
  }
  
  if (selectedMetrics.value.includes('activas')) {
    datasets.push({
      label: 'Activas',
      data: props.timeSeriesData.map(d => parseInt(d.activas || 0)),
      borderColor: '#28a745',
      backgroundColor: 'rgba(40, 167, 69, 0.1)'
    })
  }
  
  if (selectedMetrics.value.includes('perdidas')) {
    datasets.push({
      label: 'Perdidas',
      data: props.timeSeriesData.map(d => parseInt(d.perdidas || 0)),
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)'
    })
  }
  
  if (selectedMetrics.value.includes('nuevas')) {
    datasets.push({
      label: 'Nuevas',
      data: props.timeSeriesData.map(d => parseInt(d.nuevas || 0)),
      borderColor: '#ffc107',
      backgroundColor: 'rgba(255, 193, 7, 0.1)'
    })
  }
  
  return datasets
})

const getSingleMetricDataset = (metric) => {
  const metricKey = metric.key === 'total' ? 'total' : 
                   metric.key === 'activas' ? 'activas' :
                   metric.key === 'perdidas' ? 'perdidas' : 'nuevas'
  
  return {
    label: metric.label,
    data: props.timeSeriesData.map(d => parseInt(d[metricKey] || 0)),
    borderColor: metric.color,
    backgroundColor: `${metric.color}20`
  }
}

const updateCharts = () => {
  // Los gráficos se actualizarán automáticamente por reactividad
}

const loadPatternAnalysis = async () => {
  if (!showPatterns.value) return
  
  try {
    // Análisis por día de la semana
    const daysData = await getTimePatterns({
      ...props.filters,
      tipo: 'day-of-week'
    })
    
    // Análisis por hora del día
    const hoursData = await getTimePatterns({
      ...props.filters,
      tipo: 'hour-of-day'
    })
    
    patternData.value = {
      daysOfWeek: {
        labels: daysData.labels || ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        datasets: [{
          label: 'Total de Balizas',
          data: daysData.data || [],
          backgroundColor: '#007bff'
        }]
      },
      hoursOfDay: {
        labels: hoursData.labels || Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{
          label: 'Total de Balizas',
          data: hoursData.data || [],
          backgroundColor: '#28a745'
        }]
      }
    }
  } catch (error) {
    console.error('Error cargando análisis de patrones:', error)
  }
}

const loadComparison = async () => {
  try {
    const comparison = await getComparisonData({
      ...props.filters,
      agrupacion: props.filters.agrupacion || 'day',
      comparison_type: comparisonPeriod.value
    })
    
    // Alinear labels y datos
    const allLabels = new Set()
    comparison.current.forEach(item => allLabels.add(item.periodo))
    comparison.comparison.forEach(item => allLabels.add(item.periodo))
    
    comparisonLabels.value = Array.from(allLabels).sort()
    
    // Mapear datos a labels
    const currentMap = new Map(comparison.current.map(item => [item.periodo, item.total]))
    const comparisonMap = new Map(comparison.comparison.map(item => [item.periodo, item.total]))
    
    currentPeriodData.value = comparisonLabels.value.map(label => currentMap.get(label) || 0)
    comparisonPeriodData.value = comparisonLabels.value.map(label => comparisonMap.get(label) || 0)
  } catch (error) {
    console.error('Error cargando comparación:', error)
  }
}

const calculateTrendStats = async () => {
  try {
    const trends = await getTrendStats({
      fecha_inicio: props.filters.fecha_inicio,
      fecha_fin: props.filters.fecha_fin
    })
    
    trendStats.value = [
      {
        metric: 'total',
        label: 'Cambio Total',
        value: trends.total.last,
        change: trends.total.change
      },
      {
        metric: 'activas',
        label: 'Cambio Activas',
        value: trends.activas.last,
        change: trends.activas.change
      },
      {
        metric: 'perdidas',
        label: 'Cambio Perdidas',
        value: trends.perdidas.last,
        change: trends.perdidas.change
      },
      {
        metric: 'nuevas',
        label: 'Nuevas',
        value: trends.nuevas.last,
        change: trends.nuevas.change
      }
    ]
    
    // Detectar alertas
    detectAlerts()
  } catch (error) {
    console.error('Error calculando tendencias:', error)
    // Fallback a cálculo local si falla
    if (props.timeSeriesData.length >= 2) {
      const first = props.timeSeriesData[0]
      const last = props.timeSeriesData[props.timeSeriesData.length - 1]
      
      trendStats.value = [
        {
          metric: 'total',
          label: 'Cambio Total',
          value: parseInt(last.total || 0),
          change: calculatePercentageChange(first.total, last.total)
        },
        {
          metric: 'activas',
          label: 'Cambio Activas',
          value: parseInt(last.activas || 0),
          change: calculatePercentageChange(first.activas, last.activas)
        },
        {
          metric: 'perdidas',
          label: 'Cambio Perdidas',
          value: parseInt(last.perdidas || 0),
          change: calculatePercentageChange(first.perdidas, last.perdidas)
        }
      ]
      detectAlerts()
    }
  }
}

const calculatePercentageChange = (oldValue, newValue) => {
  if (!oldValue || oldValue === 0) return newValue > 0 ? 100 : 0
  return Math.round(((newValue - oldValue) / oldValue) * 100)
}

const detectAlerts = () => {
  alerts.value = []
  
  // Detectar cambios significativos (>50%)
  trendStats.value.forEach(stat => {
    if (Math.abs(stat.change) > 50) {
      alerts.value.push({
        id: `alert-${stat.metric}`,
        type: stat.change > 0 ? 'warning' : 'danger',
        title: `Cambio significativo en ${stat.label}`,
        message: `Se detectó un cambio del ${stat.change}% en ${stat.label}`,
        timestamp: new Date()
      })
    }
  })
}

const exportChart = (chartId) => {
  // Implementar exportación de gráfico
  console.log('Exportando gráfico:', chartId)
}

watch(() => [props.timeSeriesData, props.filters], () => {
  calculateTrendStats()
  if (viewMode.value === 'comparison') {
    loadComparison()
  }
}, { deep: true })

watch(() => viewMode.value, (newMode) => {
  if (newMode === 'comparison') {
    loadComparison()
  }
})

watch(() => comparisonPeriod.value, () => {
  if (viewMode.value === 'comparison') {
    loadComparison()
  }
})

onMounted(() => {
  calculateTrendStats()
  if (viewMode.value === 'comparison') {
    loadComparison()
  }
})
</script>

<style scoped>
.temporal-analysis {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.analysis-controls {
  margin-bottom: 1rem;
}

.controls-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
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

.patterns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.pattern-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
}

.trend-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.trend-stat {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.trend-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.trend-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.trend-value.positive {
  color: #28a745;
}

.trend-value.negative {
  color: #dc3545;
}

.trend-change {
  font-size: 0.9rem;
  font-weight: normal;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid;
}

.alert-item.warning {
  background: #fff3cd;
  border-color: #ffc107;
}

.alert-item.danger {
  background: #f8d7da;
  border-color: #dc3545;
}

.comparison-controls {
  display: flex;
  gap: 0.5rem;
}
</style>

