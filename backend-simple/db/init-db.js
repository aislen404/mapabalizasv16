/**
 * Script para inicializar la base de datos
 * Ejecutar: node db/init-db.js
 */

const fs = require('fs');
const path = require('path');
const { query, testConnection } = require('./connection');

async function initDatabase() {
  console.log('🔄 Inicializando base de datos...\n');

  // Probar conexión
  console.log('1. Probando conexión a PostgreSQL...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('❌ No se pudo conectar a PostgreSQL.');
    console.error('\nPor favor, asegúrate de que:');
    console.error('  - PostgreSQL esté instalado y corriendo');
    console.error('  - Las credenciales en .env sean correctas');
    console.error('  - La base de datos exista (o se creará automáticamente)');
    process.exit(1);
  }
  
  console.log('✅ Conexión exitosa\n');

  // Leer y ejecutar schema.sql
  console.log('2. Creando tablas...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  
  // Ejecutar el SQL completo (mejor que dividir por ;)
  let successCount = 0;
  let errorCount = 0;

  try {
    await query(schemaSQL);
    successCount++;
    console.log('   ✅ Schema ejecutado correctamente');
  } catch (error) {
    // Ignorar errores de "ya existe" para tablas e índices
    if (error.message.includes('already exists') || error.code === '42P07' || error.code === '42710') {
      successCount++;
      console.log('   ✅ Schema ya existe o parcialmente creado');
    } else {
      console.error(`   ⚠️  Error: ${error.message}`);
      errorCount++;
      // Intentar ejecutar sentencias individuales como fallback
      console.log('   🔄 Intentando crear tablas individualmente...');
      await createTablesIndividually();
    }
  }

  console.log(`✅ Tablas creadas (${successCount} exitosas, ${errorCount} errores)\n`);

  // Verificar tablas
  console.log('3. Verificando tablas...');
  try {
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('balizas', 'baliza_history')
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 2) {
      console.log('✅ Tablas verificadas:');
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Algunas tablas no se encontraron');
    }
  } catch (error) {
    console.error(`   ❌ Error verificando: ${error.message}`);
  }

  console.log('\n✅ Base de datos inicializada correctamente!');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. El backend guardará datos automáticamente cuando reciba balizas');
  console.log('   2. Puedes verificar los datos con: SELECT COUNT(*) FROM balizas;');
  console.log('   3. El Dashboard ahora mostrará datos históricos\n');
}

async function createTablesIndividually() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS balizas (
      id VARCHAR(255) PRIMARY KEY,
      lat DECIMAL(10, 8) NOT NULL,
      lon DECIMAL(11, 8) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      carretera VARCHAR(255),
      pk VARCHAR(100),
      sentido VARCHAR(100),
      orientacion VARCHAR(100),
      comunidad VARCHAR(255),
      provincia VARCHAR(255),
      municipio VARCHAR(255),
      first_seen TIMESTAMP,
      last_seen TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS baliza_history (
      id SERIAL PRIMARY KEY,
      baliza_id VARCHAR(255) NOT NULL,
      status VARCHAR(50),
      lat DECIMAL(10, 8),
      lon DECIMAL(11, 8),
      carretera VARCHAR(255),
      pk VARCHAR(100),
      sentido VARCHAR(100),
      orientacion VARCHAR(100),
      comunidad VARCHAR(255),
      provincia VARCHAR(255),
      municipio VARCHAR(255),
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      change_type VARCHAR(50) DEFAULT 'update',
      FOREIGN KEY (baliza_id) REFERENCES balizas(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_balizas_status ON balizas(status)`,
    `CREATE INDEX IF NOT EXISTS idx_balizas_provincia ON balizas(provincia)`,
    `CREATE INDEX IF NOT EXISTS idx_balizas_comunidad ON balizas(comunidad)`,
    `CREATE INDEX IF NOT EXISTS idx_balizas_carretera ON balizas(carretera)`,
    `CREATE INDEX IF NOT EXISTS idx_balizas_last_seen ON balizas(last_seen)`,
    `CREATE INDEX IF NOT EXISTS idx_baliza_history_baliza_id ON baliza_history(baliza_id)`,
    `CREATE INDEX IF NOT EXISTS idx_baliza_history_changed_at ON baliza_history(changed_at)`,
    `CREATE INDEX IF NOT EXISTS idx_baliza_history_change_type ON baliza_history(change_type)`
  ];

  for (const statement of statements) {
    try {
      await query(statement);
    } catch (error) {
      if (!error.message.includes('already exists') && error.code !== '42P07' && error.code !== '42710') {
        console.error(`   ⚠️  Error en: ${statement.substring(0, 50)}... - ${error.message}`);
      }
    }
  }

  // Crear función y trigger
  try {
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await query(`
      DROP TRIGGER IF EXISTS update_balizas_updated_at ON balizas;
      CREATE TRIGGER update_balizas_updated_at
          BEFORE UPDATE ON balizas
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error(`   ⚠️  Error creando trigger: ${error.message}`);
    }
  }
}

// Ejecutar
initDatabase().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

