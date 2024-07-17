const compose = require('koa-compose');
const { logger } = require('./logger');
module.exports = class CreateCompose {
    static middleware = [];
    use(channel, ...cb) {
        if (!channel) return this;
        if (!CreateCompose.middleware[channel]) {
            CreateCompose.middleware[channel] = [];
        }
        CreateCompose.middleware[channel].push(...cb);
        return this;
    }
    static async useCallback(channel, ctx) {
        try {
            if (!channel) return;
            const fn = compose(this.middleware[channel] || []);
            await fn(ctx, ctx => Promise.resolve(ctx));
        } catch (err) {
            logger.error(`middleware %s %j`, channel, err.body || err);
        }
    }
    trigger(channel, ctx) {
        return CreateCompose.useCallback(channel, ctx);
    }
};
