<template>
  <div class="search-bar">
    <h3>Búsqueda</h3>
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        :value="modelValue"
        @input="handleInput"
        placeholder="Buscar por carretera, municipio, provincia..."
        class="form-control"
      />
    </div>
    <div v-if="modelValue" class="search-results-info">
      <small>Buscando: "{{ modelValue }}"</small>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'search'])

let debounceTimer = null

const handleInput = (event) => {
  const value = event.target.value
  emit('update:modelValue', value)
  
  // Debounce para búsqueda en tiempo real
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  debounceTimer = setTimeout(() => {
    emit('search', value)
  }, 300) // 300ms de delay
}
</script>

<style scoped>
.search-bar {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
}

.search-bar h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
}

.search-input-wrapper {
  position: relative;
}

.search-input-wrapper input {
  width: 100%;
  padding: 0.5rem;
  padding-left: 2.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.search-input-wrapper input:focus {
  outline: 0;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  pointer-events: none;
  font-size: 1rem;
}

.search-results-info {
  margin-top: 0.5rem;
  color: #6c757d;
  font-size: 0.85rem;
}
</style>

