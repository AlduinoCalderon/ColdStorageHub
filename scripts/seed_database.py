import requests
import json
from datetime import datetime, timedelta
import random
import time

# Configuración
API_URL = "http://localhost:3000/api/v1"

def create_test_data():
    # Generar timestamp para emails únicos
    timestamp = int(time.time())
    
    # 1. Crear propietario
    owner_data = {
        "name": "Yamamoto Kenji",
        "email": f"yamamoto.kenji.{timestamp}@coldstorage.jp",
        "password": "Test123!",
        "phone": "+81-6-1234-5678",
        "role": "owner"
    }
    
    print("Creando propietario...")
    owner_response = requests.post(f"{API_URL}/auth/register", json=owner_data)
    print("Respuesta del servidor:", owner_response.text)
    
    if owner_response.status_code != 201:
        print("Error al crear propietario")
        return
    
    owner_data = owner_response.json()
    owner_token = owner_data["token"]
    owner_id = owner_data["data"]["user"]["id"]
    
    print(f"Propietario creado con ID: {owner_id}")
    print(f"Token del propietario: {owner_token}")
    
    # 2. Crear usuario final
    end_user_data = {
        "name": "Tanaka Aiko",
        "email": f"tanaka.aiko.{timestamp}@example.jp",
        "password": "Test123!",
        "phone": "+81-6-8765-4321",
        "role": "end_user"
    }
    
    print("\nCreando usuario final...")
    end_user_response = requests.post(f"{API_URL}/auth/register", json=end_user_data)
    print("Respuesta del servidor:", end_user_response.text)
    
    if end_user_response.status_code != 201:
        print("Error al crear usuario final")
        return
    
    end_user_data = end_user_response.json()
    end_user_token = end_user_data["token"]
    end_user_id = end_user_data["data"]["user"]["id"]
    
    print(f"Usuario final creado con ID: {end_user_id}")
    print(f"Token del usuario final: {end_user_token}")
    
    # 3. Crear almacenes
    warehouses = [
        {
            "owner_id": owner_id,
            "name": "Osaka Central Cold Storage",
            "address": "1-1-1 Nakanoshima, Kita-ku, Osaka",
            "location": {
                "type": "Point",
                "coordinates": [135.5022, 34.6937]
            },
            "operating_hours": {
                "weekday_text": [
                    "Monday: 9:00 AM – 6:00 PM",
                    "Tuesday: 9:00 AM – 6:00 PM",
                    "Wednesday: 9:00 AM – 6:00 PM",
                    "Thursday: 9:00 AM – 6:00 PM",
                    "Friday: 9:00 AM – 6:00 PM",
                    "Saturday: 9:00 AM – 2:00 PM",
                    "Sunday: Closed"
                ],
                "open_now": True
            },
            "amenities": {
                "rating": 4.5,
                "total_reviews": 128,
                "types": ["24/7_access", "security", "loading_dock"]
            }
        },
        {
            "owner_id": owner_id,
            "name": "Kobe Port Cold Storage",
            "address": "2-2-2 Higashikawasaki-cho, Chuo-ku, Kobe",
            "location": {
                "type": "Point",
                "coordinates": [135.1957, 34.6900]
            },
            "operating_hours": {
                "weekday_text": [
                    "Monday: 8:00 AM – 7:00 PM",
                    "Tuesday: 8:00 AM – 7:00 PM",
                    "Wednesday: 8:00 AM – 7:00 PM",
                    "Thursday: 8:00 AM – 7:00 PM",
                    "Friday: 8:00 AM – 7:00 PM",
                    "Saturday: 9:00 AM – 3:00 PM",
                    "Sunday: Closed"
                ],
                "open_now": True
            },
            "amenities": {
                "rating": 4.8,
                "total_reviews": 95,
                "types": ["24/7_access", "security", "loading_dock", "forklift"]
            }
        }
    ]
    
    print("\nCreando almacenes...")
    warehouse_ids = []
    for warehouse in warehouses:
        headers = {
            "Authorization": f"Bearer {owner_token}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            f"{API_URL}/warehouses",
            json=warehouse,
            headers=headers
        )
        print("Respuesta del servidor:", response.text)
        
        if response.status_code != 201:
            print(f"Error al crear almacén: {response.text}")
            continue
            
        try:
            warehouse_ids.append(response.json()["data"]["id"])
            print(f"Almacén creado con ID: {response.json()['data']['id']}")
        except Exception as e:
            print(f"Error al procesar respuesta del almacén: {str(e)}")
            continue
            
        time.sleep(1)  # Esperar entre peticiones
    
    if not warehouse_ids:
        print("No se pudieron crear almacenes. Terminando script.")
        return
    
    # 4. Crear unidades de almacenamiento
    storage_units = []
    for warehouse_id in warehouse_ids:
        for i in range(3):  # 3 unidades por almacén
            unit = {
                "warehouse_id": warehouse_id,
                "width": round(random.uniform(2.0, 4.0), 2),
                "height": round(random.uniform(2.0, 3.5), 2),
                "depth": round(random.uniform(2.0, 4.0), 2),
                "capacity_m3": round(random.uniform(10.0, 30.0), 2),
                "cost_per_hour": round(random.uniform(100, 300), 2),
                "temp_range": f"{random.randint(-25, -15)}°C to {random.randint(-15, -5)}°C",
                "humidity_range": f"{random.randint(85, 95)}% to {random.randint(95, 100)}%"
            }
            storage_units.append(unit)
    
    print("\nCreando unidades de almacenamiento...")
    unit_ids = []
    for unit in storage_units:
        headers = {
            "Authorization": f"Bearer {owner_token}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            f"{API_URL}/storage-units",
            json=unit,
            headers=headers
        )
        print("Respuesta del servidor:", response.text)
        
        if response.status_code != 201:
            print(f"Error al crear unidad de almacenamiento: {response.text}")
            continue
            
        try:
            unit_ids.append(response.json()["data"]["id"])
            print(f"Unidad creada con ID: {response.json()['data']['id']}")
        except Exception as e:
            print(f"Error al procesar respuesta de la unidad: {str(e)}")
            continue
            
        time.sleep(1)
    
    if not unit_ids:
        print("No se pudieron crear unidades de almacenamiento. Terminando script.")
        return
    
    # 5. Crear reservas
    print("\nCreando reservas...")
    for _ in range(3):  # 3 reservas
        start_date = datetime.now() + timedelta(days=random.randint(1, 30))
        end_date = start_date + timedelta(days=random.randint(1, 14))
        
        booking = {
            "end_user_id": end_user_id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "notes": "Test booking",
            "storage_unit_ids": random.sample(unit_ids, min(len(unit_ids), random.randint(1, 2)))
        }
        
        headers = {
            "Authorization": f"Bearer {end_user_token}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            f"{API_URL}/bookings",
            json=booking,
            headers=headers
        )
        print("Respuesta del servidor:", response.text)
        time.sleep(1)
    
    print("\n¡Datos de prueba creados exitosamente!")

if __name__ == "__main__":
    create_test_data() 