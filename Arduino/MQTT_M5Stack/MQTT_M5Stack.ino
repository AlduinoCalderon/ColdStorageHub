#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <TFT_eSPI.h>
#include <ESPping.h>
#include <time.h>

// DHT sensor configuration
#define DHTPIN 22  // Pin for DHT sensor
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// HC-SR04 pins
#define TRIG1 14
#define ECHO1 27
#define TRIG2 26
#define ECHO2 25

// WiFi configuration
const char* ssid = "TEQS_Guest1";
const char* password = "1234teqs6789teqs";

const char* mqtt_server = "chameleon.lmq.cloudamqp.com";
const int mqtt_port = 8883;
const char* mqtt_user = "ylltduke:ylltduke";
const char* mqtt_password = "0l2ahZ_tmYsp7Dt57IOJU8NcbccV5tw9"; 

// Unit ID
const int unitId = 1;

// NTP Server for timestamp
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 3600;

// WiFi and MQTT clients
WiFiClient espClient;
PubSubClient client(espClient);

// Initialize display
TFT_eSPI tft = TFT_eSPI();

// Define timeout for distance measurements
const unsigned long DISTANCE_TIMEOUT = 25000; // 25ms timeout

// Sensor status flags
bool dhtAvailable = false;
bool proximity1Available = false;
bool proximity2Available = false;

// Temperature range for refrigeration (adjust as needed)
const float TEMP_MIN = -50.0;  // Extreme lower limit for refrigeration
const float TEMP_MAX = 100.0;  // Extreme upper limit

void setup() {
  // Initialize display
  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  displayStatus("Starting system...");
  
  Serial.begin(115200);
  Serial.println("System initializing...");

  // Initialize DHT
  displayStatus("Initializing DHT sensor...");
  dht.begin();
  // Test DHT by reading temperature
  float testTemp = dht.readTemperature();
  delay(500); // Add delay to ensure proper reading
  
  // Try a second reading if the first one fails
  if (isnan(testTemp)) {
    delay(1000);
    testTemp = dht.readTemperature();
  }
  
  if (isnan(testTemp)) {
    displayStatus("DHT sensor not found!");
    Serial.println("DHT sensor not found!");
    dhtAvailable = false;
  } else {
    displayStatus("DHT sensor ready");
    Serial.printf("DHT sensor ready (Temp: %.2f C)\n", testTemp);
    dhtAvailable = true;
  }
  delay(1000);

  // Configure HC-SR04 pins
  displayStatus("Setting up proximity sensors...");
  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);
  
  // Test proximity sensors
  float dist1 = medirDistancia(TRIG1, ECHO1);
  if (dist1 < 0) {
    displayStatus("Proximity sensor 1 not found!");
    Serial.println("Proximity sensor 1 not found!");
    proximity1Available = false;
  } else {
    displayStatus("Proximity sensor 1 ready");
    Serial.printf("Proximity sensor 1 ready (Reading: %.2f cm)\n", dist1);
    proximity1Available = true;
  }
  delay(1000);
  
  float dist2 = medirDistancia(TRIG2, ECHO2);
  if (dist2 < 0) {
    displayStatus("Proximity sensor 2 not found!");
    Serial.println("Proximity sensor 2 not found!");
    proximity2Available = false;
  } else {
    displayStatus("Proximity sensor 2 ready");
    Serial.printf("Proximity sensor 2 ready (Reading: %.2f cm)\n", dist2);
    proximity2Available = true;
  }
  delay(1000);

  // Connect to WiFi
  displayStatus("Connecting to WiFi...");
  conectarWiFi();
  
  // Configure NTP server
  displayStatus("Setting up time server...");
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  // Wait for time sync
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    displayStatus("Failed to get time!");
    Serial.println("Failed to get time!");
  } else {
    displayStatus("Time synchronized");
    Serial.println("Time synchronized");
  }
  delay(1000);

  // Configure MQTT server
  displayStatus("Setting up MQTT...");
  client.setServer(mqtt_server, mqtt_port);
  
  // Connect to MQTT
  displayStatus("Connecting to MQTT...");
  conectarMQTT();
  
  displayStatus("System ready!");
  delay(2000);
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    displayStatus("WiFi disconnected! Reconnecting...");
    conectarWiFi();
  }

  // Check MQTT connection
  if (!client.connected()) {
    displayStatus("MQTT disconnected! Reconnecting...");
    conectarMQTT();
  }
  client.loop();

  displayStatus("Reading sensors...");
  
  // Read sensors
  float temperature = NAN;
  float humidity = NAN;
  float distance1 = -1;
  float distance2 = -1;
  
  // Read DHT if available
  if (dhtAvailable) {
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
    
    // Check if readings are valid
    if (isnan(temperature) || isnan(humidity)) {
      displayStatus("DHT sensor error!");
      Serial.println("Failed to read from DHT sensor!");
    } else {
      // Verify temperature is within realistic bounds
      if (temperature < TEMP_MIN || temperature > TEMP_MAX) {
        Serial.printf("Warning: Temperature reading (%.2f) outside expected range!\n", temperature);
        displayStatus("Suspicious temperature reading!");
        // We don't invalidate the reading, just warn about it
      }
    }
  }
  
  // Read proximity sensors if available
  if (proximity1Available) {
    distance1 = medirDistancia(TRIG1, ECHO1);
  }
  
  if (proximity2Available) {
    distance2 = medirDistancia(TRIG2, ECHO2);
  }

  // Display data on screen
  mostrarEnPantalla(temperature, humidity, distance1, distance2);

  // Publish data to MQTT
  displayStatus("Publishing to MQTT...");
  publicarEnMQTT(temperature, humidity, distance1, distance2);
  
  displayStatus("Waiting for next reading cycle...");
  // Wait before next reading
  delay(5000);
}

