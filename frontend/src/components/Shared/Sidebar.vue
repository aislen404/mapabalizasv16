<template>
  <aside :class="['sidebar', { collapsed: isCollapsed }]">
    <div class="sidebar-header">
      <h2>Balizas V16</h2>
      <button class="sidebar-toggle" @click="toggleSidebar" :aria-label="isCollapsed ? 'Expandir' : 'Colapsar'">
        {{ isCollapsed ? '☰' : '✕' }}
      </button>
    </div>
    
    <nav class="sidebar-nav">
      <button
        :class="['nav-item', { active: activeView === 'map' }]"
        @click="setView('map')"
      >
        <span class="nav-icon">🗺️</span>
        <span class="nav-label">Mapa Interactivo</span>
      </button>
      
      <button
        :class="['nav-item', { active: activeView === 'dashboard' }]"
        @click="setView('dashboard')"
      >
        <span class="nav-icon">📊</span>
        <span class="nav-label">Dashboard y Análisis</span>
      </button>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  activeView: {
    type: String,
    required: true,
    default: 'map'
  }
})

const emit = defineEmits(['update:view'])

const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const setView = (view) => {
  emit('update:view', view)
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  box-shadow: 2px 0 4px rgba(0,0,0,0.1);
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.25rem;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar.collapsed .sidebar-header h2 {
  display: none;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: transform 0.2s;
}

.sidebar-toggle:hover {
  transform: scale(1.1);
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  background: none;
  border: none;
  color: rgba(255,255,255,0.8);
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-item.active {
  background: rgba(0, 123, 255, 0.2);
  color: white;
  border-left-color: #007bff;
}

.nav-icon {
  font-size: 1.5rem;
  min-width: 24px;
  text-align: center;
}

.nav-label {
  font-size: 0.95rem;
  font-weight: 500;
}

.sidebar.collapsed .nav-label {
  display: none;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 1rem 0.5rem;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transform: translateX(0);
    transition: transform 0.3s ease;
  }
  
  .sidebar.collapsed {
    transform: translateX(-100%);
    width: 250px;
  }
}
</style>

