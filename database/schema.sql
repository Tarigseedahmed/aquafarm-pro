-- Aquafarm Pro Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS aquafarm_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    area DECIMAL(10, 2),
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ponds table (أحواض الأسماك)
CREATE TABLE IF NOT EXISTS ponds (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER,
    current_stock INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fish types table
CREATE TABLE IF NOT EXISTS fish_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(100),
    optimal_temp_min DECIMAL(4, 2),
    optimal_temp_max DECIMAL(4, 2),
    optimal_ph_min DECIMAL(3, 2),
    optimal_ph_max DECIMAL(3, 2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Water quality readings
CREATE TABLE IF NOT EXISTS water_quality (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER REFERENCES ponds(id) ON DELETE CASCADE,
    temperature DECIMAL(4, 2),
    ph_level DECIMAL(3, 2),
    dissolved_oxygen DECIMAL(4, 2),
    ammonia DECIMAL(4, 2),
    nitrite DECIMAL(4, 2),
    nitrate DECIMAL(4, 2),
    salinity DECIMAL(4, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feeding records
CREATE TABLE IF NOT EXISTS feeding_records (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER REFERENCES ponds(id) ON DELETE CASCADE,
    feed_type VARCHAR(100),
    amount DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    fed_by INTEGER REFERENCES users(id),
    fed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Harvest records
CREATE TABLE IF NOT EXISTS harvest_records (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER REFERENCES ponds(id) ON DELETE CASCADE,
    fish_type_id INTEGER REFERENCES fish_types(id),
    quantity INTEGER,
    total_weight DECIMAL(10, 2),
    average_weight DECIMAL(6, 2),
    harvest_date DATE,
    harvested_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    pond_id INTEGER REFERENCES ponds(id) ON DELETE CASCADE,
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    message TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_farms_owner ON farms(owner_id);
CREATE INDEX idx_ponds_farm ON ponds(farm_id);
CREATE INDEX idx_water_quality_pond ON water_quality(pond_id);
CREATE INDEX idx_water_quality_recorded ON water_quality(recorded_at);
CREATE INDEX idx_feeding_pond ON feeding_records(pond_id);
CREATE INDEX idx_harvest_pond ON harvest_records(pond_id);
CREATE INDEX idx_alerts_farm ON alerts(farm_id);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved);

-- Insert sample data
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@aquafarm.com', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'مدير النظام', 'admin'),
('farm_manager', 'manager@aquafarm.com', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'مدير المزرعة', 'manager');

INSERT INTO fish_types (name, scientific_name, optimal_temp_min, optimal_temp_max, optimal_ph_min, optimal_ph_max) VALUES
('البلطي النيلي', 'Oreochromis niloticus', 22.0, 28.0, 6.5, 8.5),
('السلمون', 'Salmo salar', 10.0, 16.0, 6.5, 8.0),
('القاروص', 'Dicentrarchus labrax', 18.0, 24.0, 7.0, 8.5),
('الجمبري', 'Penaeus vannamei', 26.0, 32.0, 7.5, 8.5);
