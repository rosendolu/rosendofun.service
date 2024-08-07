const { koaBody } = require('koa-body');
const path = require('path');
const { logger } = require('../common/logger');
const { isProdEnv, rootDir } = require('../common/constant');
const utils = require('../common/utils');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const env = require('../common/env');
const assert = require('assert/strict');

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
        const { token, nickname, visitCount, uid, lastVisit, role, secret, jwt } = ctx.session;
        ctx.body = {
            message: `Last visit ${dayjs().to(dayjs(lastVisit))}!`,
            visitCount: visitCount,
            lastVisit: lastVisit,
            nickname,
            role,
            token: token || '',
            secret,
            jwt,
        };
    },
    async userLogout(ctx, next) {
        ctx.session.jwt = '';
        ctx.session.secret = '';
        ctx.session.token = '';
        ctx.session.role = '';
        ctx.session.basicAuth = '';
        await next();
        ctx.status = 401;
        // ctx.set('WWW-Authenticate', 'Basic realm="Restricted Access"');
        ctx.body = ctx.session;
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
            ctx.session.basicAuth = auth;
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
            ctx.session.jwt = authToken;
            return ctx.redirect(ctx.router.url('userInfo'));
        }
        ctx.status = 401;
        ctx.set('WWW-Authenticate', 'Basic realm="Restricted Access"');
        ctx.body = 'Unauthorized';
    },

    async adminRouterAuth(ctx, next) {
        if (ctx.path.startsWith('/admin')) {
            let pass = false;
            try {
                const token = ctx.session.jwt || '';
                /**
                 * @type {any}
                 * */
                const decoded = jwt.verify(token, env.PUBLIC_KEY, { issuer: env.SERVICE_NAME });
                assert(decoded.role === 'admin', 'Not admin user');
                pass = true;
            } catch (err) {
                logger.error('adminRouterAuth %s %j', err, ctx.session);
                ctx.status = 401;
                ctx.body = '<h1 style="color:red;text-align:center">401 Unauthorized</h1>';
            }
            if (pass) {
                await next();
            }
        } else {
            await next();
        }
    },

    async adminAuth(ctx, next) {
        try {
            const token = ctx.session.jwt || '';
            assert(token, 'Empty jwt token');
            /**
             * @type {any}
             * */
            const decoded = jwt.verify(token, env.PUBLIC_KEY, { issuer: env.SERVICE_NAME });
            assert(decoded.role === 'admin', 'Not admin user');
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
