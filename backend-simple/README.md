# API Backend Simple - Balizas V16

API backend que obtiene datos de balizas V16 desde el feed DATEX2 público de la DGT y opcionalmente desde DGT 3.0 API REST.

## Instalación

```bash
npm install
```

## Configuración

### Variables de Entorno

Crea un archivo `.env` en este directorio (puedes usar `.env.example` como referencia):

```env
PORT=3000
CACHE_TTL=60000

# Feed DATEX2 (opcional, ya tiene valor por defecto)
DGT_DATEX2_URL=https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml

# DGT 3.0 API REST (opcional, solo si tienes acceso)
DGT_API_URL=https://api.dgt3.es/v1/balizas
DGT_API_TOKEN=tu_token_aqui
```

**Nota:** La API funciona automáticamente con el feed DATEX2 público de la DGT. No se requiere configuración para empezar a usar datos reales. Ver [INTEGRACION_DGT3.md](INTEGRACION_DGT3.md) para más información.

## Uso

### Desarrollo
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Producción
```bash
npm start
```

## Endpoints

- `GET /api/v16` - Obtiene todas las balizas (con cache de 60s por defecto)
- `GET /health` - Estado del servidor y edad del cache
- `POST /api/v16/refresh` - Fuerza actualización del cache

## Funcionalidades

### Integración con DGT

- ✅ **Feed DATEX2 público** - Implementado y funcionando automáticamente
- ✅ **DGT 3.0 API REST** - Preparado (opcional, requiere acceso)
- ✅ **Extracción automática** - Filtra y extrae balizas V16 del feed XML
- ✅ **Transformación automática** - Convierte datos al formato interno esperado
- ✅ **Fallback inteligente** - Prioriza DGT 3.0 API → Feed DATEX2 → Datos de ejemplo
- ✅ **Manejo robusto de errores** - Continúa funcionando aunque una fuente falle

### Cache

- Cache en memoria con TTL configurable
- Reduce llamadas a la API externa
- Mejora el rendimiento

## Estado Actual

**✅ Funcionando con datos reales:** La API obtiene datos automáticamente del feed DATEX2 público de la DGT.

**Fuente de datos:**
- Feed DATEX2: https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml
- Se extraen automáticamente eventos de tipo `vehicleObstruction` con `vehicleStuck` (balizas V16)
- Actualización en tiempo real desde el feed oficial

**Opcional:** Configurar DGT 3.0 API REST para tener prioridad (ver [INTEGRACION_DGT3.md](INTEGRACION_DGT3.md)).

## Próximos Pasos

1. ✅ **Implementar `obtenerBalizas()`** - Completado
2. ✅ **Integración con feed DATEX2** - Completado y funcionando
3. ⏳ **Obtener acceso a DGT 3.0 API** (opcional) - Ver [INTEGRACION_DGT3.md](INTEGRACION_DGT3.md)
4. ⏳ **Configurar credenciales DGT 3.0** (opcional) - Agregar `DGT_API_URL` y `DGT_API_TOKEN` en `.env`
5. 🔄 **Configurar cache externo** (Redis) para producción
6. 🔄 **Agregar rate limiting** para proteger la API
7. 🔄 **Desplegar a producción** (Heroku, Railway, Render, etc.)

## Documentación

- [INTEGRACION_DGT3.md](INTEGRACION_DGT3.md) - Guía completa para integrar con DGT 3.0
- [../GUIA_IMPLEMENTACION.md](../GUIA_IMPLEMENTACION.md) - Guía general de implementación
- [../MIGRACION_API.md](../MIGRACION_API.md) - Guía de migración del frontend
