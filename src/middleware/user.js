const { koaBody } = require('koa-body');
const path = require('path');
const { logger } = require('../common/logger');
const { isProdEnv, rootDir } = require('../common/constant');
const utils = require('../common/utils');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const env = require('../common/env');
const { assert } = require('console');

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
        const { token, nickname, visitCount, uid, lastVisit, role, auth, secret } = ctx.session;
        ctx.body = {
            message: `Last visit ${dayjs().to(dayjs(lastVisit))}!`,
            visitCount: visitCount,
            lastVisit: lastVisit,
            nickname,
            role,
            token: token || '',
            secret,
            auth,
        };
    },
    userLogout(ctx, next) {
        ctx.session.auth = '';
        ctx.session.secret = '';
        ctx.session.token = '';
        ctx.session.role = 'guest';
        // ctx.set('WWW-Authenticate', 'Basic realm="Logged Out"');
        // ctx.status = 401;
        // ctx.body = 'logout';
        return ctx.redirect(ctx.router.url('userInfo'));
    },
    userLogin(ctx, next) {
        // post body
        let { username, password } = Object.assign({}, ctx.request.body, ctx.query);
        const auth = ctx.headers['authorization'];
        if ((!username || !password) && auth && auth.indexOf('Basic ') !== -1) {
            const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
            username = credentials[0];
            password = credentials[1];
        }

        if (username && password) {
            const secret = `${username}:${password}`;
            ctx.session.token = utils.hmac(secret);
            ctx.session.secret = utils.rsa.encryptRSA(secret);
            // 设置有效载荷
            const payload = {
                username,
                role: env.ADMIN_WHITELIST.includes(secret) ? 'admin' : 'guest',
            };
            const authToken = jwt.sign(payload, env.PRIVATE_KEY, {
                algorithm: 'RS256',
                issuer: env.SERVICE_NAME,
                expiresIn: '5d',
            });
            Object.assign(ctx.session, payload);
            ctx.session.auth = authToken;
            return ctx.redirect(ctx.router.url('userInfo'));
        }
        ctx.status = 401;
        ctx.set('WWW-Authenticate', 'Basic realm="Restricted Access"');
        ctx.body = 'Unauthorized';
    },
    async adminAuth(ctx, next) {
        const token = ctx.session.auth || '';
        try {
            /**
             * @type {any}
             * */
            const decoded = jwt.verify(token, env.PUBLIC_KEY, { issuer: env.SERVICE_NAME });
            assert(decoded.role === 'admin', 'Not admin user %s', decoded);
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
