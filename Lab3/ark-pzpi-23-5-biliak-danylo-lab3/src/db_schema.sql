PRAGMA foreign_keys = ON;


CREATE TABLE IF NOT EXISTS sensors (
    id TEXT PRIMARY KEY,
    name TEXT,
    location TEXT,
    api_key TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sensors_api_key ON sensors(api_key);


CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id TEXT NOT NULL,
    temperature REAL,
    humidity REAL,
    pressure REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_time ON sensor_readings(created_at);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor ON sensor_readings(sensor_id);


CREATE TABLE IF NOT EXISTS sensor_locations (
    sensor_id TEXT PRIMARY KEY,
    city_name TEXT NOT NULL,
    country TEXT,
    lat REAL,
    lon REAL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sensor_locations_city ON sensor_locations(city_name);


CREATE TABLE IF NOT EXISTS local_forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id TEXT NOT NULL,

    forecast_time TEXT NOT NULL,

    predicted_temp REAL,
    predicted_humidity REAL,
    predicted_pressure REAL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_local_forecasts_sensor_time ON local_forecasts(sensor_id, forecast_time);
