#include "config.h"

// --- Wi-Fi Configuration ---
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// --- Backend Server Configuration ---
const char* SERVER_ADDRESS = "http://host.wokwi.internal:3000";
const char* REGISTER_ENDPOINT = "/sensors";
const char* READINGS_ENDPOINT = "/readings";

// --- Sensor Configuration ---

// --- File System Paths ---
const char* SENSOR_CREDENTIALS_FILE = "/sensor_credentials.txt";
const char* BUFFER_FILE = "/readings_buffer.json";

// --- Timing and Validation ---
const unsigned long SEND_INTERVAL_MS = 3 * 60 * 1000; // 30 minutes
const float MAX_TEMP_DEVIATION = 5.0; // degrees Celsius
const float MAX_HUM_DEVIATION = 10.0; // percent
