module.exports = {
    isProdEnv: !/dev/i.test(process.env.NODE_ENV || ''),
    koaSessionConfig: {
        maxAge: 864e5 * 7, // seven days
        httpOnly: true /** (boolean) httpOnly or not (default true) */,
        signed: true /** (boolean) signed or not (default true) */,
        rolling: true /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */,
        renew: true /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/,
        secure: false /** (boolean) secure cookie*/,
    },
};
