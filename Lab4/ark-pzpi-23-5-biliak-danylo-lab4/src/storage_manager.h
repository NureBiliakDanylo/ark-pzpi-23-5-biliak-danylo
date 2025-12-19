#ifndef STORAGE_MANAGER_H
#define STORAGE_MANAGER_H

#include <Arduino.h>

// Make sensor credentials available to other files
extern String sensorId;
extern String apiKey;
extern String sensorName;
extern String sensorLocation;

void setupStorage();
bool loadSensorCredentials();
void saveSensorCredentials(const String& id, const String& key, const String& name, const String& location);
void appendReadingToBuffer(float temperature, float humidity, float pressure = 0.0);
void processReadingBuffer();

#endif // STORAGE_MANAGER_H
