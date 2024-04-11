const { koaBody } = require('koa-body');
const path = require('path');
const logger = require('../common/logger');
const { isProdEnv } = require('../common/constant');

module.exports = {
    commonHandle: function commonHandle() {
        return async function commonHandleMiddleware(ctx, next) {
            let startTime = 0;
            let data = null;
            let error = null;
            try {
                startTime = Date.now();
                await next();
                data = ctx.body;
            } catch (err) {
                error = {
                    // @ts-ignore
                    message: err.message || '',
                    // @ts-ignore
                    stack: err.stack || '',
                };
                ctx.body = error;
                ctx.body.status = ctx.status;
                logger.error('commonHandle Error', err);
                //
            } finally {
                // 线上环境防止泄漏
                if (error && isProdEnv) {
                    error = error.message || 'Unknown error';
                }
                if (/application\/json/.test(ctx.type)) {
                    ctx.body = {
                        error: error,
                        data: data || null,
                    };
                    // 加上时间戳
                    ctx.body.duration = Date.now() - startTime;
                    ctx.body.status = ctx.status;
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
                uploadDir: path.resolve('./static'),
                keepExtensions: true,
            },
        });
    },
};
