const fs = require('fs');
const db = require('./src/database.js');

const schema = fs.readFileSync('./src/db_schema.sql', 'utf8');

db.serialize(() => {
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error executing schema', err.message);
    } else {
      console.log('Database schema created successfully.');
    }
    db.close();
  });
});
