const dayjs = require('dayjs');
const utils = require('../common/utils');

const Router = require('@koa/router');
const router = new Router();
router.all('/', ctx => {
    ctx.body = `<h1 style="text-align:center">Hello from <em><i>rosendofun.service</i></em></h1>`;
});
module.exports = router;
