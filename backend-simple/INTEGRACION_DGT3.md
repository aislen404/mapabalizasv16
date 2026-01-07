# Guía de Integración con DGT

Esta guía explica las diferentes formas de obtener datos de balizas V16 desde la DGT.

## Fuentes de Datos Disponibles

### 1. Feed DATEX2 Público (✅ Implementado y Funcionando)

**URL:** https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml

**Características:**
- ✅ **Público y gratuito** - No requiere autenticación
- ✅ **Ya implementado** - Funciona automáticamente
- ✅ **Actualización en tiempo real** - Feed XML actualizado constantemente
- ✅ **Formato estándar DATEX2** - Estándar europeo para información de tráfico

**Estado:** La API ya está configurada para usar este feed automáticamente como fuente secundaria.

### 2. DGT 3.0 API REST (Opcional)

DGT 3.0 es la plataforma oficial de la Dirección General de Tráfico de España que proporciona acceso a datos de tráfico en tiempo real mediante APIs REST y colas MQTT.

**Características:**
- APIs REST y colas MQTT para integración
- Datos anónimos (sin información personal)
- Actualización en tiempo real
- Acceso oficial y legal
- **Requiere solicitud de acceso**

## Prioridad de Fuentes de Datos

La API intenta obtener datos en este orden:

1. **DGT 3.0 API REST** (si está configurada con `DGT_API_URL` y `DGT_API_TOKEN`)
2. **Feed DATEX2 público** (automático, no requiere configuración)
3. **Datos de ejemplo** (fallback si todo falla)

## Configuración Actual

### Feed DATEX2 (Ya Funcionando)

No requiere configuración. La API usa automáticamente:
- URL: `https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml`
- Se puede personalizar con variable de entorno `DGT_DATEX2_URL`

El feed se parsea automáticamente y se extraen las balizas V16 (eventos de tipo `vehicleObstruction` con `vehicleStuck`).

## DGT 3.0 API REST (Opcional)

### Pasos para Obtener Acceso

### 1. Contactar con DGT

**Portal oficial:** https://www.dgt.es/muevete-con-seguridad/tecnologia-e-innovacion-en-carretera/forma-parte-de-la-dgt-3.0/

**Pasos:**
1. Visitar el portal de DGT 3.0
2. Completar el formulario de solicitud de acceso
3. Proporcionar información sobre tu proyecto/uso
4. Esperar respuesta de la DGT (puede tardar varios días/semanas)

### 2. Obtener Credenciales

Una vez aprobado, la DGT te proporcionará:
- **URL base de la API**: Ejemplo: `https://api.dgt3.es/v1`
- **Token de autenticación**: Token Bearer para autenticación
- **Documentación técnica**: Especificación de endpoints y formatos

### 3. Configurar Variables de Entorno

Una vez tengas las credenciales:

1. **Crear archivo `.env`** en el directorio `backend-simple/`:
```bash
cd backend-simple
cp .env.example .env
```

2. **Editar `.env`** y completar las variables:
```env
# Configuración del servidor
PORT=3000
CACHE_TTL=60000

# Feed DATEX2 (opcional, ya tiene valor por defecto)
DGT_DATEX2_URL=https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml

# DGT 3.0 API REST (opcional, solo si tienes acceso)
DGT_API_URL=https://api.dgt3.es/v1/balizas
DGT_API_TOKEN=tu_token_aqui
```

**Nota:** Si no configuras `DGT_API_URL` y `DGT_API_TOKEN`, la API usará automáticamente el feed DATEX2 público.

3. **No commitees el archivo `.env`** (debe estar en `.gitignore`)

## Formato de Respuesta Esperado

La función `transformarDatosDGT()` en `server.js` está preparada para manejar diferentes formatos de respuesta. Sin embargo, necesitarás ajustarla según el formato real que devuelva DGT 3.0.

### Formatos Soportados Actualmente

La función maneja estos formatos:

1. **Array directo:**
```json
[
  {
    "id": "123",
    "latitud": 40.4168,
    "longitud": -3.7038,
    "activa": true,
    ...
  }
]
```

2. **Objeto con propiedad `balizas`:**
```json
{
  "balizas": [
    {
      "id": "123",
      "latitud": 40.4168,
      ...
    }
  ]
}
```

3. **Objeto con propiedad `eventos`:**
```json
{
  "eventos": [
    {
      "id": "123",
      "latitud": 40.4168,
      ...
    }
  ]
}
```

### Mapeo de Campos

La función `transformarDatosDGT()` mapea automáticamente estos campos:

