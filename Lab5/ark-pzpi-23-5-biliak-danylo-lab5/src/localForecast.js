const pool = require('./database');

function calculateLinearRegression(readings, valueField) {
  const n = readings.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const firstTimestamp = new Date(readings[n - 1].created_at).getTime() / 1000;

  readings.forEach(r => {
    const x = (new Date(r.created_at).getTime() / 1000) - firstTimestamp;
    const y = r[valueField];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

async function generateLocalForecast(sensorId, hoursAhead = 1) {
    const { rows } = await pool.query(`SELECT * FROM sensor_readings WHERE sensor_id = $1 ORDER BY created_at DESC LIMIT 50`, [sensorId]);
    const readings = rows.reverse();

  if (readings.length < 2) {
    return null;
  }

  const tempRegression = calculateLinearRegression(readings, 'temperature');
  const humidityRegression = calculateLinearRegression(readings, 'humidity');
  const pressureRegression = calculateLinearRegression(readings, 'pressure');

  if (!tempRegression || !humidityRegression || !pressureRegression) {
    return null;
  }

  const lastReadingTime = new Date(readings[readings.length - 1].created_at).getTime() / 1000;
  const firstTimestamp = new Date(readings[0].created_at).getTime() / 1000;
  const futureTimeX = lastReadingTime - firstTimestamp + (hoursAhead * 3600);

  const predictedTemp = tempRegression.intercept + tempRegression.slope * futureTimeX;
  const predictedHumidity = humidityRegression.intercept + humidityRegression.slope * futureTimeX;
  const predictedPressure = pressureRegression.intercept + pressureRegression.slope * futureTimeX;

  const forecastTime = new Date();
  forecastTime.setHours(forecastTime.getHours() + hoursAhead);

  const insertSql = `INSERT INTO local_forecasts (sensor_id, forecast_time, predicted_temp, predicted_humidity, predicted_pressure) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
  
  const result = await pool.query(insertSql, [
    sensorId,
    forecastTime.toISOString(),
    predictedTemp,
    predictedHumidity,
    predictedPressure
  ]);
  const forecastId = result.rows[0].id;

  return {
    id: forecastId,
    sensor_id: sensorId,
    forecast_time: forecastTime.toISOString(),
    hours_ahead: hoursAhead,
    predicted_temp: predictedTemp,
    predicted_humidity: predictedHumidity,
    predicted_pressure: predictedPressure,
    note: "This forecast is based on a linear regression of the last 50 sensor readings. Its accuracy decreases with the forecast horizon."
  };
}

module.exports = {
  generateLocalForecast,
};
