#!/bin/bash

# Script de arranque optimizado para Balizas V16
# Levanta backend, frontend y verifica la base de datos de forma rápida y robusta

# Nota: set -e eliminado para manejo selectivo de errores
# Solo fallamos en errores críticos, continuamos con advertencias en los demás

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

# Variables de estado
BACKEND_OK=false
FRONTEND_OK=false
DB_OK=false
BACKEND_PID=""
FRONTEND_PID=""

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 Iniciando Sistema Balizas V16 (Optimizado)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Función para verificar si un puerto está en uso
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Función optimizada para esperar a que un servicio esté listo
# Reducido de 30 intentos a 12 con intervalo de 2s (máximo 24s vs 30s anterior)
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=12
    local attempt=0
    
    echo -e "${YELLOW}Esperando a que $name esté listo...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name está listo${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        if [ $attempt -lt $max_attempts ]; then
            sleep 2
        fi
    done
    echo -e "${RED}✗ $name no respondió después de $((max_attempts * 2)) segundos${NC}"
    return 1
}

# Función para ejecutar con timeout (compatible con macOS y Linux)
run_with_timeout() {
    local duration=$1
    shift
    local cmd=("$@")
    
    if command -v timeout > /dev/null 2>&1; then
        timeout "$duration" "${cmd[@]}"
    elif command -v gtimeout > /dev/null 2>&1; then
        # macOS con coreutils instalado vía brew
        gtimeout "$duration" "${cmd[@]}"
    else
        # Fallback: ejecutar directamente sin timeout
        "${cmd[@]}"
    fi
}

# Función para verificar PostgreSQL de forma rápida
check_postgres() {
    # Intentar con pg_isready primero (más rápido)
    if command -v pg_isready > /dev/null 2>&1; then
        if run_with_timeout 3 pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
            return 0
        fi
    fi
    
    # Fallback: verificar si el puerto está en uso
    if check_port 5432; then
        return 0
    fi
    
    # Último intento: verificar proceso
    if pgrep -x postgres > /dev/null 2>&1; then
        return 0
    fi
    
    return 1
}

# Función para verificar que un proceso está corriendo
verify_process() {
    local pid=$1
    local name=$2
    
    if [ -z "$pid" ]; then
        echo -e "${RED}✗ Error: PID vacío para $name${NC}"
        return 1
    fi
    
    # Esperar un momento para que el proceso se inicie
    sleep 0.5
    
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $name iniciado correctamente (PID: $pid)${NC}"
        return 0
    else
        echo -e "${RED}✗ Error: $name no se inició correctamente${NC}"
        return 1
    fi
}

# 1. Verificar PostgreSQL (optimizado y no bloqueante)
echo -e "${BLUE}[1/5] Verificando PostgreSQL...${NC}"
if check_postgres; then
    echo -e "${GREEN}✓ PostgreSQL está corriendo${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL no está corriendo${NC}"
    # Intentar iniciar solo si brew está disponible, pero no bloquear
    if command -v brew > /dev/null 2>&1; then
        echo -e "${YELLOW}  Intentando iniciar PostgreSQL...${NC}"
        (brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null) || true
        # No esperamos, continuamos
    fi
    echo -e "${YELLOW}  Continuando sin PostgreSQL (funcionalidad limitada)${NC}"
fi
echo ""

# 2. Detener procesos anteriores
echo -e "${BLUE}[2/5] Limpiando procesos anteriores...${NC}"
pkill -f "node server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
# Reducido sleep de 1s a 0.5s
sleep 0.5
echo -e "${GREEN}✓ Procesos anteriores detenidos${NC}"
echo ""

# 3. Verificar dependencias (optimizado - solo verificar, no instalar automáticamente)
echo -e "${BLUE}[3/5] Verificando dependencias...${NC}"
MISSING_DEPS=false

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠ Faltan dependencias del backend${NC}"
    echo -e "${YELLOW}  Ejecuta: cd backend-simple && npm install${NC}"
    MISSING_DEPS=true
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠ Faltan dependencias del frontend${NC}"
    echo -e "${YELLOW}  Ejecuta: cd frontend && npm install${NC}"
    MISSING_DEPS=true
fi

if [ "$MISSING_DEPS" = false ]; then
    echo -e "${GREEN}✓ Dependencias verificadas${NC}"
else
    echo -e "${YELLOW}⚠ Continuando sin algunas dependencias (puede fallar)${NC}"
fi
echo ""

# 4. Iniciar Backend
echo -e "${BLUE}[4/5] Iniciando servicios...${NC}"
echo -e "${YELLOW}  → Iniciando Backend (puerto 3000)...${NC}"

# Verificar que el puerto esté libre
if check_port 3000; then
    echo -e "${YELLOW}⚠ Puerto 3000 en uso, intentando liberar...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 0.5
fi

cd "$BACKEND_DIR" || {
    echo -e "${RED}✗ Error: No se pudo acceder a $BACKEND_DIR${NC}"
    exit 1
}

node server.js > /tmp/balizas_backend.log 2>&1 &
BACKEND_PID=$!

# Verificar inmediatamente que el proceso se inició
if ! verify_process "$BACKEND_PID" "Backend"; then
    echo -e "${RED}✗ No se pudo iniciar el backend. Revisa los logs:${NC}"
    echo -e "${BLUE}  tail -f /tmp/balizas_backend.log${NC}"
    BACKEND_OK=false
else
    # Esperar menos tiempo (reducido de 2s a 1s)
    sleep 1
fi

# 5. Iniciar Frontend
echo -e "${YELLOW}  → Iniciando Frontend (puerto 5173)...${NC}"

