/**
 * Servicio para obtener datos de balizas
 * Separado para evitar dependencias circulares
 */

const { XMLParser } = require('fast-xml-parser');

const DGT_API_URL = process.env.DGT_API_URL;
const DGT_API_TOKEN = process.env.DGT_API_TOKEN;
const DGT_DATEX2_URL = process.env.DGT_DATEX2_URL || 'https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml';

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true,
    trimValues: true
});

/**
 * Obtiene datos del feed DATEX2
 */
async function obtenerDeDATEX2() {
    try {
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
        
        return jsonData;
    } catch (error) {
        console.error('Error obteniendo datos del feed DATEX2:', error.message);
        throw error;
    }
}

/**
 * Extrae balizas del feed DATEX2
 */
function extraerBalizasDeDATEX2(datex2Data) {
    const balizas = [];
    
    try {
        const payload = datex2Data['d2:payload'] || datex2Data.payload;
        if (!payload) {
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

                const cause = record['sit:cause'] || record.cause || {};
                const causeType = cause['sit:causeType'] || cause.causeType || '';
                const detailedCause = cause['sit:detailedCauseType'] || cause.detailedCauseType || {};
                const vehicleObstructionType = detailedCause['sit:vehicleObstructionType'] || detailedCause.vehicleObstructionType || '';

                if (causeType === 'vehicleObstruction' && vehicleObstructionType === 'vehicleStuck') {
                    const locationRef = record['sit:locationReference'] || record.locationReference || {};
                    
                    let lat = null;
                    let lon = null;
                    let roadName = 'N/A';
                    let kmPoint = 'N/A';
                    let comunidad = 'N/A';
                    let provincia = 'N/A';
                    let municipio = 'N/A';
                    let sentido = 'N/A';

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

                    const suppDesc = locationRef['loc:supplementaryPositionalDescription'] || locationRef.supplementaryPositionalDescription || {};
                    const roadInfo = suppDesc['loc:roadInformation'] || suppDesc.roadInformation || {};
                    roadName = roadInfo['loc:roadName'] || roadInfo.roadName || 'N/A';

                    const tpegDir = pointLocation['loc:tpegDirection'] || linearLocation['loc:tpegDirection'] || '';
                    if (tpegDir) {
                        sentido = tpegDir;
                    }

                    const creationTime = record['sit:situationRecordCreationTime'] || record.situationRecordCreationTime || new Date().toISOString();
                    const versionTime = record['sit:situationRecordVersionTime'] || record.situationRecordVersionTime || creationTime;
                    const validity = record['sit:validity'] || record.validity || {};
                    const validityTime = validity['com:validityTimeSpecification'] || validity.validityTimeSpecification || {};
                    const startTime = validityTime['com:overallStartTime'] || validityTime.overallStartTime || creationTime;

                    if (lat && lon && lat !== 0 && lon !== 0) {
                        const situationId = situation['@_id'] || situation.id || record['@_id'] || record.id || `${lat}-${lon}`;
                        
                        balizas.push({
                            id: situationId.toString(),
                            lat: lat,
                            lon: lon,
                            status: 'active',
                            carretera: roadName,
                            pk: kmPoint,
                            sentido: sentido,
                            orientacion: sentido,
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

        return { balizas };
    } catch (error) {
        console.error('Error extrayendo balizas de DATEX2:', error);
        return { balizas: [] };
    }
}

/**
 * Obtiene datos de ejemplo
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
            }
        ]
    };
}

/**
 * Función principal para obtener balizas
 */
async function obtenerBalizas() {
    // Intentar DATEX2 primero
    try {
        const datex2Data = await obtenerDeDATEX2();
        const balizas = extraerBalizasDeDATEX2(datex2Data);
        if (balizas.balizas && balizas.balizas.length > 0) {
            return balizas;
        }
    } catch (error) {
        console.warn('No se pudo obtener del feed DATEX2:', error.message);
    }
    
    return obtenerDatosEjemplo();
}

/**
 * Procesa y formatea datos
 */
function procesarDatos(datosBrutos) {
    return {
        balizas: datosBrutos.balizas.map(b => ({
            ...b,
            status: b.status || "active",
            carretera: b.carretera || "N/A",
            pk: b.pk || "N/A"
        }))
    };
}

module.exports = {
    obtenerBalizas,
    procesarDatos
};

