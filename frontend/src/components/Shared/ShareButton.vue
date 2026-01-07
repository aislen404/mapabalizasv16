<template>
  <button 
    class="btn btn-success btn-block"
    @click="shareLink"
    :disabled="sharing"
  >
    <span v-if="sharing">Copiando...</span>
    <span v-else-if="copied">✓ Enlace copiado</span>
    <span v-else>🔗 Compartir Enlace</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const sharing = ref(false)
const copied = ref(false)

const shareLink = async () => {
  sharing.value = true
  copied.value = false

  try {
    // Construir URL con parámetros de filtros
    const url = new URL(window.location.href.split('?')[0])
    
    if (props.filters.provincia && props.filters.provincia !== 'todas') {
      url.searchParams.set('provincia', props.filters.provincia)
    }
    
    if (props.filters.comunidad && props.filters.comunidad !== 'todas') {
      url.searchParams.set('comunidad', props.filters.comunidad)
    }
    
    if (props.filters.carretera && props.filters.carretera.trim() !== '') {
      url.searchParams.set('carretera', props.filters.carretera)
    }
    
    if (props.filters.estado && props.filters.estado !== 'todas') {
      url.searchParams.set('estado', props.filters.estado)
    }

    const shareUrl = url.toString()

    // Intentar usar Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl)
      copied.value = true
      
      // Resetear mensaje después de 2 segundos
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } else {
      // Fallback: mostrar URL en un prompt
      const userInput = prompt('Copia este enlace:', shareUrl)
      if (userInput) {
        copied.value = true
        setTimeout(() => {
          copied.value = false
        }, 2000)
      }
    }
  } catch (error) {
    console.error('Error compartiendo enlace:', error)
    alert('Error al copiar el enlace. Por favor, copia manualmente la URL de la barra de direcciones.')
  } finally {
    sharing.value = false
  }
}
</script>

<style scoped>
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

