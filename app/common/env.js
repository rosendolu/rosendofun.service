const env = process.env;
module.exports = {
    ADMIN_WHITELIST: env.ADMIN_WHITELIST.split(','),
    SESSION_KEYS: env.SESSION_KEYS,
    PORT: env.PORT,
    SERVICE_NAME: 'rosendofun.service',
};
