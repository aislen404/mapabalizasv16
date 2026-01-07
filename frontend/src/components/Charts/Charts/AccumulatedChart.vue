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
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(
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
  data: {
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
  
  // Preparar datasets con acumulación
  const datasets = [
    {
      label: 'Total Acumulado',
      data: props.data.map(item => parseInt(item.acumulado_total || 0)),
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Activas Acumuladas',
      data: props.data.map(item => parseInt(item.acumulado_activas || 0)),
      borderColor: '#28a745',
      backgroundColor: 'rgba(40, 167, 69, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Perdidas Acumuladas',
      data: props.data.map(item => parseInt(item.acumulado_perdidas || 0)),
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Nuevas Acumuladas',
      data: props.data.map(item => parseInt(item.acumulado_nuevas || 0)),
      borderColor: '#ffc107',
      backgroundColor: 'rgba(255, 193, 7, 0.1)',
      fill: true,
      tension: 0.4
    }
  ]
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!props.title,
          text: props.title
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const value = context.parsed.y
              return `${context.dataset.label}: ${value.toLocaleString('es-ES')}`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M'
              } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K'
              }
              return value
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
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

watch(() => [props.labels, props.data], () => {
  if (chartInstance) {
    chartInstance.data.labels = props.labels
    chartInstance.data.datasets = [
      {
        label: 'Total Acumulado',
        data: props.data.map(item => parseInt(item.acumulado_total || 0)),
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Activas Acumuladas',
        data: props.data.map(item => parseInt(item.acumulado_activas || 0)),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Perdidas Acumuladas',
        data: props.data.map(item => parseInt(item.acumulado_perdidas || 0)),
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Nuevas Acumuladas',
        data: props.data.map(item => parseInt(item.acumulado_nuevas || 0)),
        borderColor: '#ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
    chartInstance.update()
  } else {
    createChart()
  }
}, { deep: true })
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
}
</style>

