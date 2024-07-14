const path = require('path');
const { rootDir } = require('./constant');
const { readFileSync } = require('fs');
const env = process.env;

module.exports = {
    ADMIN_WHITELIST: env.ADMIN_WHITELIST?.split(',') || [],
    SECRET_KEYS: env.SECRET_KEYS,
    PORT: env.PORT,
    SERVICE_NAME: 'rosendofun.service',
    PRIVATE_KEY: readFileSync(path.resolve(rootDir, 'local/private_key.pem')),
    PUBLIC_KEY: readFileSync(path.resolve(rootDir, 'local/public_key.pem')),
};
