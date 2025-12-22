const fs = require('fs');
const pool = require('./src/database.js');

const schema = fs.readFileSync('./src/db_schema.sql', 'utf8');

const init = async () => {
  try {
    await pool.query(schema);
    console.log('Database schema created successfully.');
  } catch (err) {
    console.error('Error executing schema', err.stack);
  } finally {
    await pool.end();
  }
};

init();
