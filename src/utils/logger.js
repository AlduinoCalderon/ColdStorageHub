class Logger {
    static #getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    static #formatMessage(type, message) {
        const emojis = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };

        return `${emojis[type]} [${this.#getTimestamp()}] ${message}`;
    }

    static info(message) {
        console.log(this.#formatMessage('info', message));
    }

    static success(message) {
        console.log(this.#formatMessage('success', message));
    }

    static error(message) {
        console.error(this.#formatMessage('error', message));
    }

    static warning(message) {
        console.warn(this.#formatMessage('warning', message));
    }

    static health(status) {
        const { mqtt, mongodb, mysql, externalApi } = status;
        
        const mqttStatus = mqtt ? '🟢' : '🔴';
        const mongoStatus = mongodb ? '🟢' : '🔴';
        const mysqlStatus = mysql ? '🟢' : '🔴';
        
        // Estado de la API externa con indicador de delay
        const externalStatus = externalApi?.status?.status === 'OK' ? '🟢' : '🔴';
        const lastCheck = externalApi?.lastChecked;
        const timeSinceLastCheck = lastCheck ? Math.floor((new Date() - lastCheck) / 1000 / 60) : null;
        const checkStatus = timeSinceLastCheck === null ? '⏳ Nunca' : 
                          timeSinceLastCheck >= 5 ? '🔄 Pendiente' : 
                          `✅ ${timeSinceLastCheck}m`;

        console.log(`
🌡️  System Health Status
┌─────────────────────────────┐
│ MQTT:    ${mqttStatus}            │
│ MongoDB: ${mongoStatus}            │
│ MySQL:   ${mysqlStatus}            │
│ External: ${externalStatus} (${checkStatus})    │
└─────────────────────────────┘
        `.trim());
    }
}

module.exports = Logger; 