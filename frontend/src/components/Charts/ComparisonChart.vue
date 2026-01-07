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
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
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
  currentData: {
    type: Array,
    required: true,
    default: () => []
  },
  comparisonData: {
    type: Array,
    required: true,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const createChart = () => {
  if (!chartCanvas.value) return

  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Período Actual',
          data: props.currentData,
          backgroundColor: 'rgba(0, 123, 255, 0.6)',
          borderColor: '#007bff',
          borderWidth: 1
        },
        {
          label: 'Período de Comparación',
          data: props.comparisonData,
          backgroundColor: 'rgba(108, 117, 125, 0.6)',
          borderColor: '#6c757d',
          borderWidth: 1
        }
      ]
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
              
              // Calcular diferencia si hay datos de comparación
              if (context.datasetIndex === 0 && props.comparisonData[context.dataIndex] !== undefined) {
                const current = context.parsed.y
                const comparison = props.comparisonData[context.dataIndex]
                const diff = current - comparison
                const percent = comparison !== 0 ? ((diff / comparison) * 100).toFixed(1) : 0
                label += ` (${diff > 0 ? '+' : ''}${diff}, ${percent > 0 ? '+' : ''}${percent}%)`
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

watch(() => [props.labels, props.currentData, props.comparisonData], () => {
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

