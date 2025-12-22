#include "sensor_handler.h"
#include "config.h"

// Define the DHT object and last known good readings
DHT dht(DHT_PIN, DHT_TYPE);
float lastSentTemperature = -999.0;
float lastSentHumidity = -999.0;

void setupSensor() {
  dht.begin();
}

// Simple validation: check if values are within a reasonable range and not drastically different from previous valid readings
bool validateReading(float newTemp, float newHum) {
  // Check for out-of-range values (common DHT22 ranges)
  if (newTemp < -50 || newTemp > 100 || newHum < 0 || newHum > 100) {
    Serial.println("Reading out of typical range. Invalid.");
    return false;
  }

  // If this is the first valid reading, accept it
  if (lastSentTemperature == -999.0) {
    return true;
  }

  // Check for sudden drastic changes (anomaly detection)
  if (abs(newTemp - lastSentTemperature) > MAX_TEMP_DEVIATION || abs(newHum - lastSentHumidity) > MAX_HUM_DEVIATION) {
    Serial.println("Significant deviation from last sent reading. Considered anomalous.");
    return false;
  }

  return true;
}

SensorData readAndValidateSensorData() {
  SensorData data = {0.0, 0.0, false};

  Serial.println("\nTaking sensor reading...");
  data.humidity = dht.readHumidity();
  data.temperature = dht.readTemperature();

  if (isnan(data.humidity) || isnan(data.temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return data;
  }

  Serial.print("Raw Temperature: "); Serial.print(data.temperature); Serial.print(" C, Humidity: "); Serial.print(data.humidity); Serial.println(" %");

  // Validate reading
  if (!validateReading(data.temperature, data.humidity)) {
    Serial.println("Reading considered anomalous or invalid. Skipping.");
    return data;
  }

  // Check for duplicates (only if it's not the very first valid reading)
  if (lastSentTemperature != -999.0 && abs(data.temperature - lastSentTemperature) < 0.1 && abs(data.humidity - lastSentHumidity) < 0.1) {
    Serial.println("Reading is a duplicate of the last sent valid reading. Skipping.");
    return data;
  }

  data.isValid = true;
  return data;
}
