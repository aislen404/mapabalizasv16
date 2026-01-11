#!/bin/bash

# Script para hacer backup de la base de datos

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backend-simple"
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  💾 Backup de Base de Datos - Balizas V16${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Cargar variables de entorno
cd "$BACKEND_DIR"
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo -e "${RED}✗ Archivo .env no encontrado${NC}"
    exit 1
fi

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

# Nombre del archivo de backup
BACKUP_FILE="$BACKUP_DIR/balizas_v16_backup_${TIMESTAMP}.sql"
BACKUP_TAR="$BACKUP_DIR/balizas_v16_backup_${TIMESTAMP}.tar.gz"

echo -e "${YELLOW}Realizando backup de la base de datos '$DB_NAME'...${NC}"

# Hacer backup con pg_dump
if [ -z "$DB_PASSWORD" ]; then
    PGPASSWORD="" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_TAR" 2>/dev/null || {
        # Intentar con formato SQL plano
        PGPASSWORD="" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
            echo -e "${RED}✗ Error al hacer backup${NC}"
            exit 1
        }
        echo -e "${GREEN}✓ Backup creado: $BACKUP_FILE${NC}"
    }
else
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_TAR" 2>/dev/null || {
        # Intentar con formato SQL plano
        PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
            echo -e "${RED}✗ Error al hacer backup${NC}"
            exit 1
        }
        echo -e "${GREEN}✓ Backup creado: $BACKUP_FILE${NC}"
    }
fi

if [ -f "$BACKUP_TAR" ]; then
    echo -e "${GREEN}✓ Backup comprimido creado: $BACKUP_TAR${NC}"
    BACKUP_SIZE=$(du -h "$BACKUP_TAR" | cut -f1)
    echo -e "${GREEN}  Tamaño: $BACKUP_SIZE${NC}"
elif [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✓ Backup SQL creado: $BACKUP_FILE${NC}"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}  Tamaño: $BACKUP_SIZE${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

