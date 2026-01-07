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
  
  // Preparar datasets con fill
  const datasetsWithFill = props.datasets.map(dataset => ({
    ...dataset,
    fill: true,
    tension: 0.4
  }))
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: datasetsWithFill
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
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          stacked: false
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

watch(() => [props.labels, props.datasets], () => {
  if (chartInstance) {
    chartInstance.data.labels = props.labels
    chartInstance.data.datasets = props.datasets.map(dataset => ({
      ...dataset,
      fill: true,
      tension: 0.4
    }))
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

