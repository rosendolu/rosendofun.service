const { koaBody } = require('koa-body');
const path = require('path');
const logger = require('../common/logger');
const { isProdEnv } = require('../common/constant');
const utils = require('../common/utils');

module.exports = {
    userHandle: function userHandle() {
        return async function commonHandleMiddleware(ctx, next) {
            if (!ctx.session.uid) {
                ctx.session.visitCount = 0;
                ctx.session.uid = await utils.uid();
                ctx.session.lastVisit = utils.timestamp();
            }
            await next();
            ctx.session.visitCount += 1;
            ctx.session.lastVisit = utils.timestamp();
        };
    },
};
