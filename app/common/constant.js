module.exports = {
    isProdEnv: !/dev/.test(process.env.NODE_ENV || ''),
};
