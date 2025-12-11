const db = require('./src/database.js');

db.all("PRAGMA table_info(sensor_locations);", (err, rows) => {
    if (err) {
        console.error('Error getting table info:', err.message);
    } else {
        console.log(rows);
    }
    db.close();
});