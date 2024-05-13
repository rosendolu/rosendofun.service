const dayjs = require('dayjs');
const utils = require('../common/utils');

module.exports = router => {
    router.all('/', ctx => {
        ctx.status = 302;
        ctx.redirect(router.url('userInfo'));
    });
};
