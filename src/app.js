require('dotenv').config();
const Koa = require('koa');
const serve = require('koa-static');
const { logger } = require('./common/logger');
const cors = require('@koa/cors');
const router = require('./router/index');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const duration = require('dayjs/plugin/duration');
// Extend dayjs with the relativeTime plugin
dayjs.extend(relativeTime);
dayjs.extend(duration);
const { commonHandle, useKoaBody } = require('./middleware');
const koaSession = require('koa-session');
const constant = require('./common/constant');
const user = require('./middleware/user');
const path = require('node:path');
const env = require('./common/env');
const { useServeTempDir } = require('./middleware/file');
const app = new Koa();
app.keys = [env.SECRET_KEYS];

app.use(commonHandle());
app.use(
    cors({
        credentials: true,
    })
);
app.use(koaSession(constant.koaSessionConfig, app));
app.use(user.userHandle());
app.use(user.adminRouterAuth);
app.use(useKoaBody());
// app.use(serve(path.join(constant.rootDir, 'temp'), { maxage: 0, hidden: false }));
app.use(useServeTempDir());
app.use(router.routes()).use(router.allowedMethods());
require('./schedule/index');
require('./service/fileServer');
app.listen(env.PORT, () => {
    logger.info(`Server running at http://localhost:%s`, env.PORT);
});
