<template>
  <div class="app">
    <Sidebar 
      :active-view="activeView"
      @update:view="setView"
    />
    
    <div class="app-main">
      <MapView v-if="activeView === 'map'" />
      <DashboardView v-if="activeView === 'dashboard'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/Shared/Sidebar.vue'
import MapView from './views/MapView.vue'
import DashboardView from './views/DashboardView.vue'

const activeView = ref('map')

const setView = (view) => {
  activeView.value = view
}
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-left: 0;
  transition: margin-left 0.3s ease;
}
</style>
