# Frontend Vue.js - Balizas V16

Frontend moderno construido con Vue.js 3 para visualizar balizas V16 en un mapa interactivo.

## Características

- 🗺️ **Mapa interactivo** con Leaflet
- 🔍 **Búsqueda en tiempo real** por texto
- 🎯 **Filtros avanzados** por provincia, comunidad, carretera y estado
- 📊 **Panel de estadísticas** con métricas y distribuciones
- 🔗 **Compartir enlaces** con filtros aplicados
- 📥 **Exportar datos** a JSON y CSV
- 🔄 **Actualización automática** cada 60 segundos
- 🔗 **Deep linking** para cargar filtros desde URL

## Requisitos Previos

- Node.js 18+ y npm
- Backend corriendo en `http://localhost:3000`

## Instalación

```bash
cd frontend
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor de desarrollo estará disponible en `http://localhost:5173`

## Build para Producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`

## Preview del Build

```bash
npm run preview
```

## Configuración

### URL del Backend

Por defecto, el frontend se conecta a `http://localhost:3000/api/v16`.

Para cambiar la URL, crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://tu-servidor.com/api/v16
```

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/        # Componentes Vue
│   │   ├── MapView.vue
│   │   ├── FiltersPanel.vue
│   │   ├── SearchBar.vue
│   │   ├── StatisticsPanel.vue
│   │   ├── ShareButton.vue
│   │   └── ExportButton.vue
│   ├── composables/       # Composables Vue (lógica reutilizable)
│   │   └── useBalizas.js
│   ├── utils/            # Utilidades
│   │   ├── filters.js
│   │   └── export.js
│   ├── styles/           # Estilos globales
│   │   └── main.css
│   ├── App.vue           # Componente raíz
│   └── main.js           # Punto de entrada
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Uso

### Filtros

- **Comunidad Autónoma**: Filtra por comunidad autónoma
- **Provincia**: Filtra por provincia
- **Carretera**: Busca por nombre de carretera (ej: A-1, AP-7)
- **Estado**: Filtra por estado (activa, perdida, todas)

### Búsqueda

La barra de búsqueda permite buscar por:
- Nombre de carretera
- Municipio
- Provincia
- Comunidad autónoma
- Punto kilométrico

### Compartir Enlaces

El botón "Compartir Enlace" genera una URL con los filtros aplicados. Al abrir esa URL, los filtros se cargarán automáticamente.

### Exportar Datos

Puedes exportar los datos filtrados a:
- **JSON**: Formato estructurado para programación
- **CSV**: Formato de hoja de cálculo (compatible con Excel)

## Tecnologías

- **Vue.js 3**: Framework JavaScript progresivo
- **Vite**: Build tool rápida
- **Leaflet**: Biblioteca de mapas open source
- **OpenStreetMap**: Tiles de mapas gratuitos

## Desarrollo

### Agregar Nuevos Componentes

Los componentes se encuentran en `src/components/`. Cada componente es un archivo `.vue` con:
- `<template>`: HTML
- `<script setup>`: Lógica JavaScript
- `<style scoped>`: Estilos CSS

### Agregar Nuevas Funcionalidades

- **Composables**: Lógica reutilizable en `src/composables/`
- **Utilidades**: Funciones auxiliares en `src/utils/`
- **Estilos**: Estilos globales en `src/styles/`

## Solución de Problemas

### El mapa no se muestra

- Verifica que Leaflet CSS esté cargado en `index.html`
- Revisa la consola del navegador para errores
- Asegúrate de que el contenedor del mapa tenga altura definida

### No se cargan las balizas

- Verifica que el backend esté corriendo en `http://localhost:3000`
- Revisa la consola del navegador para errores de red
- Verifica la configuración de CORS en el backend

### Los filtros no funcionan

- Verifica que las balizas tengan los campos necesarios
- Revisa la consola para errores de JavaScript

## Licencia

Este proyecto es de código abierto.

