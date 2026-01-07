/**
 * Rutas de administración y análisis
 */

const express = require('express');
const router = express.Router();
const {
    getGeneralStats,
    getStatsByLocation,
    getTimeSeries,
    getRawData,
    getBalizaHistory,
    saveBalizas,
    getProvinciasList,
    getComunidadesList,
    getAccumulatedStats,
    getTimePatterns,
    getComparisonData,
    getTrendStats
} = require('../db/queries');

/**
 * Guardar datos manualmente
 * Obtiene datos del feed y los guarda en BD
 */
router.post('/save', async (req, res) => {
    try {
        const { obtenerBalizas, procesarDatos } = require('../services/balizasService');
        
        const datosBrutos = await obtenerBalizas();
        const datosProcesados = procesarDatos(datosBrutos);
        
        const result = await saveBalizas(datosProcesados.balizas);
        
        res.json({
            success: true,
            message: 'Datos guardados exitosamente',
            ...result
        });
    } catch (error) {
        console.error('Error guardando datos:', error);
        res.status(500).json({
            error: 'Error al guardar datos',
            message: error.message
        });
    }
});

/**
 * Estadísticas generales
 */
router.get('/stats/general', async (req, res) => {
    try {
        const filters = {
            provincia: req.query.provincia,
            comunidad: req.query.comunidad,
            carretera: req.query.carretera,
            status: req.query.status,
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin
        };
        
        const stats = await getGeneralStats(filters);
        
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        // Si es error de BD no configurada, devolver datos vacíos
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist')))) {
            res.json({
                total: 0,
                activas: 0,
                perdidas: 0,
                provincias: 0,
                comunidades: 0,
                carreteras: 0
            });
        } else {
            res.status(500).json({
                error: 'Error al obtener estadísticas',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Estadísticas por ubicación
 */
router.get('/stats/by-location', async (req, res) => {
    try {
        const filters = {
            provincia: req.query.provincia,
            comunidad: req.query.comunidad,
            carretera: req.query.carretera,
            status: req.query.status,
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin
        };
        
        const stats = await getStatsByLocation(filters);
        
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas por ubicación:', error);
        // Si es error de BD no configurada, devolver datos vacíos
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Base de datos no disponible')))) {
            res.json({
                byProvincia: [],
                byComunidad: []
            });
        } else {
            res.status(500).json({
                error: 'Error al obtener estadísticas',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Series temporales
 */
router.get('/timeseries/counts', async (req, res) => {
    try {
        const filters = {
            agrupacion: req.query.agrupacion || 'hour',
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin
        };
        
        const series = await getTimeSeries(filters);
        
        res.json({
            agrupacion: filters.agrupacion,
            data: series
        });
    } catch (error) {
        console.error('Error obteniendo series temporales:', error);
        // Si es error de BD no configurada, devolver datos vacíos
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Base de datos no disponible')))) {
            res.json({
                agrupacion: filters.agrupacion,
                data: []
            });
        } else {
            res.status(500).json({
                error: 'Error al obtener series temporales',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Series temporales por ubicación
 */
router.get('/timeseries/locations', async (req, res) => {
    try {
        const { agrupacion = 'day', fecha_inicio, fecha_fin, tipo = 'provincia' } = req.query;
        
        // Por ahora retornamos estructura básica
        // Se puede expandir con queries más complejas
        const filters = {
            agrupacion,
            fecha_inicio,
            fecha_fin
        };
        
        const series = await getTimeSeries(filters);
        const locationStats = await getStatsByLocation({ fecha_inicio, fecha_fin });
        
        res.json({
            agrupacion,
            tipo,
            series,
            locations: tipo === 'provincia' ? locationStats.byProvincia : locationStats.byComunidad
        });
    } catch (error) {
        console.error('Error obteniendo series por ubicación:', error);
        // Si es error de BD no configurada, devolver datos vacíos
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Base de datos no disponible')))) {
            res.json({
                agrupacion: req.query.agrupacion || 'day',
                tipo,
                series: [],
                locations: []
            });
        } else {
            res.status(500).json({
                error: 'Error al obtener series por ubicación',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Análisis de patrones temporales
 */
router.get('/timeseries/patterns', async (req, res) => {
    try {
        const { tipo = 'day-of-week', fecha_inicio, fecha_fin } = req.query;
        
        const patterns = await getTimePatterns({
            tipo,
            fecha_inicio,
            fecha_fin
        });
        
        res.json(patterns);
    } catch (error) {
        console.error('Error obteniendo patrones temporales:', error);
        // Si es error de BD no configurada, devolver datos vacíos
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Base de datos no disponible')))) {
            res.json({
                labels: [],
                data: []
            });
        } else {
            res.status(500).json({
                error: 'Error al obtener patrones temporales',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Datos para comparación de períodos
 */
router.get('/timeseries/comparison', async (req, res) => {
    try {
        const { agrupacion = 'day', fecha_inicio, fecha_fin, comparison_type = 'previous' } = req.query;
        
        const comparison = await getComparisonData({
            agrupacion,
            fecha_inicio,
            fecha_fin,
            comparison_type
        });
        
        res.json(comparison);
    } catch (error) {
        console.error('Error obteniendo datos de comparación:', error);
        // Si es error de BD no configurada, devolver datos vacíos
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Base de datos no disponible')))) {
            res.json({
                current: [],
                comparison: []
            });
        } else {
            res.status(500).json({
                error: 'Error al obtener datos de comparación',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Estadísticas de tendencia
 */
router.get('/timeseries/trends', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        const trends = await getTrendStats({
            fecha_inicio,
            fecha_fin
        });
        
        res.json(trends);
    } catch (error) {
        console.error('Error obteniendo estadísticas de tendencia:', error);
        // Si es error de BD no configurada, devolver datos vacíos
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Base de datos no disponible')))) {
            res.json({
                total: { first: 0, last: 0, change: 0 },
                activas: { first: 0, last: 0, change: 0 },
                perdidas: { first: 0, last: 0, change: 0 },
                nuevas: { first: 0, last: 0, change: 0 }
            });
        } else {
            res.status(500).json({
                error: 'Error al obtener estadísticas de tendencia',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Datos crudos con filtros
 */
router.get('/data/raw', async (req, res) => {
    try {
        const filters = {
            provincia: req.query.provincia,
            comunidad: req.query.comunidad,
            carretera: req.query.carretera,
            status: req.query.status,
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin
        };
        
        const limit = parseInt(req.query.limit || '1000', 10);
        const offset = parseInt(req.query.offset || '0', 10);
        
        const result = await getRawData(filters, limit, offset);
        
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo datos crudos:', error);
        // Si es error de BD no configurada, devolver datos vacíos
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Base de datos no disponible')))) {
            res.json({
                data: [],
                total: 0,
                limit: parseInt(req.query.limit || '1000', 10),
                offset: parseInt(req.query.offset || '0', 10)
            });
        } else {
            res.status(500).json({
                error: 'Error al obtener datos',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Historial de una baliza específica
 */
router.get('/history/:balizaId', async (req, res) => {
    try {
        const { balizaId } = req.params;
        const limit = parseInt(req.query.limit || '100', 10);
        
        const history = await getBalizaHistory(balizaId, limit);
        
        res.json({
            balizaId,
            history
        });
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({
            error: 'Error al obtener historial',
            message: error.message
        });
    }
});

/**
 * Obtener lista de provincias
 */
router.get('/locations/provincias', async (req, res) => {
    try {
        const filters = {
            comunidad: req.query.comunidad,
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin
        };
        
        const provincias = await getProvinciasList(filters);
        
        res.json(provincias);
    } catch (error) {
        console.error('Error obteniendo provincias:', error);
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Base de datos no disponible')))) {
            res.json([]);
        } else {
            res.status(500).json({
                error: 'Error al obtener provincias',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Obtener lista de comunidades
 */
router.get('/locations/comunidades', async (req, res) => {
    try {
        const filters = {
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin
        };
        
        const comunidades = await getComunidadesList(filters);
        
        res.json(comunidades);
    } catch (error) {
        console.error('Error obteniendo comunidades:', error);
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Base de datos no disponible')))) {
            res.json([]);
        } else {
            res.status(500).json({
                error: 'Error al obtener comunidades',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Estadísticas acumuladas
 */
router.get('/stats/accumulated', async (req, res) => {
    try {
        const filters = {
            agrupacion: req.query.agrupacion || 'day',
            provincia: req.query.provincia,
            comunidad: req.query.comunidad,
            carretera: req.query.carretera,
            status: req.query.status,
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin
        };
        
        const accumulated = await getAccumulatedStats(filters);
        
        res.json({
            agrupacion: filters.agrupacion,
            data: accumulated
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas acumuladas:', error);
        if (error.dbError || error.code === '42P01' || error.code === 'ECONNREFUSED' || 
            (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Base de datos no disponible')))) {
            res.json({
                agrupacion: filters.agrupacion || 'day',
                data: []
            });
        } else {
            res.status(500).json({
                error: 'Error al obtener estadísticas acumuladas',
                message: error.message || 'Error desconocido'
            });
        }
    }
});

/**
 * Exportar datos (JSON)
 */
router.get('/export', async (req, res) => {
    try {
        const filters = {
            provincia: req.query.provincia,
            comunidad: req.query.comunidad,
            carretera: req.query.carretera,
            status: req.query.status,
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin
        };
        
        const result = await getRawData(filters, 10000, 0); // Límite alto para export
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="balizas-${Date.now()}.json"`);
        res.json(result.data);
    } catch (error) {
        console.error('Error exportando datos:', error);
        res.status(500).json({
            error: 'Error al exportar datos',
            message: error.message
        });
    }
});

module.exports = router;

