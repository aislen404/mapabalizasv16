#!/bin/bash

# Script de instalación y configuración completa de Balizas V16
# Incluye: dependencias, base de datos, y configuración inicial

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Directorio del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend-simple"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  📦 Instalación Completa - Balizas V16${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Verificar prerrequisitos
echo -e "${BLUE}[1/7] Verificando prerrequisitos...${NC}"

# Node.js
if ! command_exists node; then
    echo -e "${RED}✗ Node.js no está instalado${NC}"
    echo -e "${YELLOW}  Instala Node.js desde: https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js: $NODE_VERSION${NC}"

# npm
if ! command_exists npm; then
    echo -e "${RED}✗ npm no está instalado${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm: $NPM_VERSION${NC}"

# PostgreSQL
if ! command_exists psql && ! command_exists pg_isready; then
    echo -e "${YELLOW}⚠ PostgreSQL no encontrado en PATH${NC}"
    echo -e "${YELLOW}  Verificando si está instalado vía Homebrew...${NC}"
    if command_exists brew; then
        if brew services list | grep -q postgresql; then
            echo -e "${GREEN}✓ PostgreSQL instalado vía Homebrew${NC}"
            # Agregar PostgreSQL al PATH si es necesario
            if [ -d "/opt/homebrew/opt/postgresql@15/bin" ]; then
                export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
            elif [ -d "/usr/local/opt/postgresql@15/bin" ]; then
                export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
            fi
        else
            echo -e "${YELLOW}⚠ PostgreSQL no está instalado${NC}"
            echo -e "${CYAN}  ¿Deseas instalar PostgreSQL ahora? (s/n)${NC}"
            read -r response
            if [[ "$response" =~ ^[Ss]$ ]]; then
                brew install postgresql@15
                brew services start postgresql@15
                sleep 2
            else
                echo -e "${YELLOW}  Continuando sin PostgreSQL (funcionalidad limitada)${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠ PostgreSQL no está instalado${NC}"
        echo -e "${YELLOW}  Instala PostgreSQL desde: https://www.postgresql.org/download/${NC}"
    fi
else
    echo -e "${GREEN}✓ PostgreSQL encontrado${NC}"
fi

echo ""

# 2. Instalar dependencias del backend
echo -e "${BLUE}[2/7] Instalando dependencias del backend...${NC}"
cd "$BACKEND_DIR"
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json no encontrado en backend-simple${NC}"
    exit 1
fi
npm install
echo -e "${GREEN}✓ Dependencias del backend instaladas${NC}"
echo ""

# 3. Instalar dependencias del frontend
echo -e "${BLUE}[3/7] Instalando dependencias del frontend...${NC}"
cd "$FRONTEND_DIR"
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json no encontrado en frontend${NC}"
    exit 1
fi
npm install
echo -e "${GREEN}✓ Dependencias del frontend instaladas${NC}"
echo ""

# 4. Configurar variables de entorno
echo -e "${BLUE}[4/7] Configurando variables de entorno...${NC}"
cd "$BACKEND_DIR"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}  Creando archivo .env...${NC}"
    
    # Detectar usuario del sistema para PostgreSQL
    DB_USER="${USER:-postgres}"
    
    # Solicitar información de la base de datos
    echo -e "${CYAN}  Configuración de PostgreSQL:${NC}"
    echo -e "${CYAN}  Usuario (Enter para usar '$DB_USER'):${NC}"
    read -r input_user
    if [ -n "$input_user" ]; then
        DB_USER="$input_user"
    fi
    
    echo -e "${CYAN}  Contraseña (Enter para dejar vacía):${NC}"
    read -rs DB_PASSWORD
    echo ""
    
    echo -e "${CYAN}  Nombre de la base de datos (Enter para 'balizas_v16'):${NC}"
    read -r DB_NAME
    DB_NAME=${DB_NAME:-balizas_v16}
    
    echo -e "${CYAN}  Host (Enter para 'localhost'):${NC}"
    read -r DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    echo -e "${CYAN}  Puerto (Enter para '5432'):${NC}"
    read -r DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    # Construir DATABASE_URL
    if [ -z "$DB_PASSWORD" ]; then
        DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    else
        DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    fi
    
    # Crear archivo .env
    cat > .env << EOF
