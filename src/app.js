require('dotenv').config();
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const duration = require('dayjs/plugin/duration');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
// Extend dayjs with the relativeTime plugin
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);

const Koa = require('koa');
const serve = require('koa-static');
const { logger } = require('./common/logger');
const cors = require('@koa/cors');
const { commonHandle, useKoaBody } = require('./middleware');
const koaSession = require('koa-session');
const constant = require('./common/constant');
const user = require('./middleware/user');
const path = require('node:path');
const env = require('./common/env');
const { useRouter } = require('./router');
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
app.use(useKoaBody());
useRouter(app);
require('./schedule/index');
require('./service/fileServer');
app.listen(env.PORT, () => {
    logger.info(`Server running at http://localhost:%s`, env.PORT);
});
