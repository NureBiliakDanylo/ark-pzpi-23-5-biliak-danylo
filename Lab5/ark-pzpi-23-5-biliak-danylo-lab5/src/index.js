require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('./database.js');
const { generateLocalForecast } = require('./localForecast.js');
const swaggerUi = require('swagger-ui-express');
const specs = require('../swagger.js');

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const PORT = process.env.PORT || 3000;

/**
 * @swagger
 * components:
 *   schemas:
 *     Sensor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated UUID of the sensor.
 *         name:
 *           type: string
 *           description: The name of the sensor.
 *         location:
 *           type: string
 *           description: The physical location of the sensor.
 *         api_key:
 *           type: string
 *           format: uuid
 *           description: The API key for the sensor to authenticate with.
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the sensor was created.
 *         last_seen_at:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the sensor last sent a reading.
 *     SensorReading:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the reading.
 *         sensor_id:
 *           type: string
 *           format: uuid
 *           description: The ID of the sensor that took the reading.
 *         temperature:
 *           type: number
 *           format: float
 *           description: The temperature in Celsius.
 *         humidity:
 *           type: number
 *           format: float
 *           description: The relative humidity in percent.
 *         pressure:
 *           type: number
 *           format: float
 *           description: The atmospheric pressure in hPa.
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the reading was recorded.
 *     SensorLocation:
 *        type: object
 *        properties:
 *          sensor_id:
 *            type: string
 *            format: uuid
 *          city_name:
 *            type: string
 *          country:
 *            type: string
 *          lat:
 *            type: number
 *            format: float
 *          lon:
 *            type: number
 *            format: float
 *          updated_at:
 *            type: string
 *            format: date-time
 *     LocalForecast:
 *        type: object
 *        properties:
 *          id:
 *            type: integer
 *          sensor_id:
 *            type: string
 *            format: uuid
 *          forecast_time:
 *            type: string
 *            format: date-time
 *          hours_ahead:
 *            type: integer
 *          predicted_temp:
 *            type: number
 *            format: float
 *          predicted_humidity:
 *            type: number
 *            format: float
 *          predicted_pressure:
 *            type: number
 *            format: float
 *          note:
 *            type: string
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-key
 *
 * tags:
 *   - name: Sensors
 *     description: API for sensor interaction and data submission.
 *   - name: Admin
 *     description: Administrative API for managing sensors and data.
 *
 * /sensors:
 *   post:
 *     summary: Register a new sensor
 *     tags: [Sensors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Weather Station Alpha"
 *               location:
 *                 type: string
 *                 example: "Rooftop"
 *     responses:
 *       201:
 *         description: Sensor created successfully. Returns the new sensor object including its API key.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Missing 'name' or 'location' in request body.
 *       500:
 *         description: Internal server error.
 *
 * /readings:
 *   post:
 *     summary: Record a new sensor reading
 *     tags: [Sensors]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [temperature, humidity, pressure]
 *             properties:
 *               temperature:
 *                 type: number
 *                 example: 22.5
 *               humidity:
 *                 type: number
 *                 example: 55.2
 *               pressure:
 *                 type: number
 *                 example: 1012.5
 *     responses:
 *       201:
 *         description: The sensor reading was successfully recorded.
 *       400:
 *         description: Missing required fields.
 *       401:
 *         description: API Key is missing.
 *       403:
 *         description: Invalid API Key.
 *       500:
 *         description: Internal server error.
 *
 * /sensor_locations:
 *   post:
 *     summary: Record or update a sensor's geographic location
 *     tags: [Sensors]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [city_name]
 *             properties:
 *               city_name:
 *                 type: string
 *                 example: "Berlin"
 *               country:
 *                 type: string
 *                 example: "Germany"
 *               lat:
 *                 type: number
 *                 example: 52.5200
 *               lon:
 *                 type: number
 *                 example: 13.4050
 *     responses:
 *       201:
 *         description: The sensor location was successfully recorded or updated.
 *       400:
 *         description: Missing required fields.
 *       401:
 *         description: API Key is missing.
 *       403:
 *         description: Invalid API Key.
 *       500:
 *         description: Internal server error.
 *
 * /locations/{location_name}:
 *   get:
 *     summary: Get sensor information by city name
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: location_name
 *         schema:
 *           type: string
 *         required: true
 *         description: The city name to search for.
 *     responses:
 *       200:
 *         description: A list of sensors for the specified location.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SensorLocation'
 *       404:
 *         description: No sensors found for this location.
 *       500:
 *         description: Internal server error.
 *
 * /local-forecasts/{sensor_id}:
 *   get:
 *     summary: Generate and retrieve a local forecast for a specific sensor
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: sensor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the sensor.
 *       - in: query
 *         name: hours_ahead
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The number of hours ahead to forecast.
 *     responses:
 *       200:
 *         description: The generated local forecast.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocalForecast'
 *       400:
 *         description: Invalid 'hours_ahead' parameter.
 *       404:
 *         description: Not enough data to generate a forecast for this sensor.
 *       500:
 *         description: Internal server error.
 *
 * /admin/sensors:
 *   get:
 *     summary: Get a list of all registered sensors (Admin)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of all sensor objects, including API keys.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sensor'
 *       500:
 *         description: Internal server error.
 *
 * /admin/sensors/{id}:
 *   delete:
 *     summary: Delete a sensor by its ID (Admin)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the sensor to delete.
 *     responses:
 *       200:
 *         description: Sensor deleted successfully.
 *       404:
 *         description: Sensor not found.
 *       500:
 *         description: Internal server error.
 *
 * /admin/sensors/{id}/readings:
 *   get:
 *     summary: Get all readings for a specific sensor (Admin)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the sensor.
 *     responses:
 *       200:
 *         description: A list of all readings for the specified sensor.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SensorReading'
 *       404:
 *         description: Sensor not found.
 *       500:
 *         description: Internal server error.
 */

