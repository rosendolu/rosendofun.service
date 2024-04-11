const Koa = require('koa');
const logger = require('./common/logger');
const cors = require('@koa/cors');
const router = require('./router/index');
const { commonHandle, useKoaBody } = require('./middleware');
const app = new Koa();
require('dotenv').config();
app.use(commonHandle());
app.use(useKoaBody());
app.use(
    cors({
        credentials: true,
    })
);
app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT;
app.listen(port, () => {
    logger.info(`Server running at http://localhost:%s`, port);
});
