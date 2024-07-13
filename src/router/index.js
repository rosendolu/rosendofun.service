const Router = require('@koa/router');
const { glob } = require('glob');
const { logger } = require('../common/logger');
const path = require('path');
const { isProdEnv, rootDir } = require('../common/constant');
const router = new Router();
const routerFiles = glob.sync('./**/*.route.js', { cwd: __dirname });

if (!isProdEnv) {
    logger.info('Router/index.js %O', routerFiles);
}
try {
    for (const routerPath of routerFiles) {
        require(path.resolve(__dirname, routerPath))(router);
    }
} catch (error) {
    logger.error('Router/index.js %s', error);
}

module.exports = router;
