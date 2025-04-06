const Reading = require('../models/reading.model');

async function processReadingsBuffer(readingsBuffer) {
    if (readingsBuffer.length < 20) return;

    console.log('🔄 Procesando buffer de lecturas...');
    console.log(`📊 Total de lecturas en buffer: ${readingsBuffer.length}`);

    // Separar lecturas por tipo
    const tempReadings = readingsBuffer.filter(r => r.sensorType === 'temperature');
    const humReadings = readingsBuffer.filter(r => r.sensorType === 'humidity');

    console.log(`🌡️  Lecturas de temperatura: ${tempReadings.length}`);
    console.log(`💧 Lecturas de humedad: ${humReadings.length}`);

    // Calcular máximos y mínimos
    const minTemp = Math.min(...tempReadings.map(r => r.value));
    const maxTemp = Math.max(...tempReadings.map(r => r.value));
    const minHumidity = Math.min(...humReadings.map(r => r.value));
    const maxHumidity = Math.max(...humReadings.map(r => r.value));

    // Crear payload para la API
    const payload = {
        minTemp: minTemp.toString(),
        maxTemp: maxTemp.toString(),
        minHumidity: minHumidity.toString(),
        maxHumidity: maxHumidity.toString()
    };

    console.log('📤 Enviando datos a la API:', payload);

    try {
        // Enviar datos a la API
        const response = await fetch('https://coldstoragehub.onrender.com/API/storage-unit/1', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('✅ Datos enviados exitosamente a la API:', responseData);
        
        return true; // Indicar que el procesamiento fue exitoso
    } catch (error) {
        console.error('❌ Error al enviar datos a la API:', error);
        return false; // Indicar que el procesamiento falló
    }
}

async function processMessage(topic, message, readingsBuffer, bufferSize) {
    console.log('📥 Mensaje recibido en tópico:', topic);
    console.log('📦 Contenido del mensaje:', message.toString());
    
    try {
        const data = JSON.parse(message);
        const unitId = topic.split('/')[2];
        const sensorType = topic.split('/')[4];
        
        console.log('🔍 Procesando lectura:', {
            unitId,
            sensorType,
            value: data.value,
            timestamp: data.timestamp
        });

        // Guardar en MongoDB
        const reading = new Reading({
            unitId,
            sensorType,
            value: data.value,
            timestamp: new Date(data.timestamp)
        });

        await reading.save();
        console.log('💾 Lectura guardada en MongoDB:', reading);

        // Agregar al buffer
        readingsBuffer.push({
            unitId,
            sensorType,
            value: data.value,
            timestamp: data.timestamp
        });

        console.log(`📊 Buffer actual: ${readingsBuffer.length}/${bufferSize} lecturas`);

        // Procesar buffer si está lleno
        if (readingsBuffer.length >= bufferSize) {
            const success = await processReadingsBuffer(readingsBuffer);
            if (success) {
                // Limpiar el buffer solo si el procesamiento fue exitoso
                readingsBuffer.length = 0;
                console.log('🧹 Buffer limpiado');
            }
        }
    } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
    }
}

module.exports = {
    processMessage,
    processReadingsBuffer
}; 