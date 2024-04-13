const dayjs = require('dayjs');
const utils = require('../common/utils');
module.exports = router => {
    router.all('/', ctx => {
        const { visitCount, uid, lastVisit } = ctx.session;
        ctx.body = {
            message: `Last visit ${dayjs().to(dayjs(lastVisit))}!`,
            lastVisit: lastVisit,
            uid,
            serverTime: utils.timestamp(),
        };
    });
};
