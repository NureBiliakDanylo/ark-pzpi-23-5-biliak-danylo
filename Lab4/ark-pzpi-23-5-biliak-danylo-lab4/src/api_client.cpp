#include "api_client.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include "config.h"
#include "storage_manager.h" // For sensorId, apiKey, and saveSensorCredentials

bool registerSensor() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot register sensor, WiFi not connected.");
    return false;
  }

  HTTPClient http;
  http.begin(String(SERVER_ADDRESS) + REGISTER_ENDPOINT);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["name"] = sensorName;
  doc["location"] = sensorLocation;

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.println("Registering sensor with body: " + requestBody);
  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.println("Server Response: " + response);

    if (httpResponseCode == HTTP_CODE_CREATED) { // 201 Created
      StaticJsonDocument<300> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);

      if (!error) {
        String newId = responseDoc["id"].as<String>();
        String newKey = responseDoc["api_key"].as<String>();
        saveSensorCredentials(newId, newKey, sensorName, sensorLocation);
        // Also update the global variables immediately
        sensorId = newId;
        apiKey = newKey;
        Serial.println("Sensor registered successfully. ID: " + sensorId + ", API Key: " + apiKey.substring(0, 4) + "...");
        http.end();
        return true;
      } else {
        Serial.println("Failed to parse registration response: " + String(error.c_str()));
      }
    }
  } else {
    Serial.printf("HTTP Error during registration: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
  return false;
}

bool sendReading(float temperature, float humidity, float pressure) {
  if (WiFi.status() != WL_CONNECTED || sensorId.isEmpty() || apiKey.isEmpty()) {
    Serial.println("Cannot send reading: WiFi not connected or sensor not registered.");
    return false;
  }

  HTTPClient http;
  http.begin(String(SERVER_ADDRESS) + READINGS_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", apiKey);

  StaticJsonDocument<200> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["pressure"] = pressure; 

  String requestBody;
  serializeJson(doc, requestBody);

  // Serial.println("Sending reading with body: " + requestBody); // Can be verbose
  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    // Serial.print("HTTP Response code: ");
    // Serial.println(httpResponseCode);
    // String response = http.getString(); // Response body not critical for success
    http.end();
    if (httpResponseCode == HTTP_CODE_CREATED) { // 201 Created
      return true;
    }
  } else {
    Serial.printf("HTTP Error during sending reading: %s\n", http.errorToString(httpResponseCode).c_str());
    http.end();
  }
  return false;
}
