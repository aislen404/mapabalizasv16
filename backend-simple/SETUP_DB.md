# Configuración de Base de Datos PostgreSQL

## Opción 1: Usar Docker (Recomendado - Más fácil)

### 1. Iniciar PostgreSQL con Docker

```bash
cd backend-simple
docker-compose up -d
```

Esto iniciará PostgreSQL en el puerto 5432 con:
- Usuario: `postgres`
- Contraseña: `postgres`
- Base de datos: `balizas_v16`

### 2. Inicializar las tablas

```bash
node db/init-db.js
```

### 3. Verificar que funciona

```bash
# Ver logs de Docker
docker-compose logs -f postgres

# O conectarte directamente
docker exec -it balizas_postgres psql -U postgres -d balizas_v16
```

## Opción 2: Instalar PostgreSQL localmente

### macOS (con Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15
createdb balizas_v16
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb balizas_v16
```

### Windows

1. Descargar PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Instalar con las opciones por defecto
3. Crear la base de datos desde pgAdmin o desde la línea de comandos

### Configurar .env

Edita `backend-simple/.env` y ajusta las credenciales si es necesario:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/balizas_v16
```

### Inicializar las tablas

```bash
cd backend-simple
node db/init-db.js
```

## Verificar que funciona

Una vez configurado, el backend guardará datos automáticamente cuando reciba balizas del feed DATEX2.

Puedes verificar que hay datos con:

```bash
# Si usas Docker
docker exec -it balizas_postgres psql -U postgres -d balizas_v16 -c "SELECT COUNT(*) FROM balizas;"

# Si usas PostgreSQL local
psql -U postgres -d balizas_v16 -c "SELECT COUNT(*) FROM balizas;"
```

## Solución de Problemas

### Error: "connection refused"

- Verifica que PostgreSQL esté corriendo:
  - Docker: `docker-compose ps`
  - Local: `brew services list` (macOS) o `sudo systemctl status postgresql` (Linux)

### Error: "database does not exist"

- Crea la base de datos:
  - Docker: Se crea automáticamente
  - Local: `createdb balizas_v16` o `sudo -u postgres createdb balizas_v16`

### Error: "password authentication failed"

- Verifica las credenciales en `.env`
- Para Docker, las credenciales por defecto son `postgres/postgres`

## Detener Docker (si lo usas)

```bash
cd backend-simple
docker-compose down
```

Para eliminar también los datos:

```bash
docker-compose down -v
```

