#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <TFT_eSPI.h>
#include <ESPping.h>
#include <time.h>

// DHT sensor
#define DHTPIN 22
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Proximidad
#define TRIG1 21
#define ECHO1 36
#define TRIG2 26
#define ECHO2 25

// WiFi
const char* ssid = "SPW_X12_7918d7";
const char* password = "2bddca7fae65c";

// MQTT CloudAMQP (con TLS)
const char* mqtt_server = "chameleon.lmq.cloudamqp.com";
const int tls_port = 8883;
const char* mqtt_user = "ylltduke:ylltduke";
const char* mqtt_password = "0l2ahZ_tmYsp7Dt57IOJU8NcbccV5tw9";

const int unitId = 1;

// NTP
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 9 * 3600; // UTC+9 para Osaka
const int daylightOffset_sec = 0;


// MQTT con TLS
WiFiClientSecure secureClient;
PubSubClient client(secureClient);
TFT_eSPI tft = TFT_eSPI();

const unsigned long DISTANCE_TIMEOUT = 25000;
bool dhtAvailable = false;
bool proximity1Available = false;
bool proximity2Available = false;

const float TEMP_MIN = -50.0;
const float TEMP_MAX = 100.0;

void setup() {
  Serial.begin(115200);
  Serial.println("Starting system...");

  // Test DHT
  dht.begin();
  float testTemp = dht.readTemperature();
  float testHum = dht.readHumidity();
  dhtAvailable = !isnan(testTemp) && !isnan(testHum);
  Serial.printf("DHT: %s\n", dhtAvailable ? "OK" : "NO DETECTA");

  // Test Proximity Sensors
  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);

  float dist1 = medirDistancia(TRIG1, ECHO1);
  proximity1Available = dist1 >= 0;
  Serial.printf("Proximidad 1: %s\n", proximity1Available ? "OK" : "NO DETECTA");

  float dist2 = medirDistancia(TRIG2, ECHO2);
  proximity2Available = dist2 >= 0;
  Serial.printf("Proximidad 2: %s\n", proximity2Available ? "OK" : "NO DETECTA");

  conectarWiFi();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  secureClient.setInsecure();
  client.setServer(mqtt_server, tls_port);
  conectarMQTT();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected");
    conectarWiFi();
  }

  if (!client.connected()) {
    Serial.println("MQTT disconnected");
    conectarMQTT();
  }
  client.loop();

  float temperature = NAN, humidity = NAN;
  float distance1 = -1, distance2 = -1;

  // DHT readings
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  Serial.printf("DHT: Temp=%.1f°C, Hum=%.1f%%\n", temperature, humidity);

  // Proximity readings
  distance1 = medirDistancia(TRIG1, ECHO1);
  Serial.printf("Proximidad 1: %s\n", distance1 >= 0 ? "OK" : "NO DETECTA");

  distance2 = medirDistancia(TRIG2, ECHO2);
  Serial.printf("Proximidad 2: %s\n", distance2 >= 0 ? "OK" : "NO DETECTA");

  publicarEnMQTT(temperature, humidity, distance1, distance2);
  delay(5000);
}

void conectarWiFi() {
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi OK: " + WiFi.localIP().toString());
  } else {
    Serial.println("WiFi failed");
  }
}

void conectarMQTT() {
  int attempts = 0;
  while (!client.connected() && attempts < 5) {
    Serial.println("MQTT try " + String(attempts + 1));
    if (client.connect("LiligoClient", mqtt_user, mqtt_password)) {
      Serial.println("MQTT connected");
    } else {
      Serial.println("MQTT fail rc=" + String(client.state()));
      delay(1000);
      attempts++;
    }
  }

  if (!client.connected()) {
    Serial.println("MQTT failed after retries");
  }
}

float medirDistancia(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, DISTANCE_TIMEOUT);
  if (duration == 0) {
    Serial.printf("Sensor %d: No echo\n", trigPin);
    return -1;
  }

  float distance = duration * 0.034 / 2;
  if (distance > 400 || distance < 2) {
    Serial.printf("Sensor %d: %.1f cm (fuera de rango)\n", trigPin, distance);
    return -1;
  }
  
  Serial.printf("Sensor %d: %.1f cm\n", trigPin, distance);
  return distance;
}

void publicarEnMQTT(float temperature, float humidity, float distance1, float distance2) {
  String timestamp = obtenerTimestamp();
  char payload[200];

  if (!isnan(temperature)) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", temperature, timestamp.c_str());
    client.publish("warehouse/unit/1/sensor/temperature", payload);
    Serial.println("Sent temperature");
  }

  if (!isnan(humidity)) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", humidity, timestamp.c_str());
    client.publish("warehouse/unit/1/sensor/humidity", payload);
    Serial.println("Sent humidity");
  }

  if (distance1 >= 0) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", distance1, timestamp.c_str());
    client.publish("warehouse/unit/1/sensor/proximity1", payload);
    Serial.println("Sent proximity 1");
  }

  if (distance2 >= 0) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", distance2, timestamp.c_str());
    client.publish("warehouse/unit/1/sensor/proximity2", payload);
    Serial.println("Sent proximity 2");
  }
}

String obtenerTimestamp() {
  struct tm timeinfo;
  char timestamp[25];

  if (!getLocalTime(&timeinfo)) {
    unsigned long s = millis() / 1000;
    sprintf(timestamp, "%02lu:%02lu:%02lu", (s / 3600) % 24, (s / 60) % 60, s % 60);
  } else {
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", &timeinfo);
  }

  return String(timestamp);
}
