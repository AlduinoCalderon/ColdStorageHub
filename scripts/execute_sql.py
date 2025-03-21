import os
import mysql.connector
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos
db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME')
}

def execute_sql_file(filename):
    try:
        # Conectar a la base de datos
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print(f"Ejecutando script SQL: {filename}")
        
        # Leer y ejecutar el script SQL
        with open(filename, 'r') as file:
            sql_commands = file.read()
            
            # Dividir el script en comandos individuales
            commands = sql_commands.split(';')
            
            # Ejecutar cada comando
            for command in commands:
                command = command.strip()
                if command:
                    print(f"Ejecutando: {command}")
                    cursor.execute(command)
                    
            # Confirmar los cambios
            conn.commit()
            print("Script SQL ejecutado exitosamente")
            
    except mysql.connector.Error as err:
        print(f"Error al ejecutar el script SQL: {err}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    execute_sql_file('scripts/drop_tables.sql') 