#ifndef SENSOR_HANDLER_H
#define SENSOR_HANDLER_H

#include <DHT.h>

// Make the DHT object and last readings available to other files
extern DHT dht;
extern float lastSentTemperature;
extern float lastSentHumidity;

// Struct to hold sensor readings
struct SensorData {
  float temperature;
  float humidity;
  bool isValid;
};

void setupSensor();
SensorData readAndValidateSensorData();

#endif // SENSOR_HANDLER_H
