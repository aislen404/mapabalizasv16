#!/bin/bash

# Script para restaurar la base de datos desde un backup

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backend-simple"
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backups"

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔄 Restaurar Base de Datos - Balizas V16${NC}"
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

# Listar backups disponibles
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
    echo -e "${RED}✗ No se encontraron backups en $BACKUP_DIR${NC}"
    exit 1
fi

echo -e "${CYAN}Backups disponibles:${NC}"
echo ""
BACKUPS=($(ls -t "$BACKUP_DIR"/*.{sql,tar.gz} 2>/dev/null | head -10))
for i in "${!BACKUPS[@]}"; do
    echo -e "  ${GREEN}[$((i+1))]${NC} $(basename "${BACKUPS[$i]}")"
done
echo ""

# Seleccionar backup
echo -e "${CYAN}Selecciona el número del backup a restaurar:${NC}"
read -r selection

if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "${#BACKUPS[@]}" ]; then
    echo -e "${RED}✗ Selección inválida${NC}"
    exit 1
fi

BACKUP_FILE="${BACKUPS[$((selection-1))]}"

echo ""
echo -e "${YELLOW}⚠ ADVERTENCIA: Esto eliminará todos los datos actuales de la base de datos${NC}"
echo -e "${CYAN}¿Estás seguro de que deseas continuar? (escribe 'si' para confirmar):${NC}"
read -r confirmation

if [ "$confirmation" != "si" ]; then
    echo -e "${YELLOW}Operación cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Restaurando desde: $(basename "$BACKUP_FILE")${NC}"

# Eliminar y recrear la base de datos
echo -e "${YELLOW}Eliminando base de datos existente...${NC}"
if [ -z "$DB_PASSWORD" ]; then
    PGPASSWORD="" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
    PGPASSWORD="" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
else
    PGPASSWORD="$DB_PASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
    PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
fi

# Restaurar backup
if [[ "$BACKUP_FILE" == *.tar.gz ]]; then
    # Backup comprimido (custom format)
    if [ -z "$DB_PASSWORD" ]; then
        PGPASSWORD="" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$BACKUP_FILE" || {
            echo -e "${RED}✗ Error al restaurar backup${NC}"
            exit 1
        }
    else
        PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$BACKUP_FILE" || {
            echo -e "${RED}✗ Error al restaurar backup${NC}"
            exit 1
        }
    fi
else
    # Backup SQL plano
    if [ -z "$DB_PASSWORD" ]; then
        PGPASSWORD="" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE" || {
            echo -e "${RED}✗ Error al restaurar backup${NC}"
            exit 1
        }
    else
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE" || {
            echo -e "${RED}✗ Error al restaurar backup${NC}"
            exit 1
        }
    fi
fi

echo -e "${GREEN}✓ Base de datos restaurada correctamente${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