| Campo Interno | Campos DGT 3.0 (alternativas) |
|---------------|-------------------------------|
| `id` | `id`, `identificador` |
| `lat` | `latitud`, `lat`, `latitude` |
| `lon` | `longitud`, `lon`, `longitude` |
| `status` | `activa` (true/false), `estado` ("activa"/"lost") |
| `carretera` | `carretera`, `via`, `road` |
| `pk` | `puntoKilometrico`, `pk`, `km` |
| `sentido` | `sentido`, `direction` |
| `orientacion` | `orientacion`, `orientation` |
| `firstSeen` | `fechaInicio`, `firstSeen`, `timestamp` |
| `lastSeen` | `fechaUltima`, `lastSeen`, `ultimaActualizacion` |
| `comunidad` | `comunidadAutonoma`, `comunidad`, `region` |
| `provincia` | `provincia`, `province` |
| `municipio` | `municipio`, `municipality` |

## Ajustar la Transformación

Si el formato de DGT 3.0 es diferente, edita la función `transformarDatosDGT()` en `server.js`:

```javascript
function transformarDatosDGT(datosDGT) {
    // Ajustar según el formato real de DGT 3.0
    let balizas = datosDGT.balizas || datosDGT.eventos || datosDGT;
    
    return {
        balizas: balizas.map(b => ({
            // Mapear campos según formato real
            id: b.id,
            lat: parseFloat(b.latitud),
            lon: parseFloat(b.longitud),
            // ... resto de campos
        }))
    };
}
```

## Testing

### 1. Probar Localmente

```bash
cd backend-simple
npm install
npm run dev
```

En otra terminal:
```bash
curl http://localhost:3000/api/v16
```

### 2. Verificar Logs

El servidor mostrará en consola:
- `"Intentando obtener datos de DGT 3.0..."` si está configurado
- `"Datos obtenidos de DGT 3.0 exitosamente"` si funciona
- `"DGT 3.0 no configurado, usando datos de ejemplo"` si faltan credenciales
- `"No se pudo obtener datos de DGT 3.0, usando datos de ejemplo"` si hay error

### 3. Probar en Frontend

1. Asegúrate de que el backend esté corriendo
2. Abre `app.js` en el navegador
3. Verifica en la consola del navegador que los datos se cargan correctamente
4. Verifica que los marcadores aparecen en el mapa

## Solución de Problemas

### Error: "DGT 3.0 no configurado"

**Causa:** Faltan variables de entorno `DGT_API_URL` o `DGT_API_TOKEN`

**Solución:**
1. Verificar que existe archivo `.env` en `backend-simple/`
2. Verificar que las variables están definidas
3. Reiniciar el servidor después de cambiar `.env`

### Error: "DGT 3.0 API error: 401 Unauthorized"

**Causa:** Token inválido o expirado

**Solución:**
1. Verificar que el token es correcto
2. Contactar con DGT si el token ha expirado
3. Verificar formato del header de autorización

### Error: "DGT 3.0 API error: 404 Not Found"

**Causa:** URL de la API incorrecta

**Solución:**
1. Verificar `DGT_API_URL` en `.env`
2. Consultar documentación de DGT 3.0 para la URL correcta
3. Verificar que el endpoint existe

### Los datos no se transforman correctamente

**Causa:** Formato de respuesta diferente al esperado

**Solución:**
1. Agregar `console.log(datosDGT)` en `obtenerDeDGT3()` para ver formato real
2. Ajustar `transformarDatosDGT()` según formato real
3. Verificar mapeo de campos

## Estado Actual

**✅ La API ya está funcionando con datos reales:**

- El feed DATEX2 público está implementado y funcionando
- Se extraen automáticamente las balizas V16 del feed
- No se requieren credenciales para usar el feed DATEX2
- Los datos se actualizan automáticamente desde el feed oficial de la DGT

**Opcional - DGT 3.0 API REST:**

- Si obtienes acceso a DGT 3.0 API, configúrala en `.env` para tener prioridad
- El código está preparado y funcionará automáticamente
- Solo será necesario configurar las variables de entorno

## Referencias

- **Portal DGT 3.0:** https://www.dgt.es/muevete-con-seguridad/tecnologia-e-innovacion-en-carretera/forma-parte-de-la-dgt-3.0/
- **DGT Principal:** https://www.dgt.es
- **Observatorio Nacional de Seguridad Vial:** https://seguridadvial2030.dgt.es

## Notas Importantes

⚠️ **IMPORTANTE:**
- No compartas tus credenciales de DGT 3.0
- No commitees el archivo `.env` al repositorio
- Respeta los límites de rate de la API de DGT
- Verifica los términos de uso de DGT 3.0

