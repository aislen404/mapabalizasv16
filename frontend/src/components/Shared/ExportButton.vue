<template>
  <div class="export-button-wrapper">
    <button 
      class="btn btn-secondary btn-block"
      @click="showMenu = !showMenu"
    >
      📥 Exportar Datos
    </button>
    
    <div v-if="showMenu" class="export-menu">
      <button 
        class="export-option"
        @click="exportJSON"
      >
        Exportar como JSON
      </button>
      <button 
        class="export-option"
        @click="exportCSV"
      >
        Exportar como CSV
      </button>
      <div class="export-info">
        <small>{{ balizas.length }} baliza(s) a exportar</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { exportToJSON, exportToCSV } from '../../utils/export'

const props = defineProps({
  balizas: {
    type: Array,
    required: true,
    default: () => []
  }
})

const showMenu = ref(false)

const exportJSON = () => {
  const timestamp = new Date().toISOString().split('T')[0]
  exportToJSON(props.balizas, `balizas-${timestamp}`)
  showMenu.value = false
}

const exportCSV = () => {
  const timestamp = new Date().toISOString().split('T')[0]
  exportToCSV(props.balizas, `balizas-${timestamp}`)
  showMenu.value = false
}

// Cerrar menú al hacer click fuera
const handleClickOutside = (event) => {
  if (!event.target.closest('.export-button-wrapper')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.export-button-wrapper {
  position: relative;
}

.export-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 0.5rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1000;
  overflow: hidden;
}

.export-option {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.9rem;
}

.export-option:hover {
  background: #f8f9fa;
}

.export-option:first-child {
  border-bottom: 1px solid #dee2e6;
}

.export-info {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  color: #6c757d;
  font-size: 0.85rem;
}
</style>

