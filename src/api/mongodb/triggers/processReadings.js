const BUFFER_SIZE = 20;
let readingsBuffer = [];

async function processReadingsBuffer() {
    if (readingsBuffer.length < BUFFER_SIZE) return;

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
        const response = await fetch('https://coldstoragehub.onrender.com/API/storage-units/1', {
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
        
        // Limpiar el buffer después de procesar
        readingsBuffer = [];
        console.log('🧹 Buffer limpiado');
    } catch (error) {
        console.error('❌ Error al enviar datos a la API:', error);
        // No limpiamos el buffer si hay error para reintentar
    }
}

function addToBuffer(reading) {
    readingsBuffer.push(reading);
    console.log(`📊 Buffer actual: ${readingsBuffer.length}/${BUFFER_SIZE} lecturas`);

    if (readingsBuffer.length >= BUFFER_SIZE) {
        return processReadingsBuffer();
    }
    return Promise.resolve();
}

module.exports = {
    addToBuffer
}; 