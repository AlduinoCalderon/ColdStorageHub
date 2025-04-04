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
    if rc == 0:
        print("Conectado al broker MQTT")
    else:
        print(f"Error de conexión: {rc}")

def on_publish(client, userdata, mid):
    print(f"Mensaje publicado con ID: {mid}")

def on_disconnect(client, userdata, rc):
    print("Desconectado del broker MQTT")

# Crear cliente MQTT con la versión más reciente de la API
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
client.on_connect = on_connect
client.on_publish = on_publish
client.on_disconnect = on_disconnect

# Configurar tiempo de espera más largo
client.connect_timeout = 30

try:
    print(f"Intentando conectar a {MQTT_BROKER}...")
    client.connect(MQTT_BROKER, 1883, 60)
    client.loop_start()
    
    # Esperar a que se establezca la conexión
    time.sleep(2)
    
    if not client.is_connected():
        print("No se pudo conectar al broker MQTT")
        client.loop_stop()
        client.disconnect()
        exit(1)
    
    # Contador de mensajes
    message_count = 0
    max_messages = 5
    
    while message_count < max_messages and client.is_connected():
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
        
        try:
            client.publish(temp_topic, json.dumps(temp_payload))
            client.publish(hum_topic, json.dumps(hum_payload))
            
            print(f"Mensaje {message_count + 1}/{max_messages}")
            print(f"Publicado - Temp: {temperature}°C, Hum: {humidity}%")
            
            message_count += 1
            time.sleep(2)
        except Exception as e:
            print(f"Error al publicar mensaje: {e}")
            break

except Exception as e:
    print(f"Error general: {e}")
finally:
    client.loop_stop()
    client.disconnect()
    print("Simulador detenido") 