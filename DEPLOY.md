# 🚀 Guía de Despliegue - Balizas V16

Esta guía describe las mejores opciones para desplegar el sistema completo de Balizas V16 en diferentes plataformas.

## 📋 Índice

1. [Plataformas Recomendadas](#plataformas-recomendadas)
2. [Despliegue en Railway](#despliegue-en-railway) ⭐ **Recomendado**
3. [Despliegue en Render](#despliegue-en-render)
4. [Despliegue en Fly.io](#despliegue-en-flyio)
5. [Despliegue con Docker](#despliegue-con-docker)
6. [Despliegue Separado (Frontend + Backend + BD)](#despliegue-separado)

---

## 🎯 Plataformas Recomendadas

### ⭐ **Railway** (Recomendado para inicio rápido)
- ✅ **Ventajas:**
  - Muy fácil de usar, perfecto para principiantes
  - PostgreSQL incluido con un clic
  - Despliegue automático desde GitHub
  - Plan gratuito generoso
  - Soporta Node.js y PostgreSQL nativamente
- ⚠️ **Consideraciones:**
  - Plan gratuito tiene límites de uso
  - Puede ser más costoso a escala

### 🥈 **Render** (Mejor relación calidad-precio)
- ✅ **Ventajas:**
  - Plan gratuito permanente
  - PostgreSQL gratuito (con limitaciones)
  - Despliegue automático desde GitHub
  - SSL automático
- ⚠️ **Consideraciones:**
  - Los servicios gratuitos se "duermen" después de inactividad
  - PostgreSQL gratuito tiene límites de tamaño

### 🥉 **Fly.io** (Mejor para control total)
- ✅ **Ventajas:**
  - Muy flexible y potente
  - PostgreSQL gestionado disponible
  - Buena para apps full-stack
  - Plan gratuito generoso
- ⚠️ **Consideraciones:**
  - Requiere más configuración
  - Curva de aprendizaje más alta

### 🐳 **Docker + Cualquier Cloud**
- ✅ **Ventajas:**
  - Máxima portabilidad
  - Funciona en cualquier plataforma
  - Control total
- ⚠️ **Consideraciones:**
  - Requiere más conocimiento técnico
  - Necesitas gestionar la infraestructura

---

## 🚂 Despliegue en Railway

Railway es la opción más fácil para desplegar todo el sistema.

### Paso 1: Preparar el Proyecto

1. Asegúrate de que tu código esté en GitHub
2. Crea un archivo `railway.json` en la raíz:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend-simple && node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Paso 2: Desplegar en Railway

1. Ve a [railway.app](https://railway.app) y crea una cuenta
2. Crea un nuevo proyecto
3. Conecta tu repositorio de GitHub
4. Railway detectará automáticamente el proyecto

### Paso 3: Configurar Variables de Entorno

En Railway, ve a tu servicio y agrega estas variables:

```env
PORT=3000
NODE_ENV=production
CACHE_TTL=60000
DGT_DATEX2_URL=https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml
```

### Paso 4: Agregar PostgreSQL

1. En Railway, haz clic en "New" → "Database" → "PostgreSQL"
2. Railway creará automáticamente una variable `DATABASE_URL`
3. Tu backend la detectará automáticamente

### Paso 5: Inicializar la Base de Datos

1. Conecta a tu base de datos PostgreSQL desde Railway
2. Ejecuta el script de inicialización:

```bash
# Desde tu máquina local, conecta a la BD de Railway
psql $DATABASE_URL -f backend-simple/db/schema.sql
```

O usa el script de inicialización:

```bash
cd backend-simple
DATABASE_URL="tu_url_de_railway" node db/init-db.js
```

### Paso 6: Desplegar el Frontend

1. Crea un nuevo servicio en Railway para el frontend
2. Configura el build:
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Start Command:** `cd frontend && npx serve -s dist -l 3000`
3. Agrega variable de entorno:
   ```env
   VITE_API_URL=https://tu-backend.railway.app
   ```

### Paso 7: Configurar Dominio

Railway proporciona un dominio automático, pero puedes agregar uno personalizado en la configuración.

---

## 🎨 Despliegue en Render

### Backend en Render

1. Ve a [render.com](https://render.com) y crea una cuenta
2. Crea un nuevo "Web Service"
3. Conecta tu repositorio de GitHub
4. Configuración:
   - **Build Command:** `cd backend-simple && npm install`
   - **Start Command:** `cd backend-simple && node server.js`
   - **Environment:** Node
5. Agrega variables de entorno (igual que Railway)

### PostgreSQL en Render

1. Crea un nuevo "PostgreSQL" database
2. Render proporcionará una `DATABASE_URL` automáticamente
3. Inicializa la base de datos igual que en Railway

### Frontend en Render

1. Crea un nuevo "Static Site"
2. Conecta tu repositorio
3. Configuración:
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
4. Agrega variable de entorno:
   ```env
   VITE_API_URL=https://tu-backend.onrender.com
   ```

---

## 🪂 Despliegue en Fly.io

### Instalación de Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### Configurar Backend

1. Crea un `fly.toml` en `backend-simple/`:

```toml
app = "balizas-v16-backend"
primary_region = "mad"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "3000"
  NODE_ENV = "production"

[[services]]
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"
  script_checks_enabled = true

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/health"
```

2. Despliega:

```bash
cd backend-simple
fly launch
fly secrets set DATABASE_URL="tu_url_postgresql"
fly deploy
```

### PostgreSQL en Fly.io

```bash
fly postgres create --name balizas-v16-db
fly postgres attach balizas-v16-db -a balizas-v16-backend
```

---

## 🐳 Despliegue con Docker

### Crear Dockerfile para Backend

Crea `backend-simple/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Crear Dockerfile para Frontend

Crea `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Crear docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: balizas_v16
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend-simple
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/balizas_v16
      PORT: 3000
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Desplegar con Docker

```bash
docker-compose up -d
```

---

## 🔀 Despliegue Separado (Frontend + Backend + BD)

Esta es la opción más flexible, desplegando cada componente en su mejor plataforma.

### Opción A: Vercel + Railway + Supabase

- **Frontend:** Vercel (gratis, excelente para Vue.js)
- **Backend:** Railway (fácil, con PostgreSQL)
- **Base de Datos:** Supabase (PostgreSQL gratuito, muy potente)

### Opción B: Netlify + Render + Neon

- **Frontend:** Netlify (gratis, fácil)
- **Backend:** Render (gratis)
- **Base de Datos:** Neon (PostgreSQL serverless, gratis)

### Configuración del Frontend

En cualquier plataforma de frontend, configura:

```env
VITE_API_URL=https://tu-backend-url.com
```

Y en el build, asegúrate de que las variables de entorno se inyecten correctamente.

---

## 📦 Scripts de Despliegue

El proyecto incluye scripts útiles:

### `setup.sh`
Instalación completa del sistema localmente.

### `backup-db.sh`
Hace backup de la base de datos antes de desplegar.

### `restore-db.sh`
Restaura la base de datos desde un backup.

### `start.sh` / `stop.sh`
Iniciar/detener el sistema localmente.

---

## 🔐 Variables de Entorno de Producción

Asegúrate de configurar estas variables en tu plataforma:

### Backend

```env
PORT=3000
NODE_ENV=production
CACHE_TTL=60000
DATABASE_URL=postgresql://user:pass@host:port/dbname
DGT_DATEX2_URL=https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml
```

### Frontend

```env
VITE_API_URL=https://tu-backend-url.com
```

---

## 🚨 Consideraciones Importantes

1. **Base de Datos:** Asegúrate de hacer backup antes de desplegar cambios importantes
2. **Variables de Entorno:** Nunca commitees archivos `.env` con credenciales
3. **CORS:** Configura CORS en el backend para permitir tu dominio de frontend
4. **SSL:** La mayoría de plataformas proporcionan SSL automático
5. **Escalado:** Considera el plan de escalado según el tráfico esperado

---

## 📞 Soporte

Para problemas específicos de despliegue, consulta la documentación de cada plataforma o abre un issue en el repositorio.

