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
  Title,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  xLabels: {
    type: Array,
    required: true,
    default: () => []
  },
  yLabels: {
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
  
  // Convertir datos a formato de barras agrupadas
  const datasets = props.yLabels.map((yLabel, yIndex) => {
    const values = props.xLabels.map((xLabel, xIndex) => {
      const item = props.data.find(d => d.x === xIndex && d.y === yIndex)
      return item ? item.value : 0
    })
    
    return {
      label: yLabel,
      data: values,
      backgroundColor: `hsl(${220 + yIndex * 30}, 70%, 50%)`
    }
  })
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.xLabels,
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
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}`
            }
          }
        }
      },
      scales: {
        x: {
          stacked: false
        },
        y: {
          beginAtZero: true,
          stacked: false
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

watch(() => [props.data, props.xLabels, props.yLabels], () => {
  if (chartInstance) {
    createChart()
  }
}, { deep: true })
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 500px;
}
</style>

