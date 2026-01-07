<template>
  <div class="table-container">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    <div v-else-if="error" class="error-message">
      Error: {{ error }}
    </div>
    <div v-else>
      <h3>Historial de Cambios</h3>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Carretera</th>
            <th>PK</th>
            <th>Tipo de Cambio</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data" :key="item.id">
            <td>{{ formatDate(item.changed_at) }}</td>
            <td>
              <span class="badge" :class="item.status === 'active' ? 'badge-success' : 'badge-danger'">
                {{ item.status === 'active' ? 'Activa' : 'Perdida' }}
              </span>
            </td>
            <td>{{ item.carretera || 'N/A' }}</td>
            <td>{{ item.pk || 'N/A' }}</td>
            <td>
              <span class="badge badge-info">
                {{ item.change_type || 'status_change' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="data.length === 0" class="empty-message">
        No hay historial para mostrar
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
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
})
</script>

<style scoped>
.table-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
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

