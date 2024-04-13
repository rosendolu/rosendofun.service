const { koaBody } = require('koa-body');
const path = require('path');
const logger = require('../common/logger');
const { isProdEnv } = require('../common/constant');

module.exports = {
    commonHandle: function commonHandle() {
        return async function commonHandleMiddleware(ctx, next) {
            const res = {
                data: null,
                error: null,
                message: '',
                status: 200,
                duration: 0,
            };
            let startTime = 0;
            try {
                startTime = Date.now();
                if (ctx.path === '/favicon.ico') return;
                await next();

                ctx.body && (res.data = ctx.body);
            } catch (err) {
                // @ts-ignore
                res.error = {
                    // @ts-ignore
                    message: err.message || '',
                    // @ts-ignore
                    stack: err.stack || '',
                };
                logger.error('commonHandle Error', err);
                //
            } finally {
                // Remove error stack sensitive information
                if (res.error && isProdEnv) {
                    // @ts-ignore
                    res.error = res.error?.message || 'Internal Server Error';
                }
                // Check if the response Content-Type is JSON
                const responseType = ctx.response.headers['content-type'];
                if ((responseType && responseType.includes('application/json')) || !ctx.body) {
                    // time consuming x ms
                    res.duration = Date.now() - startTime;
                    res.status = ctx.response.status;
                    res.message = ctx.response.message;
                    ctx.body = res;
                }
            }
        };
    },
    useKoaBody: function useKoaBody() {
        return koaBody({
            multipart: true,
            jsonLimit: '100mb',
            formLimit: '100mb',
            textLimit: '100mb',
            formidable: {
                maxFieldsSize: 100 * 1024 * 1024, // 100mb
                uploadDir: path.resolve('./temp'),
                keepExtensions: true,
            },
        });
    },
};
