#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>

bool registerSensor();
bool sendReading(float temperature, float humidity, float pressure = 0.0);

#endif // API_CLIENT_H
