const Router = require('@koa/router');
const { glob } = require('glob');
const { logger } = require('../common/logger');
const path = require('path');
const { isProdEnv, rootDir } = require('../common/constant');
const routerFiles = glob.sync('./**/*.route.js', { cwd: __dirname });

function useRouter(app) {
    try {
        logger.debug('Router/index.js %O', routerFiles);
        for (const routerPath of routerFiles) {
            const router = require(path.resolve(__dirname, routerPath));
            app.use(router.routes()).use(router.allowedMethods());
        }
    } catch (error) {
        logger.error('Router/index.js %s', error);
    }
}

module.exports = { useRouter };
