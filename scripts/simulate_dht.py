import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime
import os
from dotenv import load_dotenv
import socket

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

print(f"Configuración MQTT:")
print(f"Broker: {MQTT_BROKER}")
print(f"Usuario: {MQTT_USER}")
print(f"Contraseña: {'*' * len(MQTT_PASSWORD) if MQTT_PASSWORD else 'No configurada'}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Conectado al broker MQTT")
    else:
        print(f"Error de conexión: {rc}")
        print("Códigos de error comunes:")
        print("1: Conexión rechazada - versión de protocolo incorrecta")
        print("2: Conexión rechazada - identificador de cliente inválido")
        print("3: Conexión rechazada - servidor no disponible")
        print("4: Conexión rechazada - usuario o contraseña incorrectos")
        print("5: Conexión rechazada - no autorizado")

def on_publish(client, userdata, mid):
    print(f"Mensaje publicado con ID: {mid}")

def on_disconnect(client, userdata, rc):
    print("Desconectado del broker MQTT")
    if rc != 0:
        print(f"Razón de desconexión: {rc}")

# Crear cliente MQTT con la versión más reciente de la API
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

# Configurar opciones de conexión
client.tls_set()  # Habilitar TLS
client.tls_insecure_set(True)  # Permitir certificados autofirmados

client.on_connect = on_connect
client.on_publish = on_publish
client.on_disconnect = on_disconnect

# Configurar tiempo de espera más largo
client.connect_timeout = 30

try:
    print(f"Intentando conectar a {MQTT_BROKER}...")
    
    # Verificar si el host es accesible
    try:
        socket.gethostbyname(MQTT_BROKER)
        print(f"Host {MQTT_BROKER} es accesible")
    except socket.gaierror:
        print(f"Error: No se puede resolver el host {MQTT_BROKER}")
        exit(1)
    
    # Intentar conectar con diferentes puertos
    ports = [1883, 8883, 443]  # Puertos comunes para MQTT
    connected = False
    
    for port in ports:
        try:
            print(f"Intentando conectar al puerto {port}...")
            client.connect(MQTT_BROKER, port, 60)
            client.loop_start()
            time.sleep(2)
            
            if client.is_connected():
                print(f"Conectado exitosamente al puerto {port}")
                connected = True
                break
            else:
                print(f"No se pudo conectar al puerto {port}")
                client.loop_stop()
                client.disconnect()
        except Exception as e:
            print(f"Error al conectar al puerto {port}: {str(e)}")
            continue
    
    if not connected:
        print("No se pudo conectar a ningún puerto")
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
            print(f"Publicando en tópico: {temp_topic}")
            client.publish(temp_topic, json.dumps(temp_payload))
            print(f"Publicando en tópico: {hum_topic}")
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
    print("Detalles del error:")
    print(f"Tipo de error: {type(e).__name__}")
    print(f"Mensaje de error: {str(e)}")
finally:
    client.loop_stop()
    client.disconnect()
    print("Simulador detenido") 