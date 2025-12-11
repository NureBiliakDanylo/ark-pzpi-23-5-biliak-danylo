const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./database.js');
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
 *       required:
 *         - name
 *         - location
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the sensor
 *         name:
 *           type: string
 *           description: The name of the sensor
 *         location:
 *           type: string
 *           description: The location of the sensor
 *         api_key:
 *           type: string
 *           description: The API key for the sensor
 *       example:
 *         id: d5fE_asz
 *         name: Weather Station 1
 *         location: New York
 *         api_key: 12345
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-key
 */

/**
 * @swagger
 * tags:
 *   name: Sensors
 *   description: The sensors managing API
 *   name: Admin
 *   description: Administrative API for managing sensors and data
 */

// Endpoint to register a new sensor
/**
 * @swagger
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
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: The sensor was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       500:
 *         description: Some server error
 */
app.post('/sensors', (req, res) => {
  const { name, location } = req.body;

  if (!name || !location) {
    return res.status(400).json({ error: 'Name and location are required' });
  }

  const id = uuidv4();
  const apiKey = uuidv4(); 

  const sql = `INSERT INTO sensors (id, name, location, api_key) VALUES (?, ?, ?, ?)`;
  db.run(sql, [id, name, location, apiKey], function(err) {
    if (err) {
      console.error('Error inserting sensor', err.message);
      return res.status(500).json({ error: 'Failed to register sensor' });
    }
    res.status(201).json({ id, name, location, api_key: apiKey });
  });
});

// Middleware to authenticate API key
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API Key is required' });
  }

  db.get(`SELECT * FROM sensors WHERE api_key = ?`, [apiKey], (err, row) => {
    if (err) {
      console.error('Error authenticating API key', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!row) {
      return res.status(403).json({ error: 'Invalid API Key' });
    }
    req.sensor = row;
    next();
  });
};

// Endpoint to receive sensor readings
/**
 * @swagger
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
 *             required:
 *               - temperature
 *               - humidity
 *               - pressure
 *             properties:
 *               temperature:
 *                 type: number
 *               humidity:
 *                 type: number
 *               pressure:
 *                 type: number
 *     responses:
 *       201:
 *         description: The sensor reading was successfully recorded
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: API Key is required
 *       403:
 *         description: Invalid API Key
 *       500:
 *         description: Some server error
 */
app.post('/readings', authenticateApiKey, (req, res) => {
  const { temperature, humidity, pressure } = req.body;
  const sensor_id = req.sensor.id;

  if (temperature === undefined || humidity === undefined || pressure === undefined) {
    return res.status(400).json({ error: 'Temperature, humidity, and pressure are required' });
  }

  const sql = `INSERT INTO sensor_readings (sensor_id, temperature, humidity, pressure) VALUES (?, ?, ?, ?)`;
  db.run(sql, [sensor_id, temperature, humidity, pressure], function(err) {
    if (err) {
      console.error('Error inserting sensor reading', err.message);
      return res.status(500).json({ error: 'Failed to record sensor reading' });
    }
    res.status(201).json({ message: 'Sensor reading recorded', id: this.lastID });

    db.run(`UPDATE sensors SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?`, [sensor_id], function(err) {
      if (err) {
        console.error('Error updating last_seen_at', err.message);
      }
    });
  });
});

// Endpoint to store sensor location
/**
 * @swagger
 * /sensor_locations:
 *   post:
 *     summary: Record or update a sensor's location
 *     tags: [Sensors]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city_name
 *             properties:
 *               city_name:
 *                 type: string
 *               country:
 *                 type: string
 *               lat:
 *                 type: number
 *               lon:
 *                 type: number
 *     responses:
 *       201:
 *         description: The sensor location was successfully recorded
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: API Key is required
 *       403:
 *         description: Invalid API Key
 *       500:
 *         description: Some server error
 */
