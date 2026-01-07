/**
 * API Backend Simple para Balizas V16
 * Node.js + Express
 * 
 * Preparado para integración con DGT 3.0
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./db/connection');
const { saveBalizas } = require('./db/queries');
const { obtenerBalizas, procesarDatos } = require('./services/balizasService');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Cache en memoria (en producción usar Redis)
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '60000', 10);
let cache = {
    data: null,
    lastUpdate: null,
    ttl: CACHE_TTL
};

// Configuración DGT
const DGT_API_URL = process.env.DGT_API_URL;
const DGT_API_TOKEN = process.env.DGT_API_TOKEN;

// Las funciones de obtención de datos están en services/balizasService.js
// Se importan arriba: obtenerBalizas, procesarDatos

/**
 * Función para obtener datos del feed DATEX2 de la DGT (DEPRECATED - usar servicio)
 * Feed público en formato XML que contiene situaciones de tráfico
 */
async function obtenerDeDATEX2_DEPRECATED() {
    try {
        console.log('Obteniendo datos del feed DATEX2 de la DGT...');
        
        const response = await fetch(DGT_DATEX2_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/xml, text/xml, */*'
            }
        });

        if (!response.ok) {
            throw new Error(`DATEX2 feed error: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();
        const jsonData = xmlParser.parse(xmlText);
        
        console.log('Datos obtenidos del feed DATEX2 exitosamente');
        return jsonData;
    } catch (error) {
        console.error('Error obteniendo datos del feed DATEX2:', error.message);
        throw error;
    }
}

/**
 * Función para extraer balizas V16 del feed DATEX2
 * Filtra situaciones relacionadas con vehículos obstruidos (vehicleStuck) que pueden ser balizas V16
 */
function extraerBalizasDeDATEX2(datex2Data) {
    const balizas = [];
    
    try {
        // Navegar por la estructura XML parseada
        const payload = datex2Data['d2:payload'] || datex2Data.payload;
        if (!payload) {
            console.warn('No se encontró payload en datos DATEX2');
            return { balizas: [] };
        }

        const situations = payload['sit:situation'] || payload.situation || [];
        const situationsArray = Array.isArray(situations) ? situations : [situations];

        for (const situation of situationsArray) {
            if (!situation) continue;

            const situationRecords = situation['sit:situationRecord'] || situation.situationRecord || [];
            const recordsArray = Array.isArray(situationRecords) ? situationRecords : [situationRecords];

            for (const record of recordsArray) {
                if (!record) continue;

                // Filtrar solo eventos de vehículos obstruidos (vehicleStuck) que pueden ser balizas V16
                const cause = record['sit:cause'] || record.cause || {};
                const causeType = cause['sit:causeType'] || cause.causeType || '';
                const detailedCause = cause['sit:detailedCauseType'] || cause.detailedCauseType || {};
                const vehicleObstructionType = detailedCause['sit:vehicleObstructionType'] || detailedCause.vehicleObstructionType || '';

                // Filtrar por vehicleObstruction con vehicleStuck (probable baliza V16)
                if (causeType === 'vehicleObstruction' && vehicleObstructionType === 'vehicleStuck') {
                    const locationRef = record['sit:locationReference'] || record.locationReference || {};
                    
                    // Extraer coordenadas y ubicación
                    let lat = null;
                    let lon = null;
                    let roadName = 'N/A';
                    let kmPoint = 'N/A';
                    let comunidad = 'N/A';
                    let provincia = 'N/A';
                    let municipio = 'N/A';
                    let sentido = 'N/A';

                    // Buscar en PointLocation (punto simple)
                    const pointLocation = locationRef['loc:tpegPointLocation'] || locationRef.tpegPointLocation || {};
                    if (pointLocation['loc:point'] || pointLocation.point) {
                        const point = pointLocation['loc:point'] || pointLocation.point;
                        const coords = point['loc:pointCoordinates'] || point.pointCoordinates || {};
                        lat = parseFloat(coords['loc:latitude'] || coords.latitude || 0);
                        lon = parseFloat(coords['loc:longitude'] || coords.longitude || 0);
                        
                        const extension = point['loc:_tpegNonJunctionPointExtension'] || point._tpegNonJunctionPointExtension || {};
                        const extended = extension['loc:extendedTpegNonJunctionPoint'] || extension.extendedTpegNonJunctionPoint || {};
                        kmPoint = (extended['lse:kilometerPoint'] || extended.kilometerPoint || 'N/A').toString();
                        comunidad = extended['lse:autonomousCommunity'] || extended.autonomousCommunity || 'N/A';
                        provincia = extended['lse:province'] || extended.province || 'N/A';
                        municipio = extended['lse:municipality'] || extended.municipality || 'N/A';
                    }

                    // Buscar en SingleRoadLinearLocation (segmento)
                    const linearLocation = locationRef['loc:tpegLinearLocation'] || locationRef.tpegLinearLocation || {};
                    if (linearLocation['loc:from'] || linearLocation.from) {
                        const fromPoint = linearLocation['loc:from'] || linearLocation.from;
                        const coords = fromPoint['loc:pointCoordinates'] || fromPoint.pointCoordinates || {};
                        if (!lat && !lon) {
                            lat = parseFloat(coords['loc:latitude'] || coords.latitude || 0);
                            lon = parseFloat(coords['loc:longitude'] || coords.longitude || 0);
                        }
                        
                        const extension = fromPoint['loc:_tpegNonJunctionPointExtension'] || fromPoint._tpegNonJunctionPointExtension || {};
                        const extended = extension['loc:extendedTpegNonJunctionPoint'] || extension.extendedTpegNonJunctionPoint || {};
                        if (kmPoint === 'N/A') {
                            kmPoint = (extended['lse:kilometerPoint'] || extended.kilometerPoint || 'N/A').toString();
                        }
                        if (comunidad === 'N/A') {
                            comunidad = extended['lse:autonomousCommunity'] || extended.autonomousCommunity || 'N/A';
                        }
                        if (provincia === 'N/A') {
                            provincia = extended['lse:province'] || extended.province || 'N/A';
                        }
                        if (municipio === 'N/A') {
                            municipio = extended['lse:municipality'] || extended.municipality || 'N/A';
                        }
                    }

                    // Extraer nombre de carretera
                    const suppDesc = locationRef['loc:supplementaryPositionalDescription'] || locationRef.supplementaryPositionalDescription || {};
                    const roadInfo = suppDesc['loc:roadInformation'] || suppDesc.roadInformation || {};
                    roadName = roadInfo['loc:roadName'] || roadInfo.roadName || 'N/A';

                    // Extraer sentido/dirección
                    const tpegDir = pointLocation['loc:tpegDirection'] || linearLocation['loc:tpegDirection'] || '';
                    if (tpegDir) {
                        sentido = tpegDir;
                    }

                    // Extraer fechas
                    const creationTime = record['sit:situationRecordCreationTime'] || record.situationRecordCreationTime || new Date().toISOString();
                    const versionTime = record['sit:situationRecordVersionTime'] || record.situationRecordVersionTime || creationTime;
                    const validity = record['sit:validity'] || record.validity || {};
                    const validityTime = validity['com:validityTimeSpecification'] || validity.validityTimeSpecification || {};
                    const startTime = validityTime['com:overallStartTime'] || validityTime.overallStartTime || creationTime;

                    // Solo agregar si tenemos coordenadas válidas
                    if (lat && lon && lat !== 0 && lon !== 0) {
                        const situationId = situation['@_id'] || situation.id || record['@_id'] || record.id || `${lat}-${lon}`;
                        
                        balizas.push({
                            id: situationId.toString(),
                            lat: lat,
                            lon: lon,
                            status: 'active', // Si está en el feed, está activa
                            carretera: roadName,
                            pk: kmPoint,
                            sentido: sentido,
                            orientacion: sentido, // Usar sentido como orientación
                            firstSeen: startTime,
                            lastSeen: versionTime,
                            comunidad: comunidad,
                            provincia: provincia,
                            municipio: municipio
                        });
                    }
                }
            }
        }

        console.log(`Extraídas ${balizas.length} balizas V16 del feed DATEX2`);
        return { balizas };
    } catch (error) {
        console.error('Error extrayendo balizas de DATEX2:', error);
        return { balizas: [] };
    }
}

/**
 * Función para obtener datos de DGT 3.0 (API REST)
 * Requiere configuración de DGT_API_URL y DGT_API_TOKEN en variables de entorno
 */
async function obtenerDeDGT3() {
    if (!DGT_API_URL || !DGT_API_TOKEN) {
        throw new Error('DGT 3.0 no configurado: faltan DGT_API_URL o DGT_API_TOKEN');
    }

    try {
        console.log('Intentando obtener datos de DGT 3.0...');
        
        const response = await fetch(DGT_API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${DGT_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`DGT 3.0 API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Datos obtenidos de DGT 3.0 exitosamente');
        return data;
    } catch (error) {
        console.error('Error obteniendo datos de DGT 3.0:', error.message);
        throw error;
    }
}

/**
 * Función para transformar datos de DGT 3.0 al formato interno esperado
 * Ajustar según el formato real de respuesta de DGT 3.0
 */
function transformarDatosDGT(datosDGT) {
    // Esta función debe adaptarse al formato real de respuesta de DGT 3.0
    // Por ahora, asumimos un formato genérico que puede variar
    
    let balizas = [];
    
    // Si los datos vienen en un array directo
    if (Array.isArray(datosDGT)) {
        balizas = datosDGT;
    }
    // Si vienen en un objeto con propiedad 'balizas' o 'eventos' o similar
    else if (datosDGT.balizas && Array.isArray(datosDGT.balizas)) {
        balizas = datosDGT.balizas;
    }
    else if (datosDGT.eventos && Array.isArray(datosDGT.eventos)) {
        balizas = datosDGT.eventos;
    }
    else if (datosDGT.data && Array.isArray(datosDGT.data)) {
        balizas = datosDGT.data;
    }
    else {
        console.warn('Formato de datos DGT 3.0 no reconocido, usando datos tal cual');
        balizas = [datosDGT];
    }

    return {
        balizas: balizas.map(b => ({
            id: b.id || b.identificador || `${b.latitud || b.lat}-${b.longitud || b.lon}-${Date.now()}`,
            lat: parseFloat(b.latitud || b.lat || b.latitude || 0),
            lon: parseFloat(b.longitud || b.lon || b.longitude || 0),
            status: (b.activa !== undefined ? (b.activa ? 'active' : 'lost') : 
                    (b.estado === 'activa' ? 'active' : 'lost')) || 
                    (b.status || 'active'),
            carretera: b.carretera || b.via || b.road || 'N/A',
            pk: b.puntoKilometrico || b.pk || b.km || 'N/A',
            sentido: b.sentido || b.direction || 'N/A',
            orientacion: b.orientacion || b.orientation || 'N/A',
            firstSeen: b.fechaInicio || b.firstSeen || b.timestamp || new Date().toISOString(),
            lastSeen: b.fechaUltima || b.lastSeen || b.ultimaActualizacion || new Date().toISOString(),
            comunidad: b.comunidadAutonoma || b.comunidad || b.region || 'N/A',
            provincia: b.provincia || b.province || 'N/A',
            municipio: b.municipio || b.municipality || 'N/A'
        }))
    };
}

/**
 * Función para obtener datos de ejemplo (fallback temporal)
 */
function obtenerDatosEjemplo() {
    return {
        balizas: [
            {
                id: "1",
                lat: 40.4168,
                lon: -3.7038,
                status: "active",
                carretera: "A-1",
                pk: "12.5",
                sentido: "Madrid",
                orientacion: "Norte",
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                comunidad: "Comunidad de Madrid",
                provincia: "Madrid",
                municipio: "Madrid"
            },
            {
                id: "2",
                lat: 41.3851,
                lon: 2.1734,
                status: "lost",
                carretera: "AP-7",
                pk: "45.2",
                sentido: "Barcelona",
                orientacion: "Este",
                firstSeen: new Date(Date.now() - 3600000).toISOString(),
                lastSeen: new Date(Date.now() - 300000).toISOString(),
                comunidad: "Cataluña",
                provincia: "Barcelona",
                municipio: "Barcelona"
            }
        ]
    };
}

// Las funciones obtenerBalizas() y procesarDatos() están importadas desde services/balizasService.js

/**
 * Endpoint principal
 */
app.get('/api/v16', async (req, res) => {
    try {
        // Verificar cache
        const now = Date.now();
        if (cache.data && cache.lastUpdate && (now - cache.lastUpdate) < cache.ttl) {
            console.log('Sirviendo desde cache');
            return res.json(cache.data);
        }

        // Obtener nuevos datos
        console.log('Obteniendo nuevos datos...');
        const datosBrutos = await obtenerBalizas();
        const datosProcesados = procesarDatos(datosBrutos);

        // Guardar automáticamente en BD (si está configurada)
        if (process.env.DATABASE_URL || process.env.DB_NAME) {
            try {
                const result = await saveBalizas(datosProcesados.balizas);
                console.log(`💾 Guardadas en BD: ${result.saved} nuevas, ${result.updated} actualizadas, ${result.errors} errores`);
            } catch (error) {
                console.warn('⚠️  No se pudo guardar en BD (puede no estar configurada):', error.message);
            }
        }

        // Actualizar cache
        cache.data = datosProcesados;
        cache.lastUpdate = now;

        res.json(datosProcesados);
    } catch (error) {
        console.error('Error obteniendo balizas:', error);
        res.status(500).json({ 
            error: 'Error al obtener datos de balizas',
            message: error.message 
        });
    }
});

/**
 * Endpoint de salud
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        cacheAge: cache.lastUpdate ? Date.now() - cache.lastUpdate : null
    });
});

/**
 * Endpoint para forzar actualización
 */
app.post('/api/v16/refresh', async (req, res) => {
    try {
        cache.data = null;
        cache.lastUpdate = null;
        
        const datosBrutos = await obtenerBalizas();
        const datosProcesados = procesarDatos(datosBrutos);
        
        // Guardar en BD
        if (process.env.DATABASE_URL || process.env.DB_NAME) {
            try {
                const result = await saveBalizas(datosProcesados.balizas);
                console.log(`💾 Guardadas en BD: ${result.saved} nuevas, ${result.updated} actualizadas`);
            } catch (error) {
                console.warn('⚠️  No se pudo guardar en BD:', error.message);
            }
        }
        
        cache.data = datosProcesados;
        cache.lastUpdate = Date.now();
        
        res.json({ 
            success: true,
            message: 'Cache actualizado',
            count: datosProcesados.balizas.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cargar rutas de admin
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Probar conexión a BD al iniciar
if (process.env.DATABASE_URL || process.env.DB_NAME) {
    testConnection().catch(err => {
        console.warn('⚠️  Base de datos no disponible, continuando sin persistencia');
    });
}

// Las funciones están exportadas desde services/balizasService.js

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`);
    console.log(`📡 Endpoint: http://localhost:${PORT}/api/v16`);
    console.log(`🔧 Admin: http://localhost:${PORT}/api/admin`);
});
