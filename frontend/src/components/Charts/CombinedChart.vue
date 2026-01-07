<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
)

const props = defineProps({
  labels: {
    type: Array,
    required: true,
    default: () => []
  },
  datasets: {
    type: Array,
    required: true,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  },
  showTrend: {
    type: Boolean,
    default: false
  },
  showMovingAverage: {
    type: Boolean,
    default: false
  }
})

const chartCanvas = ref(null)
let chartInstance = null

// Calcular línea de tendencia (regresión lineal simple)
const calculateTrendLine = (data) => {
  if (data.length < 2) return data
  
  const n = data.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  
  data.forEach((y, x) => {
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  })
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  return data.map((_, x) => slope * x + intercept)
}

// Calcular media móvil
const calculateMovingAverage = (data, period = 7) => {
  if (data.length < period) return data
  
  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null) // No hay suficientes datos
    } else {
      const slice = data.slice(i - period + 1, i + 1)
      const sum = slice.reduce((a, b) => a + b, 0)
      result.push(sum / period)
    }
  }
  return result
}

const createChart = () => {
  if (!chartCanvas.value) return
  
  if (!props.datasets || props.datasets.length === 0) {
    return
  }

  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  
  // Preparar datasets
  const chartDatasets = [...props.datasets]
  
  // Agregar líneas de tendencia si está habilitado
  if (props.showTrend && props.datasets.length > 0) {
    props.datasets.forEach((dataset, index) => {
      const trendData = calculateTrendLine(dataset.data)
      chartDatasets.push({
        label: `${dataset.label} (Tendencia)`,
        data: trendData,
        borderColor: dataset.borderColor,
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0
      })
    })
  }
  
  // Agregar medias móviles si está habilitado
  if (props.showMovingAverage && props.datasets.length > 0) {
    props.datasets.forEach((dataset, index) => {
      const movingAvg = calculateMovingAverage(dataset.data, 7)
      chartDatasets.push({
        label: `${dataset.label} (Media Móvil)`,
        data: movingAvg,
        borderColor: dataset.borderColor,
        borderDash: [10, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.3
      })
    })
  }
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: chartDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: !!props.title,
          text: props.title,
          font: {
            size: 16
          }
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || ''
              if (label) {
                label += ': '
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toLocaleString('es-ES')
              }
              return label
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Período'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Cantidad'
          },
          beginAtZero: true
        }
      }
    }
  })
}

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

watch(() => [props.labels, props.datasets, props.showTrend, props.showMovingAverage], () => {
  if (chartInstance) {
    createChart()
  } else {
    createChart()
  }
}, { deep: true })
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  margin: 1rem 0;
}
</style>

