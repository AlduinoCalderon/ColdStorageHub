// Schema MongoDB para ColdStorages (Propuesta Híbrida)
// Este schema contiene las colecciones para datos IoT y datos que requieren flexibilidad

// Colección de detalles extendidos de almacenes
db.createCollection("warehouseDetails", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["warehouseId", "location", "address", "operatingHours", "amenities"],
            properties: {
                warehouseId: { bsonType: "int" }, // Referencia al ID en MySQL
                location: {
                    bsonType: "object",
                    required: ["type", "coordinates"],
                    properties: {
                        type: { enum: ["Point"] },
                        coordinates: {
                            bsonType: "array",
                            items: { bsonType: "double" }
                        }
                    }
                },
                address: { bsonType: "string" },
                operatingHours: {
                    bsonType: "object",
                    properties: {
                        monday: { bsonType: "array", items: { bsonType: "string" } },
                        tuesday: { bsonType: "array", items: { bsonType: "string" } },
                        wednesday: { bsonType: "array", items: { bsonType: "string" } },
                        thursday: { bsonType: "array", items: { bsonType: "string" } },
                        friday: { bsonType: "array", items: { bsonType: "string" } },
                        saturday: { bsonType: "array", items: { bsonType: "string" } },
                        sunday: { bsonType: "array", items: { bsonType: "string" } }
                    }
                },
                amenities: {
                    bsonType: "array",
                    items: { bsonType: "string" }
                },
                images: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["url", "type"],
                        properties: {
                            url: { bsonType: "string" },
                            type: { enum: ["exterior", "interior", "amenity"] },
                            description: { bsonType: "string" }
                        }
                    }
                }
            }
        }
    }
});

// Colección de detalles extendidos de unidades de almacenamiento
db.createCollection("storageUnitDetails", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["unitId", "dimensions", "temperatureRange", "humidityRange"],
            properties: {
                unitId: { bsonType: "int" }, // Referencia al ID en MySQL
                dimensions: {
                    bsonType: "object",
                    required: ["width", "height", "depth"],
                    properties: {
                        width: { bsonType: "double" },
                        height: { bsonType: "double" },
                        depth: { bsonType: "double" }
                    }
                },
                temperatureRange: {
                    bsonType: "object",
                    required: ["min", "max"],
                    properties: {
                        min: { bsonType: "double" },
                        max: { bsonType: "double" }
                    }
                },
                humidityRange: {
                    bsonType: "object",
                    required: ["min", "max"],
                    properties: {
                        min: { bsonType: "double" },
                        max: { bsonType: "double" }
                    }
                }
            }
        }
    }
});

// Colección de sensores IoT
db.createCollection("iotSensors", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["unitId", "type", "status", "metadata"],
            properties: {
                unitId: { bsonType: "int" }, // Referencia al ID en MySQL
                type: { enum: ["temperature", "humidity", "motion", "door"] },
                status: { enum: ["active", "inactive", "error"] },
                metadata: {
                    bsonType: "object",
                    required: ["manufacturer", "model", "serialNumber"],
                    properties: {
                        manufacturer: { bsonType: "string" },
                        model: { bsonType: "string" },
                        serialNumber: { bsonType: "string" },
                        installationDate: { bsonType: "date" },
                        lastCalibration: { bsonType: "date" },
                        calibrationDue: { bsonType: "date" }
                    }
                }
            }
        }
    }
});

// Colección de lecturas IoT (Time Series)
db.createCollection("iotReadings", {
    timeseries: {
        timeField: "timestamp",
        metaField: "metadata",
        granularity: "minutes"
    }
});

// Colección de mantenimiento
db.createCollection("maintenance", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["warehouseId", "type", "status", "description", "schedule"],
            properties: {
                warehouseId: { bsonType: "int" }, // Referencia al ID en MySQL
                unitId: { bsonType: "int" }, // Opcional, referencia al ID en MySQL
                type: { enum: ["preventive", "corrective", "emergency"] },
                status: { enum: ["scheduled", "in_progress", "completed", "cancelled"] },
                description: { bsonType: "string" },
                schedule: {
                    bsonType: "object",
                    required: ["startDate", "estimatedDuration"],
                    properties: {
                        startDate: { bsonType: "date" },
                        estimatedDuration: { bsonType: "int" }, // en minutos
                        completionDate: { bsonType: "date" }
                    }
                },
                tasks: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["description", "status"],
                        properties: {
                            description: { bsonType: "string" },
                            status: { enum: ["pending", "completed", "skipped"] },
                            completedAt: { bsonType: "date" },
                            notes: { bsonType: "string" }
                        }
                    }
                }
            }
        }
    }
});

// Índices
db.warehouseDetails.createIndex({ location: "2dsphere" });
db.warehouseDetails.createIndex({ warehouseId: 1 }, { unique: true });
db.storageUnitDetails.createIndex({ unitId: 1 }, { unique: true });
db.iotSensors.createIndex({ unitId: 1 });
db.iotSensors.createIndex({ status: 1 });
db.maintenance.createIndex({ warehouseId: 1 });
db.maintenance.createIndex({ "schedule.startDate": 1 });
db.maintenance.createIndex({ status: 1 }); 