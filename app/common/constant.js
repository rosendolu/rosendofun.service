const path = require('path');

module.exports = {
    isProdEnv: !/dev/i.test(process.env.NODE_ENV || ''),
    rootDir: path.resolve(__dirname, '../../'),
    koaSessionConfig: {
        maxAge: 864e5 * 3e4, //  3e4 days
        httpOnly: true /** (boolean) httpOnly or not (default true) */,
        signed: true /** (boolean) signed or not (default true) */,
        rolling: true /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */,
        renew: true /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/,
        secure: this.isProdEnv ? true : false /** (boolean) secure cookie*/,
    },
};
