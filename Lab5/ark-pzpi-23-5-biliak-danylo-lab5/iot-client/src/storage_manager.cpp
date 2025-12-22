#include "storage_manager.h"
#include <LittleFS.h>
#include <ArduinoJson.h>
#include "config.h"
#include "api_client.h"

String sensorId = "";
String apiKey = "";
String sensorName = "";
String sensorLocation = "";

void setupStorage() {
  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS Mount Failed");
    return;
  }
  Serial.println("LittleFS Mounted Successfully");
}

bool loadSensorCredentials() {
  if (LittleFS.exists(SENSOR_CREDENTIALS_FILE)) {
    File file = LittleFS.open(SENSOR_CREDENTIALS_FILE, "r");
    if (file) {
      String id = file.readStringUntil('\n');
      String key = file.readStringUntil('\n');
      String name = file.readStringUntil('\n');
      String location = file.readStringUntil('\n');
      id.trim();
      key.trim();
      name.trim();
      location.trim();
      if (!id.isEmpty() && !key.isEmpty()) {
        sensorId = id;
        apiKey = key;
        sensorName = name;
        sensorLocation = location;
        file.close();
        return true;
      }
      file.close();
    }
  }
  return false;
}

void saveSensorCredentials(const String& id, const String& key, const String& name, const String& location) {
  File file = LittleFS.open(SENSOR_CREDENTIALS_FILE, "w");
  if (file) {
    file.println(id);
    file.println(key);
    file.println(name);
    file.println(location);
    file.close();
    Serial.println("Sensor credentials saved.");
  } else {
    Serial.println("Failed to save sensor credentials.");
  }
}

void appendReadingToBuffer(float temperature, float humidity, float pressure) {
  File file = LittleFS.open(BUFFER_FILE, "a+"); // Open in append mode
  if (file) {
    StaticJsonDocument<200> doc;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["pressure"] = pressure;
    doc["timestamp"] = millis(); // Store timestamp for ordering if needed later

    String readingJson;
    serializeJson(doc, readingJson);
    file.println(readingJson); // Each reading on a new line
    file.close();
    Serial.println("Reading appended to buffer.");
  } else {
    Serial.println("Failed to open buffer file for appending.");
  }
}

void processReadingBuffer() {
  if (!LittleFS.exists(BUFFER_FILE)) {
    Serial.println("Buffer file does not exist.");
    return;
  }

  File file = LittleFS.open(BUFFER_FILE, "r");
  if (!file) {
    Serial.println("Failed to open buffer file for reading.");
    return;
  }

  String bufferedReadings = file.readString();
  file.close(); // Close the file for reading

  Serial.println("--- Processing Buffered Readings ---");
  // Serial.print("Buffer content:\n" + bufferedReadings + "\n--- End Buffer Content ---\n");

  // Create a temporary file to store readings that failed to send
  File tempFile = LittleFS.open((String(BUFFER_FILE) + "_temp").c_str(), "w");
  if (!tempFile) {
    Serial.println("Failed to create temporary buffer file.");
    return;
  }

  int startIndex = 0;
  bool bufferModified = false;

  while (startIndex < bufferedReadings.length()) {
    int endIndex = bufferedReadings.indexOf('\n', startIndex);
    String line;
    if (endIndex == -1) { // Last line
      line = bufferedReadings.substring(startIndex);
      startIndex = bufferedReadings.length();
    } else {
      line = bufferedReadings.substring(startIndex, endIndex);
      startIndex = endIndex + 1;
    }
    line.trim();

    if (line.isEmpty()) continue;

    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, line);

    if (!error) {
      float temp = doc["temperature"];
      float hum = doc["humidity"];
      float pres = doc["pressure"];

      Serial.print("Attempting to send buffered reading: T="); Serial.print(temp); Serial.print(", H="); Serial.println(hum);
      if (sendReading(temp, hum, pres)) {
        Serial.println("Buffered reading sent successfully. Removing from buffer.");
        bufferModified = true;
      } else {
        Serial.println("Failed to send buffered reading. Keeping in buffer.");
        serializeJson(doc, tempFile); // Write to temp file if not sent
        tempFile.println(); // Add newline
      }
    } else {
      Serial.println("Failed to parse buffered JSON: " + String(error.c_str()));
      tempFile.println(line); // Write back unparseable line to avoid data loss
      bufferModified = true; 
    }
  }

  tempFile.close();

  LittleFS.remove(BUFFER_FILE); // Remove the old buffer
  if (LittleFS.exists((String(BUFFER_FILE) + "_temp").c_str())) {
      // Check if the temp file has content before renaming
      File f = LittleFS.open((String(BUFFER_FILE) + "_temp").c_str(), "r");
      if (f && f.size() > 0) {
          f.close();
          LittleFS.rename((String(BUFFER_FILE) + "_temp").c_str(), BUFFER_FILE);
          Serial.println("Buffer file updated with remaining readings.");
      } else {
          if(f) f.close();
          LittleFS.remove((String(BUFFER_FILE) + "_temp").c_str());
          Serial.println("Buffer cleared.");
      }
  }
  Serial.println("--- Finished Processing Buffered Readings ---");
}
