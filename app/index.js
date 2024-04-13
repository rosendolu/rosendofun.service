const Koa = require('koa');
const logger = require('./common/logger');
const cors = require('@koa/cors');
const router = require('./router/index');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
// Extend dayjs with the relativeTime plugin
dayjs.extend(relativeTime);
const { commonHandle, useKoaBody } = require('./middleware');
require('dotenv').config({ path: ['.env', '.env.local'], override: true });
const koaSession = require('koa-session');
const constant = require('./common/constant');
const user = require('./middleware/user');
const app = new Koa();
app.keys = [process.env.SESSION_KEYS];
app.use(commonHandle());
app.use(koaSession(constant.koaSessionConfig, app));
app.use(user.userHandle());
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
