/**
 * Queries SQL para gestión de balizas
 */

const { query, getClient } = require('./connection');

/**
 * Inserta o actualiza una baliza
 * Retorna true si hubo cambios
 */
async function upsertBaliza(baliza) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Verificar si existe
    const existing = await client.query(
      'SELECT id, status, lat, lon, carretera, pk FROM balizas WHERE id = $1',
      [baliza.id]
    );
    
    const exists = existing.rows.length > 0;
    let hasChanges = false;
    
    if (exists) {
      const old = existing.rows[0];
      
      // Verificar si hay cambios
      hasChanges = 
        old.status !== baliza.status ||
        parseFloat(old.lat) !== parseFloat(baliza.lat) ||
        parseFloat(old.lon) !== parseFloat(baliza.lon) ||
        old.carretera !== baliza.carretera ||
        old.pk !== baliza.pk;
      
      if (hasChanges) {
        // Actualizar baliza
        await client.query(`
          UPDATE balizas 
          SET 
            lat = $1, lon = $2, status = $3,
            carretera = $4, pk = $5, sentido = $6, orientacion = $7,
            comunidad = $8, provincia = $9, municipio = $10,
            first_seen = COALESCE(first_seen, $11),
            last_seen = $12,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $13
        `, [
          baliza.lat, baliza.lon, baliza.status,
          baliza.carretera || null, baliza.pk || null, baliza.sentido || null, baliza.orientacion || null,
          baliza.comunidad || null, baliza.provincia || null, baliza.municipio || null,
          baliza.firstSeen ? new Date(baliza.firstSeen) : null,
          baliza.lastSeen ? new Date(baliza.lastSeen) : new Date(),
          baliza.id
        ]);
        
        // Registrar en historial
        await client.query(`
          INSERT INTO baliza_history (
            baliza_id, status, lat, lon, carretera, pk, sentido, orientacion,
            comunidad, provincia, municipio, changed_at, change_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, $12)
        `, [
          baliza.id, baliza.status, baliza.lat, baliza.lon,
          baliza.carretera || null, baliza.pk || null, baliza.sentido || null, baliza.orientacion || null,
          baliza.comunidad || null, baliza.provincia || null, baliza.municipio || null,
          hasChanges ? 'status_change' : 'info_update'
        ]);
      } else {
        // Solo actualizar last_seen
        await client.query(
          'UPDATE balizas SET last_seen = $1 WHERE id = $2',
          [baliza.lastSeen ? new Date(baliza.lastSeen) : new Date(), baliza.id]
        );
      }
    } else {
      // Insertar nueva baliza
      hasChanges = true;
      await client.query(`
        INSERT INTO balizas (
          id, lat, lon, status, carretera, pk, sentido, orientacion,
          comunidad, provincia, municipio, first_seen, last_seen
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        baliza.id, baliza.lat, baliza.lon, baliza.status,
        baliza.carretera || null, baliza.pk || null, baliza.sentido || null, baliza.orientacion || null,
        baliza.comunidad || null, baliza.provincia || null, baliza.municipio || null,
        baliza.firstSeen ? new Date(baliza.firstSeen) : new Date(),
        baliza.lastSeen ? new Date(baliza.lastSeen) : new Date()
      ]);
      
      // Registrar en historial
      await client.query(`
        INSERT INTO baliza_history (
          baliza_id, status, lat, lon, carretera, pk, sentido, orientacion,
          comunidad, provincia, municipio, changed_at, change_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, 'new')
      `, [
        baliza.id, baliza.status, baliza.lat, baliza.lon,
        baliza.carretera || null, baliza.pk || null, baliza.sentido || null, baliza.orientacion || null,
        baliza.comunidad || null, baliza.provincia || null, baliza.municipio || null
      ]);
    }
    
    await client.query('COMMIT');
    return hasChanges;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Guarda múltiples balizas
 */
async function saveBalizas(balizas) {
  let saved = 0;
  let updated = 0;
  let errors = 0;
  
  for (const baliza of balizas) {
    try {
      const existed = await query('SELECT id FROM balizas WHERE id = $1', [baliza.id]);
      const hasChanges = await upsertBaliza(baliza);
      
      if (existed.rows.length > 0) {
        if (hasChanges) updated++;
      } else {
        saved++;
      }
    } catch (error) {
      console.error(`Error guardando baliza ${baliza.id}:`, error.message);
      errors++;
    }
  }
  
  return { saved, updated, errors, total: balizas.length };
}

/**
 * Obtiene estadísticas generales
 */
async function getGeneralStats(filters = {}) {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (filters.provincia && filters.provincia !== 'todas') {
      whereClause += ` AND provincia = $${paramIndex}`;
      params.push(filters.provincia);
      paramIndex++;
    }
    
    if (filters.comunidad && filters.comunidad !== 'todas') {
      whereClause += ` AND comunidad = $${paramIndex}`;
      params.push(filters.comunidad);
      paramIndex++;
    }
    
    if (filters.carretera && filters.carretera.trim() !== '') {
      whereClause += ` AND carretera ILIKE $${paramIndex}`;
      params.push(`%${filters.carretera}%`);
      paramIndex++;
    }
    
    if (filters.status && filters.status !== 'todas') {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters.fecha_inicio) {
      whereClause += ` AND last_seen >= $${paramIndex}`;
      params.push(new Date(filters.fecha_inicio));
      paramIndex++;
    }
    
    if (filters.fecha_fin) {
      whereClause += ` AND last_seen <= $${paramIndex}`;
      params.push(new Date(filters.fecha_fin));
      paramIndex++;
    }
    
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as activas,
        COUNT(*) FILTER (WHERE status = 'lost') as perdidas,
        COUNT(DISTINCT provincia) as provincias,
        COUNT(DISTINCT comunidad) as comunidades,
        COUNT(DISTINCT carretera) as carreteras
      FROM balizas
      ${whereClause}
    `, params);
    
    return stats.rows[0];
  } catch (error) {
    console.error('Error en getGeneralStats:', error.message);
    throw error;
  }
}