# Puerto del servidor
PORT=3000

# Cache TTL en milisegundos
CACHE_TTL=60000

# Feed DATEX2 de la DGT
DGT_DATEX2_URL=https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml

# DGT 3.0 API REST (opcional)
# DGT_API_URL=https://api.dgt3.es/v1/balizas
# DGT_API_TOKEN=tu_token_aqui

# PostgreSQL
DATABASE_URL=${DATABASE_URL}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_SSL=false

# Entorno
NODE_ENV=development
EOF
    
    echo -e "${GREEN}✓ Archivo .env creado${NC}"
else
    echo -e "${YELLOW}⚠ Archivo .env ya existe, omitiendo...${NC}"
fi
echo ""

# 5. Crear base de datos
echo -e "${BLUE}[5/7] Configurando base de datos...${NC}"

# Cargar variables de entorno
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Intentar crear la base de datos
if command_exists psql || command_exists createdb; then
    echo -e "${YELLOW}  Creando base de datos '$DB_NAME'...${NC}"
    
    # Intentar conectar y crear la base de datos
    if [ -z "$DB_PASSWORD" ]; then
        PGPASSWORD="" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || {
            echo -e "${YELLOW}  ⚠ La base de datos ya existe o no se pudo crear${NC}"
            echo -e "${YELLOW}  Continuando con la inicialización...${NC}"
        }
    else
        PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || {
            echo -e "${YELLOW}  ⚠ La base de datos ya existe o no se pudo crear${NC}"
            echo -e "${YELLOW}  Continuando con la inicialización...${NC}"
        }
    fi
    
    # Inicializar esquema
    echo -e "${YELLOW}  Inicializando esquema de la base de datos...${NC}"
    node db/init-db.js
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Base de datos configurada correctamente${NC}"
    else
        echo -e "${YELLOW}⚠ Hubo problemas al inicializar la base de datos${NC}"
        echo -e "${YELLOW}  Puedes ejecutar manualmente: cd backend-simple && node db/init-db.js${NC}"
    fi
else
    echo -e "${YELLOW}⚠ PostgreSQL no está disponible, omitiendo configuración de BD${NC}"
fi
echo ""

# 6. Verificar instalación
echo -e "${BLUE}[6/7] Verificando instalación...${NC}"

# Verificar que los módulos estén instalados
if [ -d "$BACKEND_DIR/node_modules" ] && [ -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${GREEN}✓ Módulos instalados correctamente${NC}"
else
    echo -e "${RED}✗ Algunos módulos no están instalados${NC}"
    exit 1
fi

# Verificar archivos de configuración
if [ -f "$BACKEND_DIR/.env" ]; then
    echo -e "${GREEN}✓ Configuración del backend lista${NC}"
else
    echo -e "${YELLOW}⚠ Archivo .env no encontrado${NC}"
fi

echo ""

# 7. Resumen final
echo -e "${BLUE}[7/7] Resumen de la instalación${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Instalación completada${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Próximos pasos:${NC}"
echo ""
echo -e "${YELLOW}1. Iniciar el sistema:${NC}"
echo -e "   ${BLUE}./start.sh${NC}"
echo ""
echo -e "${YELLOW}2. O iniciar manualmente:${NC}"
echo -e "   ${BLUE}cd backend-simple && node server.js${NC}"
echo -e "   ${BLUE}cd frontend && npm run dev${NC}"
echo ""
echo -e "${YELLOW}3. Acceder a la aplicación:${NC}"
echo -e "   ${GREEN}Frontend:${NC} http://localhost:5173"
echo -e "   ${GREEN}Backend:${NC}  http://localhost:3000"
echo ""
echo -e "${YELLOW}4. Para detener el sistema:${NC}"
echo -e "   ${BLUE}./stop.sh${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

