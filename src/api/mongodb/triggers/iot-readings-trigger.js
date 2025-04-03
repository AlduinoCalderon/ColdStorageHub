// src/api/mongodb/triggers/iot-readings.trigger.js
const { MongoClient } = require('mongodb');
const axios = require('axios');

// This file demonstrates how to set up MongoDB change streams (triggers)

// Connect to MongoDB
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse-iot';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function setupTriggers() {
  try {
    await client.connect();
    const database = client.db();
    
    // Setup change stream trigger for IoT readings collection
    const iotReadingsCollection = database.collection('iotReadings');
    
    // Watch for new documents only (insert operations)
    const iotReadingsPipeline = [{ $match: { operationType: 'insert' } }];
    
    // Start the change stream
    const changeStream = iotReadingsCollection.watch(iotReadingsPipeline);
    
    // Listen for changes
    changeStream.on('change', async (change) => {
      try {
        const reading = change.fullDocument;
        
        // First, use the sensorId to find the sensor info
        const sensorCollection = database.collection('iotSensors');
        const sensor = await sensorCollection.findOne({ _id: reading.sensorId });
        
        if (!sensor) {
          console.error(`Sensor not found for ID: ${reading.sensorId}`);
          return;
        }
        
        // Find the corresponding storage unit
        const unitCollection = database.collection('storageUnits');
        const storageUnit = await unitCollection.findOne({ unitId: sensor.unitId });
        
        if (!storageUnit) {
          console.error(`Storage unit not found for ID: ${sensor.unitId}`);
          return;
        }
        
        // For critical readings, trigger alert in MySQL system via API
        if (sensor.sensorType === 'temperature' || sensor.sensorType === 'humidity') {
          const outOfRange = checkIfOutOfRange(reading.value, sensor.sensorType, storageUnit);
          
          if (outOfRange) {
            console.log(`Critical ${sensor.sensorType} reading detected for unit ${storageUnit.unitId}: ${reading.value}`);
            
            // Update the MySQL system via API
            try {
              await axios.post(`${process.env.MYSQL_API_URL}/api/alerts`, {
                unitId: storageUnit.unitId,
                warehouseId: storageUnit.warehouseId,
                sensorType: sensor.sensorType,
                value: reading.value,
                timestamp: reading.recordedAt,
                status: 'critical'
              });
              
              console.log(`Alert sent to MySQL API for unit ${storageUnit.unitId}`);
            } catch (apiError) {
              console.error('Failed to send alert to MySQL API:', apiError.message);
            }
          }
        }
        
        // Aggregate and calculate statistics daily
        // This would typically be done with a scheduled job rather than on every insert
        // But this shows how you could trigger calculations based on new readings
        
      } catch (error) {
        console.error('Error processing change stream event:', error);
      }
    });
    
    console.log('MongoDB change stream triggers set up successfully');
    
  } catch (error) {
    console.error('Error setting up MongoDB triggers:', error);
  }
}

// Helper function to check if a reading is out of range
function checkIfOutOfRange(value, sensorType, storageUnit) {
  if (sensorType === 'temperature') {
    return value < storageUnit.climateControl.temperature.min || 
           value > storageUnit.climateControl.temperature.max;
  } else if (sensorType === 'humidity') {
    return value < storageUnit.climateControl.humidity.min || 
           value > storageUnit.climateControl.humidity.max;
  }
  return false;
}

// Setup triggers on startup
setupTriggers().catch(console.error);

// Handle application shutdown
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await client.close();
  process.exit(0);
});

module.exports = { setupTriggers };