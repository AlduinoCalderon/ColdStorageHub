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
const char* ssid = "TEQS_Guest1";
const char* password = "1234teqs6789teqs";

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
  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  Serial.begin(115200);

  logStatus("Starting system...");

  dht.begin();
  float testTemp = dht.readTemperature();
  delay(500);
  if (isnan(testTemp)) {
    delay(1000);
    testTemp = dht.readTemperature();
  }
  dhtAvailable = !isnan(testTemp);
  logStatus(dhtAvailable ? "DHT ready" : "DHT not found");
  delay(1000);

  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);

  float dist1 = medirDistancia(TRIG1, ECHO1);
  proximity1Available = dist1 >= 0;
  logStatus(proximity1Available ? "Proximity 1 ready" : "Proximity 1 failed");
  delay(1000);

  float dist2 = medirDistancia(TRIG2, ECHO2);
  proximity2Available = dist2 >= 0;
  logStatus(proximity2Available ? "Proximity 2 ready" : "Proximity 2 failed");
  delay(1000);

  conectarWiFi();

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    logStatus("NTP failed");
  } else {
    logStatus("Time synchronized");
  }
  delay(1000);

  secureClient.setInsecure();
  client.setServer(mqtt_server, tls_port);
  conectarMQTT();

  logStatus("System ready");
  delay(2000);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    logStatus("WiFi disconnected");
    conectarWiFi();
  }

  if (!client.connected()) {
    logStatus("MQTT disconnected");
    conectarMQTT();
  }
  client.loop();

  float temperature = NAN, humidity = NAN;
  float distance1 = -1, distance2 = -1;

  if (dhtAvailable) {
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
    if (isnan(temperature) || isnan(humidity)) {
      logStatus("DHT error");
    } else if (temperature < TEMP_MIN || temperature > TEMP_MAX) {
      logStatus("Temp suspicious: " + String(temperature));
    }
  }

  if (proximity1Available) distance1 = medirDistancia(TRIG1, ECHO1);
  if (proximity2Available) distance2 = medirDistancia(TRIG2, ECHO2);

  mostrarEnPantalla(temperature, humidity, distance1, distance2);
  publicarEnMQTT(temperature, humidity, distance1, distance2);

  logStatus("Waiting for next cycle...");
  delay(5000);
}

void logStatus(String message) {
  tft.fillRect(0, 200, 320, 30, TFT_BLACK);
  tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  tft.setTextSize(1);
  tft.setCursor(10, 200);
  tft.println("Status: " + message);
  Serial.println("Status: " + message);
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
    logStatus("WiFi OK: " + WiFi.localIP().toString());
  } else {
    logStatus("WiFi failed");
  }
}

void conectarMQTT() {
  int attempts = 0;
  while (!client.connected() && attempts < 5) {
    logStatus("MQTT try " + String(attempts + 1));
    if (client.connect("LiligoClient", mqtt_user, mqtt_password)) {
      logStatus("MQTT connected");
    } else {
      logStatus("MQTT fail rc=" + String(client.state()));
      delay(1000);
      attempts++;
    }
  }

  if (!client.connected()) {
    logStatus("MQTT failed after retries");
  }
}

float medirDistancia(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, DISTANCE_TIMEOUT);
  if (duration == 0) return -1;

  float distance = duration * 0.034 / 2;
  if (distance > 400 || distance < 2) return -1;
  return distance;
}

void mostrarEnPantalla(float temperature, float humidity, float distance1, float distance2) {
  tft.fillRect(0, 10, 320, 180, TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);

  tft.setCursor(10, 10);
  tft.println("Sensor Readings:");

  tft.setCursor(10, 40);
  if (!isnan(temperature)) {
    if (temperature < 0)
      tft.setTextColor(TFT_CYAN);
    else if (temperature > 30)
      tft.setTextColor(TFT_RED);
    else
      tft.setTextColor(TFT_GREEN);
    tft.printf("Temp: %.2f C", temperature);
    tft.setTextColor(TFT_WHITE);
  } else {
    tft.print("Temp: N/A");
  }

  tft.setCursor(10, 70);
  tft.print("Humidity: ");
  if (!isnan(humidity)) tft.printf("%.2f %%", humidity);
  else tft.print("N/A");

  tft.setCursor(10, 100);
  tft.print("Dist1: ");
  if (distance1 >= 0) tft.printf("%.2f cm", distance1);
  else tft.print("N/A");

  tft.setCursor(10, 130);
  tft.print("Dist2: ");
  if (distance2 >= 0) tft.printf("%.2f cm", distance2);
  else tft.print("N/A");

  int count = 0;
  if (!isnan(temperature) && !isnan(humidity)) count++;
  if (distance1 >= 0) count++;
  if (distance2 >= 0) count++;
  tft.setCursor(10, 160);
  tft.printf("Active: %d/3", count);
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

void publicarEnMQTT(float temperature, float humidity, float distance1, float distance2) {
  String timestamp = obtenerTimestamp();
  char payload[200];

  if (!isnan(temperature)) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", temperature, timestamp.c_str());
    client.publish("warehouse/unit/1/sensor/temperature", payload);
    logStatus("Sent temperature");
  }

  if (!isnan(humidity)) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", humidity, timestamp.c_str());
    client.publish("warehouse/unit/1/sensor/humidity", payload);
    logStatus("Sent humidity");
  }

  if (distance1 >= 0) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", distance1, timestamp.c_str());
    client.publish("warehouse/unit/1/sensor/proximity1", payload);
    logStatus("Sent proximity 1");
  }

  if (distance2 >= 0) {
    sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", distance2, timestamp.c_str());
    client.publish("warehouse/unit/1/sensor/proximity2", payload);
    logStatus("Sent proximity 2");
  }
}
