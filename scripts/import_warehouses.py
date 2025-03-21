import requests
import pandas as pd
from datetime import datetime
import json
import time
from typing import Dict, List
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la API
API_URL = "http://localhost:3000/api/v1"  # Cambia esto a tu URL de producción
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

# Coordenadas de Osaka y áreas circundantes
LOCATIONS = [
    {"name": "Osaka", "lat": 34.6937, "lng": 135.5022, "radius": 50000},
    {"name": "Kobe", "lat": 34.6900, "lng": 135.1957, "radius": 30000},
    {"name": "Kyoto", "lat": 35.0116, "lng": 135.7681, "radius": 30000},
]

def search_places(location: Dict) -> List[Dict]:
    """Busca lugares usando Google Places API"""
    base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    
    params = {
        "location": f"{location['lat']},{location['lng']}",
        "radius": location['radius'],
        "type": "storage",
        "keyword": "cold storage warehouse refrigerated",
        "key": GOOGLE_PLACES_API_KEY
    }
    
    response = requests.get(base_url, params=params)
    return response.json().get("results", [])

def get_place_details(place_id: str) -> Dict:
    """Obtiene detalles adicionales de un lugar"""
    base_url = "https://maps.googleapis.com/maps/api/place/details/json"
    
    params = {
        "place_id": place_id,
        "fields": "name,formatted_address,formatted_phone_number,opening_hours,website,rating,reviews",
        "key": GOOGLE_PLACES_API_KEY
    }
    
    response = requests.get(base_url, params=params)
    return response.json().get("result", {})

def create_warehouse_data(place: Dict) -> Dict:
    """Crea un diccionario con los datos del almacén en el formato de la API"""
    return {
        "name": place.get("name", ""),
        "address": place.get("vicinity", ""),
        "location": {
            "type": "Point",
            "coordinates": [
                place["geometry"]["location"]["lng"],
                place["geometry"]["location"]["lat"]
            ]
        },
        "operating_hours": {
            "weekday_text": place.get("opening_hours", {}).get("weekday_text", []),
            "open_now": place.get("opening_hours", {}).get("open_now", False)
        },
        "amenities": {
            "rating": place.get("rating", 0),
            "total_reviews": place.get("user_ratings_total", 0),
            "types": place.get("types", [])
        },
        "contact_info": {
            "phone": place.get("formatted_phone_number", ""),
            "website": place.get("website", "")
        }
    }

def save_to_database(warehouse_data: Dict) -> bool:
    """Guarda los datos del almacén en la base de datos a través de la API"""
    try:
        response = requests.post(
            f"{API_URL}/warehouses",
            json=warehouse_data,
            headers={"Content-Type": "application/json"}
        )
        return response.status_code == 201
    except Exception as e:
        print(f"Error al guardar en la base de datos: {str(e)}")
        return False

def main():
    """Función principal para importar almacenes"""
    all_warehouses = []
    
    for location in LOCATIONS:
        print(f"Buscando almacenes en {location['name']}...")
        places = search_places(location)
        
        for place in places:
            # Obtener detalles adicionales
            details = get_place_details(place["place_id"])
            place.update(details)
            
            # Crear datos del almacén
            warehouse_data = create_warehouse_data(place)
            
            # Guardar en la base de datos
            if save_to_database(warehouse_data):
                print(f"Almacén guardado: {warehouse_data['name']}")
                all_warehouses.append(warehouse_data)
            
            # Esperar para no exceder límites de la API
            time.sleep(2)
    
    # Guardar resultados en un archivo CSV
    df = pd.DataFrame(all_warehouses)
    df.to_csv("imported_warehouses.csv", index=False)
    print(f"\nTotal de almacenes importados: {len(all_warehouses)}")

if __name__ == "__main__":
    main() 