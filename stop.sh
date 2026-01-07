#!/bin/bash

# Script para detener todos los servicios de Balizas V16

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🛑 Deteniendo Sistema Balizas V16${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Detener procesos por PID si existen
if [ -f /tmp/balizas_backend.pid ]; then
    BACKEND_PID=$(cat /tmp/balizas_backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Deteniendo Backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ Backend detenido${NC}"
    fi
    rm -f /tmp/balizas_backend.pid
fi

if [ -f /tmp/balizas_frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/balizas_frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Deteniendo Frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ Frontend detenido${NC}"
    fi
    rm -f /tmp/balizas_frontend.pid
fi

# Detener cualquier proceso restante
echo -e "${YELLOW}Buscando procesos restantes...${NC}"
pkill -f "node server.js" 2>/dev/null && echo -e "${GREEN}✓ Procesos backend adicionales detenidos${NC}" || true
pkill -f "vite" 2>/dev/null && echo -e "${GREEN}✓ Procesos frontend adicionales detenidos${NC}" || true

sleep 1

# Verificar que los puertos estén libres
if ! lsof -ti:3000 > /dev/null 2>&1 && ! lsof -ti:5173 > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}✓ Todos los servicios han sido detenidos${NC}"
    echo -e "${GREEN}✓ Puertos 3000 y 5173 están libres${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠ Algunos puertos aún pueden estar en uso${NC}"
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo -e "${YELLOW}  → Puerto 3000 aún en uso${NC}"
    fi
    if lsof -ti:5173 > /dev/null 2>&1; then
        echo -e "${YELLOW}  → Puerto 5173 aún en uso${NC}"
    fi
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

