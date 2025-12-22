#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// --- Wi-Fi Configuration ---
extern const char* WIFI_SSID;
extern const char* WIFI_PASSWORD;

// --- Backend Server Configuration ---
extern const char* SERVER_ADDRESS;
extern const char* REGISTER_ENDPOINT;
extern const char* READINGS_ENDPOINT;

// --- Sensor Configuration ---

#define DHT_PIN 2
#define DHT_TYPE DHT22

// --- File System Paths ---
extern const char* SENSOR_CREDENTIALS_FILE;
extern const char* BUFFER_FILE;

// --- Timing and Validation ---
extern const unsigned long SEND_INTERVAL_MS;
extern const float MAX_TEMP_DEVIATION;
extern const float MAX_HUM_DEVIATION;

#endif // CONFIG_H