# Verificar que el puerto esté libre
if check_port 5173; then
    echo -e "${YELLOW}⚠ Puerto 5173 en uso, intentando liberar...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 0.5
fi

cd "$FRONTEND_DIR" || {
    echo -e "${RED}✗ Error: No se pudo acceder a $FRONTEND_DIR${NC}"
    exit 1
}

npm run dev > /tmp/balizas_frontend.log 2>&1 &
FRONTEND_PID=$!

# Verificar inmediatamente que el proceso se inició
if ! verify_process "$FRONTEND_PID" "Frontend"; then
    echo -e "${RED}✗ No se pudo iniciar el frontend. Revisa los logs:${NC}"
    echo -e "${BLUE}  tail -f /tmp/balizas_frontend.log${NC}"
    FRONTEND_OK=false
fi

echo ""

# 6. Esperar a que los servicios estén listos (verificación optimizada)
echo -e "${BLUE}[5/5] Verificando que los servicios respondan...${NC}"

# Verificar Backend (usando endpoint más simple /health en lugar de /api/admin/stats/general)
if [ -n "$BACKEND_PID" ] && ps -p "$BACKEND_PID" > /dev/null 2>&1; then
    if wait_for_service "http://localhost:3000/health" "Backend"; then
        BACKEND_OK=true
    else
        # Intentar endpoint alternativo
        if curl -s --max-time 2 "http://localhost:3000/api/v16" > /dev/null 2>&1; then
            BACKEND_OK=true
            echo -e "${GREEN}✓ Backend está respondiendo${NC}"
        else
            BACKEND_OK=false
            echo -e "${YELLOW}⚠ Backend iniciado pero no responde aún${NC}"
            echo -e "${YELLOW}  Revisa los logs: tail -f /tmp/balizas_backend.log${NC}"
        fi
    fi
else
    BACKEND_OK=false
fi

# Verificar Frontend
if [ -n "$FRONTEND_PID" ] && ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
    if wait_for_service "http://localhost:5173" "Frontend"; then
        FRONTEND_OK=true
    else
        FRONTEND_OK=false
        echo -e "${YELLOW}⚠ Frontend iniciado pero no responde aún${NC}"
        echo -e "${YELLOW}  Revisa los logs: tail -f /tmp/balizas_frontend.log${NC}"
    fi
else
    FRONTEND_OK=false
fi

echo ""

# Guardar PIDs para poder detenerlos después
if [ -n "$BACKEND_PID" ]; then
    echo "$BACKEND_PID" > /tmp/balizas_backend.pid
fi
if [ -n "$FRONTEND_PID" ]; then
    echo "$FRONTEND_PID" > /tmp/balizas_frontend.pid
fi

# 7. Verificar Base de Datos (opcional, rápido y no bloquea)
echo -e "${BLUE}Verificando conexión a la base de datos (opcional)...${NC}"
cd "$BACKEND_DIR" || exit 0
# Timeout de 3 segundos para la verificación de BD
if run_with_timeout 3 node -e "require('dotenv').config(); const { testConnection } = require('./db/connection'); testConnection().then(() => process.exit(0)).catch(() => process.exit(1));" 2>/dev/null; then
    DB_OK=true
    echo -e "${GREEN}✓ Base de datos conectada${NC}"
    # Obtener estadísticas rápidamente (con timeout)
    BALIZAS_COUNT=$(run_with_timeout 2 node -e "require('dotenv').config(); const { query } = require('./db/connection'); query('SELECT COUNT(*) as total FROM balizas').then(r => console.log(r.rows[0].total)).catch(() => console.log('0'));" 2>/dev/null || echo "0")
    HISTORY_COUNT=$(run_with_timeout 2 node -e "require('dotenv').config(); const { query } = require('./db/connection'); query('SELECT COUNT(*) as total FROM baliza_history').then(r => console.log(r.rows[0].total)).catch(() => console.log('0'));" 2>/dev/null || echo "0")
else
    DB_OK=false
    BALIZAS_COUNT="N/A"
    HISTORY_COUNT="N/A"
    echo -e "${YELLOW}⚠ Base de datos no disponible (el sistema funcionará con datos de ejemplo)${NC}"
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
    echo -e "  ${YELLOW}→ Revisa:${NC} tail -f /tmp/balizas_backend.log"
fi

echo ""

if [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✓ Frontend:${NC} http://localhost:5173"
else
    echo -e "${RED}✗ Frontend:${NC} No disponible"
    echo -e "  ${YELLOW}→ Revisa:${NC} tail -f /tmp/balizas_frontend.log"
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

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}🎯 Sistema iniciado correctamente!${NC}"
else
    echo -e "${YELLOW}⚠ Sistema iniciado con advertencias${NC}"
    if [ "$BACKEND_OK" = false ]; then
        echo -e "${YELLOW}  → Backend no disponible${NC}"
    fi
    if [ "$FRONTEND_OK" = false ]; then
        echo -e "${YELLOW}  → Frontend no disponible${NC}"
    fi
fi
echo ""
echo -e "${YELLOW}Para detener los servicios, ejecuta:${NC}"
echo -e "  ${BLUE}./stop.sh${NC}  o"
echo -e "  ${BLUE}pkill -f 'node server.js' && pkill -f 'vite'${NC}"
echo ""
echo -e "${YELLOW}Para ver los logs:${NC}"
echo -e "  ${BLUE}tail -f /tmp/balizas_backend.log${NC}"
echo -e "  ${BLUE}tail -f /tmp/balizas_frontend.log${NC}"
echo ""
if [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}Abre tu navegador en: http://localhost:5173${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