void displayStatus(String message) {
  tft.fillRect(0, 200, 320, 30, TFT_BLACK);
  tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  tft.setTextSize(1);
  tft.setCursor(10, 200);
  tft.println("Status: " + message);
  Serial.println("Status: " + message);
}

void conectarWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    tft.fillRect(0, 215, 320, 15, TFT_BLACK);
    tft.setCursor(10, 215);
    tft.print("Connecting" + String(".").repeat(attempts % 4));
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    displayStatus("WiFi connected: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi connection failed!");
    displayStatus("WiFi connection failed!");
  }
}

void conectarMQTT() {
  int attempts = 0;
  while (!client.connected() && attempts < 5) {
    Serial.print("Connecting to MQTT...");
    displayStatus("Connecting to MQTT... Attempt " + String(attempts + 1));
    
    if (client.connect("LiligoClient", mqtt_user, mqtt_password)) {
      Serial.println("connected");
      displayStatus("MQTT connected!");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 1 second");
      displayStatus("MQTT failed: code " + String(client.state()));
      
      // Ping test
      Serial.print("Pinging broker... ");
      IPAddress ip;
      if (WiFi.hostByName(mqtt_server, ip)) {
        Serial.println("Broker IP: " + ip.toString());
        if (Ping.ping(ip)) {
          Serial.println("Ping successful!");
          displayStatus("Broker ping successful");
        } else {
          Serial.println("Ping failed");
          displayStatus("Broker ping failed");
        }
      } else {
        Serial.println("Could not resolve broker hostname");
        displayStatus("Could not resolve broker hostname");
      }
      delay(1000);
      attempts++;
    }
  }
  
  if (!client.connected() && attempts >= 5) {
    displayStatus("MQTT connection failed after 5 attempts");
  }
}

float medirDistancia(int trigPin, int echoPin) {
  // Clear TRIG pin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  
  // Set TRIG pin HIGH for 10 microseconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Read pulse duration from ECHO pin with timeout
  unsigned long startTime = micros();
  long duration = pulseIn(echoPin, HIGH, DISTANCE_TIMEOUT);
  
  // Check if we got a valid reading
  if (duration == 0) {
    // Timeout occurred - sensor might be disconnected
    return -1;
  }
  
  // Calculate distance (in cm)
  float distance = duration * 0.034 / 2;
  
  // Check for unrealistic values (out of HC-SR04 range)
  if (distance > 400 || distance < 2) {
    return -1;
  }
  
  return distance;
}

