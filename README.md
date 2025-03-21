# ColdStorageHub

Plataforma web para conectar propietarios de almacenes frigoríficos con empresas y usuarios que necesitan almacenamiento refrigerado.

## Características

- Registro y autenticación de usuarios (propietarios de almacenes y clientes)
- Gestión de almacenes frigoríficos
- Gestión de unidades de almacenamiento
- Sistema de reservas
- Monitoreo en tiempo real de sensores IoT
- Búsqueda de almacenes por ubicación
- Gestión de pagos y facturación

## Requisitos

- Node.js >= 14.0.0
- MySQL >= 5.7
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/cold-storage-hub.git
cd cold-storage-hub
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo de variables de entorno:
```bash
cp .env.example .env
```

4. Configurar las variables de entorno en el archivo `.env`

5. Crear la base de datos:
```sql
CREATE DATABASE cold_storage_hub;
```

6. Iniciar el servidor:
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Estructura del Proyecto

```
src/
├── config/         # Configuraciones
├── controllers/    # Controladores
├── middleware/     # Middleware
├── models/        # Modelos de la base de datos
├── routes/        # Rutas
├── app.js         # Configuración de Express
└── server.js      # Punto de entrada
```

## API Endpoints

### Autenticación
- POST /api/v1/auth/register - Registro de usuario
- POST /api/v1/auth/login - Inicio de sesión
- GET /api/v1/auth/profile - Obtener perfil
- PATCH /api/v1/auth/profile - Actualizar perfil

### Almacenes
- GET /api/v1/warehouses - Obtener todos los almacenes
- GET /api/v1/warehouses/:id - Obtener un almacén específico
- POST /api/v1/warehouses - Crear almacén
- PATCH /api/v1/warehouses/:id - Actualizar almacén
- DELETE /api/v1/warehouses/:id - Eliminar almacén
- GET /api/v1/warehouses/nearby - Buscar almacenes cercanos

### Unidades de Almacenamiento
- GET /api/v1/storage-units - Obtener todas las unidades
- GET /api/v1/storage-units/:id - Obtener una unidad específica
- POST /api/v1/storage-units - Crear unidad
- PATCH /api/v1/storage-units/:id - Actualizar unidad
- DELETE /api/v1/storage-units/:id - Eliminar unidad

### Reservas
- GET /api/v1/bookings - Obtener todas las reservas
- GET /api/v1/bookings/:id - Obtener una reserva específica
- POST /api/v1/bookings - Crear reserva
- PATCH /api/v1/bookings/:id - Actualizar reserva
- POST /api/v1/bookings/:id/cancel - Cancelar reserva

### Sensores
- GET /api/v1/sensors - Obtener todos los sensores
- GET /api/v1/sensors/:id - Obtener un sensor específico
- POST /api/v1/sensors - Crear sensor
- PATCH /api/v1/sensors/:id - Actualizar sensor
- DELETE /api/v1/sensors/:id - Eliminar sensor
- POST /api/v1/sensors/readings - Registrar lectura de sensor
- GET /api/v1/sensors/:id/readings - Obtener lecturas de un sensor
- GET /api/v1/sensors/:id/stats - Obtener estadísticas de un sensor

## Scripts Disponibles

- `npm start` - Iniciar el servidor en modo producción
- `npm run dev` - Iniciar el servidor en modo desarrollo
- `npm test` - Ejecutar pruebas
- `npm run lint` - Ejecutar linter
- `npm run format` - Formatear código

## Contribuir

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC - ver el archivo [LICENSE](LICENSE) para más detalles. 