app.post('/sensor_locations', authenticateApiKey, (req, res) => {
  const { city_name, country, lat, lon } = req.body;
  const sensor_id = req.sensor.id;

  if (!city_name) {
    return res.status(400).json({ error: 'city_name is required' });
  }

  const sql = `INSERT OR REPLACE INTO sensor_locations (sensor_id, city_name, country, lat, lon) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [sensor_id, city_name, country, lat, lon], function(err) {
    if (err) {
      console.error('Error inserting sensor location', err.message);
      return res.status(500).json({ error: 'Failed to record sensor location' });
    }
    res.status(201).json({ message: 'Sensor location recorded', sensor_id });
  });
});

/**
 * @swagger
 * /locations/{location_name}:
 *   get:
 *     summary: Get sensor information by location
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: location_name
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the location
 *     responses:
 *       200:
 *         description: A list of sensors for the location
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   last_seen_at:
 *                     type: string
 *                   city_name:
 *                     type: string
 *                   country:
 *                     type: string
 *       404:
 *         description: No sensors found for this location
 *       500:
 *         description: Some server error
 */
app.get('/locations/:location_name', (req, res) => {
  const { location_name } = req.params;

  const sql = `
    SELECT s.id, s.last_seen_at, sl.city_name, sl.country
    FROM sensors s
    JOIN sensor_locations sl ON s.id = sl.sensor_id
    WHERE sl.city_name = ?
  `;

  db.all(sql, [location_name], (err, rows) => {
    if (err) {
      console.error('Error fetching sensors by location', err.message);
      return res.status(500).json({ error: 'Failed to retrieve sensors' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No sensors found for this location' });
    }
    res.status(200).json(rows);
  });
});

/**
 * @swagger
 * /local-forecasts/{sensor_id}:
 *   get:
 *     summary: Get a local forecast for a sensor
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: sensor_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The sensor id
 *       - in: query
 *         name: hours_ahead
 *         schema:
 *           type: integer
 *         description: The number of hours ahead to forecast
 *     responses:
 *       200:
 *         description: The local forecast
 *       400:
 *         description: Invalid hours_ahead parameter
 *       404:
 *         description: Not enough data to generate a local forecast
 *       500:
 *         description: Some server error
 */
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
    console.error('Error generating local forecast', error.message);
    res.status(500).json({ error: 'Failed to generate local forecast' });
  }
});


// Admin endpoint to get all sensors
/**
 * @swagger
 * /admin/sensors:
 *   get:
 *     summary: Get all registered sensors
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of all sensors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sensor'
 *       500:
 *         description: Some server error
 */
app.get('/admin/sensors', (req, res) => {
  db.all(`SELECT id, name, location, api_key, created_at, last_seen_at FROM sensors`, (err, rows) => {
    if (err) {
      console.error('Error fetching sensors', err.message);
      return res.status(500).json({ error: 'Failed to retrieve sensors' });
    }
    res.status(200).json(rows);
  });
});

// Admin endpoint to delete a sensor by ID
/**
 * @swagger
 * /admin/sensors/{id}:
 *   delete:
 *     summary: Delete a sensor by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The sensor ID
 *     responses:
 *       200:
 *         description: The sensor was successfully deleted
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Some server error
 */
app.delete('/admin/sensors/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM sensors WHERE id = ?`, [id], function(err) {
    if (err) {
      console.error('Error deleting sensor', err.message);
      return res.status(500).json({ error: 'Failed to delete sensor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    res.status(200).json({ message: 'Sensor deleted successfully' });
  });
});

// Admin endpoint to get all readings for a specific sensor
/**
 * @swagger
 * /admin/sensors/{id}/readings:
 *   get:
 *     summary: Get all readings for a specific sensor
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The sensor ID
 *     responses:
 *       200:
 *         description: A list of sensor readings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   sensor_id:
 *                     type: string
 *                   temperature:
 *                     type: number
 *                   humidity:
 *                     type: number
 *                   pressure:
 *                     type: number
 *                   created_at:
 *                     type: string
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Some server error
 */
app.get('/admin/sensors/:id/readings', (req, res) => {
  const { id } = req.params;
  db.all(`SELECT id, sensor_id, temperature, humidity, pressure, created_at FROM sensor_readings WHERE sensor_id = ?`, [id], (err, rows) => {
    if (err) {
      console.error('Error fetching sensor readings', err.message);
      return res.status(500).json({ error: 'Failed to retrieve sensor readings' });
    }
    db.get(`SELECT id FROM sensors WHERE id = ?`, [id], (sensorErr, sensorRow) => {
      if (sensorErr) {
        console.error('Error checking sensor existence', sensorErr.message);
        return res.status(500).json({ error: 'Failed to retrieve sensor readings' });
      }
      if (!sensorRow) {
        return res.status(404).json({ error: 'Sensor not found' });
      }
      res.status(200).json(rows);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
