#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <TFT_eSPI.h>  // Biblioteca para la pantalla TFT

// Configuración del sensor DHT
#define DHTPIN 22  // Pin para el sensor DHT
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Pines HC-SR04
#define TRIG1 14
#define ECHO1 27
#define TRIG2 26
#define ECHO2 25

// Configuración WiFi
const char* ssid = "TEQS_Guest1_5G";  // Tu SSID
const char* password = "1234teqs6789teqs";  // Tu contraseña WiFi

// Configuración MQTT
const char* mqtt_server = "localhost";  // IP de tu servidor Node.js
const int mqtt_port = 1883;
const char* mqtt_user = "alduino";  // Usuario MQTT
const char* mqtt_password = "12345";  // Contraseña MQTT

// ID de la unidad
const int unitId = 1;

// Cliente WiFi y MQTT
WiFiClient espClient;
PubSubClient client(espClient);

// Inicializar pantalla
TFT_eSPI tft = TFT_eSPI(); // Crear objeto TFT

void setup() {
  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  
  Serial.begin(115200);
  
  // Inicializar DHT
  dht.begin();
  
  // Conectar a WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("¡WiFi conectado!");
  
  // Configurar servidor MQTT
  client.setServer(mqtt_server, mqtt_port);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Conectando a MQTT...");
    if (client.connect("ESP32Client", mqtt_user, mqtt_password)) {
      Serial.println("conectado");
    } else {
      Serial.print("falló, rc=");
      Serial.print(client.state());
      Serial.println(" reintentando en 5 segundos");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Leer sensores
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Mostrar en pantalla
  tft.setTextColor(TFT_WHITE);
  tft.setTextSize(2);
  tft.fillScreen(TFT_BLACK);  // Limpiar pantalla antes de mostrar nuevos datos
  tft.setCursor(10, 10);
  tft.printf("Temp: %.2f C\n", temperature);
  tft.setCursor(10, 40);
  tft.printf("Humedad: %.2f %%\n", humidity);
  
  // Crear payload JSON
  char payload[200];
  sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", 
          temperature, 
          getTimestamp());
  
  // Publicar en MQTT
  String topic = "warehouse/unit/" + String(unitId) + "/sensor/temperature";
  client.publish(topic.c_str(), payload);
  
  sprintf(payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", 
          humidity, 
          getTimestamp());
  topic = "warehouse/unit/" + String(unitId) + "/sensor/humidity";
  client.publish(topic.c_str(), payload);
  
  delay(5000);
}

// Función para obtener timestamp
char* getTimestamp() {
  static char timestamp[25];
  unsigned long ms = millis();
  unsigned long seconds = ms / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  sprintf(timestamp, "%02lu:%02lu:%02lu.%03lu",
         hours % 24, minutes % 60, seconds % 60, ms % 1000);
  
  return timestamp;
}