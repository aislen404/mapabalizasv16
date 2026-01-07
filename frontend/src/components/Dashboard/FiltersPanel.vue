<template>
  <div class="filters-panel">
    <h3>Filtros</h3>

    <div class="form-group">
      <label>Período</label>
      <select v-model="localFilters.periodo" @change="handlePeriodChange">
        <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div v-if="localFilters.periodo === 'custom'" class="form-group">
      <label>Fecha Inicio</label>
      <input
        type="datetime-local"
        v-model="localFilters.fecha_inicio"
        @change="emitFilters"
      />
    </div>

    <div v-if="localFilters.periodo === 'custom'" class="form-group">
      <label>Fecha Fin</label>
      <input
        type="datetime-local"
        v-model="localFilters.fecha_fin"
        @change="emitFilters"
      />
    </div>

    <div class="form-group">
      <label>Agrupación Temporal</label>
      <select v-model="localFilters.agrupacion" @change="emitFilters">
        <option v-for="opt in groupingOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label>Comunidad Autónoma</label>
      <select v-model="localFilters.comunidad" @change="handleComunidadChange">
        <option value="todas">Todas</option>
        <option 
          v-for="comunidad in comunidades" 
          :key="comunidad"
          :value="comunidad"
        >
          {{ comunidad }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label>Provincia</label>
      <select v-model="localFilters.provincia" @change="emitFilters">
        <option value="todas">Todas</option>
        <option 
          v-for="provincia in provincias" 
          :key="provincia"
          :value="provincia"
        >
          {{ provincia }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label>Carretera</label>
      <input
        type="text"
        v-model="localFilters.carretera"
        @input="emitFilters"
        placeholder="Ej: A-1, AP-7..."
      />
    </div>

    <div class="form-group">
      <label>Estado</label>
      <select v-model="localFilters.status" @change="emitFilters">
        <option value="todas">Todas</option>
        <option value="active">Activas</option>
        <option value="lost">Perdidas</option>
      </select>
    </div>

    <button class="btn btn-secondary btn-block" @click="clearFilters">
      Limpiar Filtros
    </button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getPeriodOptions, getGroupingOptions, getPeriodRange } from '../../utils/dateUtils'
import { useAnalytics } from '../../composables/useAnalytics'

const props = defineProps({
  filters: {
    type: Object,
    required: true,
    default: () => ({
      provincia: 'todas',
      comunidad: 'todas',
      carretera: '',
      status: 'todas',
      periodo: 'last-7d',
      agrupacion: 'day',
      fecha_inicio: null,
      fecha_fin: null
    })
  }
})

const emit = defineEmits(['update:filters'])

const { getProvinciasList, getComunidadesList } = useAnalytics()

const localFilters = ref({ ...props.filters })
const periodOptions = getPeriodOptions()
const groupingOptions = getGroupingOptions()

const comunidades = ref([])
const provincias = ref([])

const loadLocations = async () => {
  try {
    // Cargar comunidades
    const comunidadesData = await getComunidadesList({
      fecha_inicio: localFilters.value.fecha_inicio,
      fecha_fin: localFilters.value.fecha_fin
    })
    comunidades.value = comunidadesData || []
    
    // Cargar provincias (filtradas por comunidad si está seleccionada)
    const provinciasData = await getProvinciasList({
      comunidad: localFilters.value.comunidad !== 'todas' ? localFilters.value.comunidad : null,
      fecha_inicio: localFilters.value.fecha_inicio,
      fecha_fin: localFilters.value.fecha_fin
    })
    provincias.value = provinciasData || []
  } catch (error) {
    console.error('Error cargando ubicaciones:', error)
    comunidades.value = []
    provincias.value = []
  }
}

const handlePeriodChange = () => {
  if (localFilters.value.periodo === 'custom') {
    // Mantener fechas personalizadas si ya existen
    if (!localFilters.value.fecha_inicio) {
      const now = new Date()
      localFilters.value.fecha_fin = now.toISOString().slice(0, 16)
      localFilters.value.fecha_inicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    }
  } else {
    const range = getPeriodRange(localFilters.value.periodo)
    localFilters.value.fecha_inicio = range.inicio
    localFilters.value.fecha_fin = range.fin
  }
  emitFilters()
  loadLocations()
}

const handleComunidadChange = () => {
  // Resetear provincia cuando cambia la comunidad
  localFilters.value.provincia = 'todas'
  emitFilters()
  loadLocations()
}

const emitFilters = () => {
  emit('update:filters', { ...localFilters.value })
}

const clearFilters = () => {
  localFilters.value = {
    provincia: 'todas',
    comunidad: 'todas',
    carretera: '',
    status: 'todas',
    periodo: 'last-7d',
    agrupacion: 'day',
    fecha_inicio: null,
    fecha_fin: null
  }
  handlePeriodChange()
}

onMounted(() => {
  loadLocations()
})

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
  loadLocations()
}, { deep: true })
</script>

<style scoped>
.filters-panel {
  background: white;
  border-radius: 8px;
  padding: 1rem;
}

.filters-panel h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
}
</style>

