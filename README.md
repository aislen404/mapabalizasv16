# Balizas V16 - Sistema de Visualización y Análisis

Sistema completo para visualización y análisis de balizas V16 de la DGT, con mapa interactivo y dashboard de análisis de datos.

## 🎯 Características

### Mapa Interactivo
- 🗺️ Visualización en tiempo real con Leaflet
- 🔍 Búsqueda en tiempo real por texto
- 🎯 Filtros avanzados (provincia, comunidad, carretera, estado)
- 📊 Panel de estadísticas
- 🔗 Compartir enlaces con filtros aplicados
- 📥 Exportar datos a JSON y CSV
- 🔄 Actualización automática cada 60 segundos

### Dashboard y Análisis
- 📊 Dashboard interactivo con múltiples métricas
- 📈 Gráficos temporales (líneas, barras, áreas, acumulados)
- 🗺️ Análisis geográfico por provincia y comunidad
- 📋 Tabla de datos crudos con paginación
- 🔍 Filtros avanzados con períodos predefinidos y personalizados
- 📥 Exportación de datos filtrados
- 💾 Historial de cambios de balizas

## 🏗️ Estructura del Proyecto

```
mapabalizasv16/
├── backend-simple/          # API Backend Node.js/Express
│   ├── db/                 # Configuración PostgreSQL
│   ├── routes/             # Rutas API
│   ├── services/           # Servicios de datos
│   └── server.js           # Servidor principal
├── frontend/               # Frontend unificado Vue.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/        # Componentes del mapa
│   │   │   ├── Dashboard/  # Componentes del dashboard
│   │   │   ├── Charts/     # Componentes de gráficos
│   │   │   └── Shared/     # Componentes compartidos
│   │   ├── views/          # Vistas principales
│   │   │   ├── MapView.vue
│   │   │   └── DashboardView.vue
│   │   ├── composables/    # Composables Vue
│   │   ├── utils/          # Utilidades
│   │   └── styles/         # Estilos globales
│   └── package.json
├── start.sh                # Script de arranque automático
├── stop.sh                 # Script para detener servicios
├── README.md               # Este archivo
└── .gitignore
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ y npm
- PostgreSQL (opcional, para funcionalidades de análisis)

### Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd mapabalizasv16
```

2. **Instalar dependencias del backend**
```bash
cd backend-simple
npm install
```

3. **Configurar variables de entorno del backend**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Instalar dependencias del frontend**
```bash
cd ../frontend
npm install
```

### Ejecución

#### 🎯 Método Recomendado: Script de Arranque Automático

El proyecto incluye scripts de arranque y parada para facilitar el inicio del sistema:

**Iniciar todo el sistema:**
```bash
./start.sh
```

Este script:
- ✅ Verifica que PostgreSQL esté corriendo
- ✅ Limpia procesos anteriores
- ✅ Verifica e instala dependencias si es necesario
- ✅ Inicia el backend (puerto 3000)
- ✅ Inicia el frontend (puerto 5173)
- ✅ Verifica la conexión a la base de datos
- ✅ Muestra un resumen del estado del sistema

**Detener todos los servicios:**
```bash
./stop.sh
```

#### 🔧 Método Manual

Si prefieres iniciar los servicios manualmente:

1. **Iniciar el backend**
```bash
cd backend-simple
node server.js
# El servidor estará en http://localhost:3000
```

2. **Iniciar el frontend**
```bash
cd frontend
npm run dev
# La aplicación estará en http://localhost:5173
```

## ⚙️ Configuración

### Backend

Crea un archivo `.env` en `backend-simple/`:

```env
PORT=3000
CACHE_TTL=60000

# Feed DATEX2 (opcional, tiene valor por defecto)
DGT_DATEX2_URL=https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml

# DGT 3.0 API REST (opcional)
DGT_API_URL=https://api.dgt3.es/v1/balizas
DGT_API_TOKEN=tu_token_aqui

# PostgreSQL (opcional, para análisis)
DATABASE_URL=postgresql://usuario:password@localhost:5432/balizas
# O configuración individual:
DB_USER=usuario
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=balizas
DB_SSL=false
```

### Frontend

Por defecto, el frontend se conecta a `http://localhost:3000/api/v16`.

Para cambiar la URL, crea un archivo `.env` en `frontend/`:

```env
VITE_API_URL=http://tu-servidor.com
```

## 📡 API Endpoints

### Públicos

- `GET /api/v16` - Obtiene todas las balizas (con cache)
- `GET /health` - Estado del servidor

### Administrativos

- `POST /api/v16/refresh` - Fuerza actualización del cache
- `GET /api/admin/stats/general` - Estadísticas generales
- `GET /api/admin/stats/by-location` - Estadísticas por ubicación
- `GET /api/admin/stats/accumulated` - Estadísticas acumuladas
- `GET /api/admin/timeseries/counts` - Series temporales
- `GET /api/admin/data/raw` - Datos crudos con paginación
- `GET /api/admin/export` - Exportar datos
- `GET /api/admin/locations/provincias` - Lista de provincias
- `GET /api/admin/locations/comunidades` - Lista de comunidades

## 🗄️ Base de Datos

El sistema puede funcionar sin base de datos, pero para las funcionalidades de análisis se requiere PostgreSQL.

### Esquema

- `balizas`: Estado actual de las balizas
- `baliza_history`: Historial de cambios

Ver `backend-simple/db/queries.js` para más detalles.

## 🎨 Navegación

El frontend unificado incluye un sidebar de navegación con dos secciones:

1. **🗺️ Mapa Interactivo**: Visualización en tiempo real de balizas
2. **📊 Dashboard y Análisis**: Análisis de datos históricos y estadísticas

## 🛠️ Tecnologías

### Backend
- Node.js
- Express.js
- PostgreSQL (opcional)
- fast-xml-parser (para DATEX2)

### Frontend
- Vue.js 3 (Composition API)
- Vite
- Leaflet (mapas)
- Chart.js (gráficos)
- date-fns (manejo de fechas)

## 📚 Documentación Adicional

- [Backend README](backend-simple/README.md) - Documentación detallada del backend
- [Frontend README](frontend/README.md) - Documentación del frontend
- [Integración DGT 3.0](backend-simple/INTEGRACION_DGT3.md) - Guía de integración con DGT 3.0

## 🔄 Fuentes de Datos

El sistema obtiene datos de balizas V16 de:

1. **DGT 3.0 API REST** (prioridad, requiere acceso)
2. **Feed DATEX2 público** (fallback automático)
   - URL: https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml
3. **Datos de ejemplo** (último recurso)

## 🚢 Despliegue

### Backend

El backend puede desplegarse en cualquier plataforma que soporte Node.js:
- Heroku
- Railway
- Render
- Vercel (con serverless functions)
- AWS Lambda

### Frontend

El frontend puede desplegarse como sitio estático:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 📝 Licencia

Este proyecto es de código abierto.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📧 Soporte

Para problemas o preguntas, abre un issue en el repositorio.

