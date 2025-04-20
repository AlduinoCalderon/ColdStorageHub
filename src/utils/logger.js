const chalk = require('chalk');
const boxen = require('boxen');

class Logger {
    static #getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    static #formatBox(message, title, color) {
        return boxen(message, {
            title: title,
            titleAlignment: 'center',
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: color
        });
    }

    static info(message) {
        console.log(
            this.#formatBox(
                `${chalk.blue('ℹ')} ${chalk.blue(this.#getTimestamp())} ${message}`,
                'INFO',
                'blue'
            )
        );
    }

    static success(message) {
        console.log(
            this.#formatBox(
                `${chalk.green('✓')} ${chalk.green(this.#getTimestamp())} ${message}`,
                'SUCCESS',
                'green'
            )
        );
    }

    static error(message) {
        console.error(
            this.#formatBox(
                `${chalk.red('✗')} ${chalk.red(this.#getTimestamp())} ${message}`,
                'ERROR',
                'red'
            )
        );
    }

    static warning(message) {
        console.warn(
            this.#formatBox(
                `${chalk.yellow('⚠')} ${chalk.yellow(this.#getTimestamp())} ${message}`,
                'WARNING',
                'yellow'
            )
        );
    }

    static health(status) {
        const { mqtt, mongodb, mysql, externalApi } = status;
        
        const mqttStatus = mqtt ? '🟢' : '🔴';
        const mongoStatus = mongodb ? '🟢' : '🔴';
        const mysqlStatus = mysql ? '🟢' : '🔴';
        const externalStatus = externalApi?.status?.status === 'OK' ? '🟢' : '🔴';

        const message = `
${chalk.bold('System Health Status')}
${chalk.gray('┌─────────────────────────────┐')}
${chalk.gray('│')} MQTT:    ${mqttStatus} ${chalk.gray('│')}
${chalk.gray('│')} MongoDB: ${mongoStatus} ${chalk.gray('│')}
${chalk.gray('│')} MySQL:   ${mysqlStatus} ${chalk.gray('│')}
${chalk.gray('│')} External: ${externalStatus} ${chalk.gray('│')}
${chalk.gray('└─────────────────────────────┘')}
${chalk.gray('Last External Check:')} ${externalApi?.lastChecked?.toLocaleTimeString() || 'Never'}
        `.trim();

        console.log(this.#formatBox(message, 'HEALTH CHECK', 'cyan'));
    }
}

module.exports = Logger; 