/**
 * Obtiene estadísticas por ubicación
 */
async function getStatsByLocation(filters = {}) {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (filters.provincia && filters.provincia !== 'todas') {
    whereClause += ` AND provincia = $${paramIndex}`;
    params.push(filters.provincia);
    paramIndex++;
  }
  
  if (filters.comunidad && filters.comunidad !== 'todas') {
    whereClause += ` AND comunidad = $${paramIndex}`;
    params.push(filters.comunidad);
    paramIndex++;
  }
  
  if (filters.carretera && filters.carretera.trim() !== '') {
    whereClause += ` AND carretera ILIKE $${paramIndex}`;
    params.push(`%${filters.carretera}%`);
    paramIndex++;
  }
  
  if (filters.status && filters.status !== 'todas') {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }
  
  if (filters.fecha_inicio) {
    whereClause += ` AND last_seen >= $${paramIndex}`;
    params.push(new Date(filters.fecha_inicio));
    paramIndex++;
  }
  
  if (filters.fecha_fin) {
    whereClause += ` AND last_seen <= $${paramIndex}`;
    params.push(new Date(filters.fecha_fin));
    paramIndex++;
  }
  
  const byProvincia = await query(`
    SELECT 
      provincia,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as activas,
      COUNT(*) FILTER (WHERE status = 'lost') as perdidas
    FROM balizas
    ${whereClause}
    GROUP BY provincia
    ORDER BY total DESC
  `, params);
  
  const byComunidad = await query(`
    SELECT 
      comunidad,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as activas,
      COUNT(*) FILTER (WHERE status = 'lost') as perdidas
    FROM balizas
    ${whereClause}
    GROUP BY comunidad
    ORDER BY total DESC
  `, params);
  
  return {
    byProvincia: byProvincia.rows,
    byComunidad: byComunidad.rows
  };
}

/**
 * Obtiene series temporales
 */