app.post('/sensors', async (req, res) => {
  const { name, location } = req.body;

  if (!name || !location) {
    return res.status(400).json({ error: 'Name and location are required' });
  }

  const id = uuidv4();
  const apiKey = uuidv4();

  const sql = `INSERT INTO sensors (id, name, location, api_key) VALUES ($1, $2, $3, $4)`;
  try {
    await pool.query(sql, [id, name, location, apiKey]);
    res.status(201).json({ id, name, location, api_key: apiKey });
  } catch (err) {
    console.error('Error inserting sensor', err.stack);
    return res.status(500).json({ error: 'Failed to register sensor' });
  }
});

const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API Key is required' });
  }

  try {
    const { rows } = await pool.query(`SELECT * FROM sensors WHERE api_key = $1`, [apiKey]);
    const sensor = rows[0];
    if (!sensor) {
      return res.status(403).json({ error: 'Invalid API Key' });
    }
    req.sensor = sensor;
    next();
  } catch (err) {
    console.error('Error authenticating API key', err.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

app.post('/readings', authenticateApiKey, async (req, res) => {
  const { temperature, humidity, pressure } = req.body;
  const sensor_id = req.sensor.id;

  if (temperature === undefined || humidity === undefined || pressure === undefined) {
    return res.status(400).json({ error: 'Temperature, humidity, and pressure are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertReadingSql = `INSERT INTO sensor_readings (sensor_id, temperature, humidity, pressure) VALUES ($1, $2, $3, $4) RETURNING id`;
    const readingResult = await client.query(insertReadingSql, [sensor_id, temperature, humidity, pressure]);
    
    const updateSensorSql = `UPDATE sensors SET last_seen_at = NOW() WHERE id = $1`;
    await client.query(updateSensorSql, [sensor_id]);
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Sensor reading recorded', id: readingResult.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting sensor reading', err.stack);
    return res.status(500).json({ error: 'Failed to record sensor reading' });
  } finally {
    client.release();
  }
});

app.post('/sensor_locations', authenticateApiKey, async (req, res) => {
  const { city_name, country, lat, lon } = req.body;
  const sensor_id = req.sensor.id;

  if (!city_name) {
    return res.status(400).json({ error: 'city_name is required' });
  }

  const sql = `
    INSERT INTO sensor_locations (sensor_id, city_name, country, lat, lon) 
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (sensor_id) 
    DO UPDATE SET city_name = EXCLUDED.city_name, country = EXCLUDED.country, lat = EXCLUDED.lat, lon = EXCLUDED.lon, updated_at = NOW()
  `;
  try {
    await pool.query(sql, [sensor_id, city_name, country, lat, lon]);
    res.status(201).json({ message: 'Sensor location recorded', sensor_id });
  } catch (err) {
    console.error('Error inserting sensor location', err.stack);
    return res.status(500).json({ error: 'Failed to record sensor location' });
  }
});

app.get('/locations/:location_name', async (req, res) => {
  const { location_name } = req.params;

  const sql = `
    SELECT s.id, s.last_seen_at, sl.city_name, sl.country
    FROM sensors s
    JOIN sensor_locations sl ON s.id = sl.sensor_id
    WHERE sl.city_name = $1
  `;

  try {
    const { rows } = await pool.query(sql, [location_name]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No sensors found for this location' });
    }
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching sensors by location', err.stack);
    return res.status(500).json({ error: 'Failed to retrieve sensors' });
  }
});

app.get('/local-forecasts/:sensor_id', async (req, res) => {
  const { sensor_id } = req.params;
  const hoursAhead = req.query.hours_ahead ? parseInt(req.query.hours_ahead, 10) : 1;

  if (isNaN(hoursAhead) || hoursAhead <= 0) {
    return res.status(400).json({ error: 'Invalid hours_ahead parameter. Must be a positive number.' });
  }

  try {
    const forecast = await generateLocalForecast(sensor_id, hoursAhead);
    if (forecast) {
      res.json(forecast);
    } else {
      res.status(404).json({ error: 'Not enough data to generate a local forecast. At least 2 readings are required.' });
    }
  } catch (error) {
    console.error('Error generating local forecast', error.stack);
    res.status(500).json({ error: 'Failed to generate local forecast' });
  }
});

app.get('/admin/sensors', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT id, name, location, api_key, created_at, last_seen_at FROM sensors`);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching sensors', err.stack);
    return res.status(500).json({ error: 'Failed to retrieve sensors' });
  }
});

app.delete('/admin/sensors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM sensors WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    res.status(200).json({ message: 'Sensor deleted successfully' });
  } catch (err) {
    console.error('Error deleting sensor', err.stack);
    return res.status(500).json({ error: 'Failed to delete sensor' });
  }
});

app.get('/admin/sensors/:id/readings', async (req, res) => {
  const { id } = req.params;
  try {
    const sensorCheck = await pool.query(`SELECT id FROM sensors WHERE id = $1`, [id]);
    if (sensorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    const { rows } = await pool.query(`SELECT id, sensor_id, temperature, humidity, pressure, created_at FROM sensor_readings WHERE sensor_id = $1`, [id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching sensor readings', err.stack);
    return res.status(500).json({ error: 'Failed to retrieve sensor readings' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
