-- Esquema de base de datos para Balizas V16

-- Tabla principal de balizas
CREATE TABLE IF NOT EXISTS balizas (
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
);

-- Tabla de historial de cambios
CREATE TABLE IF NOT EXISTS baliza_history (
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
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_balizas_status ON balizas(status);
CREATE INDEX IF NOT EXISTS idx_balizas_provincia ON balizas(provincia);
CREATE INDEX IF NOT EXISTS idx_balizas_comunidad ON balizas(comunidad);
CREATE INDEX IF NOT EXISTS idx_balizas_carretera ON balizas(carretera);
CREATE INDEX IF NOT EXISTS idx_balizas_last_seen ON balizas(last_seen);
CREATE INDEX IF NOT EXISTS idx_baliza_history_baliza_id ON baliza_history(baliza_id);
CREATE INDEX IF NOT EXISTS idx_baliza_history_changed_at ON baliza_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_baliza_history_change_type ON baliza_history(change_type);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_balizas_updated_at ON balizas;
CREATE TRIGGER update_balizas_updated_at
    BEFORE UPDATE ON balizas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

