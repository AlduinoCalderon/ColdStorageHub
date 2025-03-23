# Arquitectura Híbrida MySQL + MongoDB para ColdStorages

Esta propuesta implementa una arquitectura híbrida que aprovecha las fortalezas de MySQL y MongoDB para diferentes aspectos del sistema.

## Estructura General

### MySQL (Datos Transaccionales)
- Gestión de usuarios y autenticación
- Información básica de almacenes y unidades
- Reservas y pagos
- Relaciones críticas entre entidades

### MongoDB (Datos IoT y Flexibles)
- Lecturas de sensores IoT (time series)
- Detalles extendidos de almacenes y unidades
- Mantenimiento y tareas
- Datos geoespaciales

## Justificación de la Arquitectura

### ¿Por qué MySQL para datos transaccionales?
1. **Integridad ACID**: Crucial para operaciones financieras y reservas
2. **Relaciones fuertes**: Garantiza la consistencia entre usuarios, reservas y pagos
3. **Transacciones**: Necesarias para operaciones que involucran múltiples tablas
4. **Queries complejos**: Facilita reportes y análisis de negocio

### ¿Por qué MongoDB para IoT y datos flexibles?
1. **Time Series Collections**: Optimizadas para lecturas de sensores
2. **Escalabilidad horizontal**: Mejor manejo de grandes volúmenes de datos IoT
3. **Schema flexible**: Permite evolución de metadatos y configuraciones
4. **Índices geoespaciales**: Búsqueda eficiente de almacenes por ubicación
5. **Mejor rendimiento**: Para escrituras masivas de sensores

## Relaciones entre Bases de Datos

### IDs Compartidos
- Los IDs de MySQL se utilizan como referencia en MongoDB
- Ejemplo: `warehouseId` en MySQL se referencia en la colección `warehouseDetails` de MongoDB

### Sincronización
- Los datos básicos se mantienen en MySQL
- Los detalles extendidos y datos IoT en MongoDB
- Las aplicaciones deben mantener la consistencia al crear/actualizar registros

## Consideraciones de Implementación

### Transacciones Distribuidas
1. Usar patrón Saga para operaciones que afectan ambas bases de datos
2. Implementar compensación en caso de fallos
3. Mantener logs de operaciones distribuidas

### Caché y Rendimiento
1. Usar Redis para cachear datos frecuentemente accedidos
2. Implementar lazy loading para detalles extendidos
3. Agregar índices específicos según patrones de uso

### Backup y Recuperación
1. Coordinar backups entre ambas bases de datos
2. Mantener puntos de sincronización
3. Implementar estrategias de recuperación consistentes

## Ejemplo de Uso

### Crear un nuevo almacén:
1. Insertar datos básicos en MySQL
```sql
INSERT INTO warehouses (ownerId, name, status) VALUES (1, 'Almacén Norte', 'active');
```

2. Insertar detalles en MongoDB
```javascript
db.warehouseDetails.insertOne({
    warehouseId: mysqlWarehouseId,  // ID de MySQL
    location: {
        type: "Point",
        coordinates: [-96.7266, 17.0542]
    },
    address: "Calle Principal 123",
    operatingHours: {
        monday: ["09:00-18:00"],
        // ...
    },
    amenities: ["loading-dock", "security-24h"]
});
```

### Consulta combinada:
```javascript
// Ejemplo de consulta que combina datos de ambas bases
const warehouse = await Promise.all([
    mysql.query("SELECT * FROM warehouses WHERE warehouseId = ?", [id]),
    mongodb.warehouseDetails.findOne({ warehouseId: id })
]);
```

## Próximos Pasos

1. Implementar pruebas de carga para validar el rendimiento
2. Configurar monitoreo para ambas bases de datos
3. Desarrollar scripts de migración y sincronización
4. Implementar manejo de errores y recuperación
5. Documentar patrones de acceso a datos 