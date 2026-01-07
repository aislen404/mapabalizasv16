<template>
  <div id="map" class="map-view"></div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  balizas: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

let map = null
let markersLayer = null
let markers = []

// Iconos para balizas
const createIcon = (isActive) => {
  const color = isActive ? '#28a745' : '#dc3545'
  const size = [35, 27]
  
  return L.divIcon({
    className: 'baliza-marker',
    html: `
      <div style="
        width: ${size[0]}px;
        height: ${size[1]}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2]
  })
}

// Inicializar mapa
const initMap = () => {
  if (map) return

  // Crear mapa centrado en España
  map = L.map('map', {
    center: [40.4168, -3.7038], // Madrid
    zoom: 6,
    zoomControl: true
  })

  // Añadir capa de tiles de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)

  // Crear capa para marcadores
  markersLayer = L.layerGroup().addTo(map)
}

// Crear popup para una baliza
const createPopup = (baliza) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString('es-ES')
    } catch {
      return dateString
    }
  }

  return `
    <div class="baliza-popup">
      <h4 style="margin: 0 0 0.5rem 0; color: #333;">Baliza ${baliza.id}</h4>
      <table style="width: 100%; font-size: 0.9rem;">
        <tr>
          <td style="padding: 0.25rem 0.5rem 0.25rem 0; color: #666; font-weight: 500;">Estado:</td>
          <td style="padding: 0.25rem 0;">
            <span style="color: ${baliza.status === 'active' ? '#28a745' : '#dc3545'}; font-weight: 600;">
              ${baliza.status === 'active' ? 'Activa' : 'Perdida'}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.25rem 0.5rem 0.25rem 0; color: #666; font-weight: 500;">Carretera:</td>
          <td style="padding: 0.25rem 0;">${baliza.carretera || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 0.25rem 0.5rem 0.25rem 0; color: #666; font-weight: 500;">PK:</td>
          <td style="padding: 0.25rem 0;">${baliza.pk || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 0.25rem 0.5rem 0.25rem 0; color: #666; font-weight: 500;">Sentido:</td>
          <td style="padding: 0.25rem 0;">${baliza.sentido || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 0.25rem 0.5rem 0.25rem 0; color: #666; font-weight: 500;">Provincia:</td>
          <td style="padding: 0.25rem 0;">${baliza.provincia || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 0.25rem 0.5rem 0.25rem 0; color: #666; font-weight: 500;">Municipio:</td>
          <td style="padding: 0.25rem 0;">${baliza.municipio || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 0.25rem 0.5rem 0.25rem 0; color: #666; font-weight: 500;">Última vista:</td>
          <td style="padding: 0.25rem 0;">${formatDate(baliza.lastSeen)}</td>
        </tr>
      </table>
    </div>
  `
}

// Actualizar marcadores
const updateMarkers = () => {
  if (!markersLayer) return

  // Limpiar marcadores anteriores
  markersLayer.clearLayers()
  markers = []

  // Crear nuevos marcadores
  props.balizas.forEach(baliza => {
    if (!baliza.lat || !baliza.lon) return

    const icon = createIcon(baliza.status === 'active')
    const marker = L.marker([baliza.lat, baliza.lon], { icon })
      .addTo(markersLayer)
      .bindPopup(createPopup(baliza))

    markers.push(marker)
  })

  // Ajustar vista si hay marcadores
  if (markers.length > 0 && map) {
    const group = new L.featureGroup(markers)
    map.fitBounds(group.getBounds().pad(0.1))
  }
}

// Observar cambios en las balizas
watch(() => props.balizas, () => {
  updateMarkers()
}, { deep: true })

onMounted(() => {
  initMap()
  updateMarkers()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  markersLayer = null
  markers = []
})
</script>

<style scoped>
.map-view {
  width: 100%;
  height: 100%;
}

/* Estilos para el popup de Leaflet */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

:deep(.baliza-popup) {
  min-width: 250px;
}
</style>

