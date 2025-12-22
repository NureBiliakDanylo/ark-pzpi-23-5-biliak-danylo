#include <Arduino.h>
#include <WiFi.h> // Required for WiFi.status() and WL_CONNECTED
#include "config.h"
#include "wifi_manager.h"
#include "storage_manager.h"
#include "sensor_handler.h"
#include "api_client.h"

unsigned long lastReadingTime = 0;

void getSensorInfoFromUser() {
  if (sensorName.isEmpty()) {
    Serial.println("Please enter the sensor name:");
    while (Serial.available() == 0) { }
    sensorName = Serial.readStringUntil('\n');
    sensorName.trim();
  }
  if (sensorLocation.isEmpty()) {
    Serial.println("Please enter the sensor location:");
    while (Serial.available() == 0) { }
    sensorLocation = Serial.readStringUntil('\n');
    sensorLocation.trim();
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n--- IoT Client Starting ---");

  setupSensor();
  setupStorage();
  connectWiFi();

  // Load or Register Sensor
  if (!loadSensorCredentials() || sensorId.isEmpty()) {
    Serial.println("Sensor not registered or credentials incomplete.");
    getSensorInfoFromUser();
    Serial.println("Attempting to register sensor...");
    if (!registerSensor()) {
      Serial.println("Failed to register sensor. Will retry on next loop.");
    }
  } else {
    Serial.println("Sensor already registered. ID: " + sensorId);
    if(sensorName.isEmpty() || sensorLocation.isEmpty()){
      Serial.println("Sensor name/location not set.");
      getSensorInfoFromUser();
      saveSensorCredentials(sensorId, apiKey, sensorName, sensorLocation);
    }
    Serial.println("Name: " + sensorName + ", Location: " + sensorLocation);
  }
  
  lastReadingTime = millis(); // Initialize last reading time
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectWiFi();
    delay(5000); // Wait for 5 seconds before retrying
    return;
  }

  // If registration failed in setup, try again in the loop
  if (sensorId.isEmpty() || apiKey.isEmpty()) {
      Serial.println("Sensor not registered. Attempting to register...");
      if (!registerSensor()) {
          Serial.println("Registration failed. Will retry after a delay.");
          delay(60000); // wait a minute before retrying registration
          return;
      }
  }

  // Check if it's time to take a reading and send
  if (millis() - lastReadingTime >= SEND_INTERVAL_MS) {
    lastReadingTime = millis(); // Reset timer

    SensorData data = readAndValidateSensorData();

    if (data.isValid) {
      Serial.println("Processing reading buffer before sending current data...");
      processReadingBuffer();

      Serial.println("Attempting to send current reading...");
      if (sendReading(data.temperature, data.humidity)) {
        Serial.println("Current reading sent successfully!");
        // Update the last sent values only after a successful send
        lastSentTemperature = data.temperature;
        lastSentHumidity = data.humidity;
      } else {
        Serial.println("Failed to send current reading. Appending to buffer.");
        appendReadingToBuffer(data.temperature, data.humidity);
      }
    } else {
      Serial.println("Sensor data is not valid. Nothing to send or buffer.");
    }
  }

  delay(100); // Small delay to prevent watchdog timer issues
}
