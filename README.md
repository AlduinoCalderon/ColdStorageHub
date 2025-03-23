# ColdStorages API

API para gestión de almacenes fríos utilizando una arquitectura híbrida MySQL + MongoDB.

## Arquitectura

El proyecto utiliza una arquitectura híbrida que combina:

- **MySQL** (Clever Cloud): Para datos transaccionales y relaciones críticas
  - Usuarios y autenticación
  - Información básica de almacenes
  - Reservas y pagos

- **MongoDB** (Atlas): Para datos IoT y flexibles
  - Lecturas de sensores (time series)
  - Detalles extendidos de almacenes
  - Mantenimiento y tareas

## Requisitos

- Node.js >= 14.0.0
- MySQL (proporcionado por Clever Cloud)
- MongoDB Atlas (cuenta gratuita)

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/yourusername/ColdStorages.git
cd ColdStorages
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

## Desarrollo

```bash
# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo producción
npm start

# Ejecutar pruebas
npm test
```

## Estructura del Proyecto

```
src/
├── api/
│   ├── mysql/          # API para datos transaccionales
│   │   ├── models/     # Modelos Sequelize
│   │   ├── routes/     # Rutas Express
│   │   └── controllers/# Controladores
│   └── mongodb/        # API para datos IoT
│       ├── models/     # Modelos Mongoose
│       ├── routes/     # Rutas Express
│       └── controllers/# Controladores
├── config/            # Configuraciones
├── middleware/        # Middleware compartido
├── utils/            # Utilidades
└── index.js          # Punto de entrada
```

## Base de Datos

### MySQL (Clever Cloud)
- Host: bexln5nq6kaiskmgndpt-mysql.services.clever-cloud.com
- Base de datos: bexln5nq6kaiskmgndpt
- Puerto: 3306

### MongoDB Atlas
- Pendiente de configurar

## API Endpoints

### MySQL API

#### Usuarios
- POST /api/mysql/users/register
- POST /api/mysql/users/login

#### Almacenes
- GET /api/mysql/warehouses
- POST /api/mysql/warehouses
- GET /api/mysql/warehouses/:id

#### Reservas
- GET /api/mysql/bookings
- POST /api/mysql/bookings
- GET /api/mysql/bookings/:id

### MongoDB API

#### Sensores
- GET /api/mongodb/sensors
- POST /api/mongodb/sensors
- GET /api/mongodb/sensors/:id/readings

#### Lecturas
- POST /api/mongodb/readings
- GET /api/mongodb/readings/stats

## Siguientes Pasos

1. Configurar MongoDB Atlas
2. Implementar endpoints básicos
3. Agregar validaciones
4. Implementar autenticación
5. Documentar API con Swagger

## Licencia

MIT 