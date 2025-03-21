# Base de Datos ColdStorageHub

Este directorio contiene los archivos relacionados con la base de datos del proyecto ColdStorageHub.

## Estructura

- `schema.sql`: Contiene el esquema completo de la base de datos
- `README.md`: Este archivo, con la documentación de la base de datos

## Esquema de la Base de Datos

La base de datos está diseñada para manejar:
- Gestión de propietarios y almacenes
- Unidades de almacenamiento
- Reservas y pagos
- Monitoreo IoT
- Mantenimientos

### Tablas Principales

1. **Owners**: Propietarios de almacenes
2. **Warehouses**: Almacenes frigoríficos
3. **StorageUnits**: Unidades de almacenamiento individuales
4. **EndUsers**: Usuarios finales que realizan reservas
5. **Bookings**: Reservas de unidades de almacenamiento
6. **Payments**: Pagos de reservas
7. **Maintenances**: Registro de mantenimientos
8. **IoT_Sensors**: Sensores instalados
9. **IoT_Readings**: Lecturas de sensores
10. **IoT_Stats**: Estadísticas de monitoreo

## Características

- Soporte para ubicaciones geoespaciales
- Sistema de borrado lógico
- Monitoreo en tiempo real
- Gestión de pagos
- Sistema de reservas
- Monitoreo IoT

## Requisitos

- MySQL >= 5.7
- Soporte para tipos espaciales
- InnoDB como motor de almacenamiento

## Instalación

1. Crear la base de datos:
```sql
CREATE DATABASE coldstoragehub;
USE coldstoragehub;
```

2. Ejecutar el esquema:
```bash
mysql -u tu_usuario -p coldstoragehub < schema.sql
```

## Índices y Optimizaciones

- Índice espacial en la ubicación de almacenes
- Índice en fechas de estadísticas IoT
- Claves foráneas con eliminación en cascada
- Tipos ENUM para estados y tipos
- Campos de auditoría (created_at, deleted_at)

## Mantenimiento

Para mantener la integridad de los datos:
1. Realizar copias de seguridad regulares
2. Monitorear el crecimiento de las tablas IoT
3. Revisar periódicamente los índices
4. Limpiar datos antiguos de las tablas de monitoreo 