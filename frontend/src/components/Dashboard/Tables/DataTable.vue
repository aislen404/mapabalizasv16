<template>
  <div class="table-container">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    <div v-else-if="error" class="error-message">
      Error: {{ error }}
    </div>
    <div v-else>
      <div class="table-header">
        <h3>Datos ({{ total }} registros)</h3>
        <div class="table-actions">
          <button class="btn btn-primary" @click="loadMore" :disabled="loading || !hasMore">
            Cargar más
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Estado</th>
            <th>Carretera</th>
            <th>PK</th>
            <th>Provincia</th>
            <th>Municipio</th>
            <th>Última Vista</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data" :key="item.id">
            <td>{{ item.id }}</td>
            <td>
              <span class="badge" :class="item.status === 'active' ? 'badge-success' : 'badge-danger'">
                {{ item.status === 'active' ? 'Activa' : 'Perdida' }}
              </span>
            </td>
            <td>{{ item.carretera || 'N/A' }}</td>
            <td>{{ item.pk || 'N/A' }}</td>
            <td>{{ item.provincia || 'N/A' }}</td>
            <td>{{ item.municipio || 'N/A' }}</td>
            <td>{{ formatDate(item.last_seen) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="data.length === 0" class="empty-message">
        No hay datos para mostrar
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '../../../utils/dateUtils'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  hasMore: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['load-more'])

const loadMore = () => {
  emit('load-more')
}
</script>

<style scoped>
.table-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-header h3 {
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-message {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.error-message {
  padding: 1rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  text-align: center;
}
</style>

