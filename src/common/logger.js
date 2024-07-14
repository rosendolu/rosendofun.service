const winston = require('winston');
const utils = require('./utils');
const path = require('path');
const { isProdEnv, rootDir } = require('./constant');
const { ensureDirSync } = require('fs-extra');
const DailyRotateFile = require('winston-daily-rotate-file');

const appLogPath = path.resolve(rootDir, 'temp/logs');
ensureDirSync(appLogPath);

const loggerFileNameList = ['app', 'binance'];

const fileFormat = winston.format.combine(
    winston.format.splat(),
    // winston.format((info, options) => {
    //     const { level, message, ...meta } = info;
    //     return info;
    // })(),
    // winston.format.colorize(),
    // winston.format.label({ label: 'LABEL' }),
    winston.format.timestamp({ format: utils.timestamp() }),
    winston.format.printf(options => {
        const { level, message, label, timestamp } = options;
        return `${timestamp} [${level}]: ${message}`;
    })
);

for (const loggerName of loggerFileNameList) {
    winston.loggers.add(loggerName, loggerOptions(loggerName));
}

function loggerOptions(key) {
    const transports = [
        // new winston.transports.File({
        //     filename: `${appLogPath}/${key}.error.log`,
        //     level: 'error',
        // }),
        // new winston.transports.File({
        //     filename: `${appLogPath}/${key}.log`,
        // }),
        new DailyRotateFile({
            dirname: `${appLogPath}`,
            filename: `%DATE%-${key}`,
            level: !isProdEnv ? 'debug' : 'info',
            datePattern: 'YYYY-MM-DD',
            maxSize: '5m',
            extension: '.log',
            maxFiles: '7d',
            zippedArchive: false,
        }),
    ];
    // if (!isProdEnv) {
    transports.push(
        // @ts-ignore
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), fileFormat),
        })
    );
    // }
    return {
        level: isProdEnv ? 'info' : 'debug',
        exitOnError: false,
        format: fileFormat,
        // defaultMeta: { key },
        transports: transports,
    };
}

const logger = getLogger('app');
process.on('uncaughtException', err => logger.error('uncaughtException %s', err.toString()));
process.on('uncaughtExceptionMonitor', err => logger.error('uncaughtExceptionMonitor %s', err.toString()));
process.on('unhandledRejection', err => logger.error('unhandledRejection %s', err));

function getLogger(type = 'app') {
    return winston.loggers.get(type);
}

module.exports = { logger, getLogger };
