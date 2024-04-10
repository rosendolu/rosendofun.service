const Koa = require('koa');
const logger = require('./common/logger');
const app = new Koa();

app.use(ctx => {
    ctx.body = 'Hello Koa';
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    logger.info(`Server running at http://localhost:%s`, port);
});
