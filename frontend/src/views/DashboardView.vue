<template>
  <div class="dashboard-view">
    <header class="view-header">
      <h1>Balizas V16 - Dashboard y Data Análisis</h1>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="refreshData" :disabled="loading">
          🔄 Actualizar
        </button>
      </div>
    </header>

    <div class="view-content">
      <aside class="dashboard-sidebar">
        <FiltersPanel
          :filters="filters"
          @update:filters="handleFiltersUpdate"
        />
      </aside>

      <main class="dashboard-content">
        <Dashboard
          :filters="filters"
          :loading="loading"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Dashboard from '../components/Dashboard/Dashboard.vue'
import FiltersPanel from '../components/Dashboard/FiltersPanel.vue'

const filters = ref({
  provincia: 'todas',
  comunidad: 'todas',
  carretera: '',
  status: 'todas',
  periodo: 'last-7d',
  agrupacion: 'day',
  fecha_inicio: null,
  fecha_fin: null
})

const loading = ref(false)

const handleFiltersUpdate = (newFilters) => {
  filters.value = { ...newFilters }
}

const refreshData = () => {
  loading.value = true
  // Forzar actualización de componentes
  setTimeout(() => {
    loading.value = false
  }, 500)
}
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.view-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.view-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.view-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.dashboard-sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #dee2e6;
  overflow-y: auto;
  padding: 1rem;
}

.dashboard-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}
</style>

