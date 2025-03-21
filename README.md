# ColdStorageHub - Plataforma de Almacenes Frigoríficos

## Descripción
ColdStorageHub es una plataforma web que conecta propietarios de almacenes frigoríficos con empresas y usuarios que necesitan espacio de almacenamiento refrigerado. Similar al modelo de Airbnb, pero especializado en el sector de almacenamiento en frío.

## Características Principales
- Registro y gestión de almacenes frigoríficos
- Sistema de reservas y pagos
- Búsqueda avanzada por ubicación, temperatura y capacidad
- Sistema de calificaciones y reseñas
- Panel de administración para propietarios
- Monitoreo de temperatura en tiempo real
- Sistema de notificaciones

## Tecnologías Utilizadas
- Backend: Node.js con Express
- Frontend: React.js
- Base de datos: PostgreSQL
- Autenticación: JWT
- Almacenamiento de archivos: AWS S3
- Monitoreo: Prometheus & Grafana

## Requisitos del Sistema
- Node.js >= 14.x
- PostgreSQL >= 12.x
- npm >= 6.x

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/coldstoragehub.git
cd coldstoragehub
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto
```
coldstoragehub/
├── src/
│   ├── api/           # Endpoints de la API
│   ├── config/        # Configuraciones
│   ├── controllers/   # Controladores
│   ├── models/        # Modelos de datos
│   ├── routes/        # Rutas
│   ├── services/      # Lógica de negocio
│   └── utils/         # Utilidades
├── tests/             # Pruebas
├── docs/              # Documentación
└── public/            # Archivos estáticos
```

## Contribución
Las contribuciones son bienvenidas. Por favor, lee el archivo CONTRIBUTING.md para más detalles.

## Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE.md para más detalles.

## Contacto
Para cualquier consulta o sugerencia, por favor abre un issue en el repositorio. 