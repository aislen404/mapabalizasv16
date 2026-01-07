/**
 * Conexión a PostgreSQL
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'balizas_v16'}`,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Manejo de errores del pool
pool.on('error', (err, client) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

/**
 * Ejecuta una query
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Query ejecutada', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Error en query:', { text, error: error.message, code: error.code });
    // Si la tabla no existe o no hay conexión, lanzar error con código específico
    if (error.code === '42P01' || error.code === 'ECONNREFUSED' || error.message.includes('does not exist')) {
      const dbError = new Error(error.message || 'Base de datos no disponible');
      dbError.code = error.code;
      dbError.dbError = true;
      throw dbError;
    }
    throw error;
  }
}

/**
 * Obtiene un cliente del pool para transacciones
 */
async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * Prueba la conexión a la base de datos
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};

