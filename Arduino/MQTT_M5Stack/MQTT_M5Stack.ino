#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <TFT_eSPI.h>  // Biblioteca para la pantalla TFT

// Configuración del sensor DHT
#define DHTPIN 22  // Pin para el sensor DHT
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Pines HC-SR04 (no utilizados en este código, pero definidos)
#define TRIG1 14
#define ECHO1 27
#define TRIG2 26
#define ECHO2 25

// Configuración WiFi
const char* ssid = "TEQS_Guest1";  // Tu SSID
const char* password = "1234teqs6789teqs";  // Tu contraseña WiFi

// Configuración MQTT
const char* mqtt_server = "192.168.0.4";  // Dirección del broker MQTT
const char* mqtt_user = "alduino";  // Usuario MQTT
const char* mqtt_password = "12345";  // Contraseña MQTT

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
  conectarWiFi();

  // Configurar servidor MQTT
  client.setServer(mqtt_server, 1883);
}

void loop() {
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  // Verificar conexión MQTT
  if (!client.connected()) {
    conectarMQTT();
  }
  client.loop();

  // Leer sensores
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Mostrar datos en pantalla
  mostrarEnPantalla(temperature, humidity);

  // Publicar datos en MQTT
  publicarEnMQTT(temperature, humidity);

  // Esperar antes de la siguiente lectura
  delay(5000);
}

void conectarWiFi() {
  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n¡WiFi conectado!");
  Serial.print("Dirección IP: ");
  Serial.println(WiFi.localIP());
}

void conectarMQTT() {
  while (!client.connected()) {
    Serial.print("Conectando a MQTT...");
    if (client.connect("LiligoClient", mqtt_user, mqtt_password)) {
      Serial.println("conectado");
    } else {
      Serial.print("falló, rc=");
      Serial.print(client.state());
      Serial.println(" reintentando en 5 segundos");
      delay(5000);
    }
  }
}

void mostrarEnPantalla(float temperature, float humidity) {
  tft.setTextColor(TFT_WHITE, TFT_BLACK); // Texto blanco con fondo negro
  tft.setTextSize(2);

  // Mostrar encabezado
  tft.setCursor(10, 10);
  tft.println("Lecturas:");

  // Mostrar temperatura
  tft.setCursor(10, 40);
  tft.printf("Temp: %.2f C", temperature);

  // Mostrar humedad
  tft.setCursor(10, 70);
  tft.printf("Humedad: %.2f %%", humidity);
}

void publicarEnMQTT(float temperature, float humidity) {
  // Crear payload y publicar temperatura
  char tempPayload[100];
  sprintf(tempPayload, "{\"value\": %.2f}", temperature);
  client.publish("warehouse/unit/1/sensor/temperature", tempPayload);

  // Crear payload y publicar humedad
  char humPayload[100];
  sprintf(humPayload, "{\"value\": %.2f}", humidity);
  client.publish("warehouse/unit/1/sensor/humidity", humPayload);
}