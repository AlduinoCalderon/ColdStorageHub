#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <M5Core2.h>

// Configuración del sensor DHT
#define DHTPIN 32  // Cambiado a pin 32 para M5Stack Core2
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Pines HC-SR04
#define TRIG1 14
#define ECHO1 27
#define TRIG2 26
#define ECHO2 25

// Configuración WiFi
const char* ssid = "TEQS_Guest1_5G";
const char* password = "1234teqs6789teqs";

// Configuración MQTT - Broker y credenciales
const char* mqtt_server = "localhost"; // Cambiado a localhost para conectar con el broker local
const char* mqtt_user = "alduino";
const char* mqtt_password = "12345";

// ID de la unidad de almacenamiento que este ESP32 está monitoreando
const int unitId = 1; // Cambia según corresponda a tu unidad

// Cliente WiFi y MQTT
WiFiClient espClient;
PubSubClient client(espClient);

// Variables para almacenar los últimos valores
float lastTemperature = 0;
float lastHumidity = 0;
float lastDistance1 = 0;
float lastDistance2 = 0;

// Función para actualizar la pantalla
void updateDisplay() {
  M5.Lcd.fillScreen(BLACK);  // Limpiar pantalla con fondo negro
  M5.Lcd.setTextSize(2);
  M5.Lcd.setTextColor(WHITE);
  
  // Mostrar temperatura
  M5.Lcd.setCursor(10, 20);
  M5.Lcd.print("Temp: ");
  M5.Lcd.print(lastTemperature);
  M5.Lcd.print(" C");
  
  // Mostrar humedad
  M5.Lcd.setCursor(10, 60);
  M5.Lcd.print("Humedad: ");
  M5.Lcd.print(lastHumidity);
  M5.Lcd.print(" %");
  
  // Mostrar distancias
  M5.Lcd.setCursor(10, 100);
  M5.Lcd.print("Dist1: ");
  M5.Lcd.print(lastDistance1);
  M5.Lcd.print(" cm");
  
  M5.Lcd.setCursor(10, 140);
  M5.Lcd.print("Dist2: ");
  M5.Lcd.print(lastDistance2);
  M5.Lcd.print(" cm");
  
  // Mostrar estado de conexión
  M5.Lcd.setCursor(10, 180);
  M5.Lcd.print("MQTT: ");
  M5.Lcd.print(client.connected() ? "Conectado" : "Desconectado");
}

// Conexión WiFi
void setup_wifi() {
  Serial.println("Conectando a WiFi");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("¡WiFi conectado!");
  Serial.print("Dirección IP: ");
  Serial.println(WiFi.localIP());
}

// Reconexión MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Conectando a MQTT...");
    
    // Intenta conectar con usuario y contraseña
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

// Medir distancia con HC-SR04
float getDistance(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  
  long duration = pulseIn(echo, HIGH);
  return duration * 0.034 / 2; // Fórmula para convertir a cm
}

void setup() {
  M5.begin();  // Inicializar M5Stack Core2
  M5.Lcd.fillScreen(BLACK);
  M5.Lcd.setTextColor(WHITE);
  M5.Lcd.setTextSize(2);
  M5.Lcd.println("Iniciando...");
  
  Serial.begin(115200);
  
  // Inicializar pines para sensores ultrasónicos
  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);
  
  // Inicializar sensor DHT
  dht.begin();
  
  // Conectar a WiFi
  setup_wifi();
  
  // Configurar servidor MQTT
  client.setServer(mqtt_server, 1883);
  
  Serial.println("Inicialización completada");
}

void loop() {
  // Verificar conexión MQTT
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Leer sensores
  lastTemperature = dht.readTemperature();
  lastHumidity = dht.readHumidity();
  lastDistance1 = getDistance(TRIG1, ECHO1);
  lastDistance2 = getDistance(TRIG2, ECHO2);
  
  // Actualizar pantalla
  updateDisplay();
  
  // Verificar si las lecturas son válidas
  if (isnan(lastHumidity) || isnan(lastTemperature)) {
    Serial.println("¡Error al leer del sensor DHT!");
  } else {
    // Crear payload y publicar temperatura
    char tempPayload[100];
    sprintf(tempPayload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", lastTemperature, getTimestamp());
    String tempTopic = "warehouse/unit/" + String(unitId) + "/sensor/temperature";
    client.publish(tempTopic.c_str(), tempPayload);
    Serial.println("Temperatura publicada: " + String(lastTemperature) + "°C");
    
    // Crear payload y publicar humedad
    char humPayload[100];
    sprintf(humPayload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", lastHumidity, getTimestamp());
    String humTopic = "warehouse/unit/" + String(unitId) + "/sensor/humidity";
    client.publish(humTopic.c_str(), humPayload);
    Serial.println("Humedad publicada: " + String(lastHumidity) + "%");
  }
  
  // Publicar distancias
  if (lastDistance1 > 0 && lastDistance1 < 400) {
    char dist1Payload[100];
    sprintf(dist1Payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", lastDistance1, getTimestamp());
    String dist1Topic = "warehouse/unit/" + String(unitId) + "/sensor/distance1";
    client.publish(dist1Topic.c_str(), dist1Payload);
    Serial.println("Distancia 1 publicada: " + String(lastDistance1) + " cm");
  }
  
  if (lastDistance2 > 0 && lastDistance2 < 400) {
    char dist2Payload[100];
    sprintf(dist2Payload, "{\"value\": %.2f, \"timestamp\": \"%s\"}", lastDistance2, getTimestamp());
    String dist2Topic = "warehouse/unit/" + String(unitId) + "/sensor/distance2";
    client.publish(dist2Topic.c_str(), dist2Payload);
    Serial.println("Distancia 2 publicada: " + String(lastDistance2) + " cm");
  }
  
  // Esperar antes de la siguiente lectura
  delay(5000);
}

// Función para obtener timestamp actual (aproximado, ya que ESP32 no tiene RTC)
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