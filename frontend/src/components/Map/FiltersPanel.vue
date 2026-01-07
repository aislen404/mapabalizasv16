<template>
  <div class="filters-panel">
    <h3>Filtros</h3>
    
    <div class="form-group">
      <label for="filter-comunidad">Comunidad Autónoma</label>
      <select 
        id="filter-comunidad"
        v-model="localFilters.comunidad"
        @change="emitFilters"
      >
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
      <label for="filter-provincia">Provincia</label>
      <select 
        id="filter-provincia"
        v-model="localFilters.provincia"
        @change="emitFilters"
      >
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
      <label for="filter-carretera">Carretera</label>
      <input
        id="filter-carretera"
        type="text"
        v-model="localFilters.carretera"
        @input="emitFilters"
        placeholder="Ej: A-1, AP-7..."
      />
    </div>

    <div class="form-group">
      <label for="filter-estado">Estado</label>
      <select 
        id="filter-estado"
        v-model="localFilters.estado"
        @change="emitFilters"
      >
        <option value="todas">Todas</option>
        <option value="active">Activas</option>
        <option value="lost">Perdidas</option>
      </select>
    </div>

    <button 
      class="btn btn-secondary btn-block"
      @click="clearFilters"
    >
      Limpiar Filtros
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getComunidades, getProvincias } from '../../utils/filters'

const props = defineProps({
  balizas: {
    type: Array,
    required: true,
    default: () => []
  },
  filters: {
    type: Object,
    required: true,
    default: () => ({
      provincia: 'todas',
      comunidad: 'todas',
      carretera: '',
      estado: 'todas'
    })
  }
})

const emit = defineEmits(['update:filters'])

const localFilters = ref({ ...props.filters })

const comunidades = computed(() => getComunidades(props.balizas))
const provincias = computed(() => getProvincias(props.balizas))

const emitFilters = () => {
  emit('update:filters', { ...localFilters.value })
}

const clearFilters = () => {
  localFilters.value = {
    provincia: 'todas',
    comunidad: 'todas',
    carretera: '',
    estado: 'todas'
  }
  emitFilters()
}

// Sincronizar con props externos
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })
</script>

<style scoped>
.filters-panel {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
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