void mostrarEnPantalla(float temperature, float humidity, float distance1, float distance2) {
  tft.fillRect(0, 10, 320, 180, TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);

  // Display header
  tft.setCursor(10, 10);
  tft.println("Sensor Readings:");

  // Display temperature
  tft.setCursor(10, 40);
  if (!isnan(temperature)) {
    // Use different color for negative temperatures
    if (temperature < 0) {
      tft.setTextColor(TFT_CYAN, TFT_BLACK); // Blue for cold
    } else if (temperature > 30) {
      tft.setTextColor(TFT_RED, TFT_BLACK);  // Red for hot
    } else {
      tft.setTextColor(TFT_GREEN, TFT_BLACK); // Green for normal
    }
    tft.printf("Temp: %.2f C", temperature);
    tft.setTextColor(TFT_WHITE, TFT_BLACK); // Reset text color
  } else {
    tft.print("Temp: N/A");
  }

  // Display humidity
  tft.setCursor(10, 70);
  if (!isnan(humidity)) {
    tft.printf("Humidity: %.2f %%", humidity);
  } else {
    tft.print("Humidity: N/A");
  }
  
  // Display distances
  tft.setCursor(10, 100);
  if (distance1 >= 0) {
    tft.printf("Dist1: %.2f cm", distance1);
  } else {
    tft.print("Dist1: N/A");
  }
  
  tft.setCursor(10, 130);
  if (distance2 >= 0) {
    tft.printf("Dist2: %.2f cm", distance2);
  } else {
    tft.print("Dist2: N/A");
  }
  
  // Display active sensor count
  int activeSensors = 0;
  if (!isnan(temperature) && !isnan(humidity)) activeSensors++;
  if (distance1 >= 0) activeSensors++;
  if (distance2 >= 0) activeSensors++;
  
  tft.setCursor(10, 160);
  tft.printf("Active sensors: %d/3", activeSensors);
}

String obtenerTimestamp() {
  struct tm timeinfo;
  char timestamp[25];
  
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    displayStatus("Time sync failed, using uptime");
    // Fallback timestamp format: using millis
    unsigned long ms = millis();
    unsigned long seconds = ms / 1000;
    unsigned long minutes = seconds / 60;
    unsigned long hours = minutes / 60;
    sprintf(timestamp, "%02lu:%02lu:%02lu", hours % 24, minutes % 60, seconds % 60);
  } else {
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", &timeinfo);
  }
  
  return String(timestamp);
}

void publicarEnMQTT(float temperature, float humidity, float distance1, float distance2) {
  // Get timestamp
  String timestamp = obtenerTimestamp();
  bool published = false;
  char payload[200];
  
  // Temperature
  if (!isnan(temperature)) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", temperature, timestamp.c_str());
    if (client.publish("warehouse/unit/1/sensor/temperature", payload)) {
      Serial.printf("Published - Temp: %.2f°C\n", temperature);
      published = true;
    } else {
      Serial.println("Failed to publish temperature");
      displayStatus("Failed to publish temperature");
    }
  }
  
  // Humidity
  if (!isnan(humidity)) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", humidity, timestamp.c_str());
    if (client.publish("warehouse/unit/1/sensor/humidity", payload)) {
      Serial.printf("Published - Humidity: %.2f%%\n", humidity);
      published = true;
    } else {
      Serial.println("Failed to publish humidity");
      displayStatus("Failed to publish humidity");
    }
  }
  
  // Distance 1
  if (distance1 >= 0) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", distance1, timestamp.c_str());
    if (client.publish("warehouse/unit/1/sensor/proximity1", payload)) {
      Serial.printf("Published - Dist1: %.2fcm\n", distance1);
      published = true;
    } else {
      Serial.println("Failed to publish proximity1");
      displayStatus("Failed to publish proximity1");
    }
  }
  
  // Distance 2
  if (distance2 >= 0) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", distance2, timestamp.c_str());
    if (client.publish("warehouse/unit/1/sensor/proximity2", payload)) {
      Serial.printf("Published - Dist2: %.2fcm\n", distance2);
      published = true;
    } else {
      Serial.println("Failed to publish proximity2");
      displayStatus("Failed to publish proximity2");
    }
  }
  
  if (published) {
    displayStatus("Data published successfully");
  } else {
    displayStatus("No data published");
  }
}