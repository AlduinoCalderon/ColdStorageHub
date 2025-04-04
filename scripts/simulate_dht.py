import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración MQTT desde variables de entorno
MQTT_BROKER = os.getenv('MQTT_BROKER_URL')
MQTT_USER = os.getenv('MQTT_USERNAME')
MQTT_PASSWORD = os.getenv('MQTT_PASSWORD')
UNIT_ID = 1

# Asegurar que la URL tenga el formato correcto
if MQTT_BROKER.startswith('mqtt://'):
    MQTT_BROKER = MQTT_BROKER.replace('mqtt://', '')

def on_connect(client, userdata, flags, rc):
    print("Conectado al broker MQTT")
    print(f"Código de resultado: {rc}")

def on_publish(client, userdata, mid):
    print(f"Mensaje publicado con ID: {mid}")

# Crear cliente MQTT
client = mqtt.Client()
client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
client.on_connect = on_connect
client.on_publish = on_publish

# Conectar al broker
client.connect(MQTT_BROKER, 1883, 60)
client.loop_start()

# Contador de mensajes
message_count = 0
max_messages = 5

try:
    while message_count < max_messages:
        # Generar valores aleatorios para temperatura y humedad
        temperature = round(random.uniform(20.0, 30.0), 2)
        humidity = round(random.uniform(40.0, 60.0), 2)
        
        # Crear timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Crear payloads
        temp_payload = {
            "value": temperature,
            "timestamp": timestamp
        }
        
        hum_payload = {
            "value": humidity,
            "timestamp": timestamp
        }
        
        # Publicar mensajes
        temp_topic = f"warehouse/unit/{UNIT_ID}/sensor/temperature"
        hum_topic = f"warehouse/unit/{UNIT_ID}/sensor/humidity"
        
        client.publish(temp_topic, json.dumps(temp_payload))
        client.publish(hum_topic, json.dumps(hum_payload))
        
        print(f"Mensaje {message_count + 1}/{max_messages}")
        print(f"Publicado - Temp: {temperature}°C, Hum: {humidity}%")
        
        message_count += 1
        time.sleep(2)  # Esperar 2 segundos entre mensajes

except KeyboardInterrupt:
    print("Deteniendo simulador...")
finally:
    client.loop_stop()
    client.disconnect()
    print("Simulador detenido") 