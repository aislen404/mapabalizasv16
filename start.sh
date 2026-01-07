#!/bin/bash

# Script de arranque para Balizas V16
# Levanta backend, frontend y verifica la base de datos

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend-simple"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 Iniciando Sistema Balizas V16${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Función para verificar si un puerto está en uso
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Función para esperar a que un servicio esté listo
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}Esperando a que $name esté listo...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name está listo${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    echo -e "${RED}✗ $name no respondió después de $max_attempts intentos${NC}"
    return 1
}

# 1. Verificar PostgreSQL
echo -e "${BLUE}[1/4] Verificando PostgreSQL...${NC}"
if brew services list | grep -q "postgresql.*started" || pgrep -x postgres > /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL está corriendo${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL no está corriendo. Intentando iniciarlo...${NC}"
    if command -v brew > /dev/null; then
        brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || true
        sleep 2
    fi
fi
echo ""

# 2. Detener procesos anteriores
echo -e "${BLUE}[2/4] Limpiando procesos anteriores...${NC}"
pkill -f "node server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓ Procesos anteriores detenidos${NC}"
echo ""

# 3. Verificar dependencias
echo -e "${BLUE}[3/4] Verificando dependencias...${NC}"
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠ Instalando dependencias del backend...${NC}"
    cd "$BACKEND_DIR"
    npm install
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠ Instalando dependencias del frontend...${NC}"
    cd "$FRONTEND_DIR"
    npm install
fi
echo -e "${GREEN}✓ Dependencias verificadas${NC}"
echo ""

# 4. Iniciar Backend
echo -e "${BLUE}[4/4] Iniciando servicios...${NC}"
echo -e "${YELLOW}  → Iniciando Backend (puerto 3000)...${NC}"
cd "$BACKEND_DIR"
node server.js > /tmp/balizas_backend.log 2>&1 &
BACKEND_PID=$!
echo "    PID: $BACKEND_PID"

# Esperar un poco antes de iniciar el frontend
sleep 2

# 5. Iniciar Frontend
echo -e "${YELLOW}  → Iniciando Frontend (puerto 5173)...${NC}"
cd "$FRONTEND_DIR"
npm run dev > /tmp/balizas_frontend.log 2>&1 &
FRONTEND_PID=$!
echo "    PID: $FRONTEND_PID"
echo ""

# 6. Esperar a que los servicios estén listos
echo -e "${BLUE}Esperando a que los servicios estén listos...${NC}"
sleep 3

# Verificar Backend
if wait_for_service "http://localhost:3000/api/admin/stats/general" "Backend"; then
    BACKEND_OK=true
else
    BACKEND_OK=false
    echo -e "${YELLOW}⚠ Revisa los logs: tail -f /tmp/balizas_backend.log${NC}"
fi

# Verificar Frontend
if wait_for_service "http://localhost:5173" "Frontend"; then
    FRONTEND_OK=true
else
    FRONTEND_OK=false
    echo -e "${YELLOW}⚠ Revisa los logs: tail -f /tmp/balizas_frontend.log${NC}"
fi

echo ""

# 7. Verificar Base de Datos
echo -e "${BLUE}Verificando conexión a la base de datos...${NC}"
cd "$BACKEND_DIR"
DB_CHECK=$(node -e "require('dotenv').config(); const { testConnection } = require('./db/connection'); testConnection().then(() => process.exit(0)).catch(() => process.exit(1));" 2>&1)
if [ $? -eq 0 ]; then
    DB_OK=true
    echo -e "${GREEN}✓ Base de datos conectada${NC}"
    
    # Obtener estadísticas de la BD
    BALIZAS_COUNT=$(node -e "require('dotenv').config(); const { query } = require('./db/connection'); query('SELECT COUNT(*) as total FROM balizas').then(r => console.log(r.rows[0].total)).catch(() => console.log('0'));" 2>/dev/null || echo "0")
    HISTORY_COUNT=$(node -e "require('dotenv').config(); const { query } = require('./db/connection'); query('SELECT COUNT(*) as total FROM baliza_history').then(r => console.log(r.rows[0].total)).catch(() => console.log('0'));" 2>/dev/null || echo "0")
else
    DB_OK=false
    echo -e "${YELLOW}⚠ Base de datos no disponible (el sistema funcionará con datos de ejemplo)${NC}"
    BALIZAS_COUNT="N/A"
    HISTORY_COUNT="N/A"
fi

echo ""

# 8. Resumen final
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  📊 RESUMEN DEL SISTEMA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

if [ "$BACKEND_OK" = true ]; then
    echo -e "${GREEN}✓ Backend:${NC}  http://localhost:3000"
    echo -e "  ${GREEN}→ API:${NC}     http://localhost:3000/api/v16"
    echo -e "  ${GREEN}→ Admin:${NC}   http://localhost:3000/api/admin"
else
    echo -e "${RED}✗ Backend:${NC}  No disponible"
fi

echo ""

if [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✓ Frontend:${NC} http://localhost:5173"
else
    echo -e "${RED}✗ Frontend:${NC} No disponible"
fi

echo ""

if [ "$DB_OK" = true ]; then
    echo -e "${GREEN}✓ Base de Datos:${NC} PostgreSQL"
    echo -e "  ${GREEN}→ Balizas:${NC}     $BALIZAS_COUNT"
    echo -e "  ${GREEN}→ Historial:${NC}  $HISTORY_COUNT"
else
    echo -e "${YELLOW}⚠ Base de Datos:${NC} No disponible"
fi

echo ""

# Guardar PIDs para poder detenerlos después
echo "$BACKEND_PID" > /tmp/balizas_backend.pid
echo "$FRONTEND_PID" > /tmp/balizas_frontend.pid

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎯 Sistema iniciado correctamente!${NC}"
echo ""
echo -e "${YELLOW}Para detener los servicios, ejecuta:${NC}"
echo -e "  ${BLUE}./stop.sh${NC}  o"
echo -e "  ${BLUE}pkill -f 'node server.js' && pkill -f 'vite'${NC}"
echo ""
echo -e "${YELLOW}Para ver los logs:${NC}"
echo -e "  ${BLUE}tail -f /tmp/balizas_backend.log${NC}"
echo -e "  ${BLUE}tail -f /tmp/balizas_frontend.log${NC}"
echo ""
echo -e "${GREEN}Abre tu navegador en: http://localhost:5173${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