async function getTimeSeries(filters = {}) {
  const { agrupacion = 'hour', fecha_inicio, fecha_fin } = filters;
  
  let dateFormat = "DATE_TRUNC('hour', changed_at)";
  let interval = "1 hour";
  
  switch (agrupacion) {
    case 'day':
      dateFormat = "DATE_TRUNC('day', changed_at)";
      interval = "1 day";
      break;
    case 'week':
      dateFormat = "DATE_TRUNC('week', changed_at)";
      interval = "1 week";
      break;
    case 'month':
      dateFormat = "DATE_TRUNC('month', changed_at)";
      interval = "1 month";
      break;
  }
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (fecha_inicio) {
    whereClause += ` AND changed_at >= $${paramIndex}`;
    params.push(new Date(fecha_inicio));
    paramIndex++;
  } else {
    // Por defecto, últimos 7 días
    whereClause += ` AND changed_at >= $${paramIndex}`;
    params.push(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    paramIndex++;
  }
  
  if (fecha_fin) {
    whereClause += ` AND changed_at <= $${paramIndex}`;
    params.push(new Date(fecha_fin));
    paramIndex++;
  }
  
  // Series temporales de conteos
  const counts = await query(`
    SELECT 
      ${dateFormat} as periodo,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE change_type = 'new') as nuevas,
      COUNT(*) FILTER (WHERE status = 'active') as activas,
      COUNT(*) FILTER (WHERE status = 'lost') as perdidas
    FROM baliza_history
    ${whereClause}
    GROUP BY ${dateFormat}
    ORDER BY periodo ASC
  `, params);
  
  return counts.rows;
}

/**
 * Obtiene datos crudos con filtros
 */
async function getRawData(filters = {}, limit = 1000, offset = 0) {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (filters.provincia && filters.provincia !== 'todas') {
    whereClause += ` AND provincia = $${paramIndex}`;
    params.push(filters.provincia);
    paramIndex++;
  }
  
  if (filters.comunidad && filters.comunidad !== 'todas') {
    whereClause += ` AND comunidad = $${paramIndex}`;
    params.push(filters.comunidad);
    paramIndex++;
  }
  
  if (filters.carretera && filters.carretera.trim() !== '') {
    whereClause += ` AND carretera ILIKE $${paramIndex}`;
    params.push(`%${filters.carretera}%`);
    paramIndex++;
  }
  
  if (filters.status && filters.status !== 'todas') {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }
  
  if (filters.fecha_inicio) {
    whereClause += ` AND last_seen >= $${paramIndex}`;
    params.push(new Date(filters.fecha_inicio));
    paramIndex++;
  }
  
  if (filters.fecha_fin) {
    whereClause += ` AND last_seen <= $${paramIndex}`;
    params.push(new Date(filters.fecha_fin));
    paramIndex++;
  }
  
  const data = await query(`
    SELECT * FROM balizas
    ${whereClause}
    ORDER BY last_seen DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...params, limit, offset]);
  
  const total = await query(`
    SELECT COUNT(*) as count FROM balizas ${whereClause}
  `, params);
  
  return {
    data: data.rows,
    total: parseInt(total.rows[0].count),
    limit,
    offset
  };
}

/**
 * Obtiene historial de una baliza
 */
async function getBalizaHistory(balizaId, limit = 100) {
  const result = await query(`
    SELECT * FROM baliza_history
    WHERE baliza_id = $1
    ORDER BY changed_at DESC
    LIMIT $2
  `, [balizaId, limit]);
  
  return result.rows;
}

/**
 * Obtiene lista única de provincias
 */
async function getProvinciasList(filters = {}) {
  try {
    let whereClause = 'WHERE provincia IS NOT NULL AND provincia != \'N/A\'';
    const params = [];
    let paramIndex = 1;
    
    if (filters.comunidad && filters.comunidad !== 'todas') {
      whereClause += ` AND comunidad = $${paramIndex}`;
      params.push(filters.comunidad);
      paramIndex++;
    }
    
    if (filters.fecha_inicio) {
      whereClause += ` AND last_seen >= $${paramIndex}`;
      params.push(new Date(filters.fecha_inicio));
      paramIndex++;
    }
    
    if (filters.fecha_fin) {
      whereClause += ` AND last_seen <= $${paramIndex}`;
      params.push(new Date(filters.fecha_fin));
      paramIndex++;
    }
    
    const result = await query(`
      SELECT DISTINCT provincia
      FROM balizas
      ${whereClause}
      ORDER BY provincia ASC
    `, params);
    
    return result.rows.map(row => row.provincia);
  } catch (error) {
    console.error('Error en getProvinciasList:', error.message);
    throw error;
  }
}

/**
 * Obtiene lista única de comunidades
 */
async function getComunidadesList(filters = {}) {
  try {
    let whereClause = 'WHERE comunidad IS NOT NULL AND comunidad != \'N/A\'';
    const params = [];
    let paramIndex = 1;
    
    if (filters.fecha_inicio) {
      whereClause += ` AND last_seen >= $${paramIndex}`;
      params.push(new Date(filters.fecha_inicio));
      paramIndex++;
    }
    
    if (filters.fecha_fin) {
      whereClause += ` AND last_seen <= $${paramIndex}`;
      params.push(new Date(filters.fecha_fin));
      paramIndex++;
    }
    
    const result = await query(`
      SELECT DISTINCT comunidad
      FROM balizas
      ${whereClause}
      ORDER BY comunidad ASC
    `, params);
    
    return result.rows.map(row => row.comunidad);
  } catch (error) {
    console.error('Error en getComunidadesList:', error.message);
    throw error;
  }
}

/**
 * Obtiene estadísticas acumuladas
 */
async function getAccumulatedStats(filters = {}) {
  try {
    const { agrupacion = 'day', fecha_inicio, fecha_fin } = filters;
    
    let dateFormat = "DATE_TRUNC('hour', changed_at)";
    
    switch (agrupacion) {
      case 'day':
        dateFormat = "DATE_TRUNC('day', changed_at)";
        break;
      case 'week':
        dateFormat = "DATE_TRUNC('week', changed_at)";
        break;
      case 'month':
        dateFormat = "DATE_TRUNC('month', changed_at)";
        break;
    }
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (filters.provincia && filters.provincia !== 'todas') {
      whereClause += ` AND provincia = $${paramIndex}`;
      params.push(filters.provincia);
      paramIndex++;
    }
    
    if (filters.comunidad && filters.comunidad !== 'todas') {
      whereClause += ` AND comunidad = $${paramIndex}`;
      params.push(filters.comunidad);
      paramIndex++;
    }
    
    if (filters.carretera && filters.carretera.trim() !== '') {
      whereClause += ` AND carretera ILIKE $${paramIndex}`;
      params.push(`%${filters.carretera}%`);
      paramIndex++;
    }
    
    if (filters.status && filters.status !== 'todas') {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    if (fecha_inicio) {
      whereClause += ` AND changed_at >= $${paramIndex}`;
      params.push(new Date(fecha_inicio));
      paramIndex++;
    } else {
      whereClause += ` AND changed_at >= $${paramIndex}`;
      params.push(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      paramIndex++;
    }
    
    if (fecha_fin) {
      whereClause += ` AND changed_at <= $${paramIndex}`;
      params.push(new Date(fecha_fin));
      paramIndex++;
    }
    
    // Obtener datos por período
    const periodData = await query(`
      SELECT 
        ${dateFormat} as periodo,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE change_type = 'new') as nuevas,
        COUNT(*) FILTER (WHERE status = 'active') as activas,
        COUNT(*) FILTER (WHERE status = 'lost') as perdidas
      FROM baliza_history
      ${whereClause}
      GROUP BY ${dateFormat}
      ORDER BY periodo ASC
    `, params);
    
    // Calcular acumulación
    let accumulatedTotal = 0;
    let accumulatedActivas = 0;
    let accumulatedPerdidas = 0;
    let accumulatedNuevas = 0;
    
    const accumulated = periodData.rows.map(row => {
      accumulatedTotal += parseInt(row.total || 0);
      accumulatedActivas += parseInt(row.activas || 0);
      accumulatedPerdidas += parseInt(row.perdidas || 0);
      accumulatedNuevas += parseInt(row.nuevas || 0);
      
      return {
        periodo: row.periodo,
        total: parseInt(row.total || 0),
        nuevas: parseInt(row.nuevas || 0),
        activas: parseInt(row.activas || 0),
        perdidas: parseInt(row.perdidas || 0),
        acumulado_total: accumulatedTotal,
        acumulado_activas: accumulatedActivas,
        acumulado_perdidas: accumulatedPerdidas,
        acumulado_nuevas: accumulatedNuevas
      };
    });
    
    return accumulated;
  } catch (error) {
    console.error('Error en getAccumulatedStats:', error.message);
    throw error;
  }
}

/**
 * Obtiene análisis de patrones temporales (día de semana, hora del día)
 */
async function getTimePatterns(filters = {}) {
  try {
    const { tipo = 'day-of-week', fecha_inicio, fecha_fin } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (fecha_inicio) {
      whereClause += ` AND changed_at >= $${paramIndex}`;
      params.push(new Date(fecha_inicio));
      paramIndex++;
    } else {
      whereClause += ` AND changed_at >= $${paramIndex}`;
      params.push(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      paramIndex++;
    }
    
    if (fecha_fin) {
      whereClause += ` AND changed_at <= $${paramIndex}`;
      params.push(new Date(fecha_fin));
      paramIndex++;
    }
    
    let groupBy, labels;
    
    if (tipo === 'day-of-week') {
      groupBy = "EXTRACT(DOW FROM changed_at)";
      labels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    } else if (tipo === 'hour-of-day') {
      groupBy = "EXTRACT(HOUR FROM changed_at)";
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    } else {
      throw new Error('Tipo de patrón no válido');
    }
    
    const result = await query(`
      SELECT 
        ${groupBy} as periodo,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE change_type = 'new') as nuevas,
        COUNT(*) FILTER (WHERE status = 'active') as activas
      FROM baliza_history
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY periodo ASC
    `, params);
    
    // Mapear resultados a arrays completos
    let data;
    if (tipo === 'day-of-week') {
      // Crear array de 7 elementos (0-6 para domingo-sábado)
      data = Array(7).fill(0);
      result.rows.forEach(row => {
        const dayIndex = parseInt(row.periodo);
        data[dayIndex] = parseInt(row.total || 0);
      });
    } else if (tipo === 'hour-of-day') {
      // Crear array de 24 elementos (0-23 para horas)
      data = Array(24).fill(0);
      result.rows.forEach(row => {
        const hourIndex = parseInt(row.periodo);
        data[hourIndex] = parseInt(row.total || 0);
      });
    } else {
      data = result.rows.map(row => parseInt(row.total || 0));
    }
    
    return {
      labels,
      data
    };
  } catch (error) {
    console.error('Error en getTimePatterns:', error.message);
    throw error;
  }
}

/**
 * Obtiene datos para comparación de períodos
 */
async function getComparisonData(filters = {}) {
  try {
    const { agrupacion = 'day', fecha_inicio, fecha_fin, comparison_type = 'previous' } = filters;
    
    let dateFormat = "DATE_TRUNC('hour', changed_at)";
    
    switch (agrupacion) {
      case 'day':
        dateFormat = "DATE_TRUNC('day', changed_at)";
        break;
      case 'week':
        dateFormat = "DATE_TRUNC('week', changed_at)";
        break;
      case 'month':
        dateFormat = "DATE_TRUNC('month', changed_at)";
        break;
    }
    
    // Calcular fechas del período actual
    const endDate = fecha_fin ? new Date(fecha_fin) : new Date();
    const startDate = fecha_inicio ? new Date(fecha_inicio) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const periodDuration = endDate - startDate;
    
    // Calcular fechas del período de comparación
    let comparisonStart, comparisonEnd;
    
    if (comparison_type === 'previous') {
      comparisonEnd = new Date(startDate.getTime() - 1);
      comparisonStart = new Date(comparisonEnd.getTime() - periodDuration);
    } else if (comparison_type === 'last-year') {
      comparisonStart = new Date(startDate);
      comparisonStart.setFullYear(comparisonStart.getFullYear() - 1);
      comparisonEnd = new Date(endDate);
      comparisonEnd.setFullYear(comparisonEnd.getFullYear() - 1);
    } else {
      throw new Error('Tipo de comparación no válido');
    }
    
    // Obtener datos del período actual
    const currentData = await query(`
      SELECT 
        ${dateFormat} as periodo,
        COUNT(*) as total
      FROM baliza_history
      WHERE changed_at >= $1 AND changed_at <= $2
      GROUP BY ${dateFormat}
      ORDER BY periodo ASC
    `, [startDate, endDate]);
    
    // Obtener datos del período de comparación
    const comparisonData = await query(`
      SELECT 
        ${dateFormat} as periodo,
        COUNT(*) as total
      FROM baliza_history
      WHERE changed_at >= $1 AND changed_at <= $2
      GROUP BY ${dateFormat}
      ORDER BY periodo ASC
    `, [comparisonStart, comparisonEnd]);
    
    return {
      current: currentData.rows.map(row => ({
        periodo: row.periodo,
        total: parseInt(row.total || 0)
      })),
      comparison: comparisonData.rows.map(row => ({
        periodo: row.periodo,
        total: parseInt(row.total || 0)
      }))
    };
  } catch (error) {
    console.error('Error en getComparisonData:', error.message);
    throw error;
  }
}

/**
 * Calcula estadísticas de tendencia
 */
async function getTrendStats(filters = {}) {
  try {
    const { fecha_inicio, fecha_fin } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (fecha_inicio) {
      whereClause += ` AND changed_at >= $${paramIndex}`;
      params.push(new Date(fecha_inicio));
      paramIndex++;
    } else {
      whereClause += ` AND changed_at >= $${paramIndex}`;
      params.push(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      paramIndex++;
    }
    
    if (fecha_fin) {
      whereClause += ` AND changed_at <= $${paramIndex}`;
      params.push(new Date(fecha_fin));
      paramIndex++;
    }
    
    // Obtener datos agrupados por período para calcular tendencias
    const periodData = await query(`
      SELECT 
        DATE_TRUNC('day', changed_at) as periodo,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as activas,
        COUNT(*) FILTER (WHERE status = 'lost') as perdidas,
        COUNT(*) FILTER (WHERE change_type = 'new') as nuevas
      FROM baliza_history
      ${whereClause}
      GROUP BY DATE_TRUNC('day', changed_at)
      ORDER BY periodo ASC
    `, params);
    
    // Obtener primer y último período
    let first = { total: 0, activas: 0, perdidas: 0, nuevas: 0 };
    let last = { total: 0, activas: 0, perdidas: 0, nuevas: 0 };
    
    if (periodData && periodData.rows && periodData.rows.length > 0) {
      first = periodData.rows[0] || { total: 0, activas: 0, perdidas: 0, nuevas: 0 };
      last = periodData.rows[periodData.rows.length - 1] || { total: 0, activas: 0, perdidas: 0, nuevas: 0 };
    }
    
    const calculateChange = (oldVal, newVal) => {
      if (!oldVal || oldVal === 0) return newVal > 0 ? 100 : 0;
      return Math.round(((newVal - oldVal) / oldVal) * 100);
    };
    
    return {
      total: {
        first: parseInt(first.total || 0),
        last: parseInt(last.total || 0),
        change: calculateChange(first.total, last.total)
      },
      activas: {
        first: parseInt(first.activas || 0),
        last: parseInt(last.activas || 0),
        change: calculateChange(first.activas, last.activas)
      },
      perdidas: {
        first: parseInt(first.perdidas || 0),
        last: parseInt(last.perdidas || 0),
        change: calculateChange(first.perdidas, last.perdidas)
      },
      nuevas: {
        first: parseInt(first.nuevas || 0),
        last: parseInt(last.nuevas || 0),
        change: calculateChange(first.nuevas, last.nuevas)
      }
    };
  } catch (error) {
    console.error('Error en getTrendStats:', error.message);
    throw error;
  }
}

module.exports = {
  upsertBaliza,
  saveBalizas,
  getGeneralStats,
  getStatsByLocation,
  getTimeSeries,
  getRawData,
  getBalizaHistory,
  getProvinciasList,
  getComunidadesList,
  getAccumulatedStats,
  getTimePatterns,
  getComparisonData,
  getTrendStats
};

