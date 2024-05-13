const { koaBody } = require('koa-body');
const path = require('path');
const logger = require('../common/logger');
const { isProdEnv, rootDir } = require('../common/constant');
const utils = require('../common/utils');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const env = require('../common/env');
const { assert } = require('console');
const PRIVATE_KEY = fs.readFileSync(path.resolve(rootDir, 'local/private_key.pem'));
const PUBLIC_KEY = fs.readFileSync(path.resolve(rootDir, 'local/public_key.pem'));

module.exports = {
    userHandle() {
        return async function commonHandleMiddleware(ctx, next) {
            if (ctx.session.isNew) {
                ctx.session.visitCount = 0;
                ctx.session.uid = utils.uid();
                ctx.session.lastVisit = utils.timestamp();
                ctx.session.nickname = utils.faker.name();
            }
            await next();
            ctx.session.visitCount += 1;
            ctx.session.lastVisit = utils.timestamp();
        };
    },
    userInfo(ctx, next) {
        const { token, nickname, visitCount, uid, lastVisit } = ctx.session;
        ctx.body = {
            message: `Last visit ${dayjs().to(dayjs(lastVisit))}!`,
            visitCount: visitCount,
            lastVisit: lastVisit,
            nickname,
            token: token || '',
        };
    },
    userLogin(ctx, next) {
        // post body
        let { username, password } = ctx.request.body;
        const auth = ctx.headers['authorization'];
        if ((!username || !password) && auth && auth.indexOf('Basic ') !== -1) {
            const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
            username = credentials[0];
            password = credentials[1];
        }

        if (username && password) {
            ctx.session.username = username;
            ctx.session.password = password;
            // admin jwt token
            if (env.ADMIN_WHITELIST.includes(`${username}:${password}`)) {
                const payload = { uid: ctx.session.uid, username, timestamp: utils.timestamp() }; // 设置有效载荷
                const token = jwt.sign(payload, PRIVATE_KEY, {
                    algorithm: 'RS256',
                    issuer: env.SERVICE_NAME,
                    expiresIn: '5d',
                });
                ctx.session.token = token;
            }
            return ctx.redirect(ctx.router.url('userInfo'));
        }
        ctx.status = 401;
        ctx.set('WWW-Authenticate', 'Basic realm="Restricted Access"');
        ctx.body = 'Unauthorized';
    },
    async adminAuth(ctx, next) {
        const token = ctx.session.token || '';
        try {
            const decoded = jwt.verify(token, PUBLIC_KEY, { issuer: env.SERVICE_NAME });
            ctx.status = 200;
            ctx.body = decoded;
            await next();
        } catch (err) {
            logger.error('adminAuth %s %j', err, ctx.session);
            ctx.status = 401;
            ctx.body = 'Unauthorized';
        }
    },
};
