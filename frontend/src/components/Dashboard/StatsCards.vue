<template>
  <div class="stats-grid">
    <div class="stat-card primary">
      <div class="stat-label">Total de Balizas</div>
      <div class="stat-value">{{ formatNumber(stats.total) }}</div>
      <div v-if="accumulatedTotal > 0" class="stat-change positive">
        Acumulado: {{ formatAccumulated(accumulatedTotal) }}
      </div>
      <div v-else-if="statsChange" class="stat-change" :class="statsChange.total > 0 ? 'positive' : 'negative'">
        {{ statsChange.total > 0 ? '+' : '' }}{{ statsChange.total }}
      </div>
      <div v-else class="stat-change">
        {{ stats.total > 0 ? ((stats.activas / stats.total) * 100).toFixed(1) + '% activas' : 'Sin datos' }}
      </div>
    </div>

    <div class="stat-card success">
      <div class="stat-label">Activas</div>
      <div class="stat-value">{{ formatNumber(stats.activas) }}</div>
      <div v-if="accumulatedActivas > 0" class="stat-change positive">
        Acumulado: {{ formatAccumulated(accumulatedActivas) }}
      </div>
      <div v-else class="stat-change positive">
        {{ stats.total > 0 ? ((stats.activas / stats.total) * 100).toFixed(1) + '%' : '0%' }}
      </div>
    </div>

    <div class="stat-card danger">
      <div class="stat-label">Perdidas</div>
      <div class="stat-value">{{ formatNumber(stats.perdidas) }}</div>
      <div v-if="accumulatedPerdidas > 0" class="stat-change negative">
        Acumulado: {{ formatAccumulated(accumulatedPerdidas) }}
      </div>
      <div v-else class="stat-change negative">
        {{ stats.total > 0 ? ((stats.perdidas / stats.total) * 100).toFixed(1) + '%' : '0%' }}
      </div>
    </div>

    <div class="stat-card warning">
      <div class="stat-label">Provincias</div>
      <div class="stat-value">{{ formatNumber(stats.provincias) }}</div>
      <div v-if="totalChange > 0" class="stat-change positive">
        Cambio: +{{ formatNumber(totalChange) }}
      </div>
    </div>

    <div class="stat-card primary">
      <div class="stat-label">Comunidades</div>
      <div class="stat-value">{{ formatNumber(stats.comunidades) }}</div>
    </div>

    <div class="stat-card success">
      <div class="stat-label">Carreteras</div>
      <div class="stat-value">{{ formatNumber(stats.carreteras) }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getLastAccumulatedValue, calculateTotalChange, formatAccumulatedValue } from '../../utils/analyticsUtils'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      total: 0,
      activas: 0,
      perdidas: 0,
      provincias: 0,
      comunidades: 0,
      carreteras: 0
    })
  },
  statsChange: {
    type: Object,
    default: null
  },
  accumulatedData: {
    type: Array,
    default: () => []
  }
})

const accumulatedTotal = computed(() => {
  return getLastAccumulatedValue(props.accumulatedData, 'acumulado_total')
})

const accumulatedActivas = computed(() => {
  return getLastAccumulatedValue(props.accumulatedData, 'acumulado_activas')
})

const accumulatedPerdidas = computed(() => {
  return getLastAccumulatedValue(props.accumulatedData, 'acumulado_perdidas')
})

const totalChange = computed(() => {
  if (props.accumulatedData.length === 0) return 0
  return calculateTotalChange(props.accumulatedData, 'acumulado_total')
})

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return parseInt(num).toLocaleString('es-ES')
}

const formatAccumulated = (value) => {
  return formatAccumulatedValue(value)
}
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
</style>

