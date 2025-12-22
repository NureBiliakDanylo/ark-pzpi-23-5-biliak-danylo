require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const pool = require('./src/database');

const createSensor = async () => {
  const id = uuidv4();
  const apiKey = uuidv4();
  const name = 'Test Lab Sensor';
  const location = 'Building A';

  const sql = `INSERT INTO sensors (id, name, location, api_key) VALUES ($1, $2, $3, $4) RETURNING id`;
  
  console.log('Creating a new sensor...');

  try {
    const res = await pool.query(sql, [id, name, location, apiKey]);
    const newId = res.rows[0].id;
    console.log('--------------------------------------------------');
    console.log('Sensor created successfully!');
    console.log(`>>> Use this ID for seeding: ${newId}`);
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('Error creating sensor:', err.stack);
  } finally {
    await pool.end();
  }
};

createSensor();
